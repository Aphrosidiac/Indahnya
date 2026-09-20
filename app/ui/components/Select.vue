<script setup lang="ts" generic="T extends string | number | null">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { Check, ChevronDown, Search } from 'lucide-vue-next';
import { useOverlayStack } from '../overlay-stack';

export interface SelectOption<V> {
  value: V;
  label: string;
  /** Second line — the thing that makes the choice obvious. */
  hint?: string;
  disabled?: boolean;
}

/**
 * The house dropdown.
 *
 * A native <select> renders its list with the OS, so on macOS it arrives as a
 * dark grey sheet in the system font — the one element on the page that ignores
 * the design entirely. This is the same control drawn in our own tokens.
 *
 * Two implementation details are load-bearing:
 *
 *  - The list is TELEPORTED to the body and positioned fixed. Every filter bar
 *    in this app sits above a table with `overflow-x-auto`, and the branch
 *    picker sits inside a sticky header; an absolutely positioned panel is
 *    clipped by both.
 *  - It joins the overlay stack, so Escape inside a Drawer closes the dropdown
 *    and leaves the drawer alone.
 */
const props = withDefaults(defineProps<{
  options: SelectOption<T>[];
  placeholder?: string;
  /** Set when rendered inside <Field>, so the label's `for` still works. */
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  block?: boolean;
  /** Leading icon, e.g. a shop for the branch picker. */
  icon?: unknown;
  /** Adds a filter box. Worth it past roughly a dozen options. */
  searchable?: boolean;
  searchPlaceholder?: string;
}>(), { placeholder: 'Select…', searchPlaceholder: 'Search…' });

const model = defineModel<T>({ required: true });

const open = ref(false);
const active = ref(-1);
const trigger = ref<HTMLButtonElement>();
const list = ref<HTMLElement>();
const listId = useId();
const rect = ref({ top: 0, left: 0, width: 0, flip: false });

const { isTop } = useOverlayStack(open);

const query = ref('');
const search = ref<HTMLInputElement>();

const selected = computed(() => props.options.find(o => o.value === model.value) ?? null);

/** What is actually on screen. Everything below indexes into THIS, not props. */
const shown = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter(o =>
    o.label.toLowerCase().includes(q) || (o.hint ?? '').toLowerCase().includes(q));
});
const enabled = computed(() => shown.value.filter(o => !o.disabled));

/** Fixed to the viewport, and flipped upward when the room below runs out. */
function place() {
  const el = trigger.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const needed = Math.min(props.options.length * 40 + 12, 288);
  const below = innerHeight - r.bottom;
  rect.value = {
    top: below < needed + 12 && r.top > needed ? r.top - needed - 6 : r.bottom + 6,
    left: Math.min(r.left, innerWidth - Math.max(r.width, 180) - 8),
    width: Math.max(r.width, 180),
    flip: below < needed + 12 && r.top > needed,
  };
}

async function show() {
  if (props.disabled) return;
  place();
  open.value = true;
  /** Click does not focus a button in every browser, and without focus the
      arrow keys would go nowhere. */
  trigger.value?.focus();
  query.value = '';
  active.value = Math.max(0, props.options.findIndex(o => o.value === model.value));
  await nextTick();
  if (props.searchable) search.value?.focus();
  list.value?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
}

function hide(refocus = true) {
  open.value = false;
  if (refocus) trigger.value?.focus();
}

function choose(o: SelectOption<T>) {
  if (o.disabled) return;
  model.value = o.value;
  hide();
}

/** Type a letter to jump, the way a native select does. */
let typed = '';
let typedAt = 0;
function typeahead(key: string) {
  const now = Date.now();
  typed = now - typedAt > 700 ? key : typed + key;
  typedAt = now;
  const i = shown.value.findIndex(o => !o.disabled && o.label.toLowerCase().startsWith(typed));
  if (i >= 0) active.value = i;
}

function onKey(e: KeyboardEvent) {
  if (!open.value) {
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); void show(); }
    return;
  }
  if (e.key === 'Escape') {
    /** Only if we are the top-most overlay — a Select inside a Drawer must not
        take the Drawer down with it. */
    if (isTop()) { e.preventDefault(); e.stopPropagation(); hide(); }
    return;
  }
  if (e.key === 'Tab') { hide(false); return; }

  const step = (d: number) => {
    e.preventDefault();
    const list_ = shown.value;
    let i = active.value;
    for (let n = 0; n < list_.length; n++) {
      i = (i + d + list_.length) % list_.length;
      if (!list_[i]?.disabled) break;
    }
    active.value = i;
    nextTick(() => list.value?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }));
  };

  if (e.key === 'ArrowDown') return step(1);
  if (e.key === 'ArrowUp') return step(-1);
  if (e.key === 'Home') { e.preventDefault(); active.value = shown.value.indexOf(enabled.value[0]!); return; }
  if (e.key === 'End') { e.preventDefault(); active.value = shown.value.indexOf(enabled.value[enabled.value.length - 1]!); return; }
  if (e.key === 'Enter') {
    e.preventDefault();
    const o = shown.value[active.value];
    if (o) choose(o);
    return;
  }
  /** With a filter box open, space is a character and letters are typing. */
  if (props.searchable) return;
  if (e.key === ' ') { e.preventDefault(); const o = shown.value[active.value]; if (o) choose(o); return; }
  if (e.key.length === 1 && /\S/.test(e.key)) typeahead(e.key.toLowerCase());
}

