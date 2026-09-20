/**
 * The shared design system — RackForge's bones, re-grounded 2026-09-18 on the
 * language of a reference back office (see docs/27-ops-redesign.md).
 *
 * Everything here is presentational and app-agnostic, because Ops and the till
 * are both Vue and both need it. Anything that reaches for a router, a store or
 * a nav list belongs in the app, not here — which is why AppShell,
 * CommandPalette, BranchPicker and WebShopTabs stayed in apps/ops.
 *
 * The two load-bearing rules live in the components themselves:
 *   - Btn's primary is charcoal ink, and its type defaults to "button". The
 *     green `accent` carries ink text and is used once per page.
 *   - Card uses a hairline AND a shadow.
 *
 * Composition, in the order a page reads: KpiStrip + Stat, then Card with a
 * right column (Meter, ActionRow, Alert), then DataTable; Tabs for a page's
 * screens, Tabs variant="filter" for narrowing a list.
 */
export { default as ActionRow } from './components/ActionRow.vue';
export { default as Alert } from './components/Alert.vue';
export { default as Avatar } from './components/Avatar.vue';
export { default as Bars } from './components/Bars.vue';
export { default as Chip } from './components/Chip.vue';
export { default as Count } from './components/Count.vue';
export { default as IconBox } from './components/IconBox.vue';
export { default as KeyValue } from './components/KeyValue.vue';
export { default as KpiStrip } from './components/KpiStrip.vue';
export { default as Meter } from './components/Meter.vue';
export { default as Ring } from './components/Ring.vue';
export { default as Tabs } from './components/Tabs.vue';
export { default as Btn } from './components/Btn.vue';
export { default as Card } from './components/Card.vue';
export { default as DataTable } from './components/DataTable.vue';
export { default as Drawer } from './components/Drawer.vue';
export { default as EmptyState } from './components/EmptyState.vue';
export { default as Field } from './components/Field.vue';
export { default as FilterBar } from './components/FilterBar.vue';
export { default as ImageUploader } from './components/ImageUploader.vue';
export type { UploadedImage } from './components/ImageUploader.vue';
export { default as Logo } from './components/Logo.vue';
export { default as Modal } from './components/Modal.vue';
export { default as PageHead } from './components/PageHead.vue';
export { default as Select } from './components/Select.vue';
export type { SelectOption } from './components/Select.vue';
export { default as Sk } from './components/Sk.vue';
export { default as Skeleton } from './components/Skeleton.vue';
export { default as Stat } from './components/Stat.vue';
export { default as StatusPill } from './components/StatusPill.vue';
export { default as Thumb } from './components/Thumb.vue';
export { default as Toggle } from './components/Toggle.vue';
export { default as Toasts } from './components/Toasts.vue';

export type { Column } from './components/DataTable.vue';

/** Toasts and its store ship together; one is useless without the other. */
export { useUi, type Toast } from './toasts-store';
export { useOverlayStack } from './overlay-stack';
export { installOverlayScrollbars } from './overlay-scrollbar';
export { useMedia } from './use-media';
export { localDay, today, shiftDay } from './local-day';
