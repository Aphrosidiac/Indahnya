/**
 * The guest upload pipeline, browser side.
 *
 *   1. ask the server for slots (it checks the cap and signs a PUT per file)
 *   2. PUT each file straight to the bucket with XHR, for a progress event
 *   3. tell the server the PUT landed; it enqueues processing
 *   4. poll status until every id is ready or failed
 *
 * Three files at a time — enough to fill a phone's uplink, few enough that a
 * bad one does not stall the rest. A failed PUT retries twice with backoff;
 * a failed slot request (the cap, a closed window) fails the whole batch
 * with the server's own words.
 */
export interface UploadItem {
  key: string; file: File; name: string; preview: string | null;
  id: string | null; pct: number;
  state: 'queued' | 'signing' | 'uploading' | 'processing' | 'ready' | 'failed';
  error: string | null; thumb: string | null;
}

export function useUploader(slug: () => string) {
  const items = ref<UploadItem[]>([]);
  const running = ref(false);
  const done = computed(() => items.value.filter(i => i.state === 'ready').length);
  const failed = computed(() => items.value.filter(i => i.state === 'failed').length);
  const active = computed(() => items.value.some(i => ['queued', 'signing', 'uploading', 'processing'].includes(i.state)));

  function add(files: FileList | File[]) {
    for (const f of Array.from(files)) {
      const isImg = f.type.startsWith('image/');
      items.value.push({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file: f, name: f.name, preview: isImg ? URL.createObjectURL(f) : null, id: null, pct: 0, state: 'queued', error: null, thumb: null });
    }
    if (!running.value) void run();
  }

  async function run() {
    running.value = true;
    try {
      const batch = items.value.filter(i => i.state === 'queued');
      if (!batch.length) return;
      batch.forEach(i => { i.state = 'signing'; });
      let slots: { name: string; id?: string; url?: string; error?: string }[];
      try {
        const r = await $fetch<{ uploads: typeof slots }>(`/api/g/${slug()}/uploads`, { method: 'POST', body: { files: batch.map(i => ({ name: i.name, type: i.file.type || 'application/octet-stream', bytes: i.file.size })) } });
        slots = r.uploads;
      } catch (e) {
        const msg = apiError(e);
        batch.forEach(i => { i.state = 'failed'; i.error = msg; });
        return;
      }
      slots.forEach((s, n) => { const it = batch[n]!; if (s.error || !s.url) { it.state = 'failed'; it.error = s.error ?? 'Tak dapat slot'; } else { it.id = s.id!; (it as UploadItem & { url?: string }).url = s.url; } });

      const queue = batch.filter(i => i.state === 'signing');
      const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
        for (;;) { const it = queue.shift(); if (!it) return; await putOne(it as UploadItem & { url: string }); }
      });
      await Promise.all(workers);
      await poll(batch.filter(i => i.state === 'processing'));
    } finally {
      running.value = false;
      if (items.value.some(i => i.state === 'queued')) void run();
    }
  }

  async function putOne(it: UploadItem & { url: string }) {
    it.state = 'uploading';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', it.url);
          xhr.setRequestHeader('Content-Type', it.file.type || 'application/octet-stream');
          xhr.upload.onprogress = (e) => { if (e.lengthComputable) it.pct = Math.round((e.loaded / e.total) * 100); };
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`PUT ${xhr.status}`)));
          xhr.onerror = () => reject(new Error('network'));
          xhr.send(it.file);
        });
        await $fetch(`/api/g/${slug()}/uploads/${it.id}/complete`, { method: 'POST' });
        it.pct = 100; it.state = 'processing';
        return;
      } catch (e) {
        if (attempt === 2) { it.state = 'failed'; it.error = apiError(e, 'Upload terputus'); return; }
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }

  async function poll(list: UploadItem[]) {
    const pending = new Map(list.map(i => [i.id!, i]));
    for (let n = 0; pending.size && n < 90; n++) {
      await new Promise(r => setTimeout(r, n < 5 ? 1500 : 3000));
      try {
        const r = await $fetch<{ items: { id: string; status: string; error: string | null; thumb: string | null }[] }>(`/api/g/${slug()}/uploads/status`, { query: { ids: [...pending.keys()].join(',') } });
        for (const s of r.items) {
          const it = pending.get(s.id); if (!it) continue;
          if (s.status === 'ready' || s.status === 'hidden') { it.state = 'ready'; it.thumb = s.thumb; pending.delete(s.id); }
          else if (s.status === 'failed') { it.state = 'failed'; it.error = s.error ?? 'Gagal proses'; pending.delete(s.id); }
        }
      } catch { /* keep polling */ }
    }
    for (const it of pending.values()) { it.state = 'ready'; } // the worker is slow, not broken: it will land
  }

  function retry(it: UploadItem) { it.state = 'queued'; it.error = null; it.pct = 0; it.id = null; if (!running.value) void run(); }
  function clear() { items.value.filter(i => i.preview).forEach(i => URL.revokeObjectURL(i.preview!)); items.value = []; }

  return { items, add, retry, clear, done, failed, active };
}
