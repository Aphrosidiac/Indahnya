import type Lenis from 'lenis';

/**
 * The landing's motion runtime: Lenis for the scroll, GSAP's ScrollTrigger
 * for anything tied to it, one ticker driving both. Loaded on the client
 * only, after the page is interactive, so none of it sits in the first paint.
 *
 * Under prefers-reduced-motion nothing is smoothed, pinned or scrubbed: the
 * sections fall back to their resting layout (each component checks
 * `reduced`), and anchors jump.
 */
type Gsap = typeof import('gsap').gsap;
type ST = typeof import('gsap/ScrollTrigger').ScrollTrigger;

const state = {
  gsap: null as Gsap | null,
  ST: null as ST | null,
  lenis: null as Lenis | null,
  /** The ticker callback that drives Lenis; removed on teardown (see there). */
  tick: null as ((t: number) => void) | null,
  ready: null as Promise<{ gsap: Gsap; ST: ST }> | null,
  /** Bumped on teardown, so a boot still awaiting its imports cannot start Lenis on the next page. */
  gen: 0,
};

export const prefersReduced = () => import.meta.client && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useLandingMotion() {
  const reduced = ref(false);

  async function boot() {
    reduced.value = prefersReduced();
    const gen = state.gen;
    state.ready ??= (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      gsap.registerPlugin(ScrollTrigger);
      state.gsap = gsap; state.ST = ScrollTrigger;
      if (!prefersReduced()) {
        const { default: LenisCtor } = await import('lenis');
        if (gen !== state.gen) return { gsap, ST: ScrollTrigger }; // the landing was left while this loaded
        const lenis = new LenisCtor({ lerp: 0.11, wheelMultiplier: 1, anchors: false });
        lenis.on('scroll', ScrollTrigger.update);
        state.tick = t => lenis.raf(t * 1000);
        gsap.ticker.add(state.tick);
        gsap.ticker.lagSmoothing(0);
        state.lenis = lenis;
      }
      return { gsap, ST: ScrollTrigger };
    })();
    return state.ready;
  }

  /*
   * Leaving the landing. Lenis must stop AND lose its ticker: destroy() alone
   * leaves a scroll that is still gliding (the reader clicked a nav link
   * mid-scroll) running on the ticker, and it finishes that glide on the next
   * page, landing /harga at its footer.
   */
  function teardown() {
    state.gen++;
    state.ST?.getAll().forEach(t => t.kill());
    if (state.tick) state.gsap?.ticker.remove(state.tick);
    state.lenis?.stop();
    state.lenis?.destroy();
    state.lenis = null; state.tick = null; state.ready = null;
  }

  function scrollTo(target: string | HTMLElement | number, offset = -72) {
    if (state.lenis) state.lenis.scrollTo(target as string, { offset, duration: 1.3 });
    else if (typeof target === 'number') window.scrollTo({ top: target });
    else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ block: 'start' });
  }

  return { boot, teardown, scrollTo, reduced, motion: state };
}

/** `v-arrive`-style entrance: add `.l-in` once the element is on screen. Resting state is visible. */
export function useArrive(root: Ref<HTMLElement | undefined>) {
  onMounted(() => {
    if (prefersReduced() || !root.value) return;
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { e.target.classList.add('l-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -10% 0px' });
    root.value.querySelectorAll('.l-arrive').forEach(el => io.observe(el));
    onBeforeUnmount(() => io.disconnect());
  });
}
