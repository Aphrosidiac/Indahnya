/**
 * Who sent a request, from its User-Agent and path. Pure: no network. Verification of a claimed crawler
 * (published IP list or forward-confirmed reverse DNS) is in ipranges.ts; this file only says what each
 * crawler claims to be and how its claim can be checked.
 *
 * Verification methods, from each vendor's own verification guide. Every JSON list below was fetched and read on
 * 12 November 2026; a list that stops loading leaves its crawler "unverifiable" (never "verified"):
 * - Google: developers.google.com/search/docs/crawling-indexing/verifying-googlebot (JSON lists + googlebot.com/google.com rDNS)
 * - Bing: bing.com/webmasters/help/how-to-verify-bingbot (bingbot.json + search.msn.com rDNS)
 * - OpenAI: platform.openai.com/docs/bots (gptbot.json, searchbot.json, chatgpt-user.json)
 * - Perplexity: docs.perplexity.ai/guides/bots (perplexitybot.json, perplexity-user.json)
 * - DuckDuckGo: duckduckgo.com/duckduckgo-help-pages/results/duckduckbot (duckduckbot.json)
 * - Apple: support.apple.com/119829 (rDNS *.applebot.apple.com)
 * - Yandex: yandex.com/support/webmaster/robot-workings/check-yandex-robots.html (rDNS yandex.ru/.net/.com)
 * - Amazon: developer.amazon.com/amazonbot (rDNS *.crawl.amazonbot.amazon)
 * Crawlers without a published list or rDNS rule (ClaudeBot, Meta, Common Crawl, …) are "unverifiable":
 * counted under their claimed name, never as verified.
 */

export type BotCategory = 'search-bot' | 'ai-bot' | 'other-bot';
/** ai-bot purpose: training crawl, AI search index, or a fetch a person asked an assistant to make. */
export type AiPurpose = 'training' | 'search' | 'user';

export interface Verify { lists?: string[]; rdns?: string[] }
export interface KnownBot { name: string; re: RegExp; category: BotCategory; owner: string; purpose?: AiPurpose; verify?: Verify }

const G = 'https://developers.google.com/static/search/apis/ipranges/';
const GOOGLE_RDNS = ['.googlebot.com', '.google.com', '.googleusercontent.com'];

