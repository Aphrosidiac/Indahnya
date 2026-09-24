<script setup lang="ts">
import { Mic, Square, Trash2, Send, RotateCcw, Play, Pause, PenLine } from 'lucide-vue-next';

/**
 * Ucapan: the wishes wall and the way to add one — written, or spoken into
 * the phone ("tak payah sewa telefon vintage"). Newest first. A guest can take
 * back their own inside the host's delete window. In approval mode a wish
 * waits for the host and the guest is told so.
 */
const props = withDefaults(defineProps<{ slug: string; locale: 'ms' | 'en'; limit?: number; showForm?: boolean; allowMore?: boolean; guestName?: string | null }>(), { limit: 30, showForm: true, allowMore: true, guestName: null });

interface Wish { id: string; name: string | null; kind: 'text' | 'audio'; body: string | null; createdAt: string; durationSec: number | null; audio: string | null; canDelete: boolean }
const items = ref<Wish[]>([]);
const next = ref<string | null>(null);
const loading = ref(true);
const en = computed(() => props.locale === 'en');
const L = computed(() => en.value
  ? { write: 'Write', voice: 'Voice', name: 'Your name', namePh: 'e.g. Aunty Ros', msg: 'Your wish', msgPh: 'May your marriage be blessed…', send: 'Send wish', rec: 'Start recording', stop: 'Stop', again: 'Record again', sendVoice: 'Send voice wish', empty: 'No wishes yet — be the first!', more: 'Show more', held: 'Thank you! Your wish will appear once the host approves it.', thanks: 'Thank you for your wish!', processing: 'Received — your voice wish will appear in a moment.', denied: 'Allow the microphone to record a voice wish.', unsupported: 'This browser cannot record — write your wish instead.', asking: 'Allow the microphone…', max: 'Up to 60 seconds', guest: 'Guest', del: 'Delete my wish', delQ: 'Delete this wish?', fail: 'Could not send, please try again' }
  : { write: 'Tulis', voice: 'Suara', name: 'Nama', namePh: 'cth. Makcik Ros', msg: 'Ucapan', msgPh: 'Selamat pengantin baru, semoga berkekalan…', send: 'Hantar ucapan', rec: 'Mula rakam', stop: 'Berhenti', again: 'Rakam semula', sendVoice: 'Hantar ucapan suara', empty: 'Belum ada ucapan — jadi yang pertama!', more: 'Tunjuk lagi', held: 'Terima kasih! Ucapan korang akan naik selepas tuan majlis approve.', thanks: 'Terima kasih atas ucapan korang!', processing: 'Dah terima — ucapan suara korang akan naik sekejap lagi.', denied: 'Benarkan mikrofon untuk rakam ucapan suara.', unsupported: 'Browser ni tak boleh rakam — tulis ucapan je ya.', asking: 'Benarkan mikrofon…', max: 'Sampai 60 saat', guest: 'Tetamu', del: 'Padam ucapan saya', delQ: 'Padam ucapan ni?', fail: 'Tak dapat hantar, cuba lagi' });

async function load(reset = true) {
  try {
    const r = await $fetch<{ items: Wish[]; next: string | null }>(`/api/g/${props.slug}/ucapan`, { query: { limit: props.limit, cursor: reset ? undefined : next.value } });
    items.value = reset ? r.items : [...items.value, ...r.items];
    next.value = r.next;
  } catch { /* the wall is optional; the form still works */ }
  finally { loading.value = false; }
}
onMounted(() => load());

