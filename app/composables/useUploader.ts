/**
 * The guest upload pipeline, browser side.
 *
 *   1. ask the server for slots, a few files at a time and ahead of need
 *      (it checks the cap and signs a PUT per file, with the Content-Type
 *      and exact size the PUT must carry; a big file gets one URL per part)
 *   2. PUT each file straight to the bucket with XHR, three at a time, for a
 *      progress event; a big file goes up part by part, so a dropped line
 *      re-sends one 8 MB part, not 100 MB
 *   3. tell the server the PUT landed; it queues processing
 *   4. a separate poll follows what is processing until it is ready,
 *      awaiting approval, or failed — the next files never wait for it
 *
 * A phone at a majlis is the hard case, so:
 *   - a transfer that stops moving for 45 s is aborted and retried (an XHR
 *     on a dead link otherwise never settles), with backoff, and waits for
 *     the phone to come back online first;
 *   - the screen is kept awake while files are going (Wake Lock), and
 *     leaving the page asks first;
 *   - with `persist`, every file not yet safely sent is kept in IndexedDB
 *     with its slot and finished parts: reopen the page (the tab was killed,
 *     the phone restarted) and the upload carries on from where it stopped;
 *   - a video over a minute is refused before a byte is sent;
 *   - the little previews are drawn small, one at a time, never as 30
 *     full-size 12 MP images in memory (iOS reloads a tab for less).
 */
export interface UploadItem {
  key: string; file: File; name: string; preview: string | null;
  id: string | null; pct: number;
  state: 'queued' | 'signing' | 'signed' | 'uploading' | 'offline' | 'processing' | 'ready' | 'failed';
  /** Landed, but the host approves before anyone sees it. */
  awaiting: boolean;
  error: string | null; thumb: string | null;
  slot: Slot | null;
}

interface Part { n: number; size: number; url: string; etag?: string }
interface Slot { id: string; type: string; url?: string; parts?: Part[]; at: number }
type SlotAnswer = { name: string; id?: string; url?: string; type?: string; parts?: Omit<Part, 'etag'>[]; error?: string };

const BACKOFF_MS = [1000, 3000, 8000, 15000, 30000, 45000, 60000, 60000];
const PARALLEL = 3;
/** Matches the server's per-browser reservation in a free gallery (MEDIA_LIMITS.cappedPendingPerGuest). */
const SLOT_BATCH = 10;
const STALL_MS = 45_000;
/** A slot's signed URLs live 3 h on the server; past this, ask for a new one rather than be refused. */
const SLOT_TTL_MS = 2.5 * 3_600_000;
const VIDEO_MAX_SEC = 60;

export interface UploaderMsgs {
  dropped: string; videoTooLong: (sec: number) => string; failedProcess: string; noSlot: string;
}
const MSG_MS: UploaderMsgs = {
  dropped: 'Upload terputus — tekan cuba lagi',
  videoTooLong: s => `Video ${s} saat — had ${VIDEO_MAX_SEC} saat`,
  failedProcess: 'Gagal proses',
  noSlot: 'Tak dapat slot',
};

