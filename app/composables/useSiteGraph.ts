/**
 * The site-wide entities every public page's JSON-LD points at, by @id: the
 * operator (FF Dev Studio), the website, and the product. One definition, so
 * the landing and About can never describe Indahnya two different ways.
 * Every fact here is also visible on the site (landing, /tentang, /privasi);
 * docs/geo/facts.md is the canonical list. Change them together.
 */
export function siteGraph(site: string, lang: 'ms' | 'en') {
  const en = lang === 'en';
  const id = (k: string) => `${site}/#${k}`;
  return [
    {
      '@type': 'Organization', '@id': id('org'), name: 'FF Dev Studio', url: 'https://ffdev.studio',
      description: en ? 'A small software studio in Malaysia. Builds and runs Indahnya.' : 'Studio perisian kecil di Malaysia. Bina dan jalankan Indahnya.',
      address: { '@type': 'PostalAddress', addressCountry: 'MY' },
      contactPoint: {
        '@type': 'ContactPoint', contactType: 'customer support', email: 'hello@ffdev.studio', url: 'https://wa.me/60139078719',
        areaServed: 'MY', availableLanguage: ['ms', 'en'],
      },
    },
    {
      '@type': 'WebSite', '@id': id('website'), name: 'Indahnya', alternateName: 'indahnya.my', url: `${site}/`,
      inLanguage: ['ms-MY', 'en-MY'], publisher: { '@id': id('org') },
    },
    {
      '@type': 'SoftwareApplication', '@id': id('app'), name: 'Indahnya', url: `${site}/`,
      applicationCategory: 'MultimediaApplication', operatingSystem: 'Web browser', image: `${site}/icon-512.png`,
      description: en
        ? 'Indahnya is a QR photo gallery for Malaysian events. Guests scan a QR code, upload photos from their phone browser with no app or sign-up, and every photo lands in one gallery that can play on the venue screen. Also: e-invitation card, RSVP, table finder and guest wishes.'
        : 'Indahnya ialah galeri gambar majlis dengan QR untuk Malaysia. Tetamu scan QR, upload gambar dari browser phone tanpa app atau login, dan semua gambar masuk satu galeri yang boleh naik atas TV dewan. Juga: e-kad jemputan, RSVP, carian nombor meja dan ucapan.',
      featureList: en
        ? ['QR photo and video upload without an app', 'Live slideshow on the venue screen', 'E-invitation card with five templates', 'RSVP', 'Table finder', 'Written and voice wishes', 'Download everything as a zip']
        : ['Upload gambar dan video dengan QR tanpa app', 'Slideshow live atas TV dewan', 'E-kad jemputan, lima template', 'RSVP', 'Carian nombor meja', 'Ucapan bertulis dan suara', 'Download semua dalam zip'],
      inLanguage: ['ms-MY', 'en-MY'], areaServed: 'MY', publisher: { '@id': id('org') },
      offers: [
        { '@type': 'Offer', name: 'Percuma', price: 0, priceCurrency: 'MYR', description: en ? '50 uploads, kept 30 days after the event' : '50 upload, simpan 30 hari selepas majlis' },
        { '@type': 'Offer', name: 'Indahnya', price: 59, priceCurrency: 'MYR', description: en ? 'One-time. Unlimited uploads, kept one year' : 'Sekali bayar. Upload tanpa had, simpan setahun' },
        { '@type': 'Offer', name: 'Indahnya Lengkap', price: 99, priceCurrency: 'MYR', description: en ? 'One-time. Unlimited uploads, kept two years, no Indahnya badge' : 'Sekali bayar. Upload tanpa had, simpan dua tahun, tanpa badge Indahnya' },
      ],
    },
  ];
}

/** Serialise a graph for a <script type="application/ld+json">: `<` escaped so no string can close the tag. */
export const ldJson = (graph: Record<string, unknown>[]) => JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