/* ── the form ── */
const mode = ref<'text' | 'voice'>('text');
const name = ref(props.guestName ?? '');
const body = ref('');
const busy = ref(false);
const note = ref('');
const error = ref('');
const voice = useVoiceRecorder(60);
function done(status: string) {
  if (status === 'visible') note.value = L.value.thanks;
  else if (status === 'hidden') note.value = L.value.held;
  else if (status === 'processing') note.value = L.value.processing;
  else { error.value = L.value.fail; return; }
  body.value = ''; voice.reset();
  void load();
}
async function sendText() {
  error.value = ''; note.value = '';
  if (!body.value.trim()) { error.value = L.value.msg; return; }
  busy.value = true;
  try { const r = await $fetch<{ status: string }>(`/api/g/${props.slug}/ucapan`, { method: 'POST', body: { name: name.value.trim() || undefined, body: body.value.trim() } }); done(r.status); }
  catch (e) { error.value = apiError(e, L.value.fail); }
  finally { busy.value = false; }
}
async function sendVoice() {
  const b = voice.blob.value; if (!b) return;
  error.value = ''; note.value = ''; busy.value = true;
  try {
    const slot = await $fetch<{ id: string; url: string; type: string }>(`/api/g/${props.slug}/ucapan/audio`, { method: 'POST', body: { name: name.value.trim() || undefined, type: b.type || 'audio/webm', bytes: b.size } });
    const put = await fetch(slot.url, { method: 'PUT', headers: { 'content-type': slot.type }, body: b }).catch(() => null);
    if (!put?.ok) {
      // hand the slot back: three dead ones on bad hall wifi would otherwise block voice wishes for hours
      await $fetch(`/api/g/${props.slug}/ucapan/${slot.id}`, { method: 'DELETE' }).catch(() => {});
      throw new Error(L.value.fail);
    }
    const r = await $fetch<{ status: string }>(`/api/g/${props.slug}/ucapan/${slot.id}/complete`, { method: 'POST', retry: 2, retryDelay: 1500 });
    done(r.status);
  } catch (e) { error.value = apiError(e, L.value.fail); }
  finally { busy.value = false; }
}
async function remove(w: Wish) {
  if (!confirm(L.value.delQ)) return;
  try { await $fetch(`/api/g/${props.slug}/ucapan/${w.id}`, { method: 'DELETE' }); items.value = items.value.filter(i => i.id !== w.id); }
  catch (e) { error.value = apiError(e, L.value.fail); }
}

/* one voice note plays at a time — across every wishes box on the page, and never over the kad's song */
const playing = ref<string | null>(null);
const player = ref<HTMLAudioElement | null>(null);
const me = Math.random().toString(36).slice(2);
function onOther(e: Event) { if ((e as CustomEvent).detail !== me) { player.value?.pause(); playing.value = null; } }
onMounted(() => addEventListener('indahnya:voice', onOther));
onBeforeUnmount(() => removeEventListener('indahnya:voice', onOther));
function play(w: Wish) {
  if (!w.audio) return;
  if (playing.value === w.id) { player.value?.pause(); playing.value = null; return; }
  dispatchEvent(new CustomEvent('indahnya:voice', { detail: me }));
  player.value?.pause();
  player.value = new Audio(w.audio);
  player.value.onended = () => { playing.value = null; };
  player.value.play().then(() => { playing.value = w.id; }, () => { playing.value = null; });
}
onBeforeUnmount(() => player.value?.pause());
const when = (d: string) => fmtDateTime(d, props.locale);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
</script>

