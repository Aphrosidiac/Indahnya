/**
 * First-party analytics beacon (docs/ANALYTICS.md). On the public marketing pages only, never on a couple's
 * pages (/<slug>), the dashboard, the TV or the embed:
 *
 * - First visit: remembers where this browser first came from in `indahnya_ft` (path, referrer host, utm source,
 *   time; 180 days, first-party). It is read once, at sign-up, and copied onto the new account.
 * - After the first interaction, or 3 s with the tab visible: POST /_e?p=<path>&r=<referrer host>&wd=<webdriver>…
 *   nginx logs the request line and answers 204. The ingest job matches it to the page view, and that match is
 *   what makes a visit "human". Nothing else is sent; no ids, no fingerprint, no third party.
 *
 * It runs once per full page load, after mount and off the critical path, so it does not touch Lighthouse.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // routes whose first name segment is a majlis, the app, the TV, the widget or sign-in
  const PRIVATE = /^(slug|app|tv|embed|masuk)(-|$)/;
  nuxtApp.hook('app:mounted', () => {
    try {
      const w = window, d = document, l = location, n = navigator;
      // the static preview on Pages has no server to log it
      if (l.hostname.endsWith('.pages.dev')) return;
      const route = useRouter().currentRoute.value;
      if (!route.matched.length || PRIVATE.test(String(route.name ?? ''))) return;

      let ref = '';
      try {
        if (d.referrer) { const h = new URL(d.referrer).hostname; if (h.replace(/^www\./, '') !== l.hostname.replace(/^www\./, '')) ref = h; }
      } catch { /* no usable referrer */ }
      const us = new URLSearchParams(l.search).get('utm_source') || '';

      if (!/(?:^|; )indahnya_ft=/.test(d.cookie)) {
        const ft = encodeURIComponent(JSON.stringify({ r: ref, s: us.slice(0, 80), p: l.pathname, t: Date.now() }));
        d.cookie = `indahnya_ft=${ft}; path=/; max-age=15552000; samesite=lax${l.protocol === 'https:' ? '; secure' : ''}`;
      }

      let sent = false;
      const send = (e: string) => {
        if (sent) return;
        sent = true;
        const q = `/_e?p=${encodeURIComponent(l.pathname)}&r=${encodeURIComponent(ref)}&us=${encodeURIComponent(us.slice(0, 80))}&w=${w.innerWidth || 0}&wd=${n.webdriver ? 1 : 0}&e=${e}`;
        if (n.sendBeacon) n.sendBeacon(q); else void fetch(q, { method: 'POST', keepalive: true }).catch(() => {});
      };
      for (const t of ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove']) w.addEventListener(t, () => send('i'), { once: true, passive: true });
      setTimeout(() => { if (d.visibilityState === 'visible') send('t'); }, 3000);
    } catch { /* analytics never breaks a page */ }
  });
});
