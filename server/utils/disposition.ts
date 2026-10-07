/**
 * A Content-Disposition a browser on any OS turns into the right filename:
 * an ASCII `filename=` for old clients, and RFC 5987 `filename*=` carrying
 * the real name (a guest called 陈美玲 or Ñora keeps it).
 */
export function contentDisposition(filename: string, type: 'attachment' | 'inline' = 'attachment') {
  const clean = filename.replace(/[\r\n"\\/]/g, '').trim() || 'download';
  const ascii = clean.normalize('NFKD').replace(/[^\x20-\x7e]/g, '').replace(/\s+/g, ' ').trim() || 'download';
  const star = encodeURIComponent(clean).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${type}; filename="${ascii}"; filename*=UTF-8''${star}`;
}
