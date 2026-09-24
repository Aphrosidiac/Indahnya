<script setup lang="ts">
import { useEvents } from '~/stores/events';
/**
 * The dashboard. Auth is restored by the `auth` middleware before any page
 * here renders; the event list loads once for the picker.
 *
 * NO ROUTE TRANSITION — the keyed wrapper with `.reveal` is a CSS keyframe
 * with no fill mode (see ui/tokens.css): a page that never gets to animate
 * is already at rest. Keyed on path, not fullPath, so a query change
 * refetches without rebuilding the page under the reader's hands.
 */
const route = useRoute();
const events = useEvents();
onMounted(() => { void events.load(); });
</script>

<template>
  <AppShell>
    <div :key="route.path" class="reveal"><slot /></div>
  </AppShell>
</template>
