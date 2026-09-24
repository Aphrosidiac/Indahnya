<script setup lang="ts">
import { PRIVACY } from '~/composables/useLegal';
definePageMeta({ layout: 'bare' });
</script>

<template><LegalPage :doc="PRIVACY" path="/privasi" /></template>
