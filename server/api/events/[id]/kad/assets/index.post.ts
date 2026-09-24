import { z } from 'zod';
import { requireEventAccess } from '../../../../../utils/session';
import { presignPut } from '../../../../../utils/storage';
import { newId } from '../../../../../utils/ids';
import { readBodyAs } from '../../../../../utils/validate';
import { rateLimit } from '../../../../../utils/rate';
import { KAD_ASSET_TYPES } from '../../../../../utils/kad';
import { scheduleKadGc } from '../../../../../worker/kad-gc';

const Body = z.object({ kind: z.enum(['photo', 'qr', 'music']), type: z.string().max(100), bytes: z.number().int().positive() });

/**
 * A host's kad asset (couple photo, DuitNow QR, song): signed like a guest
 * upload, into the PRIVATE bucket's kad-src/ — the processed copy is what
 * goes public, never the file as sent (EXIF, GPS, a 12 MB WAV).
 */
export default defineEventHandler(async (event) => {
  const { ev, user } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const { kind, type, bytes } = await readBodyAs(event, Body);
  rateLimit(`kad-asset:${user.id}`, 60, 10 * 60_000);
  const spec = KAD_ASSET_TYPES[kind];
  const t = type.toLowerCase();
  if (ev.purgedAt) throw createError({ statusCode: 410, statusMessage: 'Majlis ni dah tamat simpanan' });
  if (!(spec.types as readonly string[]).includes(t)) {
    throw createError({ statusCode: 400, statusMessage: kind === 'music' ? 'Lagu mesti MP3, M4A atau WAV' : kind === 'qr' ? 'QR mesti JPG, PNG atau WebP (screenshot dari app bank)' : 'Gambar mesti JPG, PNG, WebP atau HEIC' });
  }
  if (bytes > spec.max) throw createError({ statusCode: 413, statusMessage: `Fail terlalu besar (had ${spec.max / 1048576} MB)` });
  const id = newId().toLowerCase();
  const url = await presignPut(`events/${ev.id.toLowerCase()}/kad-src/${id}`, t, bytes);
  // an upload the host never saves must not live on the CDN forever: sweep this kad in a day
  await scheduleKadGc(ev.id);
  return { id, url, type: t };
});
