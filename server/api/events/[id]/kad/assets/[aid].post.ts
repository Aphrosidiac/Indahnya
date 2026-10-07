import { z } from 'zod';
import sharp from 'sharp';
import { createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requireEventAccess } from '../../../../../utils/session';
import { head, getBuffer, getStream, put, del, publicUrl } from '../../../../../utils/storage';
import { kadPrefix, KAD_ASSET_TYPES } from '../../../../../utils/kad';
import { readBodyAs } from '../../../../../utils/validate';
import { heicToJpeg } from '../../../../../utils/heic';
import { runTool, FFMPEG_PRIORITY } from '../../../../../utils/proc';

/** ffmpeg reads the upload as a plain local file and nothing else (no playlists, no URLs), for at most a minute. */
const FF = { timeoutMs: 60_000, nice: FFMPEG_PRIORITY };
const AUDIO_FORMATS = /^(mp3|mov,mp4,m4a,3gp,3g2,mj2|wav|ogg|aac)$/;
const inFlight = new Set<string>();
const Body = z.object({ kind: z.enum(['photo', 'qr', 'music']) });

/**
 * The upload landed: process it into what the kad serves, in the PUBLIC
 * bucket under the event's kad/ folder, and drop the original.
 *   photo → auto-rotated, EXIF stripped, ≤1600px WebP
 *   qr    → PNG, lossless, ≤1200px — a DuitNow QR must still scan
 *   music → AAC in M4A, 128 kbps, ≤ 8 minutes — plays on every phone
 * Done in the request: these are a handful of small files, and the host is
 * watching the spinner.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const { kind } = await readBodyAs(event, Body);
  const aid = getRouterParam(event, 'aid')!;
  if (!/^[a-z0-9]{26}$/.test(aid)) throw createError({ statusCode: 400 });
  if (ev.purgedAt) throw createError({ statusCode: 410, statusMessage: 'Majlis ni dah tamat simpanan' });
  if (inFlight.has(aid)) throw createError({ statusCode: 409, statusMessage: 'Fail ni tengah diproses' });
  inFlight.add(aid);
  try { return await processAsset(ev.id, aid, kind); } finally { inFlight.delete(aid); }
});

async function processAsset(eventId: string, aid: string, kind: 'photo' | 'qr' | 'music') {
  const src = `events/${eventId.toLowerCase()}/kad-src/${aid}`;
  const h = await head(src, 'private');
  if (!h) throw createError({ statusCode: 409, statusMessage: 'Fail belum sampai' });
  if ((h.ContentLength ?? 0) > KAD_ASSET_TYPES[kind].max) { await del([src], 'private'); throw createError({ statusCode: 413, statusMessage: 'Fail terlalu besar' }); }
  const base = `${kadPrefix(eventId)}${aid}`;
  let key: string;
  try {
    if (kind === 'photo' || kind === 'qr') {
      let input: Buffer = await getBuffer(src, 'private');
      // in a child process, like the guests' photos: never on this process's event loop
      if (/heic|heif/.test(h.ContentType ?? '')) input = await heicToJpeg(input, { maxPixels: 40_000_000 });
      const img = sharp(input, { failOn: 'none', limitInputPixels: 40_000_000 }).rotate();
      if (kind === 'photo') {
        key = `${base}.webp`;
        await put(key, await img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(), 'image/webp', 'public');
      } else {
        key = `${base}.png`;
        await put(key, await img.resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer(), 'image/png', 'public');
      }
    } else {
      const dir = await mkdtemp(join(tmpdir(), 'indahnya-kad-'));
      try {
        const inPath = join(dir, 'in'), outPath = join(dir, 'out.m4a');
        await pipeline(await getStream(src, 'private'), createWriteStream(inPath));
        const { stdout } = await runTool('ffprobe', ['-v', 'error', '-protocol_whitelist', 'file', '-show_entries', 'format=duration,format_name', '-of', 'json', inPath], FF);
        const fmt = (JSON.parse(stdout.toString()) as { format?: { duration?: string; format_name?: string } }).format;
        const sec = Number(fmt?.duration ?? 0);
        if (!sec || !AUDIO_FORMATS.test(fmt?.format_name ?? '')) throw new Error('Bukan fail lagu');
        await runTool('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-protocol_whitelist', 'file', '-i', inPath, '-vn', '-t', '480', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', outPath], { ...FF, timeoutMs: 120_000 });
        key = `${base}.m4a`;
        await put(key, await readFile(outPath), 'audio/mp4', 'public');
      } finally { await rm(dir, { recursive: true, force: true }); }
    }
  } catch (e) {
    await del([src], 'private');
    throw createError({ statusCode: 422, statusMessage: kind === 'music' ? 'Lagu tu tak dapat dibaca' : 'Gambar tu tak dapat dibaca', data: { reason: (e as Error).message?.slice(0, 200) } });
  }
  await del([src], 'private');
  return { key, url: publicUrl(key) };
}
