import { effectScope } from 'vue';

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
 *
 * With `persist` there is ONE uploader per gallery for the life of the page:
 * leaving the gallery tab and coming back reattaches to the uploads still
 * running instead of starting a second copy of them. Across browser tabs,
 * each saved file belongs to the tab that is sending it (a heartbeat in
 * IndexedDB); another tab only takes over files whose tab has gone quiet.
 */
export interface UploadItem {
  key: string; file: File; name: string; preview: string | null;
  id: string | null; pct: number;
  state: 'queued' | 'signing' | 'signed' | 'uploading' | 'offline' | 'processing' | 'ready' | 'failed';
  /** Landed, but the host approves before anyone sees it. */
  awaiting: boolean;
  error: string | null; thumb: string | null;
  slot: Slot | null;
  /** A video whose length is still being read: not scheduled until it is known. */
  checking: boolean;
  /** Fresh slots taken because an old one's signature had expired (at most one). */
  reslots: number;
}

interface Part { n: number; size: number; url: string; etag?: string }
interface Slot { id: string; type: string; url?: string; parts?: Part[]; at: number }
type SlotAnswer = { name: string; id?: string; url?: string; type?: string; parts?: Omit<Part, 'etag'>[]; error?: string };

const BACKOFF_MS = [1000, 3000, 8000, 15000, 30000, 45000, 60000, 60000];
const PARALLEL = 3;
/**
 * Slots a browser holds at once: the server lets one browser hold this many
 * fresh reservations in a free gallery (MEDIA_LIMITS.cappedPendingPerGuest),
 * and the uploader never asks past it.
 */
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
  failedProcess: 'Tak dapat diproses',
  noSlot: 'Tak dapat slot',
};

type Opts = { persist?: boolean; msgs?: Partial<UploaderMsgs> };
type Uploader = ReturnType<typeof createUploader>;
const galleries = new Map<string, Uploader>();

export function useUploader(slug: () => string, opts: Opts = {}) {
  if (opts.persist && import.meta.client) {
    const key = slug();
    let u = galleries.get(key);
    if (!u) {
      // lives with the page, not the component: a remount finds the same uploads
      u = effectScope(true).run(() => createUploader(slug, opts))!;
      galleries.set(key, u);
      u.attach();
      void u.restore();
    }
    return u.api;
  }
  const u = createUploader(slug, opts);
  if (import.meta.client) {
    onMounted(() => u.attach());
    onBeforeUnmount(() => u.detach());
  }
  return u.api;
}

let seq = 0;

