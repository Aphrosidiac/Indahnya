/**
 * A voice ucapan recorder. MediaRecorder picks what the phone can make —
 * WebM/Opus on Android and desktop Chrome, MP4/AAC on iPhone — and the
 * server turns either into M4A. Stops itself at `maxSec`.
 *
 * The microphone is never left on: if the component goes away while the
 * permission prompt is still up, the stream is stopped the moment it
 * arrives; a reset detaches the recorder before stopping it, so no late
 * `onstop` resurrects a finished recording.
 */
export function useVoiceRecorder(maxSec = 60) {
  const state = ref<'idle' | 'asking' | 'recording' | 'done' | 'denied' | 'unsupported'>('idle');
  const seconds = ref(0);
  const blob = ref<Blob | null>(null);
  const url = ref<string | null>(null);
  let rec: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  let disposed = false;
  let attempt = 0;

  const supported = () => typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  const mime = () => ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported?.(t)) ?? '';
  const release = () => { stream?.getTracks().forEach(t => t.stop()); stream = null; };

  async function start() {
    if (!supported()) { state.value = 'unsupported'; return; }
    reset();
    const mine = ++attempt;
    state.value = 'asking';
    let s: MediaStream;
    try { s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch { if (mine === attempt) state.value = 'denied'; return; }
    // gone (unmounted) or superseded (reset / another start) while the prompt was up
    if (disposed || mine !== attempt) { s.getTracks().forEach(t => t.stop()); return; }
    stream = s;
    const type = mime();
    try { rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 64_000 } : undefined); }
    catch { release(); state.value = 'unsupported'; return; }
    const chunks: BlobPart[] = [];
    const r = rec;
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    r.onstop = () => {
      if (rec !== r) return;
      blob.value = new Blob(chunks, { type: r.mimeType || type || 'audio/webm' });
      url.value = URL.createObjectURL(blob.value);
      state.value = 'done';
      release();
    };
    seconds.value = 0;
    r.start(250);
    state.value = 'recording';
    timer = setInterval(() => { seconds.value++; if (seconds.value >= maxSec) stop(); }, 1000);
  }
  function stop() { clearInterval(timer); if (rec?.state === 'recording') rec.stop(); }
  function reset() {
    attempt++;
    clearInterval(timer);
    const r = rec; rec = null;
    if (r) { r.onstop = null; r.ondataavailable = null; if (r.state === 'recording') r.stop(); }
    release();
    if (url.value) URL.revokeObjectURL(url.value);
    url.value = null; blob.value = null; seconds.value = 0; state.value = 'idle';
  }
  onBeforeUnmount(() => { disposed = true; reset(); });
  return { state, seconds, blob, url, start, stop, reset, supported };
}
