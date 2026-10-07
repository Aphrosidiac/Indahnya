import { createRequire } from 'node:module';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runTool, hasTool, ToolError } from './proc';

/**
 * HEIC/HEIF → JPEG, always OUTSIDE this process.
 *
 * Decoding HEIC in Node (heic-convert = libheif compiled to WASM) is
 * synchronous: a 12 MP iPhone photo froze every request for ~3.5 s and a
 * 48 MP one for 16 s, and the WASM heap (0.5–1.7 GB) is never given back.
 * So the work runs in a child process, with a hard timeout, at low CPU
 * priority:
 *
 *   1. libheif's own CLI when the box has it (`heif-dec`, or `heif-convert`
 *      on libheif < 1.18 — `apt install libheif-examples`): native, ~2.5×
 *      faster than the WASM build;
 *   2. otherwise heic-convert in a throwaway `node` child.
 *
 * Either way a crash or an out-of-memory kill takes down the child, never
 * the server. The image's declared size is checked BEFORE anything is
 * decoded, so a crafted 30,000 × 30,000 file is refused without allocating
 * its 3.6 GB of pixels.
 */
export class HeicError extends Error {}

const TIMEOUT_MS = 90_000;

/** Width × height of the largest image the file declares (its `ispe` boxes), or null when none is found. */
export function heifDeclaredPixels(buf: Buffer): number | null {
  // `ispe` lives in the meta box, which phones write at the front; 1 MB covers every real file
  const end = Math.min(buf.length, 1024 * 1024) - 20;
  let best: number | null = null;
  for (let i = 4; i < end; i++) {
    // box layout: size(4) 'ispe'(4) version+flags(4) width(4) height(4)
    if (buf[i] === 0x69 && buf[i + 1] === 0x73 && buf[i + 2] === 0x70 && buf[i + 3] === 0x65) {
      const size = buf.readUInt32BE(i - 4);
      if (size !== 20) continue;
      const w = buf.readUInt32BE(i + 8), h = buf.readUInt32BE(i + 12);
      if (w > 0 && h > 0) best = Math.max(best ?? 0, w * h);
    }
  }
  return best;
}

async function nativeTool() {
  if (await hasTool('heif-dec')) return 'heif-dec';
  if (await hasTool('heif-convert')) return 'heif-convert';
  return null;
}

/** heic-convert's entry, resolved from this file so it works from the built server and in dev. */
let modPath: string | undefined;
function heicConvertPath() {
  return (modPath ??= createRequire(import.meta.url).resolve('heic-convert'));
}

/** Runs in the child: stdin = HEIC bytes, stdout = JPEG bytes. */
const CHILD = `
const convert = require(process.argv[1]);
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', async () => {
  try {
    const out = await convert({ buffer: Buffer.concat(chunks), format: 'JPEG', quality: Number(process.argv[2]) });
    process.stdout.write(Buffer.from(out));
  } catch (e) { process.stderr.write(String(e && e.message || e)); process.exit(2); }
});`;

export async function heicToJpeg(input: Buffer, opts: { maxPixels: number; quality?: number }): Promise<Buffer> {
  const declared = heifDeclaredPixels(input);
  if (declared !== null && declared > opts.maxPixels) throw new HeicError(`Gambar terlalu besar (${Math.round(declared / 1e6)} MP)`);
  const q = opts.quality ?? 92;
  const tool = await nativeTool();
  try {
    if (tool) {
      const dir = await mkdtemp(join(tmpdir(), 'indahnya-heic-'));
      try {
        const inPath = join(dir, 'in.heic'), outPath = join(dir, 'out.jpg');
        await writeFile(inPath, input);
        await runTool(tool, ['-q', String(q), inPath, outPath], { timeoutMs: TIMEOUT_MS, nice: 5 });
        // a file with several top-level images is written as out-1.jpg, out-2.jpg…: the first is the primary
        const name = (await readdir(dir)).filter(f => /^out(-\d+)?\.jpg$/.test(f)).sort()[0];
        if (!name) throw new HeicError('Gambar HEIC tak dapat dibaca');
        return await readFile(join(dir, name));
      } finally { await rm(dir, { recursive: true, force: true }); }
    }
    const { stdout } = await runTool(process.execPath, ['--max-old-space-size=512', '-e', CHILD, heicConvertPath(), String(q / 100)], {
      timeoutMs: TIMEOUT_MS, nice: 5, input, maxBuffer: 256 * 1024 * 1024,
    });
    if (!stdout.length) throw new HeicError('Gambar HEIC tak dapat dibaca');
    return stdout;
  } catch (e) {
    if (e instanceof HeicError) throw e;
    // a timeout is a busy box as often as a bad file: let the worker retry it
    if (e instanceof ToolError && e.timedOut) throw e;
    throw new HeicError(`Gambar HEIC tak dapat dibaca: ${(e as Error).message.slice(0, 200)}`);
  }
}
