export function slugify(s: string) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' dan ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

/** Paths the app owns; a majlis can never take one. */
export const RESERVED = new Set([
  'app', 'api', 'masuk', 'keluar', 'tv', 'harga', 'contoh', 'blog', 'admin', 'g', 'e', 'assets', '_nuxt',
  'privasi', 'terma', 'tentang', 'bantuan', 'login', 'logout', 'static', 'media', 'embed', 'auth', 'stripe',
]);