<template>
  <div class="gf">
    <div v-if="showForm" class="gf-card">
      <div class="gf-seg mb-4 grid-cols-2" role="tablist">
        <button type="button" role="tab" :aria-selected="mode === 'text'" :aria-pressed="mode === 'text'" @click="mode = 'text'"><PenLine class="mr-1.5 inline size-4" :stroke-width="1.75" aria-hidden="true" />{{ L.write }}</button>
        <button type="button" role="tab" :aria-selected="mode === 'voice'" :aria-pressed="mode === 'voice'" @click="mode = 'voice'"><Mic class="mr-1.5 inline size-4" :stroke-width="1.75" aria-hidden="true" />{{ L.voice }}</button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="gf-label" :for="`uc-name-${slug}`">{{ L.name }}</label>
          <input :id="`uc-name-${slug}`" v-model="name" class="gf-input" type="text" maxlength="60" autocomplete="name" :placeholder="L.namePh" />
        </div>
        <template v-if="mode === 'text'">
          <div>
            <label class="gf-label" :for="`uc-body-${slug}`">{{ L.msg }}</label>
            <textarea :id="`uc-body-${slug}`" v-model="body" class="gf-input" rows="4" maxlength="500" :placeholder="L.msgPh" />
            <p class="gf-hint text-right">{{ body.length }}/500</p>
          </div>
          <button type="button" class="gf-btn w-full" :disabled="busy" @click="sendText"><Send class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ busy ? '…' : L.send }}</button>
        </template>
        <template v-else>
          <div class="gf-soft text-center">
            <template v-if="voice.state.value === 'recording'">
              <p class="text-[28px] font-semibold tabular-nums" aria-live="polite">{{ mmss(voice.seconds.value) }}</p>
              <p class="gf-hint">{{ L.max }}</p>
              <button type="button" class="gf-btn mt-3" @click="voice.stop()"><Square class="size-4" :stroke-width="2" aria-hidden="true" />{{ L.stop }}</button>
            </template>
            <template v-else-if="voice.state.value === 'done' && voice.url.value">
              <audio :src="voice.url.value" controls class="w-full" />
              <div class="mt-3 flex flex-wrap justify-center gap-2">
                <button type="button" class="gf-btn gf-btn-ghost" :disabled="busy" @click="voice.start()"><RotateCcw class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ L.again }}</button>
                <button type="button" class="gf-btn" :disabled="busy" @click="sendVoice"><Send class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ busy ? '…' : L.sendVoice }}</button>
              </div>
            </template>
            <template v-else>
              <p v-if="voice.state.value === 'denied'" class="gf-err mb-3">{{ L.denied }}</p>
              <p v-else-if="voice.state.value === 'unsupported'" class="gf-err mb-3">{{ L.unsupported }}</p>
              <button type="button" class="gf-btn" :disabled="voice.state.value === 'asking'" @click="voice.start()"><Mic class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ voice.state.value === 'asking' ? L.asking : L.rec }}</button>
              <p class="gf-hint">{{ L.max }}</p>
            </template>
          </div>
        </template>
        <p v-if="error" class="gf-err" role="alert">{{ error }}</p>
        <p v-if="note" class="gf-hint" role="status">{{ note }}</p>
      </div>
    </div>

    <div :class="showForm && 'mt-5'">
      <div v-if="loading" class="space-y-3" aria-busy="true"><div v-for="i in 3" :key="i" class="skeleton h-16" /></div>
      <p v-else-if="!items.length" class="py-6 text-center text-[15px]" :style="{ color: 'var(--f-muted)' }">{{ L.empty }}</p>
      <ul v-else class="space-y-3">
        <li v-for="w in items" :key="w.id" class="gf-card">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[15px] font-semibold leading-5">{{ w.name || L.guest }}</p>
              <p class="text-[12px] leading-4" :style="{ color: 'var(--f-muted)' }">{{ when(w.createdAt) }}</p>
            </div>
            <button v-if="w.canDelete" type="button" class="grid size-8 shrink-0 place-items-center rounded-full" :style="{ color: 'var(--f-muted)' }" :aria-label="L.del" @click="remove(w)"><Trash2 class="size-4" :stroke-width="1.75" /></button>
          </div>
          <p v-if="w.kind === 'text'" class="mt-2 whitespace-pre-line break-words text-[15px] leading-6">{{ w.body }}</p>
          <button v-else type="button" class="mt-3 inline-flex h-11 items-center gap-2.5 rounded-full border px-4 text-[14px] font-medium" :style="{ borderColor: 'var(--f-line)' }" :aria-pressed="playing === w.id" @click="play(w)">
            <component :is="playing === w.id ? Pause : Play" class="size-4" :stroke-width="2" aria-hidden="true" />{{ L.voice }}<span v-if="w.durationSec" class="tabular-nums" :style="{ color: 'var(--f-muted)' }">{{ mmss(w.durationSec) }}</span>
          </button>
        </li>
      </ul>
      <button v-if="allowMore && next" type="button" class="gf-btn gf-btn-ghost mt-4 w-full" @click="load(false)">{{ L.more }}</button>
    </div>
  </div>
</template>
