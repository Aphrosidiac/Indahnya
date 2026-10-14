<script setup lang="ts">
import { COMPANY } from '~~/shared/company';

/**
 * The company block every public footer carries: registered name and SSM
 * number, business address, email and phone. Inherits its colour and size
 * from the footer it sits in.
 */
const legal = useRuntimeConfig().public.legal;
const name = computed(() => legal.name || COMPANY.name);
const reg = computed(() => legal.reg || COMPANY.reg);
const address = computed(() => legal.address || COMPANY.address);
const link = 'underline decoration-current/25 underline-offset-2 hover:text-ink-900 max-md:inline-block max-md:py-1.5';
</script>

<template>
  <address class="not-italic leading-[1.6]">
    <p class="font-medium">{{ name }} ({{ reg }})</p>
    <p>{{ address }}</p>
    <p>
      <a :href="`mailto:${COMPANY.email}`" :class="link">{{ COMPANY.email }}</a>
      <span class="mx-1.5 opacity-50" aria-hidden="true">·</span>
      <a :href="`tel:${COMPANY.phoneHref}`" :class="link">{{ COMPANY.phone }}</a>
    </p>
  </address>
</template>
