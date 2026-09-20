/**
 * Overlay scrollbars for every scroller, on every platform.
 *
 * The native bar is never drawn (tokens.css / store.css / app.css hide it),
 * because a classic one takes ~15px out of its scroller the moment content
 * grows past the edge and gives it back when it shrinks — and the layout
 * moves with it. Reserving a permanent gutter was tried and rejected: an
 * empty strip down every page. `overflow: overlay`, which was the browser's
 * own answer, no longer exists in Chromium.
 *
 * So the bar is drawn HERE, over the content, in the two ways a Mac draws
 * its own: it appears while the scroller moves and fades out a moment after
 * it stops, and it occupies no layout width at all. The document gets a
 * fixed one; any inner scroller gets one the first time it scrolls, placed
 * inside it and moved with the content so it always sits at the visible
 * edge. Both axes. The thumb can be dragged.
 *
 * Nothing here changes how scrolling works — wheel, trackpad, keys, touch
 * and drag all reach the browser untouched. This only paints.
 */

const THICKNESS = 6;
const INSET = 2;
const MIN_THUMB = 24;
const HIDE_AFTER_MS = 900;

type Axis = 'y' | 'x';
type Bar = { el: HTMLElement; track: HTMLElement; axis: Axis; timer: number | undefined; hover: boolean };
type Tracked = { target: HTMLElement | Document; y: Bar; x: Bar; ro?: ResizeObserver };

const tracked = new WeakMap<HTMLElement | Document, Tracked>();
let installed = false;

/** The strip along the edge a pointer can find even while the thumb is hidden. Wider than the thumb, on purpose. */
const TRACK = 14;

const STYLE = `
.ov-track{position:absolute;z-index:2147482999;background:transparent;display:none}
.ov-track.ov-track-y{top:0;bottom:0;right:0;width:${TRACK}px}
.ov-track.ov-track-x{left:0;right:0;bottom:0;height:${TRACK}px}
.ov-track.ov-track-doc{position:fixed}
.ov-track.ov-live{display:block}
.ov-sb{position:absolute;z-index:2147483000;border-radius:999px;pointer-events:none;opacity:0;
  background:color-mix(in srgb, var(--color-ink-500, #726b59) 55%, transparent);
  transition:opacity 240ms ease;will-change:opacity,transform}
.ov-sb.ov-sb-y{width:${THICKNESS}px;right:${INSET}px}
.ov-sb.ov-sb-x{height:${THICKNESS}px;bottom:${INSET}px}
.ov-sb.ov-sb-doc{position:fixed}
.ov-sb.ov-on{opacity:1;pointer-events:auto;transition:opacity 80ms ease}
.ov-sb.ov-drag{opacity:1;background:color-mix(in srgb, var(--color-ink-500, #726b59) 80%, transparent)}
.ov-sb:hover{background:color-mix(in srgb, var(--color-ink-500, #726b59) 80%, transparent)}
@media (prefers-reduced-motion: reduce){.ov-sb{transition:none}}
`;

function scrollerOf(t: HTMLElement | Document): HTMLElement {
  return t instanceof Document ? t.documentElement : t;
}

function makeBar(axis: Axis, isDoc: boolean): Bar {
  const el = document.createElement('div');
  el.className = `ov-sb ov-sb-${axis}${isDoc ? ' ov-sb-doc' : ''}`;
  el.setAttribute('aria-hidden', 'true');
  const track = document.createElement('div');
  track.className = `ov-track ov-track-${axis}${isDoc ? ' ov-track-doc' : ''}`;
  track.setAttribute('aria-hidden', 'true');
  return { el, track, axis, timer: undefined, hover: false };
}

