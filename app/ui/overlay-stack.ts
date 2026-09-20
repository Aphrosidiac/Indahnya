import { onBeforeUnmount, ref, watch, type Ref } from 'vue';

/**
 * Who is on top.
 *
 * Every Modal and Drawer used to listen for Escape on the window and lock page
 * scroll independently. Open a modal from inside a drawer and one Escape closed
 * BOTH — you lost the drawer you were working in — and closing the modal
 * unlocked the page while the drawer was still covering it.
 *
 * A stack fixes both: only the top-most overlay answers Escape, and the scroll
 * lock lifts when the LAST one closes, not the first.
 */
const stack = ref<symbol[]>([]);

/**
 * The lock is a pure function of the stack, applied in one place.
 *
 * It used to be two calls sprinkled through push and pop, and the page could
 * be found scroll-locked with nothing open — any path that added an entry
 * without its matching removal stranded `overflow: hidden` on the document
 * with no way back. Deriving it means the only way to leak the lock is to leak
 * a stack entry, which `onBeforeUnmount` already covers.
 *
 * THE PADDING IS THE POINT. Hiding overflow removes the scrollbar, and on a
 * platform that draws a classic one the page immediately becomes ~12px wider:
 * opening a dropdown shunted the header buttons sideways, re-truncated the
 * page title, and re-flowed the table underneath the listbox that had just
 * opened over it. Replacing the scrollbar's width with padding of exactly the
 * same width means locking changes nothing at all.
 *
 * It has to be MEASURED, not assumed — 12px in this Chrome, 15px elsewhere,
 * and 0 on a platform with overlay scrollbars, where padding anything would
 * create the very shift it is meant to prevent. `scrollbar-gutter: stable`
 * looks like the tidier answer and is not: the gutter it reserves only exists
 * while overflow is `auto` or `scroll`, so it vanishes at the exact moment
 * this needs it.
 *
 * The left sidebar is `fixed` below the lg breakpoint, but it is anchored to
 * the LEFT edge, so padding on the right does not move it.
 */
watch(() => stack.value.length > 0, locked => {
  const el = document.documentElement;
  if (locked) {
    /**
     * Pad by the width the content area ACTUALLY grew when the scrollbar went
     * — measured on both sides of the hide, never assumed. Since tokens.css
     * stopped drawing native scrollbars this is zero everywhere and nothing
     * is padded; the measurement stays so that a browser that ignores the
     * rule, or a future style that brings a bar back, still cannot shift.
     */
    const before = el.clientWidth;
    el.style.overflow = 'hidden';
    const grew = el.clientWidth - before;
    if (grew > 0) el.style.paddingRight = `${grew}px`;
  } else {
    el.style.overflow = '';
    el.style.paddingRight = '';
  }
}, { flush: 'sync' });

export function useOverlayStack(open: Ref<boolean> | (() => boolean)) {
  const id = Symbol('overlay');
  const isOpen = typeof open === 'function' ? { value: open() } as Ref<boolean> : open;

  const push = () => {
    if (!stack.value.includes(id)) stack.value = [...stack.value, id];
  };
  const pop = () => {
    stack.value = stack.value.filter(s => s !== id);
  };

  /** True only for the overlay a keystroke should actually reach. */
  const isTop = () => stack.value[stack.value.length - 1] === id;

  watch(() => (typeof open === 'function' ? open() : isOpen.value), o => (o ? push() : pop()), { immediate: true });
  onBeforeUnmount(pop);

  return { isTop, push, pop, depth: stack };
}
