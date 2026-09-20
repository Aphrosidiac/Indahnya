<script setup lang="ts">
import { ref } from 'vue';
import { ImageOff } from 'lucide-vue-next';

/**
 * A product shot in a list. Fixed box, `object-contain` on a warm ground:
 * catalogue photography arrives at every aspect ratio, and `object-cover` would
 * crop the label off a tall bag of food — which is the one part of the picture
 * a person is scanning the list for.
 */
withDefaults(defineProps<{ src?: string | null; alt?: string; size?: number }>(), {
  size: 40, alt: '',
});
const failed = ref(false);
</script>

<template>
  <span
    class="grid shrink-0 place-items-center overflow-hidden rounded-sm border border-line-100 bg-sand"
    :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="src && !failed" :src="src" :alt="alt" loading="lazy" decoding="async"
      class="size-full object-contain" @error="failed = true" />
    <ImageOff v-else class="size-4 text-ink-300" :stroke-width="1.5" aria-hidden="true" />
  </span>
</template>
