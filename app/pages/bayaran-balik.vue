<script setup lang="ts">
import { REFUND } from '~/composables/useLegal';
definePageMeta({ layout: 'bare', alias: ['/en/refunds'] });
</script>

<template><LegalPage :doc="REFUND" path="/bayaran-balik" /></template>
