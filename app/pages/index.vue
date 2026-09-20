<script setup lang="ts">
/** No landing page yet, by decision. The root sends you to the app. */
definePageMeta({ layout: 'bare' });
await navigateTo('/app', { redirectCode: 302 });
</script>
<template><div /></template>
