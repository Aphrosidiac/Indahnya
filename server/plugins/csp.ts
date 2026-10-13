/**
 * A Content-Security-Policy on every page, built at RUNTIME from the config
 * (the media domain and the bucket endpoint differ per environment, and
 * nothing is baked at build time). Scripts and styles come only from this
 * origin — Nuxt's own inline payload needs 'unsafe-inline' for scripts, but
 * no other host can serve one; images, video and audio from here and the
 * media domain; the browser talks to this origin and to the bucket (the
 * presigned uploads), nothing else. Only /embed may be framed by other sites.
 * One exception, on purpose: Cloudflare Web Analytics, which the proxy
 * injects into every page (cookieless, so /privasi's "no analytics cookies"
 * still holds); its beacon reports to /cdn-cgi/rum or cloudflareinsights.com.
 * Dev skips it (Vite's HMR needs eval and websockets).
 */
const CF_ANALYTICS = { script: 'https://static.cloudflareinsights.com', connect: 'https://cloudflareinsights.com' };

export default defineNitroPlugin((nitro) => {
  if (import.meta.dev) return;
  const origin = (u: string) => { try { return new URL(u).origin; } catch { return ''; } };
  let policy: { framed: string; normal: string } | null = null;
  const build = () => {
    const { s3, public: pub } = useRuntimeConfig();
    const media = origin(s3.publicBase);
    const bucket = origin(s3.endpoint);
    const hosts = [...new Set([media, bucket].filter(Boolean))].join(' ');
    const base = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${CF_ANALYTICS.script}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${hosts}`,
      `media-src 'self' blob: ${hosts}`,
      "font-src 'self' data:",
      `connect-src 'self' ${hosts} ${CF_ANALYTICS.connect}`,
      "frame-src 'self'",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(pub.siteUrl.startsWith('https://') ? ['upgrade-insecure-requests'] : []),
    ];
    return { normal: [...base, "frame-ancestors 'self'"].join('; '), framed: [...base, 'frame-ancestors *'].join('; ') };
  };
  nitro.hooks.hook('render:response', (response, { event }) => {
    policy ??= build();
    const path = event.path ?? '';
    response.headers ??= {};
    response.headers['content-security-policy'] = path.startsWith('/embed/') ? policy.framed : policy.normal;
  });
});
