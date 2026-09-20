import { onBeforeUnmount, ref } from 'vue';

/**
 * A reactive media query. Used where CSS alone cannot decide — when the same
 * slot has to render in one of two PLACES rather than one of two styles.
 */
export function useMedia(query: string) {
  const mq = typeof matchMedia === 'function' ? matchMedia(query) : null;
  const matches = ref(mq?.matches ?? false);
  const on = (e: MediaQueryListEvent) => { matches.value = e.matches; };
  mq?.addEventListener('change', on);
  onBeforeUnmount(() => mq?.removeEventListener('change', on));
  return matches;
}
