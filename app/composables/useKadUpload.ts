/**
 * A host's kad asset, end to end: ask for a signed slot, PUT the file
 * straight to the bucket, then have the server process it (WebP photo,
 * lossless QR, AAC song). Resolves to the key the kad stores and a URL the
 * preview can show.
 */
export function useKadUpload(eventId: () => string) {
  const busy = ref(0);
  async function upload(file: File, kind: 'photo' | 'qr' | 'music', onProgress?: (pct: number) => void) {
    busy.value++;
    try {
      const type = file.type || (/\.heic$/i.test(file.name) ? 'image/heic' : /\.mp3$/i.test(file.name) ? 'audio/mpeg' : /\.m4a$/i.test(file.name) ? 'audio/mp4' : '');
      const slot = await $fetch<{ id: string; url: string; type: string }>(`/api/events/${eventId()}/kad/assets`, { method: 'POST', body: { kind, type, bytes: file.size } });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', slot.url);
        xhr.setRequestHeader('Content-Type', slot.type);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload gagal (${xhr.status})`)));
        xhr.onerror = () => reject(new Error('Upload terputus'));
        xhr.send(file);
      });
      return await $fetch<{ key: string; url: string }>(`/api/events/${eventId()}/kad/assets/${slot.id}`, { method: 'POST', body: { kind } });
    } finally { busy.value--; }
  }
  return { upload, busy };
}
