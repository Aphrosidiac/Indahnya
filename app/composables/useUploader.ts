/**
 * The guest upload pipeline, browser side.
 *
 *   1. ask the server for slots (it checks the cap and signs a PUT per file,
 *      with the Content-Type and exact size the PUT must carry)
 *   2. PUT each file straight to the bucket with XHR, for a progress event
 *   3. tell the server the PUT landed; it enqueues processing
 *   4. poll status until every id is ready, awaiting approval, or failed
 *
 * Three files at a time — enough to fill a phone's uplink, few enough that a
 * bad one does not stall the rest. A dropped connection is the normal case
 * in a dewan: a failed PUT waits for the phone to come back online (the
 * signed URL lives three hours) and resumes, with backoff, instead of giving
 * up after a second. A failed slot request (the cap, a closed window) fails
 * the whole batch with the server's own words.
 */
export interface UploadItem {
  key: string; file: File; name: string; preview: string | null;
  id: string | null; pct: number;
  state: 'queued' | 'signing' | 'uploading' | 'offline' | 'processing' | 'ready' | 'failed';
  /** Landed, but the host approves before anyone sees it. */
  awaiting: boolean;
  error: string | null; thumb: string | null;
}

type Slot = { name: string; id?: string; url?: string; type?: string; error?: string };
const BACKOFF_MS = [1000, 3000, 8000, 20000, 45000];

export function useUploader(slug: () => string) {
  const items = ref<UploadItem[]>([]);
  const running = ref(false);
  const done = computed(() => items.value.filter(i => i.state === 'ready').length);
  const awaiting = computed(() => items.value.filter(i => i.state === 'ready' && i.awaiting).length);
  const failed = computed(() => items.value.filter(i => i.state === 'failed').length);
  const offline = computed(() => items.value.some(i => i.state === 'offline'));
  const active = computed(() => items.value.some(i => ['queued', 'signing', 'uploading', 'offline', 'processing'].includes(i.state)));

  function add(files: FileList | File[]) {
    for (const f of Array.from(files)) {
      const isImg = f.type.startsWith('image/') && !/heic|heif/i.test(f.type);
      items.value.push({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file: f, name: f.name, preview: isImg ? URL.createObjectURL(f) : null, id: null, pct: 0, state: 'queued', awaiting: false, error: null, thumb: null });
    }
    if (!running.value) void run();
  }

  async function run() {
    running.value = true;
    try {
      const batch = items.value.filter(i => i.state === 'queued').slice(0, 30);
      if (!batch.length) return;
      batch.forEach((i) => { i.state = 'signing'; });
      let slots: Slot[];
      try {
        const r = await $fetch<{ uploads: Slot[] }>(`/api/g/${slug()}/uploads`, { method: 'POST', body: { files: batch.map(i => ({ name: i.name, type: i.file.type || '', bytes: i.file.size })) } });
        slots = r.uploads;
      } catch (e) {
        const msg = apiError(e);
        batch.forEach((i) => { i.state = 'failed'; i.error = msg; });
        return;
      }
      const urls = new Map<UploadItem, { url: string; type: string }>();
      slots.forEach((s, n) => {
        const it = batch[n]!;
        if (s.error || !s.url || !s.id) { it.state = 'failed'; it.error = s.error ?? 'Tak dapat slot'; }
        else { it.id = s.id; urls.set(it, { url: s.url, type: s.type ?? it.file.type }); }
      });

      const queue = batch.filter(i => urls.has(i));
      const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
        for (;;) { const it = queue.shift(); if (!it) return; await putOne(it, urls.get(it)!); }
      });
      await Promise.all(workers);
      await poll(batch.filter(i => i.state === 'processing'));
    } finally {
      running.value = false;
      if (items.value.some(i => i.state === 'queued')) void run();
    }
  }

  function put(it: UploadItem, url: string, type: string) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', type);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) it.pct = Math.round((e.loaded / e.total) * 100); };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(Object.assign(new Error(`PUT ${xhr.status}`), { status: xhr.status })));
      xhr.onerror = () => reject(Object.assign(new Error('network'), { status: 0 }));
      xhr.send(it.file);
    });
  }

  const waitOnline = () => new Promise<void>((resolve) => {
    if (navigator.onLine) return resolve();
    addEventListener('online', () => resolve(), { once: true });
  });

  async function putOne(it: UploadItem, slot: { url: string; type: string }) {
    for (let attempt = 0; ; attempt++) {
      try {
        it.state = 'uploading';
        await put(it, slot.url, slot.type);
        await $fetch(`/api/g/${slug()}/uploads/${it.id}/complete`, { method: 'POST', retry: 3, retryDelay: 1500 });
        it.pct = 100; it.state = 'processing';
        return;
      } catch (e) {
        const status = (e as { status?: number; statusCode?: number }).status ?? (e as { statusCode?: number }).statusCode ?? 0;
        // 4xx from the store (a signature the store refused, an expired URL) will not heal by retrying
        const fatal = status >= 400 && status < 500 && status !== 408 && status !== 429;
        if (fatal || attempt >= BACKOFF_MS.length) { it.state = 'failed'; it.error = apiError(e, 'Upload terputus'); return; }
        if (!navigator.onLine) { it.state = 'offline'; await waitOnline(); }
        await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));
      }
    }
  }

  async function poll(list: UploadItem[]) {
    const pending = new Map(list.map(i => [i.id!, i]));
    for (let n = 0; pending.size && n < 120; n++) {
      await new Promise(r => setTimeout(r, n < 5 ? 1500 : 3000));
      try {
        const r = await $fetch<{ items: { id: string; status: string; error: string | null; thumb: string | null }[] }>(`/api/g/${slug()}/uploads/status`, { query: { ids: [...pending.keys()].join(',') } });
        for (const s of r.items) {
          const it = pending.get(s.id); if (!it) continue;
          if (s.status === 'ready' || s.status === 'hidden') { it.state = 'ready'; it.awaiting = s.status === 'hidden'; it.thumb = s.thumb; pending.delete(s.id); }
          else if (s.status === 'failed' || s.status === 'deleted') { it.state = 'failed'; it.error = s.error ?? 'Gagal proses'; pending.delete(s.id); }
        }
      } catch { /* keep polling */ }
    }
    // the bytes are safely in; the worker is slow, not broken, and the gallery will show them when it lands
    for (const it of pending.values()) { it.state = 'ready'; }
  }

  async function retry(it: UploadItem) {
    // hand back the old slot first, or it holds a place in a free gallery's cap until the sweep
    const old = it.id;
    it.state = 'signing'; it.error = null; it.pct = 0; it.id = null;
    if (old) await $fetch(`/api/g/${slug()}/media/${old}`, { method: 'DELETE' }).catch(() => {});
    it.state = 'queued';
    if (!running.value) void run();
  }
  function clear() { items.value.filter(i => i.preview).forEach(i => URL.revokeObjectURL(i.preview!)); items.value = []; }

  return { items, add, retry, clear, done, awaiting, failed, offline, active };
}
