<script setup lang="ts">
import { watch, onBeforeUnmount, ref, nextTick, useId } from 'vue';
import { X } from 'lucide-vue-next';
import { useOverlayStack } from '../overlay-stack';

const props = withDefaults(defineProps<{
  open: boolean; title: string; subtitle?: string; size?: 'md' | 'lg';
}>(), { size: 'md' });
/**
 * `close` is the contract; `update:open` rides along so that `v-model:open`
 * also works. Six SQL Account dialogs were wired with v-model and could not be
 * dismissed by X, Escape or backdrop — the component fired `close`, nothing
 * listened. Both spellings now flip the caller's ref.
 */
const emit = defineEmits<{ close: []; 'update:open': [value: boolean] }>();
const close = () => { emit('update:open', false); emit('close'); };

const panel = ref<HTMLElement>();
const { isTop } = useOverlayStack(() => props.open);
/** Outlives `open` by one transition so the panel has something to leave from. */
const mounted = ref(props.open);
const titleId = useId();
let restore: HTMLElement | null = null;

function onKey(e: KeyboardEvent) {
  /** Only the top-most overlay answers Escape; a modal over a drawer must not
      take the drawer down with it. */
  if (e.key === 'Escape') { if (isTop()) close(); return; }
  if (e.key !== 'Tab' || !panel.value) return;
  const focusable = panel.value.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  const first = focusable[0]!, last = focusable[focusable.length - 1]!;
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

watch(() => props.open, async o => {
  if (o) mounted.value = true;
  if (o) {
    restore = document.activeElement as HTMLElement;
    addEventListener('keydown', onKey);
    await nextTick();
    panel.value?.querySelector<HTMLElement>('input,button,select,textarea')?.focus();
  } else {
    removeEventListener('keydown', onKey);
    restore?.focus();
    restore = null;
  }
});
/** The stack releases the scroll lock; unlocking here would free it while
    another overlay is still covering the page. */
onBeforeUnmount(() => removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop and panel transition separately: the veil only fades, the
         panel lifts and settles. -->
    <div v-if="mounted" class="fixed inset-0 z-50 flex items-center justify-center p-4"
      :class="!open && 'pointer-events-none'">
      <!-- `appear` matters: `mounted` and `open` both become true in the same
           tick, so Vue treats the panel as an INITIAL render and skips the
           enter transition entirely. It opened instantly and only animated on
           the way out. -->
      <Transition name="veil" appear>
        <div v-if="open" class="absolute inset-0 bg-ink-900/45" @click="close()" />
      </Transition>

      <Transition name="pop" appear @after-leave="mounted = false">
        <div v-if="open" ref="panel" role="dialog" aria-modal="true" :aria-labelledby="titleId"
          class="relative flex max-h-[88vh] w-full flex-col rounded-lg bg-surface-0 shadow-lg"
          :class="size === 'lg' ? 'max-w-[720px]' : 'max-w-[520px]'">
          <header class="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
            <div>
              <h2 :id="titleId" class="text-[18px] leading-7 font-semibold">{{ title }}</h2>
              <p v-if="subtitle" class="mt-0.5 text-[13px] leading-5 text-ink-500">{{ subtitle }}</p>
            </div>
            <button type="button" class="grid size-7 shrink-0 place-items-center rounded-full bg-sand text-ink-600 transition-colors hover:bg-line-200 hover:text-ink-900"
              aria-label="Close" @click="close()">
              <X class="size-4" :stroke-width="2" />
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4"><slot /></div>
          <footer v-if="$slots.footer"
            class="flex justify-end gap-2 px-6 pb-5 pt-2">
            <slot name="footer" />
          </footer>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
