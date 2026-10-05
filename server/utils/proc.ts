import { spawn } from 'node:child_process';
import { setPriority } from 'node:os';

/**
 * Every external tool (ffmpeg, ffprobe, the HEIC decoder) runs through here:
 * always with a hard timeout (SIGKILL, so a wedged encoder cannot hold a
 * worker slot until its job lock goes stale and the job runs twice), and
 * optionally at a lower CPU priority so the web side of the box stays
 * responsive while a video encodes.
 */
export class ToolError extends Error {
  constructor(message: string, readonly code: number | null, readonly timedOut = false) { super(message); }
}

export interface RunOpts {
  timeoutMs: number;
  /** 0 (normal) to 19 (lowest). */
  nice?: number;
  /** Bytes written to the tool's stdin. */
  input?: Buffer;
  /** Cap on captured stdout; past it the tool is killed. */
  maxBuffer?: number;
  env?: NodeJS.ProcessEnv;
}

export function runTool(cmd: string, args: string[], o: RunOpts): Promise<{ stdout: Buffer; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], env: o.env ?? process.env });
    if (o.nice && child.pid) { try { setPriority(child.pid, o.nice); } catch { /* not permitted: run at normal priority */ } }
    const out: Buffer[] = [];
    let outBytes = 0;
    let err = '';
    let settled = false;
    const max = o.maxBuffer ?? 64 * 1024 * 1024;
    const finish = (e: Error | null, v?: { stdout: Buffer; stderr: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (e) reject(e); else resolve(v!);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new ToolError(`${cmd} timed out after ${Math.round(o.timeoutMs / 1000)}s`, null, true));
    }, o.timeoutMs);
    child.stdout.on('data', (c: Buffer) => {
      outBytes += c.length;
      if (outBytes > max) { child.kill('SIGKILL'); finish(new ToolError(`${cmd} output over ${max} bytes`, null)); return; }
      out.push(c);
    });
    child.stderr.on('data', (c: Buffer) => { if (err.length < 8000) err += c.toString(); });
    child.on('error', e => finish(e));
    child.on('close', (code, signal) => {
      if (code === 0) finish(null, { stdout: Buffer.concat(out), stderr: err });
      else finish(new ToolError(`${cmd} failed (${signal ?? code}): ${err.trim().split('\n').slice(-2).join(' ').slice(0, 300)}`, code));
    });
    child.stdin.on('error', () => { /* the tool exited before reading all of stdin; close tells the story */ });
    child.stdin.end(o.input);
  });
}

/** Is `cmd` on PATH? Asked once per process per tool. */
const seen = new Map<string, Promise<boolean>>();
export function hasTool(cmd: string, probeArgs = ['--version']) {
  let p = seen.get(cmd);
  if (!p) {
    // a non-zero exit still proves the binary is there; only "not found" (or a hang) means it is not
    p = runTool(cmd, probeArgs, { timeoutMs: 5000 }).then(() => true, e => e instanceof ToolError && !e.timedOut);
    seen.set(cmd, p);
  }
  return p;
}

export const FFMPEG_PRIORITY = 10;