/** Place and size one thumb from the scroller's current geometry. Returns whether it is needed at all. */
function layout(t: Tracked, bar: Bar): boolean {
  const s = scrollerOf(t.target);
  const isDoc = t.target instanceof Document;
  const viewport = bar.axis === 'y' ? s.clientHeight : s.clientWidth;
  const content = bar.axis === 'y' ? s.scrollHeight : s.scrollWidth;
  const pos = bar.axis === 'y' ? s.scrollTop : s.scrollLeft;
  if (content <= viewport + 1) { bar.track.classList.remove('ov-live'); return false; }
  bar.track.classList.add('ov-live');
  /** Inside a scroller the track scrolls with the content too, so it is pinned to the visible edge each time. */
  if (!isDoc) {
    if (bar.axis === 'y') { bar.track.style.top = `${s.scrollTop}px`; bar.track.style.bottom = 'auto'; bar.track.style.height = `${s.clientHeight}px`; bar.track.style.right = `${-s.scrollLeft}px`; }
    else { bar.track.style.left = `${s.scrollLeft}px`; bar.track.style.right = 'auto'; bar.track.style.width = `${s.clientWidth}px`; bar.track.style.bottom = `${-s.scrollTop}px`; }
  }

  /** Leave room for the other bar's corner, and the inset on both ends. */
  const track = viewport - INSET * 2 - (bar.axis === 'y' ? 0 : THICKNESS);
  const thumb = Math.max(MIN_THUMB, Math.round((viewport / content) * track));
  const maxPos = content - viewport;
  const offset = INSET + Math.round((pos / maxPos) * (track - thumb));

  if (bar.axis === 'y') {
    bar.el.style.height = `${thumb}px`;
    /** Inside a scroller the thumb scrolls WITH the content, so it is placed at scrollTop plus its visible offset. */
    bar.el.style.top = isDoc ? `${offset}px` : `${s.scrollTop + offset}px`;
    if (!isDoc) bar.el.style.right = `${INSET - s.scrollLeft}px`;
  } else {
    bar.el.style.width = `${thumb}px`;
    bar.el.style.left = isDoc ? `${offset}px` : `${s.scrollLeft + offset}px`;
    if (!isDoc) bar.el.style.bottom = `${INSET - s.scrollTop}px`;
  }
  return true;
}

function show(t: Tracked, bar: Bar) {
  if (!layout(t, bar)) { bar.el.classList.remove('ov-on'); return; }
  bar.el.classList.add('ov-on');
  window.clearTimeout(bar.timer);
  bar.timer = window.setTimeout(() => {
    /** Stays while the pointer is on the edge or holding the thumb — the people scrolling by hand. */
    if (!bar.el.classList.contains('ov-drag') && !bar.hover) bar.el.classList.remove('ov-on');
  }, HIDE_AFTER_MS);
}

/**
 * The edge is a target even when the thumb is not showing: resting the
 * pointer there brings the thumb up so it can be grabbed, and clicking the
 * track on either side of the thumb moves the scroller a page that way.
 */
function hoverable(t: Tracked, bar: Bar) {
  bar.track.addEventListener('pointerenter', () => { bar.hover = true; show(t, bar); });
  bar.track.addEventListener('pointerleave', () => { bar.hover = false; show(t, bar); });
  bar.el.addEventListener('pointerenter', () => { bar.hover = true; show(t, bar); });
  bar.el.addEventListener('pointerleave', () => { bar.hover = false; show(t, bar); });
  bar.track.addEventListener('pointerdown', e => {
    if (e.target !== bar.track) return;
    const s = scrollerOf(t.target);
    const thumb = bar.el.getBoundingClientRect();
    const at = bar.axis === 'y' ? e.clientY : e.clientX;
    const before = bar.axis === 'y' ? at < thumb.top : at < thumb.left;
    const page = (bar.axis === 'y' ? s.clientHeight : s.clientWidth) * 0.9 * (before ? -1 : 1);
    s.scrollBy(bar.axis === 'y' ? { top: page, behavior: 'smooth' } : { left: page, behavior: 'smooth' });
    show(t, bar);
  });
}

function refresh(t: Tracked) {
  show(t, t.y);
  show(t, t.x);
}

