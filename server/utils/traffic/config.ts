/**
 * What the analytics code needs from the runtime config. The Nitro side builds
 * it from useRuntimeConfig(), the CLI on the box (scripts/metrics-cli.ts) from
 * the NUXT_* variables of /etc/indahnya/env, so nothing in this folder calls a
 * Nuxt auto-import and all of it runs under plain tsx too.
 */
export interface TrafficConfig {
  siteUrl: string;
  /** nginx's JSON log (deploy/nginx.conf, format `indahnya_json`). */
  logPath: string;
  /** Lower-cased staff emails (NUXT_STAFF_EMAILS, comma-separated). */
  staffEmails: string[];
  gscServiceAccountJson: string;
  gscProperty: string;
  bingApiKey: string;
  bingSiteUrl: string;
}

export const DEFAULT_LOG_PATH = '/var/log/indahnya/traffic.log';

export const parseEmails = (v: string | undefined | null) =>
  [...new Set(String(v ?? '').split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@')))];

interface RuntimeShape {
  staffEmails?: string; trafficLogPath?: string;
  gscServiceAccountJson?: string; gscProperty?: string; bingApiKey?: string; bingSiteUrl?: string;
  public: { siteUrl: string };
}

export function trafficConfig(rc: RuntimeShape): TrafficConfig {
  return {
    siteUrl: rc.public.siteUrl,
    logPath: rc.trafficLogPath || DEFAULT_LOG_PATH,
    staffEmails: parseEmails(rc.staffEmails),
    gscServiceAccountJson: rc.gscServiceAccountJson ?? '',
    gscProperty: rc.gscProperty || 'sc-domain:indahnya.my',
    bingApiKey: rc.bingApiKey ?? '',
    bingSiteUrl: rc.bingSiteUrl || 'https://indahnya.my/',
  };
}

/** The same keys, read from the environment (the CLI, tests). */
export function trafficConfigFromEnv(env: Record<string, string | undefined> = process.env): TrafficConfig {
  return trafficConfig({
    staffEmails: env.NUXT_STAFF_EMAILS, trafficLogPath: env.NUXT_TRAFFIC_LOG_PATH,
    gscServiceAccountJson: env.NUXT_GSC_SERVICE_ACCOUNT_JSON, gscProperty: env.NUXT_GSC_PROPERTY,
    bingApiKey: env.NUXT_BING_API_KEY, bingSiteUrl: env.NUXT_BING_SITE_URL,
    public: { siteUrl: env.NUXT_PUBLIC_SITE_URL || 'https://indahnya.my' },
  });
}

export const isStaffEmail = (cfg: Pick<TrafficConfig, 'staffEmails'>, email: string | null | undefined) =>
  !!email && cfg.staffEmails.includes(email.trim().toLowerCase());
