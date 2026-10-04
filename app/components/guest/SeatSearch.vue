<script setup lang="ts">
import { Search, Armchair } from 'lucide-vue-next';

/** "Cari nama, dapat nombor meja" — for the guest at the door with a phone and a queue behind them. */
/** `tryNames`: on the sample, names that are on its list, as one-tap chips. */
const props = defineProps<{ slug: string; locale: 'ms' | 'en'; tryNames?: string[] }>();
const q = ref('');
const items = ref<{ name: string; table: string }[] | null>(null);
let seq = 0;
const busy = ref(false);
const en = computed(() => props.locale === 'en');
const L = computed(() => en.value
  ? { try: 'Try:', label: 'Type your name', ph: 'At least 3 letters', none: 'Not found. Try another spelling, or ask the host at the entrance.', table: 'Table', people: 'people' }
  : { try: 'Cuba:', label: 'Taip nama korang', ph: 'Sekurang-kurangnya 3 huruf', none: 'Tak jumpa. Cuba ejaan lain, atau tanya tuan majlis kat pintu masuk.', table: 'Meja', people: 'orang' });
let t: ReturnType<typeof setTimeout> | undefined;
watch(q, (v) => {
  clearTimeout(t);
  if (v.trim().length < 3) { items.value = null; return; }
  t = setTimeout(async () => {
    const mine = ++seq; // a slow answer to an older query must not replace a newer one
    busy.value = true;
    try { const r = (await $fetch<{ items: { name: string; table: string }[] }>(`/api/g/${props.slug}/tempat`, { query: { q: v.trim() } })).items; if (mine === seq) items.value = r; }
    catch { if (mine === seq) items.value = []; }
    finally { if (mine === seq) busy.value = false; }
  }, 250);
});
</script>

<template>
  <div class="gf">
    <label class="gf-label" :for="`seat-${slug}`">{{ L.label }}</label>
    <div class="relative">
      <Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2" :style="{ color: 'var(--f-muted)' }" :stroke-width="1.75" aria-hidden="true" />
      <input :id="`seat-${slug}`" v-model="q" class="gf-input !pl-10" type="search" autocomplete="off" :placeholder="L.ph" />
    </div>
    <p v-if="tryNames?.length" class="mt-2.5 flex flex-wrap items-center gap-1.5 text-[13px]" :style="{ color: 'var(--f-muted)' }">
      {{ L.try }}<button v-for="n in tryNames" :key="n" type="button" class="gf-chip" @click="q = n">{{ n }}</button>
    </p>
    <div class="mt-4" aria-live="polite">
      <p v-if="items && !items.length && !busy" class="text-[14px] leading-5" :style="{ color: 'var(--f-muted)' }">{{ L.none }}</p>
      <ul v-else-if="items" class="space-y-2">
        <li v-for="(r, i) in items" :key="i" class="gf-card flex items-center gap-3">
          <span class="grid size-11 shrink-0 place-items-center rounded-full" :style="{ background: 'var(--f-accent)', color: 'var(--f-on-accent)' }"><Armchair class="size-5" :stroke-width="1.6" aria-hidden="true" /></span>
          <span class="min-w-0 flex-1 truncate text-[15px] font-semibold">{{ r.name }}</span>
          <span class="shrink-0 text-right"><span class="block text-[11px] uppercase tracking-[.14em]" :style="{ color: 'var(--f-muted)' }">{{ L.table }}</span><span class="block text-[20px] font-semibold leading-6">{{ r.table.replace(/^Meja\s+/i, '') }}</span></span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.gf-chip { height: 36px; padding: 0 14px; border-radius: 999px; font-weight: 600; color: var(--f-ink); background: color-mix(in srgb, var(--f-ink) 7%, transparent); transition: background-color .15s; }
.gf-chip:hover { background: color-mix(in srgb, var(--f-ink) 12%, transparent); }
</style>