function createUploader(slug: () => string, opts: Opts) {
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

  const store = opts.persist && import.meta.client ? uploadStore() : null;

  /* ── adding files ──────────────────────────────────────────────── */
  function makeItem(f: File, key?: string, slot: Slot | null = null): UploadItem {
    // sortable: files come back from IndexedDB in the order they were added
    key ??= `${Date.now()}-${String(seq++).padStart(6, '0')}`;
    return { key, file: f, name: f.name, preview: null, id: slot?.id ?? null, pct: 0, state: slot ? 'signed' : 'queued', awaiting: false, error: null, thumb: null, slot, checking: false, reslots: 0 };
  }

  /** Push and hand back the REACTIVE copies: changes made through the plain objects would never reach the screen. */
  function push(list: UploadItem[]) {
    items.value.push(...list);
    return items.value.slice(-list.length);
  }

  const isVideo = (f: File) => f.type.startsWith('video/') || /\.(mov|mp4|m4v|3gp|webm)$/i.test(f.name);

  async function add(files: FileList | File[]) {
    const fresh = push(Array.from(files).map(f => makeItem(f)));
    for (const it of fresh) { it.checking = isVideo(it.file); void store?.put(slug(), it); }
    previews(fresh);
    pump();
    // a video over the limit never leaves the phone: it is not scheduled until its length is known
    await Promise.all(fresh.filter(it => it.checking).map(async (it) => {
      const sec = await videoSeconds(it.file);
      it.checking = false;
      if (sec !== null && sec > VIDEO_MAX_SEC + 1) fail(it, M.videoTooLong(Math.round(sec)));
    }));
    pump();
  }

  /**
   * Bring back what an earlier visit (or a tab that has since gone quiet)
   * left unfinished. Files still held by another tab that looks alive are
   * looked at again every 15 s: a tab the phone killed a moment ago keeps
   * looking alive until its heartbeat goes stale, and its files must still
   * come back on their own.
   */
  async function restore(tries = 0) {
    if (!store) return;
    const have = new Set(items.value.map(i => i.key));
    const { mine, held } = await store.claim(slug());
    const fresh = mine.filter(r => !have.has(r.key));
    if (fresh.length) {
      const back = push(fresh.map(r => makeItem(r.file, r.key, r.slot && Date.now() - r.slot.at < SLOT_TTL_MS ? r.slot : null)));
      resumed.value += back.length;
      previews(back);
      pump();
    }
    if (held && tries < 40) setTimeout(() => void restore(tries + 1), 15_000);
  }

  function fail(it: UploadItem, error: string) {
    const held = it.id && ['signing', 'signed', 'uploading', 'offline', 'queued'].includes(it.state) ? it.id : null;
    it.state = 'failed'; it.error = error;
    // a file that cannot go is not kept for a later visit; a retry adds it back
    void store?.remove(it.key);
    // hand its slot back: in a free gallery it would otherwise hold a place (and block new slots) until its hold ends
    if (held) void $fetch(`/api/g/${slug()}/media/${held}`, { method: 'DELETE' }).catch(() => {});
  }

  /* ── the pump: slots ahead of need, three transfers at a time ──── */
  let asking = false;
  let inFlight = 0;
  /** Slots this browser holds that the server still counts as reserved. */
  const holding = () => items.value.filter(i => i.id && ['signed', 'uploading', 'offline'].includes(i.state)).length;
  function pump() {
    if (!asking && items.value.filter(i => i.state === 'signed').length < PARALLEL) {
      const room = SLOT_BATCH - holding();
      const batch = room > 0 ? items.value.filter(i => i.state === 'queued' && !i.checking).slice(0, room) : [];
      if (batch.length) void askSlots(batch);
    }
    while (inFlight < PARALLEL) {
      const it = items.value.find(i => i.state === 'signed');
      if (!it) break;
      inFlight++;
      it.state = 'uploading';
      void send(it).finally(() => { inFlight--; pump(); });
    }
    void syncKeepAwake();
  }

  async function askSlots(batch: UploadItem[]) {
    asking = true;
    batch.forEach((i) => { i.state = 'signing'; });
    try {
      const r = await $fetch<{ uploads: SlotAnswer[] }>(`/api/g/${slug()}/uploads`, { method: 'POST', body: { files: batch.map(i => ({ name: i.name, type: i.file.type || '', bytes: i.file.size })) } });
      r.uploads.forEach((s, n) => {
        const it = batch[n]!;
        // failed meanwhile: hand back the slot it was just given
        if (it.state !== 'signing') { if (s.id) void $fetch(`/api/g/${slug()}/media/${s.id}`, { method: 'DELETE' }).catch(() => {}); return; }
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
        batch.forEach((i) => { if (i.state === 'signing') i.state = 'queued'; });
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
      let stage: 'put' | 'complete' = 'put';
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
        stage = 'complete';
        await $fetch(`/api/g/${slug()}/uploads/${slot.id}/complete`, { method: 'POST', body: { parts }, retry: 3, retryDelay: 1500 });
        if ((it.state as UploadItem['state']) === 'failed') return; // given up on meanwhile
        it.pct = 100; it.state = 'processing';
        void store?.remove(it.key);
        follow(it);
        return;
      } catch (e) {
        const status = (e as { status?: number; statusCode?: number }).status ?? (e as { statusCode?: number }).statusCode ?? 0;
        // the store refused a URL signed hours ago (a slot brought back from an earlier visit):
        // hand the slot back and ask for a fresh one — once per file, never in a loop
        if (stage === 'put' && status === 403 && it.reslots < 1 && Date.now() - slot.at > 60 * 60_000) {
          it.reslots++;
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
    } finally { polling = false; void syncKeepAwake(); }
  }

  /* ── retry / clear ─────────────────────────────────────────────── */
  async function retry(it: UploadItem) {
    // hand back the old slot first, or it holds a place in a free gallery's cap until its hold ends
    const old = it.id;
    it.state = 'signing'; it.error = null; it.pct = 0; it.id = null; it.slot = null; it.reslots = 0;
    if (old) await $fetch(`/api/g/${slug()}/media/${old}`, { method: 'DELETE' }).catch(() => {});
    it.state = 'queued';
    void store?.put(slug(), it);
    pump();
  }
  /** Forget what is finished (ready or failed); what is still going stays. */
  function clear() {
    const gone = items.value.filter(i => ['ready', 'failed'].includes(i.state));
    gone.forEach((i) => { if (i.preview) URL.revokeObjectURL(i.preview); });
    items.value = items.value.filter(i => !gone.includes(i));
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

  /* ── keep the phone awake, warn before leaving, own the saved files ─ */
  let lock: { release: () => Promise<void> } | null = null;
  let attached = false;
  async function syncKeepAwake() {
    if (!import.meta.client) return;
    const want = attached && sending.value && document.visibilityState === 'visible';
    try {
      if (want && !lock && 'wakeLock' in navigator) {
        const l = await (navigator as unknown as { wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void>; addEventListener: (e: string, f: () => void) => void }> } }).wakeLock.request('screen');
        l.addEventListener('release', () => { if (lock === l) lock = null; });
        lock = l;
      } else if (!want && lock) { const l = lock; lock = null; await l.release(); }
    } catch { /* not allowed (battery saver, iframe): uploads still run */ }
  }
  function onVisible() { if (document.visibilityState === 'visible') pump(); else void syncKeepAwake(); }
  function onLeave(e: BeforeUnloadEvent) { if (sending.value) { e.preventDefault(); e.returnValue = ''; } }
  function onOnline() { pump(); }
  /** Closing or leaving the page: hand the saved files over at once instead of after the heartbeat goes stale. */
  function onHide(e: PageTransitionEvent) { if (!e.persisted) void store?.release(); }
  let beat: ReturnType<typeof setInterval> | undefined;
  function attach() {
    if (attached) return;
    attached = true;
    document.addEventListener('visibilitychange', onVisible);
    addEventListener('beforeunload', onLeave);
    addEventListener('online', onOnline);
    addEventListener('pagehide', onHide);
    if (store) { void store.beat(); beat = setInterval(() => void store.beat(), 15_000); }
    void syncKeepAwake();
  }
  function detach() {
    attached = false;
    document.removeEventListener('visibilitychange', onVisible);
    removeEventListener('beforeunload', onLeave);
    removeEventListener('online', onOnline);
    removeEventListener('pagehide', onHide);
    clearInterval(beat);
    void syncKeepAwake();
  }

  return {
    attach, detach, restore,
    api: { items, add, retry, clear, done, awaiting, failed, offline, active, sending, resumed },
  };
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
 * Each record names the tab sending it; the tab stamps a heartbeat every
 * 15 s. A page only takes over records whose tab has been quiet for 45 s —
 * a second tab on the same gallery never sends the first tab's files again.
 * Best effort: a private window, a full disk or an old browser simply means
 * nothing is kept, and uploads work as before.
 */
interface Saved { key: string; slug: string; file: File; slot: Slot | null; owner?: string }
const TAB = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const QUIET_MS = 45_000;
function uploadStore() {
  const DB = 'indahnya-uploads', FILES = 'files', OWNERS = 'owners';
  let dbp: Promise<IDBDatabase | null> | null = null;
  const open = () => (dbp ??= new Promise((resolve) => {
    try {
      const r = indexedDB.open(DB, 2);
      r.onupgradeneeded = (e) => {
        const db = r.result;
        if ((e as IDBVersionChangeEvent).oldVersion < 1) db.createObjectStore(FILES, { keyPath: 'key' }).createIndex('slug', 'slug');
        if (!db.objectStoreNames.contains(OWNERS)) db.createObjectStore(OWNERS, { keyPath: 'tab' });
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.onblocked = () => resolve(null);
    } catch { resolve(null); }
  }));
  const tx = async <T>(stores: string[], mode: IDBTransactionMode, fn: (t: IDBTransaction) => IDBRequest<T> | void): Promise<T | undefined> => {
    const db = await open(); if (!db) return undefined;
    return new Promise((resolve) => {
      try {
        const t = db.transaction(stores, mode); const req = fn(t);
        t.oncomplete = () => resolve(req ? req.result : undefined);
        t.onerror = t.onabort = () => resolve(undefined);
      } catch { resolve(undefined); }
    });
  };
  const record = (slug: string, it: UploadItem): Saved => ({ key: it.key, slug, file: it.file, slot: it.slot ? JSON.parse(JSON.stringify(it.slot)) : null, owner: TAB });
  return {
    put: (slug: string, it: UploadItem) => tx([FILES], 'readwrite', t => t.objectStore(FILES).put(record(slug, it))),
    remove: (key: string) => tx([FILES], 'readwrite', t => t.objectStore(FILES).delete(key)),
    beat: () => tx([OWNERS], 'readwrite', t => t.objectStore(OWNERS).put({ tab: TAB, at: Date.now() })),
    release: () => tx([OWNERS], 'readwrite', t => t.objectStore(OWNERS).delete(TAB)),
    /** Take over this gallery's files whose tab has gone quiet; they become this tab's. */
    async claim(slug: string) {
      const [saved, owners] = await Promise.all([
        tx<Saved[]>([FILES], 'readonly', t => t.objectStore(FILES).index('slug').getAll(slug)),
        tx<{ tab: string; at: number }[]>([OWNERS], 'readonly', t => t.objectStore(OWNERS).getAll()),
      ]);
      const alive = new Set((owners ?? []).filter(o => o.tab !== TAB && Date.now() - o.at < QUIET_MS).map(o => o.tab));
      const mine = (saved ?? []).filter(r => !r.owner || !alive.has(r.owner)).sort((a, b) => (a.key < b.key ? -1 : 1));
      const held = (saved ?? []).length - mine.length;
      await tx([FILES, OWNERS], 'readwrite', (t) => {
        for (const r of mine) if (r.owner !== TAB) t.objectStore(FILES).put({ ...r, owner: TAB });
        // tabs long gone leave no trace
        for (const o of owners ?? []) if (Date.now() - o.at > 86_400_000) t.objectStore(OWNERS).delete(o.tab);
      });
      return { mine, held };
    },
  };
}
