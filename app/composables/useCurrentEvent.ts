import { useEvents } from '~/stores/events';

/**
 * Every /app/[id]/* page calls this: it opens the event in the store (once
 * per id), exposes it, and gives the page a `loading` flag for its skeleton.
 */
export function useCurrentEvent() {
  const route = useRoute();
  const events = useEvents();
  const id = computed(() => route.params.id as string);
  const loading = ref(!events.current || events.current.id !== id.value);
  const error = ref('');
  async function load(force = false) {
    if (force) events.current = null;
    try { await events.open(id.value); }
    catch (e) { error.value = apiError(e, 'Majlis tak jumpa'); }
    finally { loading.value = false; }
  }
  onMounted(() => { void load(); });
  const ev = computed(() => (events.current?.id === id.value ? events.current : null));
  return { id, ev, loading, error, reload: () => load(true), refresh: () => events.refresh() };
}
