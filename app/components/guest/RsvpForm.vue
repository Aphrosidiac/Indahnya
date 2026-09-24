<script setup lang="ts">
import { Check, Minus, Plus, PencilLine } from 'lucide-vue-next';
import { kadDate } from '~~/shared/utils/kad-templates';

/**
 * The RSVP, as a guest fills it in on a phone: hadir or not, how many,
 * which side, a meal if the host offers a choice, and (optionally) a wish in
 * the same breath. One reply per browser; sending again changes it. Lives
 * in the e-kad's sheet and on the plain /rsvp page alike.
 */
const props = withDefaults(defineProps<{ slug: string; locale: 'ms' | 'en'; withUcapan?: boolean }>(), { withUcapan: true });
const emit = defineEmits<{ done: [attending: boolean] }>();

interface Config { open: boolean; demo?: boolean; deadline: string | null; maxPax: number; meals: string[]; sides: boolean; guestName: string | null; mine: null | { name: string; phone: string | null; attending: boolean; pax: number; side: string | null; meal: string | null; note: string | null } }
const cfg = ref<Config | null>(null);
const loadError = ref('');
const f = reactive({ name: '', phone: '', attending: null as boolean | null, pax: 1, side: null as string | null, meal: null as string | null, note: '', ucapan: '' });
const editing = ref(true);
const busy = ref(false);
const error = ref('');
const sent = ref<boolean | null>(null);

const en = computed(() => props.locale === 'en');
const L = computed(() => en.value
  ? { title: 'Will you be there?', deadline: 'Please reply by', closed: 'RSVP closed', closedSub: 'Replies are no longer being taken. Contact the host if your plans change.', demo: 'This is a sample card', demoSub: 'On your own card, guests reply right here — and you see every answer in your dashboard.', name: 'Your name', namePh: 'e.g. Aina & family', phone: 'Phone (optional)', phoneHint: 'So you can change your reply from another phone.', yes: 'Attending', no: 'Can\'t make it', pax: 'How many people, including you?', side: 'You are from', lelaki: 'Groom\'s side', perempuan: 'Bride\'s side', rakan: 'Friends', meal: 'Meal', note: 'Note for the host (optional)', ucapan: 'A wish for the couple (optional)', send: 'Send RSVP', update: 'Update RSVP', thanksYes: 'Thank you! We look forward to seeing you.', thanksNo: 'Thank you for letting us know. We will miss you.', change: 'Change my reply', yours: 'Your reply', people: 'people', pick: 'Choose attending or not first', fail: 'Could not send, please try again' }
  : { title: 'Boleh hadir?', deadline: 'Sila RSVP sebelum', closed: 'RSVP dah ditutup', closedSub: 'Jawapan tak diterima lagi. Hubungi tuan majlis kalau ada perubahan.', demo: 'Ini kad contoh', demoSub: 'Dalam kad korang sendiri, tetamu RSVP terus kat sini — dan korang nampak semua jawapan dalam dashboard.', name: 'Nama', namePh: 'cth. Aina sekeluarga', phone: 'No. telefon (pilihan)', phoneHint: 'Supaya boleh ubah jawapan dari phone lain.', yes: 'Hadir', no: 'Tak dapat hadir', pax: 'Berapa orang, termasuk korang?', side: 'Pihak', lelaki: 'Pihak lelaki', perempuan: 'Pihak perempuan', rakan: 'Kawan-kawan', meal: 'Makanan', note: 'Nota untuk tuan majlis (pilihan)', ucapan: 'Ucapan untuk pengantin (pilihan)', send: 'Hantar RSVP', update: 'Kemas kini RSVP', thanksYes: 'Terima kasih! Kami tunggu kedatangan korang.', thanksNo: 'Terima kasih sebab maklumkan. Doakan kami ya.', change: 'Ubah jawapan', yours: 'Jawapan korang', people: 'orang', pick: 'Pilih hadir atau tak dulu', fail: 'Tak dapat hantar, cuba lagi' });

async function load() {
  try {
    cfg.value = await $fetch<Config>(`/api/g/${props.slug}/rsvp`);
    const m = cfg.value.mine;
    if (m) {
      Object.assign(f, { name: m.name, phone: m.phone ?? '', attending: m.attending, pax: Math.max(1, m.pax), side: m.side, meal: m.meal, note: m.note ?? '' });
      editing.value = false; sent.value = m.attending;
    } else if (cfg.value.guestName) f.name = cfg.value.guestName;
  } catch (e) { loadError.value = apiError(e, L.value.fail); }
}
onMounted(load);

async function submit() {
  error.value = '';
  if (!f.name.trim()) { error.value = L.value.name; return; }
  if (f.attending === null) { error.value = L.value.pick; return; }
  busy.value = true;
  try {
    await $fetch(`/api/g/${props.slug}/rsvp`, { method: 'POST', body: {
      name: f.name.trim(), phone: f.phone.trim() || undefined, attending: f.attending, pax: f.pax,
      side: f.attending && cfg.value?.sides ? f.side : null, meal: f.attending ? f.meal : null,
      note: f.note.trim() || undefined, ucapan: props.withUcapan ? f.ucapan.trim() || undefined : undefined,
    } });
    sent.value = f.attending; editing.value = false; f.ucapan = '';
    emit('done', f.attending);
  } catch (e) { error.value = apiError(e, L.value.fail); }
  finally { busy.value = false; }
}
const deadlineText = computed(() => (cfg.value?.deadline ? kadDate(`${cfg.value.deadline}T00:00:00.000Z`, props.locale, { day: 'numeric', month: 'long', year: 'numeric' }) : ''));
</script>