/** Order matters: the first match wins, so specific names come before their families. */
export const KNOWN_BOTS: KnownBot[] = [
  // search engines
  { name: 'Google-InspectionTool', re: /Google-InspectionTool/i, category: 'search-bot', owner: 'Google', verify: { lists: [`${G}googlebot.json`, `${G}special-crawlers.json`], rdns: GOOGLE_RDNS } },
  { name: 'Googlebot-Image', re: /Googlebot-Image/i, category: 'search-bot', owner: 'Google', verify: { lists: [`${G}googlebot.json`], rdns: GOOGLE_RDNS } },
  { name: 'Googlebot', re: /Googlebot/i, category: 'search-bot', owner: 'Google', verify: { lists: [`${G}googlebot.json`], rdns: GOOGLE_RDNS } },
  { name: 'Storebot-Google', re: /Storebot-Google/i, category: 'search-bot', owner: 'Google', verify: { lists: [`${G}googlebot.json`, `${G}special-crawlers.json`], rdns: GOOGLE_RDNS } },
  { name: 'GoogleOther', re: /GoogleOther/i, category: 'search-bot', owner: 'Google', verify: { lists: [`${G}googlebot.json`, `${G}special-crawlers.json`], rdns: GOOGLE_RDNS } },
  { name: 'AdsBot-Google', re: /AdsBot-Google|Mediapartners-Google|APIs-Google/i, category: 'search-bot', owner: 'Google', verify: { lists: [`${G}special-crawlers.json`], rdns: GOOGLE_RDNS } },
  { name: 'Google-Site-Verification', re: /Google-Site-Verification|Google-Read-Aloud|FeedFetcher-Google|Google-Safety/i, category: 'search-bot', owner: 'Google', verify: { lists: [`${G}user-triggered-fetchers.json`, `${G}user-triggered-fetchers-google.json`, `${G}special-crawlers.json`], rdns: GOOGLE_RDNS } },
  { name: 'Bingbot', re: /bingbot|BingPreview|msnbot|adidxbot/i, category: 'search-bot', owner: 'Microsoft', verify: { lists: ['https://www.bing.com/toolbox/bingbot.json'], rdns: ['.search.msn.com'] } },
  { name: 'DuckDuckBot', re: /DuckDuckBot|DuckAssistBot/i, category: 'search-bot', owner: 'DuckDuckGo', verify: { lists: ['https://duckduckgo.com/duckduckbot.json'] } },
  { name: 'Applebot', re: /Applebot/i, category: 'search-bot', owner: 'Apple', verify: { rdns: ['.applebot.apple.com'] } },
  { name: 'YandexBot', re: /Yandex(Bot|Images|Mobile|Metrika|Accessibility|RenderResources|Favicons)?\//i, category: 'search-bot', owner: 'Yandex', verify: { rdns: ['.yandex.ru', '.yandex.net', '.yandex.com'] } },
  { name: 'Baiduspider', re: /Baiduspider/i, category: 'search-bot', owner: 'Baidu', verify: { rdns: ['.baidu.com', '.baidu.jp'] } },
  { name: 'PetalBot', re: /PetalBot/i, category: 'search-bot', owner: 'Huawei', verify: { rdns: ['.petalsearch.com'] } },
  { name: 'SeznamBot', re: /SeznamBot/i, category: 'search-bot', owner: 'Seznam', verify: { rdns: ['.seznam.cz'] } },
  { name: 'Naver Yeti', re: /Yeti\//i, category: 'search-bot', owner: 'Naver', verify: { rdns: ['.naver.com'] } },
  { name: 'Mojeek', re: /MojeekBot/i, category: 'search-bot', owner: 'Mojeek' },
  { name: 'Brave Search', re: /Bravebot/i, category: 'search-bot', owner: 'Brave' },
  // AI: training crawls, AI search indexes, and fetches a person asked an assistant to make
  { name: 'GPTBot', re: /GPTBot/i, category: 'ai-bot', owner: 'OpenAI', purpose: 'training', verify: { lists: ['https://openai.com/gptbot.json'] } },
  { name: 'OAI-SearchBot', re: /OAI-SearchBot/i, category: 'ai-bot', owner: 'OpenAI', purpose: 'search', verify: { lists: ['https://openai.com/searchbot.json'] } },
  { name: 'ChatGPT-User', re: /ChatGPT-User|ChatGPT Agent/i, category: 'ai-bot', owner: 'OpenAI', purpose: 'user', verify: { lists: ['https://openai.com/chatgpt-user.json'] } },
  { name: 'PerplexityBot', re: /PerplexityBot/i, category: 'ai-bot', owner: 'Perplexity', purpose: 'search', verify: { lists: ['https://www.perplexity.ai/perplexitybot.json'] } },
  { name: 'Perplexity-User', re: /Perplexity-User/i, category: 'ai-bot', owner: 'Perplexity', purpose: 'user', verify: { lists: ['https://www.perplexity.ai/perplexity-user.json'] } },
  { name: 'Claude-SearchBot', re: /Claude-SearchBot/i, category: 'ai-bot', owner: 'Anthropic', purpose: 'search' },
  { name: 'Claude-User', re: /Claude-User/i, category: 'ai-bot', owner: 'Anthropic', purpose: 'user' },
  { name: 'ClaudeBot', re: /ClaudeBot|anthropic-ai|Claude-Web/i, category: 'ai-bot', owner: 'Anthropic', purpose: 'training' },
  { name: 'Google-CloudVertexBot', re: /Google-CloudVertexBot/i, category: 'ai-bot', owner: 'Google', purpose: 'user', verify: { lists: [`${G}special-crawlers.json`], rdns: GOOGLE_RDNS } },
  { name: 'Gemini-Deep-Research', re: /Gemini-Deep-Research|Google-Agent/i, category: 'ai-bot', owner: 'Google', purpose: 'user', verify: { lists: [`${G}user-triggered-fetchers-google.json`, `${G}user-triggered-fetchers.json`], rdns: GOOGLE_RDNS } },
  { name: 'Meta-ExternalAgent', re: /meta-externalagent|meta-externalfetcher|meta-webindexer/i, category: 'ai-bot', owner: 'Meta', purpose: 'training' },
  { name: 'Amazonbot', re: /Amazonbot/i, category: 'ai-bot', owner: 'Amazon', purpose: 'search', verify: { rdns: ['.crawl.amazonbot.amazon'] } },
  { name: 'Applebot-Extended', re: /Applebot-Extended/i, category: 'ai-bot', owner: 'Apple', purpose: 'training', verify: { rdns: ['.applebot.apple.com'] } },
  { name: 'Bytespider', re: /Bytespider/i, category: 'ai-bot', owner: 'ByteDance', purpose: 'training' },
  { name: 'CCBot', re: /CCBot/i, category: 'ai-bot', owner: 'Common Crawl', purpose: 'training' },
  { name: 'MistralAI-User', re: /MistralAI-User/i, category: 'ai-bot', owner: 'Mistral', purpose: 'user' },
  { name: 'cohere-ai', re: /cohere-(ai|training-data-crawler)/i, category: 'ai-bot', owner: 'Cohere', purpose: 'training' },
  { name: 'DeepSeekBot', re: /DeepSeekBot/i, category: 'ai-bot', owner: 'DeepSeek', purpose: 'training' },
  { name: 'YouBot', re: /YouBot/i, category: 'ai-bot', owner: 'You.com', purpose: 'search' },
  { name: 'Diffbot', re: /Diffbot/i, category: 'ai-bot', owner: 'Diffbot', purpose: 'training' },
  { name: 'ExaBot', re: /Exa(Search)?Bot/i, category: 'ai-bot', owner: 'Exa', purpose: 'search' },
  { name: 'TimpiBot', re: /Timpibot/i, category: 'ai-bot', owner: 'Timpi', purpose: 'training' },
  { name: 'PanguBot', re: /PanguBot/i, category: 'ai-bot', owner: 'Huawei', purpose: 'training' },
  // link previews, SEO tools, feeds
  { name: 'facebookexternalhit', re: /facebookexternalhit|facebookcatalog/i, category: 'other-bot', owner: 'Meta' },
  { name: 'Twitterbot', re: /Twitterbot/i, category: 'other-bot', owner: 'X' },
  { name: 'LinkedInBot', re: /LinkedInBot/i, category: 'other-bot', owner: 'LinkedIn' },
  { name: 'Slackbot', re: /Slackbot|Slack-ImgProxy/i, category: 'other-bot', owner: 'Slack' },
  { name: 'Discordbot', re: /Discordbot/i, category: 'other-bot', owner: 'Discord' },
  { name: 'TelegramBot', re: /TelegramBot/i, category: 'other-bot', owner: 'Telegram' },
  { name: 'WhatsApp', re: /WhatsApp/i, category: 'other-bot', owner: 'Meta' },
  { name: 'Pinterestbot', re: /Pinterest(bot)?\//i, category: 'other-bot', owner: 'Pinterest' },
  { name: 'Embedly', re: /Embedly|Iframely|redditbot|Mastodon\/|Bluesky Cardyb|Cardyb/i, category: 'other-bot', owner: 'Link preview' },
  { name: 'AhrefsBot', re: /AhrefsBot|AhrefsSiteAudit/i, category: 'other-bot', owner: 'Ahrefs' },
  { name: 'SemrushBot', re: /SemrushBot|SiteAuditBot/i, category: 'other-bot', owner: 'Semrush' },
  { name: 'MJ12bot', re: /MJ12bot/i, category: 'other-bot', owner: 'Majestic' },
  { name: 'DotBot', re: /DotBot|rogerbot/i, category: 'other-bot', owner: 'Moz' },
  { name: 'DataForSeoBot', re: /DataForSeoBot/i, category: 'other-bot', owner: 'DataForSEO' },
  { name: 'Screaming Frog', re: /Screaming Frog/i, category: 'other-bot', owner: 'Screaming Frog' },
  { name: 'BLEXBot', re: /BLEXBot|SERankingBacklinksBot|Barkrowler|serpstatbot|Seekport/i, category: 'other-bot', owner: 'SEO crawler' },
  { name: 'Feed reader', re: /Feedly|Inoreader|NewsBlur|Feedbin|FreshRSS|Miniflux/i, category: 'other-bot', owner: 'Feed reader' },
];

const MONITORS = /UptimeRobot|Pingdom|StatusCake|Better ?Uptime|BetterStack|Site24x7|Uptime-Kuma|Freshping|HetrixTools|Checkly|Datadog Synthetics|NewRelicPinger|Cloudflare-Healthchecks|Cloudflare-Traffic-Manager/i;
/** Automated clients that say what they are (HTTP libraries, CLIs, headless browsers, audit tools). */
const TOOLS: [RegExp, string][] = [
  [/HeadlessChrome/i, 'HeadlessChrome'], [/Lighthouse|Chrome-Lighthouse|PageSpeed|PTST\//i, 'Lighthouse'], [/Playwright/i, 'Playwright'], [/Puppeteer/i, 'Puppeteer'],
  [/PhantomJS/i, 'PhantomJS'], [/Selenium|webdriver/i, 'Selenium'], [/^curl\//i, 'curl'], [/^Wget/i, 'wget'], [/python-requests|python-urllib|aiohttp|httpx|Python\//i, 'Python'],
  [/Go-http-client/i, 'Go'], [/node-fetch|undici|axios|got \(|Node\.js|^node\b/i, 'Node.js'], [/okhttp/i, 'OkHttp'], [/Java\/|Apache-HttpClient|Jakarta/i, 'Java'],
  [/libwww-perl|LWP::/i, 'Perl'], [/Ruby|Faraday/i, 'Ruby'], [/PostmanRuntime/i, 'Postman'], [/insomnia/i, 'Insomnia'], [/Scrapy/i, 'Scrapy'], [/colly/i, 'Colly'],
  [/HTTrack/i, 'HTTrack'], [/Dart\//i, 'Dart'], [/reqwest|hyper\//i, 'Rust'], [/^Mozilla\/5\.0$/, 'Bare Mozilla'], [/^-?$/, 'No user agent'],
  [/indahnya-metrics|FF-SEO-audit/i, 'Indahnya check'],
];
const SCANNER_UA = /zgrab|masscan|Nuclei|sqlmap|nikto|Nmap|WPScan|Expanse|Censys|InternetMeasurement|Palo Alto|CensysInspect|LeakIX|Odin|BitSightBot|ModatScanner|fasthttp|l9explore|l9tcpid|Keydrop|httpx - Open-source/i;
/**
 * Paths nobody asks Indahnya for, except vulnerability scanners. Dot-files other than .well-known, script
 * and config extensions, and the usual CMS/admin probes. (/api, /app, /_nuxt and couple slugs never match.)
 */
const SCANNER_PATH = /\.(php\d?|asp|aspx|jsp|cgi|env|ini|sql|bak|old|swp|git|ds_store|yml|yaml|config|conf|log|zip|tar|gz|rar|7z|dump)(\/|$)|\/(wp-|wordpress|phpmyadmin|pma|cgi-bin|vendor\/|node_modules\/|composer\.|package\.json|docker|backup|boaform|actuator|HNAP1|owa|ecp|autodiscover|druid|solr|console|telescope|_profiler|server-status|webui|xmlrpc|admin\.|administrator|\.(?!well-known\/)[^/]+)/i;
const GENERIC_BOT = /bot\b|bot\/|crawl|spider|slurp|scrape|fetcher|archiver|preview|checker|validator|monitor|scan|indexer|^Mozilla\/5\.0 \(compatible; [A-Za-z]/i;
const BROWSER = /^Mozilla\/5\.0 \((Windows|Macintosh|X11|Linux|iPhone|iPad|iPod|Android)[^)]*\).*(Chrome|CriOS|Firefox|FxiOS|Safari|Edg|OPR|SamsungBrowser)\//;

export type UaKind =
  | { kind: 'bot'; bot: KnownBot }
  | { kind: 'monitor'; name: string }
  | { kind: 'tool'; name: string }
  | { kind: 'scanner'; name: string }
  | { kind: 'unknown-bot'; name: string }
  | { kind: 'browser'; name: string }
  | { kind: 'other'; name: string };

const browserName = (ua: string) =>
  /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Browser';

/** What the User-Agent says. A browser UA is only a claim: ingest.ts confirms humans with the beacon. */
export function parseUa(ua: string): UaKind {
  const s = (ua ?? '').trim();
  for (const bot of KNOWN_BOTS) if (bot.re.test(s)) return { kind: 'bot', bot };
  if (MONITORS.test(s)) return { kind: 'monitor', name: s.match(MONITORS)![0] };
  if (SCANNER_UA.test(s)) return { kind: 'scanner', name: s.match(SCANNER_UA)![0] };
  for (const [re, name] of TOOLS) if (re.test(s)) return { kind: 'tool', name };
  if (GENERIC_BOT.test(s) && !BROWSER.test(s)) return { kind: 'unknown-bot', name: (s.match(/([A-Za-z][\w.-]*(bot|crawler|spider|fetcher))/i)?.[1] ?? s.slice(0, 40)) };
  if (BROWSER.test(s)) return { kind: 'browser', name: browserName(s) };
  return { kind: 'other', name: s.slice(0, 40) };
}

export const isScannerPath = (path: string) => SCANNER_PATH.test(path);

export type Device = 'mobile' | 'tablet' | 'desktop';
export function deviceOf(ua: string, width?: number): Device {
  if (width) return width < 768 ? 'mobile' : width < 1100 && /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? 'tablet' : 'desktop';
  return /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? 'tablet' : /Mobile|iPhone|Android/i.test(ua) ? 'mobile' : 'desktop';
}

export function osOf(ua: string) {
  return /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Macintosh/.test(ua) ? 'macOS' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux|X11/.test(ua) ? 'Linux' : 'Other';
}
