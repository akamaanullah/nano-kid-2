# NOIR/THREAD — Dark Premium Streetwear Storefront (static HTML/CSS/JS)

A complete, framework-free ecommerce front-end for an apparel brand (men, women, kids, custom prints).
Open `index.html` in a browser — no build step, no server needed.

## Pages
| File | What it is |
|---|---|
| `index.html` | Home: hero slider, marquees, categories, trending carousel, drop countdown, lookbook, custom-print live preview, reviews, newsletter |
| `shop.html` | Catalogue: filters (gender, category, size, colour, price), sort, active-filter chips, load more, URL state (`?gender=men&cat=hoodies&sort=new&q=…`) |
| `product.html?id=1` | Product page: colour gallery with zoom, size picker + size guide, qty, add to cart / buy now, sticky add-to-cart bar, accordions, related items |
| `cart.html` | Cart → checkout (COD / card / JazzCash / Easypaisa, promo codes `NOIR10`, `WELCOME500`) → order confirmation. Demo only: no payment is taken |
| `customize.html` | **Design studio**: live SVG preview (front/back, zoom), 6 garments, 12 colours + picker, adult/kids sizes, DTF / screen / embroidery pricing, multi text layers (6 fonts, arc, outline), image upload, graphics library, drag/resize/rotate, layers, undo/redo, bulk-discount pricing, PNG download, add to cart, quote request |
| `about.html` | Story, count-up stats, values |
| `contact.html` | Validated contact form, studio info, FAQ accordion |

Shared: mega menu (Men / Women / Kids), mobile menu, slide-in cart drawer, search overlay, quick view, size guide, wishlist hearts, toasts.

## Folder layout
```
index.html shop.html product.html cart.html about.html contact.html customize.html
css/base.css     tokens, type, buttons, header, mega/mobile menu, drawer, footer, forms
css/pages.css    cards + every page section (incl. Mini Drop kids block), responsive rules
css/studio.css   design-studio layout (sticky preview on mobile)
js/config.js     BRAND — change name, contact details, shipping, drop date HERE (one place)
js/data.js       catalogue (83 products incl. 31 kids, sizes 2-3Y…13-14Y), colours, image ids
js/boot.js       preloader / page-curtain bootstrap
js/app.js        shared UI + cart store (localStorage) + effects
js/studio.js     design studio engine (state, SVG render, interactions, export, cart)
js/home.js shop.js product.js cart.js about.js contact.js   page scripts
```

## Rebranding
* **Name / contacts / shipping rules:** `js/config.js` → `BRAND` (a `/` in the name renders as the red slash).
* **Accent colour:** `--accent` in `css/base.css` (`:root`). Everything re-skins.
* **Products:** edit `js/data.js` (`PRODUCTS`). Images are Unsplash photo ids, served as `https://images.unsplash.com/<id>?auto=format&fit=crop&w=…` — swap for your own CDN by changing `U()` in `js/app.js`.

## Design system
* **Palette:** background `#09090A` · surfaces `#0F0F11` / `#151517` / `#121214` · text `#F2EFE9` · muted `#9C9992` · dim `#6B6963` · accent red `#FF2E2E` (hover `#D41C1C`) · hairlines `rgba(242,239,233,.11 / .2)`.
* **Fonts (Google Fonts):** Anton (display, uppercase) + Space Grotesk (body/UI).
* **Animations:** preloader with letter-rise + progress count; page curtain transitions; hero slider (cross-fading masked product layers, outlined word parallax, auto-progress dots, swipe/keys, colour-thumb swaps); drifting line-art backdrop; floating product + orbit ring; spinning circular badge; infinite marquees; split-text letter reveals; scroll-reveal / zoom reveals; card tilt + second-image crossfade + quick-view slide-up; magnetic buttons; custom cursor ring ("VIEW" on cards); parallax words/images; rolling countdown digits; count-up stats; drawer / mega-menu / accordion motion; toasts; pulsing lookbook/map markers. All respect `prefers-reduced-motion`.

## Notes
* Cart + wishlist persist in `localStorage` (key derived from the brand name).
* Checkout is a front-end demo — wire `cart.js` → `render()`'s submit handler to your payment/order API.
* Fully responsive (desktop mega menu → mobile accordion menu, filter drawer on mobile).

## Kids collection & Design studio
- Kids: `shop.html?gender=kids` (kids size filter `&size=5-6Y`), Kids mega menu (incl. Ages 2-4 / 5-8 / 9-14), 'Mini Drop' banner + 'Little Legends' carousel on home, kids hero slide.
- Studio deep links: `customize.html?garment=hoodie&kids=1&color=D62828`. Prices/tiers/fonts/graphics are constants at the top of `js/studio.js`.
- Cart items from the studio store a small JPEG thumbnail + design summary (localStorage key `noir-thread-cart`).
