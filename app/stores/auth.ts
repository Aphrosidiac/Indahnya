import { defineStore } from 'pinia';

export interface Me { id: string; email: string; name: string | null }

export const useAuth = defineStore('auth', {
  state: () => ({ user: null as Me | null, googleEnabled: false, restored: false }),
  getters: {
    initials: s => (s.user?.name || s.user?.email || '?').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join(''),
  },
  actions: {
    async restore() {
      if (this.restored) return;
      try {
        const r = await $fetch<{ user: Me | null; googleEnabled: boolean }>('/api/me');
        this.user = r.user; this.googleEnabled = r.googleEnabled;
      } catch { this.user = null; }
      this.restored = true;
    },
    async logout() { await $fetch('/api/auth/logout', { method: 'POST' }); this.user = null; },
  },
});
