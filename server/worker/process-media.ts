import sharp from 'sharp';
import exifr from 'exifr';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
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

const run = promisify(execFile);

/**
 * The file itself is the problem (cannot decode, too long, not a video):
 * retrying will not help, so the row is failed at once and the guest told.
 * Anything else (the bucket, the network, the database) is thrown to the
 * worker, which retries with backoff and only fails the row on its last try.
 */
class ContentError extends Error {}
const content = <T>(p: Promise<T>) => p.catch((e: Error) => { throw new ContentError(e.message); });
/** ~100 MP. Well past any phone camera, well short of a decompression bomb. */
const MAX_PIXELS = 100_000_000;

/**
 * Turns an uploaded original into what the gallery serves.
 *
 * Photos: HEIC → JPEG, auto-rotated, EXIF stripped (location included), the
 * served copy capped at 2400px, a 480px WebP thumb. `takenAt` is read from
 * EXIF before it is stripped, so the zip and the feed can order by the
 * moment, not the upload.
 *
 * Videos: streamed to a temp file (never held whole in memory), ffprobe for
 * duration (over the cap → failed, the guest is told), a poster frame at 1s,
 * and an H.264 720p MP4 with faststart so an iPhone's HEVC .mov plays on
 * every Android at the table.
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
        const { default: convert } = await import('heic-convert');
        input = Buffer.from(await content(convert({ buffer: new Uint8Array(src) as never, format: 'JPEG', quality: 0.92 })));
      }
      const img = sharp(input, { failOn: 'none', limitInputPixels: MAX_PIXELS }).rotate();
      const [full, thumb] = await content(Promise.all([
        img.clone().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86, mozjpeg: true }).toBuffer({ resolveWithObject: true }),
        img.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
      ]));
      const key = `${base}.jpg`, thumbKey = `${base}.t.webp`;
      await Promise.all([put(key, full.data, 'image/jpeg', where), put(thumbKey, thumb, 'image/webp', where)]);
      await land(m.id, [key, thumbKey], { status: landed, key, thumbKey, width: full.info.width, height: full.info.height, takenAt, readyAt: new Date(), error: null });
    } else if (m.kind === 'video') {
      const dir = await mkdtemp(join(tmpdir(), 'indahnya-'));
      try {
        const inPath = join(dir, 'in');
        await pipeline(await getStream(m.originalKey, 'private'), createWriteStream(inPath));
        const { stdout } = await content(run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration:format=duration', '-of', 'json', inPath]));
        const probe = JSON.parse(stdout) as { streams?: { width?: number; height?: number; duration?: string }[]; format?: { duration?: string } };
        const s = probe.streams?.[0];
        if (!s) throw new ContentError('Bukan video');
        const duration = Math.round(Number(s.duration ?? probe.format?.duration ?? 0));
        if (duration > MEDIA_LIMITS.videoSec + 2) throw new ContentError(`Video ${duration} saat — had ${MEDIA_LIMITS.videoSec} saat`);
        const outPath = join(dir, 'out.mp4'), posterPath = join(dir, 'poster.jpg');
        await content(run('ffmpeg', ['-y', '-ss', '1', '-i', inPath, '-frames:v', '1', '-vf', "scale='min(1280,iw)':-2", '-q:v', '4', posterPath]).catch(() =>
          run('ffmpeg', ['-y', '-i', inPath, '-frames:v', '1', '-vf', "scale='min(1280,iw)':-2", '-q:v', '4', posterPath])));
        await content(run('ffmpeg', ['-y', '-i', inPath, '-t', String(MEDIA_LIMITS.videoSec), '-vf', "scale='min(1280,iw)':-2", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outPath], { maxBuffer: 64 * 1024 * 1024 }));
        const poster = await readFile(posterPath);
        const posterInfo = await sharp(poster).metadata();
        const out = await readFile(outPath);
        const key = `${base}.mp4`, posterKey = `${base}.p.jpg`;
        await Promise.all([put(key, out, 'video/mp4', where), put(posterKey, poster, 'image/jpeg', where)]);
        // width/height follow the poster: rotation metadata is already applied there
        await land(m.id, [key, posterKey], { status: landed, key, posterKey, thumbKey: posterKey, width: posterInfo.width ?? s.width ?? null, height: posterInfo.height ?? s.height ?? null, durationSec: duration, readyAt: new Date(), error: null });
      } finally { await rm(dir, { recursive: true, force: true }); }
    }
  } catch (e) {
    if (!(e instanceof ContentError)) throw e; // transient: the worker retries
    const msg = e.message?.slice(0, 300) || 'gagal';
    console.error(`[worker] media ${id} failed: ${msg}`);
    await db.update(media).set({ status: 'failed', error: msg }).where(and(eq(media.id, m.id), eq(media.status, 'uploaded')));
  }

  /**
   * Only an `uploaded` row lands: one deleted mid-processing (by the guest,
   * the host or a purge) stays deleted — and the copies just written for it
   * are removed again, since no row will ever point the sweep at them.
   */
  async function land(mid: string, keys: string[], set: Partial<typeof media.$inferInsert>) {
    const won = await useDb().update(media).set(set).where(and(eq(media.id, mid), eq(media.status, 'uploaded'))).returning({ id: media.id });
    if (!won.length) await delEverywhere(keys);
  }
}
