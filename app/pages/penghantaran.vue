<script setup lang="ts">
import { DELIVERY } from '~/composables/useLegal';
definePageMeta({ layout: 'bare' });
</script>

<template><LegalPage :doc="DELIVERY" path="/penghantaran" /></template>
