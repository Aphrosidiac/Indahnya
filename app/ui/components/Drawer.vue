<script setup lang="ts">
import { watch, onBeforeUnmount, ref, nextTick, useId } from 'vue';
import { X } from 'lucide-vue-next';
import { useOverlayStack } from '../overlay-stack';

/**
 * A right-hand side panel. ROWS OPEN A DRAWER, NOT A NEW PAGE.
 *
 * Staff do the same edit forty times an hour. Losing the list — its scroll
 * position, its filters, the row you were comparing against — every single time
 * is the difference between a tool people like and a tool people work around.
 */
const props = withDefaults(defineProps<{
  open: boolean; title: string; subtitle?: string; width?: 'sm' | 'md' | 'lg';
}>(), { width: 'md' });
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
/**
 * The wrapper outlives `open` by one transition. Without it the panel is
 * unmounted the instant open flips false and there is nothing left to animate
 * out — the drawer would simply blink away.
 */
const mounted = ref(props.open);
const titleId = useId();
let restore: HTMLElement | null = null;

function onKey(e: KeyboardEvent) {
  /** Only the top-most overlay answers Escape; a modal over a drawer must not
      take the drawer down with it. */
  if (e.key === 'Escape') { if (isTop()) close(); return; }
  if (e.key !== 'Tab' || !panel.value) return;
  const f = panel.value.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
  if (!f.length) return;
  const first = f[0]!, last = f[f.length - 1]!;
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
    <!-- The backdrop and the panel transition SEPARATELY. Putting both on one
         wrapper makes the slide fight the fade on the way out, and the panel
         appears to jump sideways as it disappears. -->
    <div v-if="mounted" class="fixed inset-0 z-50" :class="!open && 'pointer-events-none'">
      <!-- `appear` matters: `mounted` and `open` both become true in the same
           tick, so Vue treats the panel as an INITIAL render and skips the
           enter transition entirely. It opened instantly and only animated on
           the way out. -->
      <Transition name="veil" appear>
        <div v-if="open" class="absolute inset-0 bg-ink-900/40" @click="close()" />
      </Transition>

      <Transition name="slide" appear @after-leave="mounted = false">
        <div v-if="open" ref="panel" role="dialog" aria-modal="true" :aria-labelledby="titleId"
          class="absolute inset-y-0 right-0 flex w-full flex-col bg-surface-0 shadow-lg
                 sm:inset-y-2 sm:right-2 sm:rounded-lg"
          :class="width === 'lg' ? 'sm:w-[720px]' : width === 'sm' ? 'sm:w-[400px]' : 'sm:w-[560px]'">
          <header class="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-5">
            <div class="min-w-0">
              <h2 :id="titleId" class="truncate text-[17px] leading-6 font-semibold">{{ title }}</h2>
              <p v-if="subtitle" class="mt-0.5 truncate text-[13px] leading-[18px] text-ink-500">{{ subtitle }}</p>
            </div>
            <button type="button" class="grid size-7 shrink-0 place-items-center rounded-full bg-sand text-ink-600 transition-colors hover:bg-line-200 hover:text-ink-900"
              aria-label="Close" @click="close()">
              <X class="size-4" :stroke-width="2" />
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-3"><slot /></div>
          <footer v-if="$slots.footer"
            class="flex shrink-0 justify-end gap-2 border-t border-line-100 px-5 py-4">
            <slot name="footer" />
          </footer>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
