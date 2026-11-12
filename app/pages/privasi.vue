<script setup lang="ts">
import { PRIVACY } from '~/composables/useLegal';
definePageMeta({ layout: 'bare', alias: ['/en/privacy'] });
</script>

<template><LegalPage :doc="PRIVACY" path="/privasi" /></template>
