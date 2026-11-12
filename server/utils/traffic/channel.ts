/**
 * Where a visit or a sign-up came from, as one channel name, plus the first-visit cookie the marketing pages set
 * (app/plugins/traffic-beacon.client.ts → `indahnya_ft`, first-party, 180 days). UTM source wins when present;
 * otherwise the referrer host decides; no referrer = Direct.
 */
export type Channel = 'Google' | 'Bing' | 'AI assistant' | 'Other search' | 'Social' | 'Referral' | 'Campaign' | 'Direct' | 'Internal';

const AI = /(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|bard\.google\.com|you\.com|phind\.com|poe\.com|deepseek\.com|chat\.mistral\.ai|meta\.ai|grok\.com|kagi\.com)$/i;
const GOOGLE = /(^|\.)google\.[a-z.]+$/i;
const BING = /(^|\.)(bing\.com|cn\.bing\.com)$/i;
const SEARCH = /(^|\.)(duckduckgo\.com|search\.yahoo\.com|yandex\.[a-z]+|baidu\.com|ecosia\.org|search\.brave\.com|startpage\.com|qwant\.com|naver\.com|seznam\.cz)$/i;
const SOCIAL = /(^|\.)(facebook\.com|fb\.com|l\.facebook\.com|lm\.facebook\.com|instagram\.com|l\.instagram\.com|threads\.net|threads\.com|x\.com|twitter\.com|t\.co|linkedin\.com|lnkd\.in|reddit\.com|old\.reddit\.com|youtube\.com|tiktok\.com|pinterest\.[a-z]+|bsky\.app|mastodon\.social|discord\.com|slack\.com|t\.me|telegram\.org|wa\.me|whatsapp\.com|news\.ycombinator\.com|producthunt\.com)$/i;
const OWN = /(^|\.)indahnya\.my$/i;

export function channelOf(refHost?: string | null, utmSource?: string | null): Channel {
  const u = (utmSource ?? '').trim().toLowerCase();
  if (u) {
    if (/google/.test(u)) return u.includes('ads') || u.includes('cpc') ? 'Campaign' : 'Google';
    if (/bing/.test(u)) return 'Bing';
    if (/chatgpt|openai|perplexity|claude|copilot|gemini/.test(u)) return 'AI assistant';
    if (/facebook|fb|instagram|ig|threads|twitter|x\.com|linkedin|reddit|tiktok|youtube|bluesky|mastodon|whatsapp|telegram/.test(u)) return 'Social';
    return 'Campaign';
  }
  const h = (refHost ?? '').trim().toLowerCase().replace(/^www\./, '');
  if (!h) return 'Direct';
  if (OWN.test(h)) return 'Internal';
  if (GOOGLE.test(h)) return 'Google';
  if (BING.test(h)) return 'Bing';
  if (AI.test(h)) return 'AI assistant';
  if (SEARCH.test(h)) return 'Other search';
  if (SOCIAL.test(h)) return 'Social';
  return 'Referral';
}

export const FT_COOKIE = 'indahnya_ft';

export interface FirstTouch { refHost: string | null; utmSource: string | null; landing: string | null; firstSeenAt: Date | null }

const clip = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
const HOST = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i;

/**
 * The first-visit cookie's value, if the person came through a marketing page. It is a browser-held string, so
 * every field is clipped and checked; it is used for reporting only, never to decide what anyone may do.
 */
export function firstTouch(raw: string | undefined | null): FirstTouch | null {
  if (!raw) return null;
  try {
    // the cookie is URL-encoded; the server may already have decoded it once
    let j: Record<string, unknown>;
    try { j = JSON.parse(raw); } catch { j = JSON.parse(decodeURIComponent(raw)); }
    const t = Number(j.t);
    const ref = clip(j.r, 120)?.toLowerCase() ?? null;
    const landing = clip(j.p, 200);
    return {
      refHost: ref && HOST.test(ref) ? ref : null,
      utmSource: clip(j.s, 80),
      landing: landing && landing.startsWith('/') ? landing : null,
      firstSeenAt: Number.isFinite(t) && t > 1.7e12 && t < Date.now() + 864e5 ? new Date(t) : null,
    };
  } catch { return null; }
}

/** The users columns for a new sign-up. Empty when the cookie is absent: the channel stays null = unknown. */
export function signupFields(raw: string | undefined | null) {
  const ft = firstTouch(raw);
  if (!ft) return null;
  return {
    signupChannel: channelOf(ft.refHost, ft.utmSource), signupRefHost: ft.refHost, signupUtmSource: ft.utmSource,
    signupLanding: ft.landing, firstSeenAt: ft.firstSeenAt,
  };
}