export function useUploader(slug: () => string, opts: { persist?: boolean; msgs?: Partial<UploaderMsgs> } = {}) {
  const M = { ...MSG_MS, ...opts.msgs };
  const items = ref<UploadItem[]>([]);
  const done = computed(() => items.value.filter(i => i.state === 'ready').length);
  const awaiting = computed(() => items.value.filter(i => i.state === 'ready' && i.awaiting).length);
  const failed = computed(() => items.value.filter(i => i.state === 'failed').length);
  const offline = computed(() => items.value.some(i => i.state === 'offline'));
  const sending = computed(() => items.value.some(i => ['queued', 'signing', 'signed', 'uploading', 'offline'].includes(i.state)));
  const active = computed(() => sending.value || items.value.some(i => i.state === 'processing'));
  /** Files brought back from an earlier visit that had not finished. */
  const resumed = ref(0);

  const store = opts.persist && import.meta.client ? useUploadStore() : null;

  /* ── adding files ──────────────────────────────────────────────── */
  function makeItem(f: File, key = `${Date.now()}-${Math.random().toString(36).slice(2)}`, slot: Slot | null = null): UploadItem {
    return { key, file: f, name: f.name, preview: null, id: slot?.id ?? null, pct: 0, state: slot ? 'signed' : 'queued', awaiting: false, error: null, thumb: null, slot };
  }

  /** Push and hand back the REACTIVE copies: changes made through the plain objects would never reach the screen. */
  function push(list: UploadItem[]) {
    items.value.push(...list);
    return items.value.slice(-list.length);
  }

  async function add(files: FileList | File[]) {
    const fresh = push(Array.from(files).map(f => makeItem(f)));
    for (const it of fresh) void store?.put(slug(), it);
    previews(fresh);
    // a video over the limit never leaves the phone
    await Promise.all(fresh.filter(it => it.file.type.startsWith('video/') || /\.(mov|mp4|m4v|3gp|webm)$/i.test(it.name)).map(async (it) => {
      const sec = await videoSeconds(it.file);
      if (sec !== null && sec > VIDEO_MAX_SEC + 1) fail(it, M.videoTooLong(Math.round(sec)));
    }));
    pump();
  }

  /** Bring back what an earlier visit left unfinished. */
  async function restore() {
    if (!store) return;
    const saved = await store.list(slug());
    if (!saved.length) return;
    const back = push(saved.map(r => makeItem(r.file, r.key, r.slot && Date.now() - r.slot.at < SLOT_TTL_MS ? r.slot : null)));
    resumed.value = back.length;
    previews(back);
    pump();
  }

  function fail(it: UploadItem, error: string) {
    it.state = 'failed'; it.error = error;
    // a file that cannot go is not kept for a later visit; a retry adds it back
    void store?.remove(it.key);
  }

  /* ── the pump: slots ahead of need, three transfers at a time ──── */
  let asking = false;
  let inFlight = 0;
  function pump() {
    if (!asking && items.value.filter(i => i.state === 'signed').length < PARALLEL) {
      const batch = items.value.filter(i => i.state === 'queued').slice(0, SLOT_BATCH);
      if (batch.length) void askSlots(batch);
    }
    while (inFlight < PARALLEL) {
      const it = items.value.find(i => i.state === 'signed');
      if (!it) break;
      inFlight++;
      it.state = 'uploading';
      void send(it).finally(() => { inFlight--; pump(); });
    }
    syncKeepAwake();
  }

  async function askSlots(batch: UploadItem[]) {
    asking = true;
    batch.forEach((i) => { i.state = 'signing'; });
    try {
      const r = await $fetch<{ uploads: SlotAnswer[] }>(`/api/g/${slug()}/uploads`, { method: 'POST', body: { files: batch.map(i => ({ name: i.name, type: i.file.type || '', bytes: i.file.size })) } });
      r.uploads.forEach((s, n) => {
        const it = batch[n]!;
        if (s.error || !s.id || (!s.url && !s.parts)) { fail(it, s.error ?? M.noSlot); return; }
        it.id = s.id;
        it.slot = { id: s.id, type: s.type ?? it.file.type, url: s.url, parts: s.parts?.map(p => ({ ...p })), at: Date.now() };
        it.state = 'signed';
        void store?.put(slug(), it);
      });
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode ?? 0;
      if (status === 429 || status === 0 || status >= 500) {
        // too many at once, or the line dropped: these files wait and ask again
        batch.forEach((i) => { i.state = 'queued'; });
        await sleep(status === 429 ? 15_000 : 5_000);
        if (!navigator.onLine) await waitOnline();
      } else {
        const msg = apiError(e);
        batch.forEach(i => fail(i, msg));
      }
    } finally { asking = false; pump(); }
  }

  /* ── one file ──────────────────────────────────────────────────── */
  async function send(it: UploadItem) {
    const slot = it.slot!;
    for (let attempt = 0; ; attempt++) {
      try {
        it.state = 'uploading';
        let parts: { n: number; etag: string }[] | undefined;
        if (slot.parts) {
          parts = [];
          let sent = slot.parts.filter(p => p.etag).reduce((a, p) => a + p.size, 0);
          for (const p of slot.parts) {
            if (!p.etag) {
              const off = (p.n - 1) * slot.parts[0]!.size;
              const etag = await xhrPut(p.url, it.file.slice(off, off + p.size), undefined, loaded => { it.pct = Math.round(((sent + loaded) / it.file.size) * 100); });
              if (!etag) throw Object.assign(new Error('no ETag'), { status: 0 });
              p.etag = etag; sent += p.size;
              void store?.put(slug(), it); // a finished part survives a reload
            }
            parts.push({ n: p.n, etag: p.etag! });
          }
        } else {
          await xhrPut(slot.url!, it.file, slot.type, (loaded) => { it.pct = Math.round((loaded / it.file.size) * 100); });
        }
        await $fetch(`/api/g/${slug()}/uploads/${slot.id}/complete`, { method: 'POST', body: { parts }, retry: 3, retryDelay: 1500 });
        it.pct = 100; it.state = 'processing';
        void store?.remove(it.key);
        follow(it);
        return;
      } catch (e) {
        const status = (e as { status?: number; statusCode?: number }).status ?? (e as { statusCode?: number }).statusCode ?? 0;
        // the store refused the signature (an expired URL from an old visit): drop the slot and ask for a fresh one, once
        if ((status === 403 || status === 400) && attempt === 0 && Date.now() - slot.at > 60_000) {
          await $fetch(`/api/g/${slug()}/media/${slot.id}`, { method: 'DELETE' }).catch(() => {});
          it.slot = null; it.id = null; it.pct = 0; it.state = 'queued';
          void store?.put(slug(), it);
          return;
        }
        // 4xx from our API (gallery full, closed, too big) or the store will not heal by retrying
        const fatal = status >= 400 && status < 500 && status !== 408 && status !== 409 && status !== 429;
        if (fatal || attempt >= BACKOFF_MS.length) { fail(it, apiError(e, M.dropped)); return; }
        if (!navigator.onLine) { it.state = 'offline'; await waitOnline(); it.state = 'uploading'; }
        await sleep(BACKOFF_MS[attempt]!);
      }
    }
  }

  /** PUT with progress; resolves with the ETag. Rejects (status 0) on a network error, an abort, or 45 s without progress. */
  function xhrPut(url: string, body: Blob, type: string | undefined, onProgress: (loaded: number) => void) {
    return new Promise<string | null>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let last = Date.now();
      const watchdog = setInterval(() => { if (Date.now() - last > STALL_MS) xhr.abort(); }, 5000);
      const end = () => clearInterval(watchdog);
      xhr.open('PUT', url);
      if (type) xhr.setRequestHeader('Content-Type', type);
      xhr.upload.onprogress = (e) => { last = Date.now(); if (e.lengthComputable) onProgress(e.loaded); };
      xhr.onload = () => { end(); xhr.status >= 200 && xhr.status < 300 ? resolve(xhr.getResponseHeader('ETag')) : reject(Object.assign(new Error(`PUT ${xhr.status}`), { status: xhr.status })); };
      xhr.onerror = () => { end(); reject(Object.assign(new Error('network'), { status: 0 })); };
      xhr.onabort = () => { end(); reject(Object.assign(new Error('stalled'), { status: 0 })); };
      xhr.ontimeout = xhr.onabort;
      xhr.send(body);
    });
  }

  /* ── following what is processing ──────────────────────────────── */
  const following = new Map<string, { it: UploadItem; since: number }>();
  let polling = false;
  function follow(it: UploadItem) {
    following.set(it.id!, { it, since: Date.now() });
    if (!polling) void poll();
  }
  async function poll() {
    polling = true;
    try {
      for (let n = 0; following.size; n++) {
        await sleep(n < 5 ? 1500 : 3000);
        try {
          const ids = [...following.keys()].slice(0, 60);
          const r = await $fetch<{ items: { id: string; status: string; error: string | null; thumb: string | null }[] }>(`/api/g/${slug()}/uploads/status`, { query: { ids: ids.join(',') } });
          for (const s of r.items) {
            const f = following.get(s.id); if (!f) continue;
            if (s.status === 'ready' || s.status === 'hidden') { f.it.state = 'ready'; f.it.awaiting = s.status === 'hidden'; f.it.thumb = s.thumb; following.delete(s.id); }
            else if (s.status === 'failed' || s.status === 'deleted') { f.it.state = 'failed'; f.it.error = s.error ?? M.failedProcess; following.delete(s.id); }
          }
        } catch { /* keep polling */ }
        // the bytes are safely in; a busy worker is slow, not broken, and the gallery shows them when they land
        for (const [id, f] of following) if (Date.now() - f.since > 10 * 60_000) { f.it.state = 'ready'; following.delete(id); }
      }
    } finally { polling = false; syncKeepAwake(); }
  }

  /* ── retry / clear ─────────────────────────────────────────────── */
  async function retry(it: UploadItem) {
    // hand back the old slot first, or it holds a place in a free gallery's cap until its hold ends
    const old = it.id;
    it.state = 'signing'; it.error = null; it.pct = 0; it.id = null; it.slot = null;
    if (old) await $fetch(`/api/g/${slug()}/media/${old}`, { method: 'DELETE' }).catch(() => {});
    it.state = 'queued';
    void store?.put(slug(), it);
    pump();
  }
  function clear() {
    items.value.filter(i => i.preview).forEach(i => URL.revokeObjectURL(i.preview!));
    items.value = items.value.filter(i => !['ready', 'failed'].includes(i.state));
    resumed.value = 0;
  }

  /* ── small previews, one at a time ─────────────────────────────── */
  let drawing = Promise.resolve();
  function previews(list: UploadItem[]) {
    for (const it of list) {
      if (!it.file.type.startsWith('image/') || /heic|heif/i.test(it.file.type)) continue;
      drawing = drawing.then(async () => { it.preview = await smallPreview(it.file); });
    }
  }

  /* ── keep the phone awake, warn before leaving ─────────────────── */
  let lock: { release: () => Promise<void> } | null = null;
  async function syncKeepAwake() {
    if (!import.meta.client) return;
    const want = sending.value && document.visibilityState === 'visible';
    try {
      if (want && !lock && 'wakeLock' in navigator) lock = await (navigator as unknown as { wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void>; addEventListener: (e: string, f: () => void) => void }> } }).wakeLock.request('screen').then((l) => { l.addEventListener('release', () => { lock = null; }); return l; });
      else if (!want && lock) { await lock.release(); lock = null; }
    } catch { /* not allowed (battery saver, iframe): uploads still run */ }
  }
  function onVisible() { if (document.visibilityState === 'visible') { void syncKeepAwake(); pump(); } }
  function onLeave(e: BeforeUnloadEvent) { if (sending.value) { e.preventDefault(); e.returnValue = ''; } }
  function onOnline() { pump(); }
  if (import.meta.client) {
    onMounted(() => {
      document.addEventListener('visibilitychange', onVisible);
      addEventListener('beforeunload', onLeave);
      addEventListener('online', onOnline);
      void restore();
    });
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', onVisible);
      removeEventListener('beforeunload', onLeave);
      removeEventListener('online', onOnline);
      void lock?.release();
    });
  }

  return { items, add, retry, clear, done, awaiting, failed, offline, active, sending, resumed };
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const waitOnline = () => new Promise<void>((resolve) => {
  if (navigator.onLine) return resolve();
  addEventListener('online', () => resolve(), { once: true });
});

