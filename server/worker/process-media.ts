import sharp from 'sharp';
import exifr from 'exifr';
import { createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { and, eq } from 'drizzle-orm';
import { useDb, media, events } from '../db';
import { getBuffer, getStream, put, delEverywhere } from '../utils/storage';
import { MEDIA_LIMITS } from '../utils/plans';
import { exifMoment } from '../utils/exif-time';
import { heicToJpeg, HeicError } from '../utils/heic';
import { runTool, ToolError, FFMPEG_PRIORITY } from '../utils/proc';

/**
 * The file itself is the problem (cannot decode, too long, not a video):
 * retrying will not help, so the row is failed at once and the guest told.
 * Anything else (the bucket, the network, the database, a timeout on a busy
 * box) is thrown to the worker, which retries with backoff and only fails
 * the row on its last try.
 */
class ContentError extends Error {}
const content = <T>(p: Promise<T>) => p.catch((e: Error) => {
  if (e instanceof ToolError && e.timedOut) throw e; // transient
  throw new ContentError(e.message);
});
/** ~100 MP. Well past any phone camera, well short of a decompression bomb. */
const MAX_PIXELS = 100_000_000;
/** Threads one video encode may use: the box keeps cores for the web side and for photos. */
const FFMPEG_THREADS = String(Number(process.env.FFMPEG_THREADS) || 2);
/**
 * Every ffmpeg/ffprobe call: the input is a plain local file and nothing
 * else (no playlists, no URLs), and NO metadata is carried to the output —
 * phones write the place a video was shot (Android's ©xyz / `location`)
 * into the container, and the served copy is public.
 */
const IN = (path: string) => ['-protocol_whitelist', 'file', '-i', path];
const STRIP = ['-map_metadata', '-1', '-map_chapters', '-1'];
const ff = (args: string[], timeoutMs: number) => runTool('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { timeoutMs, nice: FFMPEG_PRIORITY });

/**
 * Turns an uploaded original into what the gallery serves.
 *
 * Photos: HEIC → JPEG (in a child process, see heic.ts), auto-rotated, EXIF
 * stripped (location included), a 2400px JPEG (the download and the TV), a
 * 1200px WebP (the phone's lightbox) and a 480px WebP thumb. `takenAt` is
 * read from EXIF before it is stripped, so the zip and the feed can order by
 * the moment, not the upload.
 *
 * Videos: streamed to a temp file (never held whole in memory), ffprobe for
 * duration (over the cap → failed, the guest is told), a poster frame at 1s,
 * and an H.264 720p MP4 with faststart so an iPhone's HEVC .mov plays on
 * every Android at the table. ffmpeg runs niced, on FFMPEG_THREADS threads,
 * with a hard timeout.
 *
 * Served copies go to the public bucket, or to the private one when the
 * event is in approval mode (the row lands `hidden` until the host shows it).
 */
export async function processMedia(id: string) {
  const db = useDb();
  const [m] = await db.select().from(media).where(eq(media.id, id));
  if (!m || m.status !== 'uploaded') return;
  const [ev] = await db.select({ settings: events.settings }).from(events).where(eq(events.id, m.eventId));
  const gated = !!ev?.settings.approvalMode;
  const where = gated ? 'private' as const : 'public' as const;
  const landed = gated ? 'hidden' as const : 'ready' as const;
  const base = `events/${m.eventId.toLowerCase()}/${m.id.toLowerCase()}`;
  try {
    if (m.kind === 'photo') {
      const src = await getBuffer(m.originalKey, 'private');
      let takenAt: Date | null = null;
      try {
        takenAt = exifMoment(await exifr.parse(src, { pick: ['DateTimeOriginal', 'CreateDate', 'OffsetTimeOriginal', 'OffsetTime'], reviveValues: false }));
      } catch { /* no exif */ }
      let input: Buffer = src;
      if (/heic|heif/.test(m.mime)) {
        try { input = await heicToJpeg(src, { maxPixels: MAX_PIXELS }); }
        catch (e) { if (e instanceof HeicError) throw new ContentError(e.message); throw e; }
      }
      const img = sharp(input, { failOn: 'none', limitInputPixels: MAX_PIXELS }).rotate();
      const fit = (px: number) => ({ width: px, height: px, fit: 'inside' as const, withoutEnlargement: true });
      const [full, mid, thumb] = await content(Promise.all([
        img.clone().resize(fit(2400)).jpeg({ quality: 86, mozjpeg: true }).toBuffer({ resolveWithObject: true }),
        img.clone().resize(fit(1200)).webp({ quality: 80 }).toBuffer(),
        img.clone().resize(fit(480)).webp({ quality: 78 }).toBuffer(),
      ]));
      const key = `${base}.jpg`, midKey = `${base}.m.webp`, thumbKey = `${base}.t.webp`;
      await Promise.all([put(key, full.data, 'image/jpeg', where), put(midKey, mid, 'image/webp', where), put(thumbKey, thumb, 'image/webp', where)]);
      await land(m.id, [key, midKey, thumbKey], { status: landed, key, midKey, thumbKey, width: full.info.width, height: full.info.height, takenAt, readyAt: new Date(), error: null });
    } else if (m.kind === 'video') {
      const dir = await mkdtemp(join(tmpdir(), 'indahnya-'));
      try {
        const inPath = join(dir, 'in');
        await pipeline(await getStream(m.originalKey, 'private'), createWriteStream(inPath));
        const { stdout } = await content(runTool('ffprobe', ['-v', 'error', '-protocol_whitelist', 'file', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration:format=duration', '-of', 'json', inPath], { timeoutMs: 30_000 }));
        const probe = JSON.parse(stdout.toString()) as { streams?: { width?: number; height?: number; duration?: string }[]; format?: { duration?: string } };
        const s = probe.streams?.[0];
        if (!s) throw new ContentError('Bukan video');
        const duration = Math.round(Number(s.duration ?? probe.format?.duration ?? 0));
        if (duration > MEDIA_LIMITS.videoSec + 2) throw new ContentError(`Video ${duration} saat — had ${MEDIA_LIMITS.videoSec} saat`);
        const outPath = join(dir, 'out.mp4'), posterPath = join(dir, 'poster.jpg');
        const posterArgs = ['-frames:v', '1', '-vf', "scale='min(1280,iw)':-2", '-q:v', '4', ...STRIP, posterPath];
        await content(ff(['-ss', '1', ...IN(inPath), ...posterArgs], 60_000).catch(() => ff([...IN(inPath), ...posterArgs], 60_000)));
        await content(ff([
          ...IN(inPath), '-t', String(MEDIA_LIMITS.videoSec),
          '-vf', "scale='min(1280,iw)':-2", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25', '-pix_fmt', 'yuv420p', '-threads', FFMPEG_THREADS,
          '-c:a', 'aac', '-b:a', '128k', ...STRIP, '-movflags', '+faststart', outPath,
        ], 10 * 60_000));
        const poster = await readFile(posterPath);
        const posterInfo = await sharp(poster).metadata();
        // the grid gets a 480px tile like photos do, not the 1280px poster
        const thumb = await content(sharp(poster).resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer());
        const out = await readFile(outPath);
        const key = `${base}.mp4`, posterKey = `${base}.p.jpg`, thumbKey = `${base}.t.webp`;
        await Promise.all([put(key, out, 'video/mp4', where), put(posterKey, poster, 'image/jpeg', where), put(thumbKey, thumb, 'image/webp', where)]);
        // width/height follow the poster: rotation metadata is already applied there
        await land(m.id, [key, posterKey, thumbKey], { status: landed, key, posterKey, thumbKey, width: posterInfo.width ?? s.width ?? null, height: posterInfo.height ?? s.height ?? null, durationSec: duration, readyAt: new Date(), error: null });
      } finally { await rm(dir, { recursive: true, force: true }); }
    }
  } catch (e) {
    if (!(e instanceof ContentError)) throw e; // transient: the worker retries
    const msg = e.message?.slice(0, 300) || 'gagal';
    console.error(`[worker] media ${id} failed: ${msg}`);
    await db.update(media).set({ status: 'failed', error: msg }).where(and(eq(media.id, m.id), eq(media.status, 'uploaded')));
  }

  /**
   * Only an `uploaded` row lands. One deleted mid-processing (by the guest,
   * the host or a purge) stays deleted, and the copies just written for it
   * are removed again, since no row will ever point the sweep at them —
   * unless the row already holds these very keys: then an earlier run of the
   * same job landed them, and deleting would leave a `ready` row with no files.
   */
  async function land(mid: string, keys: string[], set: Partial<typeof media.$inferInsert>) {
    const won = await useDb().update(media).set(set).where(and(eq(media.id, mid), eq(media.status, 'uploaded'))).returning({ id: media.id });
    if (won.length) return;
    const [now] = await useDb().select({ status: media.status, key: media.key }).from(media).where(eq(media.id, mid));
    if (now && (now.status === 'ready' || now.status === 'hidden') && now.key === set.key) return;
    await delEverywhere(keys);
  }
}
