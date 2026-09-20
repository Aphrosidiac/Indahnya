<script setup lang="ts">
/**
 * The reference has four buttons and we ship the same four:
 *   primary   — charcoal, white text. "+ New", "Send 128 outreach texts".
 *   secondary — white, hairline. "Export", "Leave it open", "View".
 *   accent    — the green, INK text. "Offer to all 3", "Auto-fix", "Invoice $42".
 *               The one obvious next step on a page, never two of them.
 *   ghost     — text only, for a row's quiet actions.
 * Danger keeps its two forms from RackForge; nothing in the reference destroys.
 */
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'danger-ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  type?: 'button' | 'submit';
}>(), { variant: 'secondary', size: 'md', type: 'button' });
</script>

<template>
  <button
    :type="type" :disabled="disabled || loading" :aria-busy="loading || undefined"
    class="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap
           font-medium transition-[background-color,border-color,color,transform,opacity] duration-[120ms] ease-[cubic-bezier(.2,.8,.2,1)]
           active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
    :class="[
      block && 'w-full',
      size === 'xs' ? 'h-[28px] rounded-[8px] px-2.5 text-[12px]'
        : size === 'sm' ? 'h-[36px] rounded-[9px] px-3 text-[13px] sm:h-[30px] sm:px-2.5'
        : size === 'lg' ? 'h-[44px] rounded-[12px] px-[18px] text-[15px]'
        : 'h-[40px] rounded-sm px-3.5 text-[14px] sm:h-[36px]',
      variant === 'primary'
        && 'bg-ink-700 text-white hover:bg-ink-800 active:bg-ink-900',
      variant === 'secondary'
        && 'border border-line-200 bg-surface-0 text-ink-800 hover:bg-surface-50 active:bg-sand',
      variant === 'accent'
        && 'bg-primary-400 text-ink-900 hover:bg-primary-500 active:bg-primary-600',
      variant === 'ghost'
        && 'text-ink-600 hover:bg-sand hover:text-ink-900',
      variant === 'danger'
        && 'bg-danger-600 text-white hover:bg-danger-700',
      variant === 'danger-ghost'
        && 'border border-line-200 bg-surface-0 text-danger-600 hover:bg-danger-50',
    ]">
    <svg v-if="loading" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
    </svg>
    <slot />
  </button>
</template>