/** A video's length from its metadata, without decoding it. Null when the browser cannot tell (it is checked again on the server). */
function videoSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (s: number | null) => { URL.revokeObjectURL(url); v.removeAttribute('src'); v.load(); resolve(s); };
    const t = setTimeout(() => done(null), 8000);
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => { clearTimeout(t); done(Number.isFinite(v.duration) ? v.duration : null); };
    v.onerror = () => { clearTimeout(t); done(null); };
    v.src = url;
  });
}

/** An 80px preview: decoded at that size where the browser can (createImageBitmap with resize), so memory stays small. */
async function smallPreview(file: File): Promise<string | null> {
  try {
    const bmp = await createImageBitmap(file, { resizeWidth: 160, resizeQuality: 'low' });
    const c = document.createElement('canvas');
    c.width = bmp.width; c.height = bmp.height;
    c.getContext('2d')!.drawImage(bmp, 0, 0);
    bmp.close();
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', 0.7));
    return blob ? URL.createObjectURL(blob) : null;
  } catch { return null; }
}

/**
 * Files waiting to be sent, kept in IndexedDB so a killed tab can carry on.
 * Best effort: a private window, a full disk or an old browser simply means
 * nothing is kept, and uploads work as before.
 */
interface Saved { key: string; slug: string; file: File; slot: Slot | null }
function useUploadStore() {
  const DB = 'indahnya-uploads', OS = 'files';
  let dbp: Promise<IDBDatabase | null> | null = null;
  const open = () => (dbp ??= new Promise((resolve) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(OS, { keyPath: 'key' }).createIndex('slug', 'slug'); };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
    } catch { resolve(null); }
  }));
  const tx = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> => {
    const db = await open(); if (!db) return undefined;
    return new Promise((resolve) => {
      try {
        const t = db.transaction(OS, mode); const req = fn(t.objectStore(OS));
        t.oncomplete = () => resolve(req ? req.result : undefined);
        t.onerror = t.onabort = () => resolve(undefined);
      } catch { resolve(undefined); }
    });
  };
  return {
    put: (slug: string, it: UploadItem) => tx('readwrite', s => s.put({ key: it.key, slug, file: it.file, slot: it.slot ? JSON.parse(JSON.stringify(it.slot)) : null } satisfies Saved)),
    remove: (key: string) => tx('readwrite', s => s.delete(key)),
    list: async (slug: string) => (await tx<Saved[]>('readonly', s => s.index('slug').getAll(slug))) ?? [],
  };
}
