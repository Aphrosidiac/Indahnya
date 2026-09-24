<script setup lang="ts">
import { TERMS } from '~/composables/useLegal';
definePageMeta({ layout: 'bare' });
</script>

<template><LegalPage :doc="TERMS" path="/terma" /></template>
