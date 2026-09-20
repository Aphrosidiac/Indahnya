import sharp from 'sharp';
import exifr from 'exifr';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { useDb, media, events } from '../db';
import { getBuffer, put } from '../utils/storage';
import { MEDIA_LIMITS } from '../utils/plans';

const run = promisify(execFile);

/**
 * Turns an uploaded original into what the gallery serves.
 *
 * Photos: HEIC → JPEG, auto-rotated, EXIF stripped (location included), the
 * served copy capped at 2400px, a 480px WebP thumb. `takenAt` is read from
 * EXIF before it is stripped, so the zip and the feed can order by the
 * moment, not the upload.
 *
 * Videos: ffprobe for duration (over the cap → failed, the guest is told),
 * a poster frame at 1s, and an H.264 720p MP4 with faststart so an iPhone's
 * HEVC .mov plays on every Android at the table.
 */
export async function processMedia(id: string) {
  const db = useDb();
  const [m] = await db.select().from(media).where(eq(media.id, id));
  if (!m || m.status !== 'uploaded') return;
  const [ev] = await db.select({ settings: events.settings }).from(events).where(eq(events.id, m.eventId));
  /** Approval mode: the served copies land under hidden/ and the row is `hidden` until the host shows it. */
  const gated = !!ev?.settings.approvalMode;
  const base = `${gated ? 'hidden/' : ''}events/${m.eventId.toLowerCase()}/${m.id.toLowerCase()}`;
  const landed = gated ? 'hidden' as const : 'ready' as const;
  try {
    if (m.kind === 'photo') {
      const src = await getBuffer(m.originalKey);
      let takenAt: Date | null = null;
      try { const d = await exifr.parse(src, { pick: ['DateTimeOriginal', 'CreateDate'] }); const v = d?.DateTimeOriginal ?? d?.CreateDate; if (v instanceof Date && !Number.isNaN(v.getTime())) takenAt = v; } catch { /* no exif */ }
      let input: Buffer = src;
      if (/heic|heif/.test(m.mime)) {
        const { default: convert } = await import('heic-convert');
        input = Buffer.from(await convert({ buffer: new Uint8Array(src) as never, format: 'JPEG', quality: 0.92 }));
      }
      const img = sharp(input, { failOn: 'none' }).rotate();
      const meta = await img.metadata();
      const [full, thumb] = await Promise.all([
        img.clone().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86, mozjpeg: true }).toBuffer({ resolveWithObject: true }),
        img.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
      ]);
      const key = `${base}.jpg`, thumbKey = `${base}.t.webp`;
      await Promise.all([put(key, full.data, 'image/jpeg'), put(thumbKey, thumb, 'image/webp')]);
      await db.update(media).set({ status: landed, key, thumbKey, width: full.info.width, height: full.info.height, takenAt, readyAt: new Date(), error: null })
        .where(eq(media.id, m.id));
      void meta;
    } else if (m.kind === 'video') {
      const dir = await mkdtemp(join(tmpdir(), 'indahnya-'));
      try {
        const inPath = join(dir, 'in');
        await writeFile(inPath, await getBuffer(m.originalKey));
        const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration:format=duration', '-of', 'json', inPath]);
        const probe = JSON.parse(stdout) as { streams?: { width?: number; height?: number; duration?: string }[]; format?: { duration?: string } };
        const s = probe.streams?.[0];
        const duration = Math.round(Number(s?.duration ?? probe.format?.duration ?? 0));
        if (duration > MEDIA_LIMITS.videoSec + 2) throw new Error(`Video ${duration}s — had ${MEDIA_LIMITS.videoSec}s`);
        const outPath = join(dir, 'out.mp4'), posterPath = join(dir, 'poster.jpg');
        await run('ffmpeg', ['-y', '-i', inPath, '-ss', '1', '-frames:v', '1', '-vf', "scale='min(1280,iw)':-2", '-q:v', '4', posterPath]).catch(() =>
          run('ffmpeg', ['-y', '-i', inPath, '-frames:v', '1', '-vf', "scale='min(1280,iw)':-2", '-q:v', '4', posterPath]));
        await run('ffmpeg', ['-y', '-i', inPath, '-t', String(MEDIA_LIMITS.videoSec), '-vf', "scale='min(1280,iw)':-2", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outPath], { maxBuffer: 64 * 1024 * 1024 });
        const poster = await readFile(posterPath);
        const posterInfo = await sharp(poster).metadata();
        const out = await readFile(outPath);
        const key = `${base}.mp4`, posterKey = `${base}.p.jpg`;
        await Promise.all([put(key, out, 'video/mp4'), put(posterKey, poster, 'image/jpeg')]);
        // width/height follow the poster: rotation metadata is already applied there
        await db.update(media).set({ status: landed, key, posterKey, thumbKey: posterKey, width: posterInfo.width ?? s?.width ?? null, height: posterInfo.height ?? s?.height ?? null, durationSec: duration, readyAt: new Date(), error: null })
          .where(eq(media.id, m.id));
      } finally { await rm(dir, { recursive: true, force: true }); }
    }
  } catch (e) {
    const msg = (e as Error).message?.slice(0, 300) || 'gagal';
    console.error(`[worker] media ${id} failed: ${msg}`);
    await db.update(media).set({ status: 'failed', error: msg }).where(eq(media.id, m.id));
  }
}
