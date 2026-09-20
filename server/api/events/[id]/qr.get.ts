import QRCode from 'qrcode';
import { requireEventAccess } from '../../../utils/session';

/** The QR as SVG (print) or PNG (paste anywhere). Points at the hub, or straight at the gallery. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const q = getQuery(event);
  const target = q.to === 'gambar' ? `/${ev.slug}/gambar` : `/${ev.slug}`;
  const url = `${useRuntimeConfig().public.siteUrl}${target}`;
  if (q.format === 'png') {
    setHeader(event, 'content-type', 'image/png');
    setHeader(event, 'content-disposition', `inline; filename="indahnya-qr-${ev.slug}.png"`);
    return QRCode.toBuffer(url, { type: 'png', width: Math.min(Number(q.size) || 1024, 4096), margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1a1a1a', light: '#ffffff' } });
  }
  setHeader(event, 'content-type', 'image/svg+xml');
  return QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1a1a1a', light: '#00000000' } });
});
