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
  ready: null as Promise<{ gsap: Gsap; ST: ST }> | null,
};

export const prefersReduced = () => import.meta.client && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useLandingMotion() {
  const reduced = ref(false);

  async function boot() {
    reduced.value = prefersReduced();
    state.ready ??= (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      gsap.registerPlugin(ScrollTrigger);
      state.gsap = gsap; state.ST = ScrollTrigger;
      if (!prefersReduced()) {
        const { default: LenisCtor } = await import('lenis');
        const lenis = new LenisCtor({ lerp: 0.11, wheelMultiplier: 1, anchors: false });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(t => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
        state.lenis = lenis;
      }
      return { gsap, ST: ScrollTrigger };
    })();
    return state.ready;
  }

  function teardown() {
    state.ST?.getAll().forEach(t => t.kill());
    state.lenis?.destroy();
    state.lenis = null; state.ready = null;
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
