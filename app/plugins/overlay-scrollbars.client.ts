import { installOverlayScrollbars } from '~/ui';

/** Overlay scrollbars: visible while scrolling, no layout width. See ui/overlay-scrollbar.ts. */
export default defineNuxtPlugin(() => { installOverlayScrollbars(); });
