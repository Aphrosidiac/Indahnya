<script setup lang="ts">
import type { LandingCopy } from '~/composables/useLanding';
import { useLandingMotion, prefersReduced } from '~/composables/useLandingMotion';

/**
 * Right after the wall: what Indahnya replaces, then the day in one
 * sentence. The "tak payah" list is struck through as it arrives (mymind's
 * NO list, in a Malaysian register); the sentence sharpens word by word as
 * it passes the middle of the screen (Cosmos), scrubbed to the scroll.
 */
const props = defineProps<{ L: LandingCopy }>();
const root = ref<HTMLElement>();
const para = ref<HTMLElement>();
const words = computed(() => props.L.story.split(' '));
let triggers: { kill: () => void }[] = [];

onMounted(async () => {
  if (prefersReduced()) return;
  const { gsap, ST } = await useLandingMotion().boot();
  const ws = [...para.value!.querySelectorAll<HTMLElement>('.w')];
  const tl = gsap.timeline({ scrollTrigger: { trigger: para.value!, start: 'top 78%', end: 'bottom 42%', scrub: true } });
  tl.fromTo(ws, { opacity: 0.16, filter: 'blur(5px)' }, { opacity: 1, filter: 'blur(0px)', stagger: 0.12, ease: 'none', duration: 0.5 });
  triggers.push(tl.scrollTrigger!);
  root.value!.querySelectorAll<HTMLElement>('.no').forEach((el, i) => {
    triggers.push(ST.create({ trigger: el, start: 'top 82%', once: true, onEnter: () => setTimeout(() => el.classList.add('is-struck'), i * 90) }));
  });
});
onBeforeUnmount(() => triggers.forEach(t => t.kill()));
</script>

<template>
  <section ref="root" class="l-wrap relative py-24 md:py-40">
    <div class="grid grid-cols-1 gap-x-12 gap-y-16 lg:grid-cols-12">
      <div class="lg:col-span-4">
        <p class="l-h3 text-[#27622a]">{{ L.nosLead }}</p>
        <ul class="mt-5 space-y-1" role="list">
          <li v-for="n in L.nos" :key="n" class="no l-h3 text-[clamp(24px,2.4vw,34px)] text-[#75716d]"><span class="no-text">{{ n }}</span></li>
        </ul>
      </div>
      <p ref="para" class="l-display text-[clamp(30px,4.1vw,60px)] !leading-[1.08] !tracking-[-0.035em] text-[#1a1a1a] lg:col-span-8">
        <template v-for="(w, i) in words" :key="i"><span class="w">{{ w }}</span>{{ ' ' }}</template>
      </p>
    </div>
  </section>
</template>

<style scoped>
/* drawn per line fragment, so a wrapped item is struck on every line */
.no-text { background: linear-gradient(#d92d20, #d92d20) 0 58% / 100% 2.5px no-repeat; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
@media (prefers-reduced-motion: no-preference) {
  .no-text { background-size: 0% 2.5px; transition: background-size .8s cubic-bezier(.65, 0, .35, 1); }
  .no.is-struck .no-text { background-size: 100% 2.5px; }
}
.w { will-change: opacity, filter; }
</style>
