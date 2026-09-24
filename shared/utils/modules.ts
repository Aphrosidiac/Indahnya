/**
 * The guest modules, and which of them are built (all of them since Phase B).
 * A module missing from BUILT keeps its switch in settings but gets no tab.
 */
export const GUEST_MODULES = ['kad', 'gambar', 'ucapan', 'rsvp', 'tempat'] as const;
export type GuestModule = typeof GUEST_MODULES[number];
export const BUILT_MODULES: readonly GuestModule[] = ['kad', 'gambar', 'ucapan', 'rsvp', 'tempat'];
export const isBuilt = (m: string) => (BUILT_MODULES as readonly string[]).includes(m);
