import { z } from 'zod';

/** A reply as the host enters or edits it (a phone call, a walk-in, a correction). */
export const HostRsvp = z.object({
  name: z.string().trim().min(1, 'Isi nama').max(80),
  phone: z.string().trim().max(20).regex(/^(\+?[\d\s-]{8,20})?$/, 'Nombor telefon tak sah').nullable().optional(),
  attending: z.boolean(),
  pax: z.number().int().min(0).max(50),
  side: z.enum(['lelaki', 'perempuan', 'rakan', 'lain']).nullable().optional(),
  meal: z.string().trim().max(40).nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
  tableId: z.string().max(40).nullable().optional(),
});
