import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getStream, put, type Where } from './storage';

const run = promisify(execFile);
const FF = { timeout: 60_000, maxBuffer: 16 * 1024 * 1024 };
/** What a phone's recorder produces (webm/opus on Android and desktop, mp4/aac on iPhone) and what people upload. */
const FORMATS = /^(matroska,webm|mov,mp4,m4a,3gp,3g2,mj2|ogg|mp3|wav|aac)$/;

/**
 * At most two transcodes at once, process-wide: a room full of guests
 * sending voice notes queues up instead of starting fifty ffmpegs. A wait
 * longer than 30 s is refused (the guest can press send again).
 */
const MAX_VOICE = 2;
let running = 0;
const waiting: (() => void)[] = [];
export function voiceSlot(): Promise<() => void> {
  const release = () => { running--; waiting.shift()?.(); };
  if (running < MAX_VOICE) { running++; return Promise.resolve(release); }
  return new Promise((resolve, reject) => {
    const go = () => { clearTimeout(t); running++; resolve(release); };
    const t = setTimeout(() => { const i = waiting.indexOf(go); if (i >= 0) waiting.splice(i, 1); reject(createError({ statusCode: 503, statusMessage: 'Ramai sangat tengah hantar — cuba sekejap lagi' })); }, 30_000);
    waiting.push(go);
  });
}

/**
 * A voice ucapan: whatever the phone recorded → mono AAC in M4A, the one
 * format every phone plays. The file is read as a plain local file only
 * (no playlists, no URLs) and cut at `maxSec`. Returns the duration.
 */
export async function processVoice(srcKey: string, outKey: string, where: Where, maxSec: number) {
  const dir = await mkdtemp(join(tmpdir(), 'indahnya-voice-'));
  try {
    const inPath = join(dir, 'in'), outPath = join(dir, 'out.m4a');
    await pipeline(await getStream(srcKey, 'private'), createWriteStream(inPath));
    const { stdout } = await run('ffprobe', ['-v', 'error', '-protocol_whitelist', 'file', '-show_entries', 'format=duration,format_name', '-of', 'json', inPath], FF);
    const fmt = (JSON.parse(stdout) as { format?: { duration?: string; format_name?: string } }).format;
    if (!FORMATS.test(fmt?.format_name ?? '')) throw new Error('Bukan rakaman suara');
    await run('ffmpeg', ['-y', '-protocol_whitelist', 'file', '-i', inPath, '-vn', '-t', String(maxSec), '-ac', '1', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', outPath], FF);
    const { stdout: out } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', outPath], FF);
    const sec = Math.max(1, Math.round(Number(out.trim()) || 0));
    await put(outKey, await readFile(outPath), 'audio/mp4', where);
    return sec;
  } finally { await rm(dir, { recursive: true, force: true }); }
}
