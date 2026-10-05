import { z } from 'zod';
import { and, eq, count, sql } from 'drizzle-orm';
import { useDb, media } from '../../../../db';
import { eventBySlug } from '../../../../utils/public';
import { ensureGuest } from '../../../../utils/guest';
import { uploadsOpen, uploadsUsed, SLOT_HOLD_MIN } from '../../../../utils/events';
import { PLANS, MEDIA_LIMITS } from '../../../../utils/plans';
import { newId } from '../../../../utils/ids';
import { presignPut, createMultipart, presignParts, MULTIPART_MIN } from '../../../../utils/storage';
import { readBodyAs } from '../../../../utils/validate';
import { rateLimit, clientIp } from '../../../../utils/rate';
import { SANDBOX } from '../../../../utils/sandbox';

const File = z.object({ name: z.string().max(255), type: z.string().max(100), bytes: z.number().int().positive() });
const Body = z.object({ files: z.array(File).min(1).max(MEDIA_LIMITS.filesPerBatch) });

const PHOTO: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'image/heif': 'heif', 'image/webp': 'webp', 'image/gif': 'gif' };
const VIDEO: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/3gpp': '3gp', 'video/x-m4v': 'm4v' };
/** Some Android pickers hand over a file with no type at all (HEIC especially). Its extension still says what it is. */
const BY_EXT: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', heic: 'image/heic', heif: 'image/heif', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', '3gp': 'video/3gpp', m4v: 'video/x-m4v' };

function resolveType(name: string, declared: string) {
  const t = declared.toLowerCase().split(';')[0]!.trim();
  if (PHOTO[t] || VIDEO[t]) return t;
  const ext = /\.([a-z0-9]{2,5})$/i.exec(name)?.[1]?.toLowerCase();
  return ext ? BY_EXT[ext] ?? null : null;
}

/**
 * Step 1 of an upload: the browser says what it has, we say where to put it.
 * The cap is checked against rows already claimed (a fresh slot holds its
 * place for SLOT_HOLD_MIN — see uploadsUsed), inside a per-event advisory
 * lock, so two phones cannot both take the last free upload. Nothing here
 * touches the bytes. The answer carries the Content-Type to PUT with, which
 * is signed — or, for a file over MULTIPART_MIN, one signed URL per part.
 */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event, { sandbox: true });
  if (ev.settings.demo) throw createError({ statusCode: 403, statusMessage: 'Ini galeri contoh' });
  if (!uploadsOpen(ev)) throw createError({ statusCode: 410, statusMessage: 'Tempoh muat naik dah tamat' });
  if (!ev.settings.modules.gambar) throw createError({ statusCode: 403, statusMessage: 'Galeri ditutup' });
  const { files } = await readBodyAs(event, Body);
  const guest = await ensureGuest(event, ev.id);
  const ip = clientIp(event);
  await rateLimit(`slots:guest:${guest.id}`, 40, 10 * 60_000);
  await rateLimit(`slots:ip:${ip}`, 600, 10 * 60_000);

  const plan: { name: string; id?: string; kind?: 'photo' | 'video'; type?: string; originalKey?: string; error?: string }[] = files.map((f) => {
    const type = resolveType(f.name, f.type);
    const kind = !type ? null : PHOTO[type] ? 'photo' as const : 'video' as const;
    if (!type || !kind) return { name: f.name, error: 'Jenis fail tak disokong' };
    const max = ev.settings.sandbox ? MEDIA_LIMITS.sandboxPhotoBytes : kind === 'photo' ? MEDIA_LIMITS.photoBytes : MEDIA_LIMITS.videoBytes;
    if (f.bytes > max) return { name: f.name, error: `Fail terlalu besar (had ${Math.round(max / 1048576)} MB)` };
    const id = newId();
    return { name: f.name, id, kind, type, originalKey: `events/${ev.id.toLowerCase()}/orig/${id.toLowerCase()}.${PHOTO[type] ?? VIDEO[type]}` };
  });
  if (ev.settings.sandbox) for (const p of plan) if (p.kind === 'video') { p.error = 'Cubaan ni untuk gambar sahaja'; delete p.id; }
  const wanted = plan.filter(p => p.id);
  const cap = PLANS[ev.plan].uploadCap;
  if (wanted.length && ev.settings.sandbox) await rateLimit('slots:sandbox', MEDIA_LIMITS.sandboxSlotsPerHour, 3_600_000, wanted.length);
  // a capped gallery: one address cannot reserve the whole free allowance
  if (wanted.length && cap !== null && !ev.settings.sandbox) await rateLimit(`slots:capped:${ev.id}:${ip}`, MEDIA_LIMITS.cappedSlotsPerIp, SLOT_HOLD_MIN * 60_000, wanted.length);

  if (wanted.length) {
    await useDb().transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ev.id}))`);
      if (ev.settings.sandbox) {
        const [mine] = await tx.select({ n: count() }).from(media).where(and(eq(media.guestId, guest.id), sql`${media.status} not in ('deleted','failed')`));
        if (Number(mine?.n ?? 0) + wanted.length > SANDBOX.perVisitor) {
          throw createError({ statusCode: 402, statusMessage: `Cubaan ni ${SANDBOX.perVisitor} gambar je. Buat majlis sendiri untuk lagi.` });
        }
      }
      if (cap !== null && !ev.settings.sandbox) {
        const used = await uploadsUsed(ev.id, tx);
        if (used + wanted.length > cap) {
          throw createError({ statusCode: 402, statusMessage: `Galeri ni dah penuh (${cap} gambar untuk pakej percuma)`, data: { used, cap, left: Math.max(0, cap - used) } });
        }
      }
      const [open] = await tx.select({ n: count(), fresh: sql<number>`count(*) filter (where ${media.createdAt} > now() - make_interval(mins => ${SLOT_HOLD_MIN}))` })
        .from(media).where(and(eq(media.guestId, guest.id), eq(media.status, 'pending')));
      // in a capped gallery a browser holds a handful of reservations at a time (the uploader asks as it goes)
      if (cap !== null && !ev.settings.sandbox && Number(open?.fresh ?? 0) + wanted.length > MEDIA_LIMITS.cappedPendingPerGuest) {
        throw createError({ statusCode: 429, statusMessage: 'Tunggu upload yang ada siap dulu' });
      }
      if (Number(open?.n ?? 0) + wanted.length > MEDIA_LIMITS.pendingPerGuest) {
        throw createError({ statusCode: 429, statusMessage: 'Tunggu upload yang ada siap dulu' });
      }
      await tx.insert(media).values(wanted.map(p => ({
        id: p.id!, eventId: ev.id, guestId: guest.id, kind: p.kind!, status: 'pending' as const,
        originalKey: p.originalKey!, mime: p.type!, bytes: files[plan.indexOf(p)]!.bytes,
      })));
    });
  }

  const uploads = await Promise.all(plan.map(async (p, i) => {
    if (p.error) return { name: p.name, error: p.error };
    const bytes = files[i]!.bytes;
    if (bytes < MULTIPART_MIN) return { name: p.name, id: p.id!, type: p.type!, url: await presignPut(p.originalKey!, p.type!, bytes) };
    const uploadId = await createMultipart(p.originalKey!, p.type!);
    await useDb().update(media).set({ uploadId }).where(eq(media.id, p.id!));
    return { name: p.name, id: p.id!, type: p.type!, parts: await presignParts(p.originalKey!, uploadId, bytes) };
  }));
  return { uploads };
});