/** Drag the thumb: pointer capture, proportional scroll, and the bar stays visible for the duration. */
function draggable(t: Tracked, bar: Bar) {
  let start = 0, startPos = 0;
  bar.el.addEventListener('pointerdown', e => {
    const s = scrollerOf(t.target);
    e.preventDefault();
    bar.el.setPointerCapture(e.pointerId);
    bar.el.classList.add('ov-drag');
    start = bar.axis === 'y' ? e.clientY : e.clientX;
    startPos = bar.axis === 'y' ? s.scrollTop : s.scrollLeft;
  });
  bar.el.addEventListener('pointermove', e => {
    if (!bar.el.classList.contains('ov-drag')) return;
    const s = scrollerOf(t.target);
    const viewport = bar.axis === 'y' ? s.clientHeight : s.clientWidth;
    const content = bar.axis === 'y' ? s.scrollHeight : s.scrollWidth;
    const track = viewport - INSET * 2 - (bar.axis === 'y' ? 0 : THICKNESS);
    const thumb = Math.max(MIN_THUMB, Math.round((viewport / content) * track));
    const delta = (bar.axis === 'y' ? e.clientY : e.clientX) - start;
    const next = startPos + delta * ((content - viewport) / Math.max(1, track - thumb));
    if (bar.axis === 'y') s.scrollTop = next; else s.scrollLeft = next;
  });
  const end = () => { bar.el.classList.remove('ov-drag'); show(t, bar); };
  bar.el.addEventListener('pointerup', end);
  bar.el.addEventListener('pointercancel', end);
}

function track(target: HTMLElement | Document): Tracked {
  const existing = tracked.get(target);
  if (existing) return existing;
  const isDoc = target instanceof Document;
  const t: Tracked = { target, y: makeBar('y', isDoc), x: makeBar('x', isDoc) };
  if (isDoc) {
    document.body.append(t.y.track, t.x.track, t.y.el, t.x.el);
  } else {
    const host = target as HTMLElement;
    /** The thumb is positioned inside the scroller; the scroller has to be a containing block. */
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.append(t.y.track, t.x.track, t.y.el, t.x.el);
    t.ro = new ResizeObserver(() => { layout(t, t.y); layout(t, t.x); });
    t.ro.observe(host);
  }
  draggable(t, t.y);
  draggable(t, t.x);
  hoverable(t, t.y);
  hoverable(t, t.x);
  /** Lay it out now, so a scroller found by hover — before it has ever scrolled — already has a live edge. */
  layout(t, t.y);
  layout(t, t.x);
  tracked.set(target, t);
  return t;
}

/**
 * Install once per document. Safe to call twice. The document's bar is set
 * up now; inner scrollers are picked up the first time each one scrolls,
 * which is the first time anyone could see a bar on it anyway.
 */
export function installOverlayScrollbars() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const style = document.createElement('style');
  style.setAttribute('data-overlay-scrollbar', '');
  style.textContent = STYLE;
  document.head.append(style);

  const doc = track(document);
  window.addEventListener('scroll', () => refresh(doc), { passive: true });
  window.addEventListener('resize', () => { layout(doc, doc.y); layout(doc, doc.x); }, { passive: true });
  /**
   * The page's height changes as content loads, long after install. The
   * body's box follows it, so watching the body is how the edge becomes live
   * on a page that was short a moment ago — before anyone has scrolled.
   */
  new ResizeObserver(() => { layout(doc, doc.y); layout(doc, doc.x); }).observe(document.body);

  /**
   * `scroll` does not bubble, but it can be CAPTURED at the document — which
   * is how one listener sees every inner scroller without any of them having
   * to opt in.
   */
  document.addEventListener('scroll', e => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    /** The thumbs themselves live inside scrollers; never track a thumb as a scroller. */
    if (el.classList.contains('ov-sb') || el.classList.contains('ov-track')) return;
    refresh(track(el));
  }, { capture: true, passive: true });

  /**
   * A scroller that has never scrolled has no bar yet, and a person without a
   * wheel or trackpad needs one to exist before they can grab it. So the
   * pointer entering any scrollable element is enough to set its edge up.
   */
  document.addEventListener('pointerover', e => {
    let el = e.target as HTMLElement | null;
    for (let i = 0; el && i < 12; i++, el = el.parentElement) {
      if (!(el instanceof HTMLElement) || el === document.body || el === document.documentElement) break;
      if (el.classList.contains('ov-sb') || el.classList.contains('ov-track')) return;
      const o = getComputedStyle(el);
      const scrolls = (v: string) => v === 'auto' || v === 'scroll';
      if ((scrolls(o.overflowY) && el.scrollHeight > el.clientHeight + 1) || (scrolls(o.overflowX) && el.scrollWidth > el.clientWidth + 1)) {
        /** Already tracked: its content may have grown since; re-measure so the edge is live before the pointer reaches it. */
        const t = tracked.get(el) ?? track(el);
        layout(t, t.y);
        layout(t, t.x);
        return;
      }
    }
  }, { passive: true });
}
