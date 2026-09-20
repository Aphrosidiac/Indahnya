import { defineStore } from 'pinia';

export interface Toast { id: number; kind: 'ok' | 'error' | 'info'; title: string; detail?: string }

let seq = 0;

export const useUi = defineStore('ui', {
  state: () => ({
    toasts: [] as Toast[],
    navOpen: false,
    /** The rail folded to icons. Remembered per browser; a preference, not state. */
    navCollapsed: (() => { try { return typeof window !== 'undefined' && localStorage.getItem('indahnya.nav.collapsed') === '1'; } catch { return false; } })(),
  }),
  actions: {
    push(kind: Toast['kind'], title: string, detail?: string) {
      const t = { id: ++seq, kind, title, detail };
      this.toasts.push(t);
      setTimeout(() => this.dismiss(t.id), kind === 'error' ? 9000 : 4500);
    },
    ok: function (title: string, detail?: string) { this.push('ok', title, detail); },
    error: function (title: string, detail?: string) { this.push('error', title, detail); },
    info: function (title: string, detail?: string) { this.push('info', title, detail); },
    dismiss(id: number) { this.toasts = this.toasts.filter(t => t.id !== id); },
    toggleNav() { this.navCollapsed = !this.navCollapsed; try { localStorage.setItem('indahnya.nav.collapsed', this.navCollapsed ? '1' : '0'); } catch { /* private window */ } },
  },
});
