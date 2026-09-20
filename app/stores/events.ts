import { defineStore } from 'pinia';

export interface EventRow {
  id: string; slug: string; type: string; title: string; names: { a: string; b?: string; short?: string };
  date: string | null; venue: { name?: string; address?: string; waze?: string; gmaps?: string };
  plan: 'free' | 'std' | 'full'; planPaidAt: string | null;
  uploadWindowEndsAt: string; storageEndsAt: string; purgedAt: string | null; createdAt: string;
  settings: {
    locale: 'ms' | 'en'; approvalMode: boolean;
    modules: { gambar: boolean; ucapan: boolean; rsvp: boolean; tempat: boolean; kad: boolean };
    slideshow: { intervalSec: number; showNames: boolean; shuffle: boolean };
    guestDeleteHours: number;
  };
  mediaCount: number; isOwner: boolean;
}

export interface EventDetail extends Omit<EventRow, 'mediaCount'> {
  tvToken: string;
  members: { userId: string; role: 'owner' | 'cohost'; email: string; name: string | null }[];
  counts: { ready: number; hidden: number; pending: number; uploaded: number; failed: number; deleted: number };
  uploads: { used: number; cap: number | null; open: boolean };
  rsvp: { n: number; pax: number };
  ucapan: number;
  planInfo: { name: string; priceCents: number; uploadCap: number | null; uploadWindowDays: number; storageDays: number; cohosts: number; customSlug: boolean; badgeFree: boolean };
}

/**
 * The host's events. The list feeds the sidebar picker; `current` is the
 * one whose screens are open. Detail is fetched per event and kept so the
 * sidebar counts do not flash between screens.
 */
export const useEvents = defineStore('events', {
  state: () => ({ items: [] as EventRow[], loaded: false, current: null as EventDetail | null, loadingCurrent: false }),
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return;
      this.items = await $fetch<EventRow[]>('/api/events');
      this.loaded = true;
    },
    async open(id: string) {
      if (this.current?.id === id) return this.current;
      this.loadingCurrent = true;
      try { this.current = await $fetch<EventDetail>(`/api/events/${id}`); }
      finally { this.loadingCurrent = false; }
      return this.current;
    },
    async refresh() {
      if (!this.current) return;
      this.current = await $fetch<EventDetail>(`/api/events/${this.current.id}`);
    },
  },
});
