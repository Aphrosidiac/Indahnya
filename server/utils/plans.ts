import type { Plan } from '../db/schema';

/**
 * The pricing table from PLAN.md, as numbers. Free is limited by count and
 * retention, never by features. Paying stretches two clocks from the moment
 * of payment (not from the event date — a couple who pays late still gets the
 * full window).
 */
export const PLANS: Record<Plan, {
  name: string; priceCents: number; uploadCap: number | null;
  uploadWindowDays: number; storageDays: number; cohosts: number; customSlug: boolean; badgeFree: boolean;
}> = {
  free: { name: 'Percuma',          priceCents: 0,    uploadCap: 50,   uploadWindowDays: 30,  storageDays: 30,  cohosts: 0, customSlug: false, badgeFree: false },
  std:  { name: 'Indahnya',         priceCents: 5900, uploadCap: null, uploadWindowDays: 183, storageDays: 365, cohosts: 1, customSlug: true,  badgeFree: false },
  full: { name: 'Indahnya Lengkap', priceCents: 9900, uploadCap: null, uploadWindowDays: 365, storageDays: 730, cohosts: 5, customSlug: true,  badgeFree: true },
};

export const MEDIA_LIMITS = {
  photoBytes: 40 * 1024 * 1024,
  videoBytes: 100 * 1024 * 1024,
  videoSec: 60,
  audioBytes: 10 * 1024 * 1024,
  audioSec: 60,
  filesPerBatch: 30,
};

export const days = (n: number) => n * 86_400_000;
