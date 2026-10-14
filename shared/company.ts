/**
 * Who runs Indahnya, as the footer, the legal pages and the site graph state it.
 * CHIP (and Malaysian e-commerce rules) want the registered name, number,
 * address and a way to reach us on every page. One definition: change it here.
 * `NUXT_PUBLIC_LEGAL_*` can still override name / reg / address at start.
 */
export const COMPANY = {
  name: 'FF DEV STUDIO',
  reg: '202603234793',
  address: 'No 15982 B, Kampung Selamat, Sungai Tong, 21500 Setiu, Terengganu, Malaysia',
  email: 'hello@ffdev.studio',
  phone: '+60 13 907 8719',
  phoneHref: '+60139078719',
} as const;
