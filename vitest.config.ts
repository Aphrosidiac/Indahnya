import { defineConfig } from 'vitest/config';

/** Unit tests for the pure rules (clocks, prices, redirects, EXIF, slugs). No Nuxt runtime needed. */
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], setupFiles: ['tests/setup.ts'] },
});
