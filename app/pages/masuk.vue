<script setup lang="ts">
import { useAuth } from '~/stores/auth';
import { Btn, Field, Alert, Logo } from '~/ui';

definePageMeta({ layout: 'default' });
useSeoMeta({ title: 'Log masuk · Indahnya', robots: 'noindex' });
const auth = useAuth();
const route = useRoute();
const router = useRouter();
const email = ref('');
const busy = ref(false);
const sent = ref(false);
const verifying = ref(false);
const error = ref('');
const next = computed(() => safeNext(route.query.next));

/**
 * The emailed link lands here with ?t=. The token is spent by this POST, not
 * by the GET that opened the page: mail scanners fetch links but do not run
 * the page, so a scanned link still works when the host taps it.
 */
onMounted(async () => {
  const t = typeof route.query.t === 'string' ? route.query.t : '';
  if (t) {
    verifying.value = true;
    try {
      const r = await $fetch<{ next: string }>('/api/auth/magic/verify', { method: 'POST', body: { t } });
      auth.restored = false;
      await auth.restore();
      return router.replace(safeNext(r.next));
    } catch (e) {
      error.value = apiError(e, 'Link tu dah tamat. Minta yang baru.');
      router.replace({ query: {} });
    } finally { verifying.value = false; }
  }
  await auth.restore();
  if (auth.user) return router.replace(next.value);
  if (route.query.error === 'expired') error.value = 'Link tu dah tamat. Minta yang baru.';
  if (route.query.error === 'google') error.value = 'Google tak jadi. Cuba lagi atau guna email.';
});

async function submit() {
  if (busy.value) return;
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) { error.value = 'Check email tu betul?'; return; }
  busy.value = true; error.value = '';
  try {
    await $fetch('/api/auth/magic', { method: 'POST', body: { email: email.value.trim(), next: next.value } });
    sent.value = true;
  } catch (e) { error.value = apiError(e, 'Tak dapat hantar link. Check email tu betul?'); }
  finally { busy.value = false; }
}
</script>

<template>
  <div class="grid min-h-screen place-items-center px-4 py-12">
    <div class="w-full max-w-[380px]">
      <div class="mb-7 flex justify-center"><NuxtLink to="/" aria-label="Indahnya — laman utama"><Logo :size="34" /></NuxtLink></div>

      <div v-if="verifying" class="card p-6 text-center" role="status">
        <span class="mx-auto block size-6 animate-spin rounded-full border-2 border-line-200 border-t-ink-700" aria-hidden="true" />
        <p class="mt-3 text-[14px] leading-5 text-ink-600">Tengah log masuk…</p>
      </div>

      <form v-else-if="!sent" class="card p-6" novalidate @submit.prevent="submit">
        <h1 class="text-[20px] leading-7 font-semibold">Log masuk</h1>
        <p class="mt-1 text-[14px] leading-5 text-ink-500">Kami hantar link ke email. Tak payah password.</p>

        <Alert v-if="error" tone="danger" title="Tak jadi" class="mt-5">{{ error }}</Alert>

        <div class="mt-5">
          <Field v-slot="{ id }" label="Email" required>
            <input :id="id" v-model="email" type="email" autocomplete="email" inputmode="email" autofocus placeholder="nama@email.com" />
          </Field>
        </div>

        <Btn type="submit" variant="primary" size="lg" block class="mt-6" :loading="busy">Hantar link log masuk</Btn>

        <template v-if="auth.googleEnabled">
          <div class="my-5 flex items-center gap-3 text-[12px] text-ink-400"><span class="h-px flex-1 bg-line-100" />atau<span class="h-px flex-1 bg-line-100" /></div>
          <a :href="`/api/auth/google?next=${encodeURIComponent(next)}`"
            class="flex h-11 w-full items-center justify-center gap-2.5 rounded-sm border border-line-200 bg-surface-0 text-[14px] font-medium text-ink-800 transition-colors hover:border-ink-300">
            <svg class="size-[18px]" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.2v3.1C3.2 21.3 7.3 24 12 24z"/><path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.2C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4.1-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.6l4.1 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>
            Teruskan dengan Google
          </a>
        </template>
        <p class="mt-5 text-[12px] leading-4 text-ink-400">Dengan log masuk, korang setuju dengan <NuxtLink to="/terma" class="underline underline-offset-2 hover:text-ink-700">Terma</NuxtLink> dan <NuxtLink to="/privasi" class="underline underline-offset-2 hover:text-ink-700">Notis Privasi</NuxtLink> kami.</p>
      </form>

      <div v-else class="card p-6" role="status">
        <h1 class="text-[20px] leading-7 font-semibold">Check email</h1>
        <p class="mt-1 text-[14px] leading-5 text-ink-600">Link log masuk dah dihantar ke <span class="font-medium text-ink-900">{{ email }}</span>. Tamat dalam 15 minit.</p>
        <p class="mt-4 text-[13px] leading-[18px] text-ink-500">Tak sampai? Tengok folder spam, atau <button type="button" class="font-medium text-ink-900 underline-offset-2 hover:underline" @click="sent = false">hantar semula</button>.</p>
      </div>

      <p class="mt-6 text-center text-[12px] leading-4 text-ink-400">Indahnya · by FF Dev Studio</p>
    </div>
  </div>
</template>