/**
 * Escape has to be caught on the WINDOW, not just on our own elements.
 *
 * Inside a Drawer the key never reached us: the Drawer's own window listener
 * fired, correctly declined because we are top of the stack, and that was the
 * end of it — Escape closed nothing at all. Every overlay in this app listens
 * globally and defers to the stack; this one has to as well.
 */
function onWindowKey(e: KeyboardEvent) {
  if (!open.value || e.key !== 'Escape') return;
  if (!isTop()) return;
  e.preventDefault();
  e.stopPropagation();
  hide();
}

function onDocPointer(e: PointerEvent) {
  if (!open.value) return;
  const t = e.target as Node;
  if (trigger.value?.contains(t) || list.value?.contains(t)) return;
  hide(false);
}

/** Follow the trigger rather than closing: the page head is sticky and the
    filter bars scroll, so closing on scroll would feel broken. */
const follow = () => { if (open.value) place(); };

watch(open, o => {
  if (o) {
    addEventListener('scroll', follow, true);
    addEventListener('resize', follow);
    addEventListener('pointerdown', onDocPointer, true);
    addEventListener('keydown', onWindowKey);
  } else {
    removeEventListener('scroll', follow, true);
    removeEventListener('resize', follow);
    removeEventListener('pointerdown', onDocPointer, true);
    removeEventListener('keydown', onWindowKey);
  }
});
onBeforeUnmount(() => {
  removeEventListener('scroll', follow, true);
  removeEventListener('resize', follow);
  removeEventListener('pointerdown', onDocPointer, true);
  removeEventListener('keydown', onWindowKey);
});
</script>

<template>
  <button
    :id="id" ref="trigger" type="button" role="combobox"
    :aria-expanded="open" :aria-controls="listId" aria-haspopup="listbox"
    :aria-label="ariaLabel" :disabled="disabled"
    class="inline-flex h-[36px] items-center gap-2 rounded-sm border border-line-200 bg-surface-0
           px-3 text-left text-[13px] text-ink-800 transition-colors
           hover:bg-surface-50 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-ink-400"
    :class="[block ? 'w-full' : 'w-auto', open && 'border-ink-400']"
    @click="open ? hide() : show()"
    @keydown="onKey">
    <component :is="icon" v-if="icon" class="size-4 shrink-0 text-ink-400" :stroke-width="1.5" aria-hidden="true" />
    <span class="min-w-0 flex-1 truncate" :class="!selected && 'text-ink-300'">
      {{ selected?.label ?? placeholder }}
    </span>
    <ChevronDown class="size-4 shrink-0 text-ink-400 transition-transform duration-[160ms]"
      :class="open && 'rotate-180'" :stroke-width="1.75" aria-hidden="true" />
  </button>

  <Teleport to="body">
    <Transition name="drop">
      <div v-if="open" :id="listId" ref="list" role="listbox" tabindex="-1"
        :aria-activedescendant="`${listId}-${active}`"
        class="card fixed z-[80] flex max-h-72 flex-col overflow-hidden p-1 shadow-md"
        :style="{ top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`,
                  transformOrigin: rect.flip ? 'bottom' : 'top' }"
        @keydown="onKey">
        <label v-if="searchable" class="relative mb-1 flex shrink-0 items-center border-b border-line-100 pb-1">
          <Search class="pointer-events-none absolute left-2 size-3.5 text-ink-400" :stroke-width="1.75" aria-hidden="true" />
          <span class="sr-only">Filter options</span>
          <input ref="search" v-model="query" type="text" :placeholder="searchPlaceholder"
            class="h-8 w-full border-0 bg-transparent pl-7 text-[14px] outline-none placeholder:text-ink-300" />
        </label>

        <div class="min-h-0 flex-1 overflow-y-auto">
        <button v-for="(o, i) in shown" :id="`${listId}-${i}`" :key="String(o.value)"
          type="button" role="option" :aria-selected="o.value === model" :data-active="i === active"
          :disabled="o.disabled"
          class="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors
                 disabled:cursor-not-allowed disabled:opacity-40"
          :class="i === active ? 'bg-primary-50' : 'hover:bg-surface-50'"
          @click="choose(o)" @mousemove="active = i">
          <Check class="size-4 shrink-0"
            :class="o.value === model ? 'text-primary-700' : 'opacity-0'"
            :stroke-width="2.25" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[14px] leading-5"
              :class="o.value === model ? 'font-medium text-ink-900' : 'text-ink-800'">{{ o.label }}</span>
            <span v-if="o.hint" class="block truncate text-[12px] leading-4 text-ink-500">{{ o.hint }}</span>
          </span>
        </button>
        <p v-if="!shown.length" class="px-2.5 py-4 text-center text-[13px] text-ink-500">
          Nothing matches &ldquo;{{ query }}&rdquo;.
        </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
