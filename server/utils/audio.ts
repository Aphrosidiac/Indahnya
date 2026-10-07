import { createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getStream, put, type Where } from './storage';
import { runTool, FFMPEG_PRIORITY } from './proc';

/** What a phone's recorder produces (webm/opus on Android and desktop, mp4/aac on iPhone) and what people upload. */
const FORMATS = /^(matroska,webm|mov,mp4,m4a,3gp,3g2,mj2|ogg|mp3|wav|aac)$/;

/**
 * At most two transcodes at once per web process: a room full of guests
 * sending voice notes queues up instead of starting fifty ffmpegs. A wait
 * longer than 20 s is refused BEFORE the wish is claimed, so the guest's
 * retry finds it still waiting, never stuck "processing". Worst case for one
 * request (20 s queue + the timeouts below) stays under a minute and a half,
 * inside nginx's and Cloudflare's limits.
 */
const MAX_VOICE = 2;
let running = 0;
const waiting: (() => void)[] = [];
export function voiceSlot(): Promise<() => void> {
  let released = false;
  const release = () => { if (released) return; released = true; running--; waiting.shift()?.(); };
  if (running < MAX_VOICE) { running++; return Promise.resolve(release); }
  return new Promise((resolve, reject) => {
    const go = () => { clearTimeout(t); running++; resolve(release); };
    const t = setTimeout(() => { const i = waiting.indexOf(go); if (i >= 0) waiting.splice(i, 1); reject(createError({ statusCode: 503, statusMessage: 'Ramai sangat tengah hantar — cuba sekejap lagi' })); }, 20_000);
    waiting.push(go);
  });
}

/**
 * A voice ucapan: whatever the phone recorded → mono AAC in M4A, the one
 * format every phone plays. The file is read as a plain local file only
 * (no playlists, no URLs), cut at `maxSec`, with no metadata carried over.
 * Returns the duration.
 */
export async function processVoice(srcKey: string, outKey: string, where: Where, maxSec: number) {
  const dir = await mkdtemp(join(tmpdir(), 'indahnya-voice-'));
  try {
    const inPath = join(dir, 'in'), outPath = join(dir, 'out.m4a');
    await pipeline(await getStream(srcKey, 'private'), createWriteStream(inPath));
    const { stdout } = await runTool('ffprobe', ['-v', 'error', '-protocol_whitelist', 'file', '-show_entries', 'format=duration,format_name', '-of', 'json', inPath], { timeoutMs: 15_000 });
    const fmt = (JSON.parse(stdout.toString()) as { format?: { duration?: string; format_name?: string } }).format;
    if (!FORMATS.test(fmt?.format_name ?? '')) throw new Error('Bukan rakaman suara');
    await runTool('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-protocol_whitelist', 'file', '-i', inPath, '-vn', '-t', String(maxSec), '-ac', '1', '-c:a', 'aac', '-b:a', '96k', '-map_metadata', '-1', '-movflags', '+faststart', outPath], { timeoutMs: 45_000, nice: FFMPEG_PRIORITY });
    const { stdout: out } = await runTool('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', outPath], { timeoutMs: 10_000 });
    const sec = Math.max(1, Math.round(Number(out.toString().trim()) || 0));
    await put(outKey, await readFile(outPath), 'audio/mp4', where);
    return sec;
  } finally { await rm(dir, { recursive: true, force: true }); }
}
