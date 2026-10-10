/**
 * The preview's only server code (Cloudflare Pages Function). Two jobs:
 *
 * 1. Queries. Pages are BM at their path; `?lang=en` is a query, which a
 *    static host cannot tell apart, so it is answered from the __en/ copy,
 *    and the few URLs the app opens with a query of its own (the landing's
 *    kad phone) from their own copy under __v/.
 * 2. The API. The sample event's answers were captured at build
 *    (_data.json, see snapshot.mjs) and are replayed here: seat search
 *    filters the captured list the way the real endpoint does, and every
 *    write gets the same refusal the real sample event gives.
 */
import data from './_data.json';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
});
const fail = (statusCode, statusMessage) => json({ statusCode, statusMessage, message: statusMessage, error: true }, statusCode);

/** Newest first, `limit` at a time from after `cursor`, as the real list endpoints page. */
function page(items, q, max, dflt) {
  const limit = Math.min(Math.max(Number(q.get('limit')) || dflt, 1), max);
  const cursor = q.get('cursor');
  const from = cursor ? items.findIndex(i => i.id === cursor) + 1 : 0;
  const slice = items.slice(from, from + limit);
  return { items: slice, next: from + limit < items.length ? slice[slice.length - 1].id : null };
}

function api(request, url) {
  const parts = url.pathname.split('/').filter(Boolean).slice(1); // after "api"
  const q = url.searchParams;
  const get = request.method === 'GET' || request.method === 'HEAD';
  if (parts[0] === 'me') return json({ user: null, googleEnabled: false });
  if (parts[0] === 'cuba' || parts[0] === 'auth' || parts[0] === 'events' || parts[0] === 'tv' || parts[0] === 'stripe' || parts[0] === 'chip') {
    return fail(503, 'Ni versi pratonton. Indahnya belum buka untuk umum.');
  }
  if (parts[0] !== 'g') return fail(404, 'Not found');
  if (parts[1] !== data.slug) return fail(404, 'Majlis tak jumpa');
  const [, , what, id, sub] = parts;

  if (!what) return get ? json(data.event) : fail(405, 'Method not allowed');
  if (what === 'kad' && get) return json(data.kad);
  if (what === 'kad.ics' && get) {
    return new Response(data.ics, { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="${data.slug}.ics"` } });
  }
  if (what === 'rsvp') return get ? json(data.rsvp) : fail(403, 'Ini kad contoh');
  if (what === 'tempat' && get) {
    // the real rule: three letters or more, from the start of a word, five at most
    const t = (q.get('q') || '').trim().toLowerCase();
    if (t.length < 3) return json({ items: [] });
    return json({ items: data.seats.filter(s => s.name.toLowerCase().split(/\s+/).some(w => w.startsWith(t)) || s.name.toLowerCase().startsWith(t)).slice(0, 5) });
  }
  if (what === 'name' && request.method === 'POST') {
    return request.json().then(b => json({ id: 'pratonton', name: String(b?.name ?? '').trim().slice(0, 60) || null }), () => fail(400, 'Bad request'));
  }
  if (what === 'media') {
    if (!id) return get ? json(q.get('mine') === '1' ? { items: [], next: null } : page(data.media, q, 100, 40)) : fail(405, 'Method not allowed');
    const m = data.media.find(i => i.id === id);
    if (!m) return fail(404, 'Not found');
    if (sub === 'download' && get) return Response.redirect(m.url, 302);
    if (sub === 'react' && request.method === 'POST') {
      // nothing is stored: the tally the browser sees is the captured one plus this visitor's own
      return request.json().then(b => {
        const kind = ['love', 'party', 'cry'].includes(b?.kind) ? b.kind : null;
        const reactions = { ...(m.reactions || {}) };
        if (kind) reactions[kind] = (reactions[kind] || 0) + 1;
        return json({ mine: kind, reactions });
      }, () => fail(400, 'Bad request'));
    }
    return fail(403, 'Ini galeri contoh');
  }
  if (what === 'ucapan') return get && !id ? json(page(data.ucapan, q, 60, 30)) : fail(403, 'Ucapan ditutup');
  if (what === 'uploads') return fail(403, 'Ini galeri contoh');
  return fail(404, 'Not found');
}

async function asset(env, request, path) {
  const u = new URL(path, request.url);
  let r = await env.ASSETS.fetch(new Request(u, request));
  if (r.status >= 300 && r.status < 400 && r.headers.get('location')) r = await env.ASSETS.fetch(new Request(new URL(r.headers.get('location'), u), request));
  return r.ok ? new Response(r.body, r) : null;
}

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return api(request, url);
  if ((request.method === 'GET' || request.method === 'HEAD') && url.search && !/\.[a-z0-9]+$/i.test(url.pathname)) {
    // the query stays in the address bar for the app to read; only the HTML is chosen here
    const v = data.variants?.[url.pathname + url.search];
    if (v) return (await asset(env, request, v)) ?? next();
    if (url.searchParams.get('lang') === 'en') return (await asset(env, request, url.pathname === '/' ? '/__en/' : `/__en${url.pathname.replace(/\/$/, '')}`)) ?? next();
  }
  return next();
}
