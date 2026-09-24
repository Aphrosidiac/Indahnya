/**
 * Where to go after signing in. Only a path on this site: `//evil.com` and
 * `/\evil.com` are protocol-relative to a browser, and a scheme is a scheme.
 * Anything else falls back to the dashboard.
 */
export function safeNext(v: unknown, fallback = '/app'): string {
  if (typeof v !== 'string' || v.length > 512) return fallback;
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f\\]/.test(v)) return fallback;
  return v;
}
