import QRCode from 'qrcode';
import sharp from 'sharp';
import { requireEventAccess } from '../../../utils/session';
import { qrArt } from '../../../../shared/utils/qr-art';
import { contentDisposition } from '../../../utils/disposition';

/**
 * The QR as SVG (print) or PNG (paste anywhere). Points at the hub, or
 * straight at the gallery. Branded by default (Mekar eyes, the bloom in the
 * middle, error correction H); `?style=plain` gives a stock one.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const q = getQuery(event);
  const target = q.to === 'gambar' ? `/${ev.slug}/gambar` : `/${ev.slug}`;
  const url = `${useRuntimeConfig().public.siteUrl}${target}`;
  const plain = q.style === 'plain';
  if (q.format === 'png') {
    const size = Math.min(Math.max(Number(q.size) || 1024, 128), 4096);
    setHeader(event, 'content-type', 'image/png');
    setHeader(event, 'content-disposition', contentDisposition(`indahnya-qr-${ev.slug}.png`, 'inline'));
    if (plain) return QRCode.toBuffer(url, { type: 'png', width: size, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1a1a1a', light: '#ffffff' } });
    return sharp(Buffer.from(qrArt(url))).resize(size, size).png().toBuffer();
  }
  setHeader(event, 'content-type', 'image/svg+xml');
  if (plain) return QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1a1a1a', light: '#00000000' } });
  return qrArt(url);
});
