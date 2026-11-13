/* ==========================================================================
   SITE CONFIG — change the brand here (ONE place).
   Everything on every page that shows the brand reads from this constant:
   header, footer, preloader, page titles, cart storage key, copy text.
   The accent colour + fonts live in css/base.css (:root variables).
   "/" in the name renders as a red slash:  "NOIR/THREAD" -> NOIR<red>/</red>THREAD
   ========================================================================== */
const BRAND = {
  name: 'NOIR/THREAD',            // <- placeholder wordmark, replace with the real brand
  tagline: 'Streetwear for everyone',
  email: 'hello@noirthread.pk',
  phone: '+92 300 0000000',
  whatsapp: '923000000000',
  address: 'Gulberg III, Lahore, Pakistan',
  instagram: 'https://instagram.com/',
  currency: 'Rs.',
  freeShipOver: 5000,             // free delivery threshold (PKR)
  shipFee: 250,                   // flat delivery fee (PKR)
  /* next drop date shown on the countdown. If it is in the past the timer rolls forward weekly. */
  dropDate: '2026-11-20T20:00:00+05:00',
  dropName: 'Winter Drop 08'
};
BRAND.slug = BRAND.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
