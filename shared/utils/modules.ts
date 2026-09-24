/**
 * The guest modules that exist today. The rest (ucapan, RSVP, seating) are
 * Phase B: their switches are kept in settings, but no tab links to a page
 * that is not there yet.
 */
export const GUEST_MODULES = ['kad', 'gambar', 'ucapan', 'rsvp', 'tempat'] as const;
export type GuestModule = typeof GUEST_MODULES[number];
export const BUILT_MODULES: readonly GuestModule[] = ['kad', 'gambar'];
export const isBuilt = (m: string) => (BUILT_MODULES as readonly string[]).includes(m);
