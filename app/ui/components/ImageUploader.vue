<script setup lang="ts">
import { computed, ref } from 'vue';
import { ImagePlus, Star, Trash2, TriangleAlert } from 'lucide-vue-next';

export interface UploadedImage {
  id: string; url: string;
  width: number | null; height: number | null;
  altText: string | null; position: number;
}

/**
 * Photographs for a record — a product, an animal, a pet.
 *
 * Position 0 is the main image: it is what the catalogue list shows and what
 * the storefront and the marketplace feeds will reach for, so promoting one is
 * a real action rather than a cosmetic sort.
 */
const props = withDefaults(defineProps<{
  images: UploadedImage[];
  busy?: boolean;
  disabled?: boolean;
  /** Mirrors MAX_UPLOAD_BYTES on the server; checked here to fail fast. */
  maxBytes?: number;
  label?: string;
}>(), { maxBytes: 15 * 1024 * 1024, label: 'Photos' });

const emit = defineEmits<{
  add: [files: File[]];
  remove: [id: string];
  makeMain: [id: string];
}>();

const input = ref<HTMLInputElement>();
const dragging = ref(false);
const rejected = ref<string[]>([]);

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/** Filter here rather than letting the server refuse one file out of six. */
function take(list: FileList | null) {
  rejected.value = [];
  const ok: File[] = [];
  for (const f of Array.from(list ?? [])) {
    if (!ACCEPT.includes(f.type)) rejected.value.push(`${f.name} is not an image we can store`);
    else if (f.size > props.maxBytes) rejected.value.push(`${f.name} is over ${Math.round(props.maxBytes / 1024 / 1024)}MB`);
    else ok.push(f);
  }
  if (ok.length) emit('add', ok);
  if (input.value) input.value.value = '';
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  if (props.disabled) return;
  take(e.dataTransfer?.files ?? null);
}

const sorted = computed(() => [...props.images].sort((a, b) => a.position - b.position));
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between gap-3">
      <span class="text-[14px] font-medium leading-5 text-ink-800">{{ label }}</span>
      <span v-if="images.length" class="text-[13px] text-ink-500">
        {{ images.length }} &middot; the first is the main one
      </span>
    </div>

    <div
      class="grid grid-cols-3 gap-2 rounded-md border border-dashed p-2 transition-colors sm:grid-cols-4"
      :class="dragging ? 'border-primary-700 bg-primary-50' : 'border-line-200'"
      @dragover.prevent="dragging = !disabled"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop">

      <figure v-for="(m, i) in sorted" :key="m.id"
        class="group relative aspect-square overflow-hidden rounded-sm border border-line-100 bg-sand">
        <img :src="m.url" :alt="m.altText ?? ''" loading="lazy" decoding="async"
          class="size-full object-contain" />

        <span v-if="i === 0"
          class="absolute left-1 top-1 rounded-full bg-ink-900/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Main
        </span>

        <!-- always reachable by keyboard; the hover is only a visual nicety -->
        <div v-if="!disabled"
          class="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-ink-900/70 to-transparent p-1
                 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button v-if="i !== 0" type="button" :aria-label="`Make this the main photo`"
            class="grid size-6 place-items-center rounded-sm bg-surface-0/90 text-ink-700 transition-colors hover:bg-surface-0"
            @click="emit('makeMain', m.id)">
            <Star class="size-3.5" :stroke-width="2" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Remove this photo"
            class="grid size-6 place-items-center rounded-sm bg-surface-0/90 text-danger-600 transition-colors hover:bg-surface-0"
            @click="emit('remove', m.id)">
            <Trash2 class="size-3.5" :stroke-width="2" aria-hidden="true" />
          </button>
        </div>
      </figure>

      <button v-if="!disabled" type="button"
        class="grid aspect-square place-items-center rounded-sm border border-dashed border-line-200
               bg-surface-0 text-ink-400 transition-colors hover:border-primary-700 hover:text-primary-700
               disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="busy" @click="input?.click()">
        <span class="flex flex-col items-center gap-1">
          <ImagePlus class="size-5" :stroke-width="1.5" aria-hidden="true" />
          <span class="text-[12px]">{{ busy ? 'Uploading…' : 'Add' }}</span>
        </span>
      </button>
    </div>

    <input ref="input" type="file" accept="image/*" multiple class="sr-only"
      @change="take(($event.target as HTMLInputElement).files)" />

    <p v-if="!images.length && !disabled" class="mt-1.5 text-[13px] leading-[18px] text-ink-500">
      Drag them in, or click Add. The first photo is the one the list and the store show.
    </p>

    <ul v-if="rejected.length" class="mt-2 space-y-1">
      <li v-for="r in rejected" :key="r" class="flex items-start gap-1.5 text-[13px] leading-[18px] text-danger-600">
        <TriangleAlert class="mt-px size-3.5 shrink-0" :stroke-width="2" aria-hidden="true" />{{ r }}
      </li>
    </ul>
  </div>
</template>