<template>
  <div class="gf">
    <p v-if="loadError" class="gf-err">{{ loadError }}</p>
    <div v-else-if="!cfg" class="space-y-3" aria-busy="true"><div class="skeleton h-11" /><div class="skeleton h-12" /><div class="skeleton h-11" /></div>

    <!-- sent: the reply, with a way to change it -->
    <div v-else-if="!editing" class="gf-soft text-center" role="status">
      <span class="mx-auto grid size-11 place-items-center rounded-full" :style="{ background: 'var(--f-accent)', color: 'var(--f-on-accent)' }"><Check class="size-5" :stroke-width="2" aria-hidden="true" /></span>
      <p class="mt-3 text-[17px] font-semibold leading-6">{{ sent ? L.thanksYes : L.thanksNo }}</p>
      <p class="mt-1 text-[14px] leading-5" :style="{ color: 'var(--f-muted)' }">{{ L.yours }}: {{ f.name }} · {{ sent ? `${L.yes}, ${f.pax} ${L.people}` : L.no }}</p>
      <button v-if="cfg.open" type="button" class="gf-btn gf-btn-ghost mt-4" @click="editing = true"><PencilLine class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ L.change }}</button>
    </div>

    <div v-else-if="!cfg.open" class="gf-soft text-center" role="status">
      <p class="text-[17px] font-semibold">{{ cfg.demo ? L.demo : L.closed }}</p>
      <p class="mt-1 text-[14px] leading-5" :style="{ color: 'var(--f-muted)' }">{{ cfg.demo ? L.demoSub : L.closedSub }}</p>
    </div>

    <form v-else class="space-y-5" novalidate @submit.prevent="submit">
      <p v-if="deadlineText" class="text-[14px]" :style="{ color: 'var(--f-muted)' }">{{ L.deadline }} <strong :style="{ color: 'var(--f-ink)' }">{{ deadlineText }}</strong></p>
      <div>
        <label class="gf-label" :for="`rsvp-name-${slug}`">{{ L.name }}</label>
        <input :id="`rsvp-name-${slug}`" v-model="f.name" class="gf-input" type="text" maxlength="80" autocomplete="name" :placeholder="L.namePh" />
      </div>
      <div class="gf-seg grid-cols-2" role="group" :aria-label="L.title">
        <button type="button" :aria-pressed="f.attending === true" @click="f.attending = true">{{ L.yes }}</button>
        <button type="button" :aria-pressed="f.attending === false" @click="f.attending = false">{{ L.no }}</button>
      </div>
      <template v-if="f.attending">
        <div>
          <p class="gf-label">{{ L.pax }}</p>
          <div class="gf-stepper">
            <button type="button" :disabled="f.pax <= 1" aria-label="−" @click="f.pax--"><Minus class="size-4" :stroke-width="2" /></button>
            <output aria-live="polite">{{ f.pax }}</output>
            <button type="button" :disabled="f.pax >= cfg.maxPax" aria-label="+" @click="f.pax++"><Plus class="size-4" :stroke-width="2" /></button>
          </div>
        </div>
        <div v-if="cfg.sides">
          <p class="gf-label">{{ L.side }}</p>
          <div class="gf-seg grid-cols-3" role="group" :aria-label="L.side">
            <button v-for="s in (['lelaki', 'perempuan', 'rakan'] as const)" :key="s" type="button" class="!text-[13px]" :aria-pressed="f.side === s" @click="f.side = f.side === s ? null : s">{{ L[s] }}</button>
          </div>
        </div>
        <div v-if="cfg.meals.length">
          <p class="gf-label">{{ L.meal }}</p>
          <div class="gf-seg" :style="{ gridTemplateColumns: `repeat(${Math.min(cfg.meals.length, 3)}, minmax(0, 1fr))` }" role="group" :aria-label="L.meal">
            <button v-for="m in cfg.meals" :key="m" type="button" class="!text-[13px]" :aria-pressed="f.meal === m" @click="f.meal = f.meal === m ? null : m">{{ m }}</button>
          </div>
        </div>
      </template>
      <div>
        <label class="gf-label" :for="`rsvp-phone-${slug}`">{{ L.phone }}</label>
        <input :id="`rsvp-phone-${slug}`" v-model="f.phone" class="gf-input" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="012-345 6789" />
        <p class="gf-hint">{{ L.phoneHint }}</p>
      </div>
      <div>
        <label class="gf-label" :for="`rsvp-note-${slug}`">{{ L.note }}</label>
        <input :id="`rsvp-note-${slug}`" v-model="f.note" class="gf-input" type="text" maxlength="300" />
      </div>
      <div v-if="withUcapan">
        <label class="gf-label" :for="`rsvp-ucapan-${slug}`">{{ L.ucapan }}</label>
        <textarea :id="`rsvp-ucapan-${slug}`" v-model="f.ucapan" class="gf-input" rows="3" maxlength="500" />
      </div>
      <p v-if="error" class="gf-err" role="alert">{{ error }}</p>
      <button type="submit" class="gf-btn w-full" :disabled="busy">{{ busy ? '…' : cfg.mine ? L.update : L.send }}</button>
    </form>
  </div>
</template>
