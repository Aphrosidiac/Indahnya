import { z } from 'zod';
import { useDb, media } from '../../../../db';
import { eventBySlug } from '../../../../utils/public';
import { ensureGuest } from '../../../../utils/guest';
import { uploadsOpen, uploadsUsed } from '../../../../utils/events';
import { PLANS, MEDIA_LIMITS } from '../../../../utils/plans';
import { newId } from '../../../../utils/ids';
import { presignPut } from '../../../../utils/storage';

const File = z.object({ name: z.string().max(200), type: z.string().max(100), bytes: z.number().int().positive() });
const Body = z.object({ files: z.array(File).min(1).max(MEDIA_LIMITS.filesPerBatch) });

const PHOTO = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/gif']);
const VIDEO = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp', 'video/x-m4v']);

function extOf(name: string, type: string) {
  const m = /\.([a-z0-9]{2,5})$/i.exec(name);
  if (m) return m[1]!.toLowerCase();
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'image/heif': 'heif', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/3gpp': '3gp', 'video/x-m4v': 'm4v' } as Record<string, string>)[type] ?? 'bin';
}

/**
 * Step 1 of an upload: the browser says what it has, we say where to put it.
 * The cap is checked against rows already claimed (pending counts — a guest
 * who asks for 30 slots has 30 slots), so two phones cannot both take the
 * last free upload. Nothing here touches the bytes.
 */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  if (!uploadsOpen(ev)) throw createError({ statusCode: 410, statusMessage: 'Tempoh muat naik dah tamat' });
  if (!ev.settings.modules.gambar) throw createError({ statusCode: 403, statusMessage: 'Galeri ditutup' });
  const { files } = Body.parse(await readBody(event));
  const guest = await ensureGuest(event, ev.id);
  const cap = PLANS[ev.plan].uploadCap;
  if (cap !== null) {
    const used = await uploadsUsed(ev.id);
    if (used + files.length > cap) throw createError({ statusCode: 402, statusMessage: `Galeri ni dah penuh (${cap} gambar untuk pakej percuma)`, data: { used, cap } });
  }
  const db = useDb();
  const out = [];
  for (const f of files) {
    const type = f.type.toLowerCase();
    const kind = PHOTO.has(type) ? 'photo' : VIDEO.has(type) ? 'video' : null;
    if (!kind) { out.push({ name: f.name, error: 'Jenis fail tak disokong' }); continue; }
    const max = kind === 'photo' ? MEDIA_LIMITS.photoBytes : MEDIA_LIMITS.videoBytes;
    if (f.bytes > max) { out.push({ name: f.name, error: `Fail terlalu besar (had ${Math.round(max / 1048576)} MB)` }); continue; }
    const id = newId();
    const originalKey = `events/${ev.id.toLowerCase()}/orig/${id.toLowerCase()}.${extOf(f.name, type)}`;
    await db.insert(media).values({ id, eventId: ev.id, guestId: guest.id, kind, status: 'pending', originalKey, mime: type, bytes: f.bytes });
    out.push({ name: f.name, id, url: await presignPut(originalKey, type) });
  }
  return { uploads: out };
});
