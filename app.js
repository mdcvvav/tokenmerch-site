/* ============================================================
   TokenMerch storefront app
   Loaded by Shopify (Custom Liquid) and by index.html on Vercel:
     <div id="tokenmerch-root"></div>
     <script src="https://tokenmerch-site.vercel.app/app.js"></script>
   Everything (styles, markup, logic) lives here, so layout changes
   are a commit to this file instead of an edit in Shopify.
   ============================================================ */
(function () {
'use strict';

var API = 'https://tokenmerch-site.vercel.app';
var PRINTFUL_VARIANT = 9229;            // Bella+Canvas 3719, Black / L

/* The ten product slots. pid/vid are Printful's catalog product and the variant the
   preview is drawn on; price is a placeholder retail number (~2x Printful's cost)
   until the real pricing is set. shape is only the fallback drawing when Printful
   has no template. */
/* Everything prints DTG. DTF was the default for a while because it exists on the
   five top-row garments and is more vivid, but it carries a +$7.95/unit surcharge
   where the DTG front is included, and on garment-dyed cotton it sits on the cloth
   as a film rather than soaking in. DTG is cheaper, softer, and the same technique
   on every garment -- the tank has no DTF option at all, so this is also the only
   way the range is consistent.

   One upside beyond price: the mockup generator publishes no DTF templates, so the
   preview used to composite the hoodies into their DTG area while the spec line
   claimed the larger DTF one. Now the template, the preview and the print file all
   describe the same area, and `tplIn` is no longer needed anywhere.

   `shTop` is how far below the SHOULDER LINE that template's print area begins,
   measured off the template images. The shoulder line is the reference because
   neckline depth varies enormously -- the tee drops 2.28 in from shoulder to
   collar, the tank 4.11 in -- so anchoring to the collar puts the same mark at
   very different heights on the body. See claude/print-placement.md.

   Back print is deliberately limited to the men's hoodie -- it is the only
   garment it looks right on. */
var PRODUCTS = [
  { id: 'tee',       label: 'T-SHIRT',         pid: 586, vid: 15114, price: 45,  shape: 'tee', shTop: 3.59,
    styles: ['centered', 'centered-small', 'badge-left', 'badge-right'],
    print: { w: 12, h: 16, dpi: 150, tech: 'DTG', placement: 'front' } },
  { id: 'oversized', label: 'OVERSIZED T',     pid: 823, vid: 21000, price: 62,  shape: 'tee', shTop: 3.55,
    styles: ['centered', 'centered-small', 'badge-left', 'badge-right'],
    print: { w: 12, h: 16, dpi: 150, tech: 'DTG', placement: 'front' } },
  { id: 'ribbed',    label: 'RIBBED NECK',     pid: 818, vid: 20716, price: 46,  shape: 'tee', shTop: 2.90,
    styles: ['centered', 'centered-small', 'badge-left', 'badge-right'],
    print: { w: 12, h: 16, dpi: 150, tech: 'DTG', placement: 'front' } },
  /* One hoodie per cut. The women's is Bella + Canvas 7502, a cropped raw-hem fleece
     with a dropped shoulder -- 10x10 DTG front, S-2XL, four colours. The men's is
     Cotton Heritage M2580, the one Printful titles "Unisex Premium Pullover Hoodie";
     that "premium" is Printful's marketing word, not a cost tier, which is exactly why
     the old lineup looked wrong -- the slot labelled plain HOODIE was the Independent
     SS4500 at a $45.75 blank against the M2580's $39.75. Two near-identical pullovers
     $12 apart, the dearer one named as though it were the cheaper. The SS4500 is gone.

     Both DTG fronts are smaller than the DTF areas they could use (10x10 and 12x12
     against 15x12) but they are the areas the mockup templates actually show.

     No back print on the cropped hoodie. Printful serves its back template as a
     pre-coloured positioning image (ghost/back/positioning/..._hood_<colour>.png)
     rather than the colour-independent _base_whitebg ghost every other garment gives,
     so our colour fill would double up on it -- and a raw hem is the wrong canvas for
     a 10 in graphic anyway. */
  /* Jerzees 975MPR joggers. The only product that does not print on a torso, so it is
     also the only one with its own placement set: four leg marks and nothing else.

     WHY THIS BLANK. Every sweatpant and jogger Printful carries gets the same 3.5 x 14.5 in
     leg strip, but WHERE that strip sits on the garment differs, and on most of them it is
     low. Measured off each template, the strip starts 55-62% of the way down the garment --
     the M7580 (which this replaced) at 21 in below the waistband, which is the knee, because
     its cross pockets take up the thigh. The 975MPR is the one blank whose strip is high:
     hip to knee, so a thigh print is actually possible. It is also the cheapest of them at
     a $32.75 blank. The cost of that is a smaller range -- 4 colours, S-2XL -- and the
     template, below.

     NO TEMPLATE AT ALL. Every other product returns a `_whitebg` ghost laydown: a
     semi-transparent overlay, colour-independent, that the preview fills a colour under.
     The 975MPR's templates are all opaque photographs of a model, which would have left
     this one slot leading with a worn shot while the other nine lead with a flat laydown.
     So the flat laydown is ours: Printful's mockup GENERATOR will render the flat front
     view even though it publishes no flat template, and `pants/blanks.js` holds that
     render -- one per colour, taken with a fully transparent print file so the garment
     comes back blank -- together with the print rectangle, which was read off the same
     render done with a magenta calibration sheet. `blankTpl` points at that file;
     `loadBlankTemplate` synthesises a template object from it so the rest of the renderer
     cannot tell the difference.

     The photo is opaque either way, so `photoTpl` still applies: the design goes ON TOP of
     it rather than under, source-over. Not multiply -- printed ink is opaque, and multiply
     would erase a white mark on black fabric. `tplByColor` keys the cache on the swatch.

     The mark hangs `leg.top` inches DOWN from the top of the strip -- the thigh -- rather
     than up from its bottom, which is what the M7580 needed.

     left/right follow the same convention as the chest badge: LEFT is the WEARER's left,
     which is Printful's leg_left. Each leg is its own photo with its own print rectangle,
     so the preview switches templates with the style, not the side -- see tplSide().

     Cost: $32.75 blank (2XL $35.50) + a $7.95 leg surcharge that is always charged = $40.70. */
  { id: 'pants',     label: 'SWEATPANTS',      pid: 342, vid: 9927,  price: 84,  shape: 'tee',
    photoTpl: true, tplByColor: true,
    blankTpl: { js: '/pants/blanks.js', global: 'TM_PANTS' },
    styles: ['badge-left', 'badge-right', 'square-left', 'square-right'],
    styleLabels: {
      'badge-left':  'IMAGE BADGE LEFT (CIRCULAR)',
      'badge-right': 'IMAGE BADGE RIGHT (CIRCULAR)',
      'square-left': 'IMAGE BADGE LEFT (SQUARE)',
      'square-right': 'IMAGE BADGE RIGHT (SQUARE)'
    },
    placementByStyle: {
      'badge-left':  'leg_left',  'square-left':  'leg_left',
      'badge-right': 'leg_right', 'square-right': 'leg_right'
    },
    leg: { dia: 2.6, top: 1.2 },
    print: { w: 3.5, h: 14.5, dpi: 150, tech: 'DTG', placement: 'leg_left' } },
  /* Cotton Heritage M2580 -- the one Printful titles "Unisex Premium Pullover Hoodie".
     That "premium" is its marketing name, not a tier, and reading it as one is how the
     lineup ended up with the dearer Independent SS4500 ($45.75 blank against $39.75)
     sitting in the slot labelled plain HOODIE. Neither word survives: one hoodie, and
     the only garment that offers a back print. */
  { id: 'hoodie',    label: 'HOODIE',          pid: 380, vid: 10779, price: 80,  shape: 'tee', shTop: 4.94,
    styles: ['centered', 'centered-small', 'badge-left', 'badge-right', 'back-badge', 'back-ticker'],
    print: { w: 12, h: 12, dpi: 150, tech: 'DTG', placement: 'front' },
    back: { w: 12, h: 16, dpi: 150, tech: 'DTG', placement: 'back' }, backPrint: true, },
  /* Cotton Heritage M2480 -- the crewneck sibling of the M2580 men's hoodie just
     above, so the fabric and the fit are known quantities. Ghost laydown template on
     both sides, 19 colours, S-3XL, and the same 12x16 DTG front area as the tees.
     Replaced the all-over windbreaker, whose printed panels never read cleanly. No
     back print: it costs +$7.95 and, like the tank, it only looks right on a hood. */
  { id: 'crew',      label: 'SWEATSHIRT',      pid: 411, vid: 11255, price: 70,  shape: 'tee', shTop: 3.34,
    styles: ['centered', 'centered-small', 'badge-left', 'badge-right'],
    print: { w: 12, h: 16, dpi: 150, tech: 'DTG', placement: 'front' } },
  /* Comfort Colors 9360 heavyweight garment-dyed tank -- same line as the 1717 tee.
     Chosen over the Cotton Heritage MC1790 because its mockup template is a ghost
     laydown on BOTH sides, so the tank composites match every other garment instead
     of leading with a worn torso. 31 colours, XS-3XL, and the back print is free. */
  { id: 'tank',      label: 'TANK TOP',        pid: 907, vid: 23282, price: 48,  shape: 'tee', shTop: 6.34,
    styles: ['centered', 'centered-small', 'badge-left', 'badge-right'],
    print: { w: 14, h: 16, dpi: 150, tech: 'DTG', placement: 'front' } },
  /* Printful lists three capacities (11 / 15 / 20 oz); the store sells the first two,
     so the mug carries a `sizes` allow-list. It also carries a `styles` one: a mug has
     no chest and no back, so the badge and two-sided styles are meaningless on it and
     only the centred graphic is offered. */
  { id: 'mug',       label: 'COFFEE MUG',      pid: 19,  vid: 1320,  price: 18,  shape: 'mug', noTpl: true, color: '#FFFFFF',
    sizes: ['11 oz', '15 oz'], styles: ['centered'],
    print: { w: 9, h: 3.5, dpi: 300, tech: 'Sublimation', placement: 'default' },
    /* Printful DOES publish a template for the mug, but it is a flat unwrapped artwork
       guide -- a rectangle with a "Center of mug" line and a thumbnail of a mug beside
       it -- not a photograph with a transparent print area like the garment ghosts. So
       there is nothing to composite onto, hence noTpl, and the preview is built from
       Printful's own blank catalogue photo plus the cylinder map below. Measured off
       the photo; method and numbers in claude/model-shots.md. */
    /* Printful's print area is per variant: both capacities wrap the same 9 in, and the
       15 oz band is taller. So the 15 oz is the same diameter as the 11 oz and simply a
       taller mug -- which is why one photograph serves both (see stretchBySize). The
       20 oz is a different shape (10.24 x 4.02) but the store does not sell it. */
    printBySize: {
      '11 oz': { w: 9, h: 3.5, dpi: 300, tech: 'Sublimation', placement: 'default' },
      '15 oz': { w: 9, h: 3.8, dpi: 300, tech: 'Sublimation', placement: 'default' }
    },
    models: [
      { src: '/mug/mug-11oz.webp', flat: true, side: 'front', label: 'Full mug', zoom: 1.25,
        /* Printful's own 15 oz photo is 275x500 and shot turned at an angle, so it would
           be soft and inconsistent beside the 11 oz. The 11 oz shot is stretched about
           its base instead: same diameter, band 3.8/3.5 taller. */
        stretchBySize: { '15 oz': 1.0857 },
        /* the tight framing was cropping close enough to read as a different product
           from the wide one, so the mug leads with the pulled-back shot */
        wide: 0.74, wideLabel: 'Full mug', noFull: true,
        cyl: { cx: 0.6136, a: 0.2955, yRim: 0.1485, bRim: 0.0212,
               yBase: 0.8394, bBase: 0.0348, mTop: 0.0333, mBot: 0.0333 } }
    ] },
  /* Unframed matte poster (product 1), 11x14. The framed one (product 2) was dropped:
     its blanks run $29.50-$107.75 against a single retail price, and all three frame
     colours return the SAME template -- a flat "Safe Print area" guide, no frame in it
     at all -- so there was never anything to composite onto.

     One size and one art size, because consistency was the ask. 6 in prints at 133 DPI
     off an 800 px token and 67 off a 400 px one; the quality warning covers the tail
     rather than the artwork shrinking under the customer. */
  { id: 'poster',    label: 'POSTER',          pid: 1,   vid: 14125, price: 28,  shape: 'flat',
    noTpl: true, sheet: true, minDpi: 65, styles: ['centered'],
    /* Printful lists 33 sizes for this product; the store sells one. Same allow-list
       the mug uses -- Printful stays the source of truth for the variant ids. */
    sizes: ['11\u2033\u00d714\u2033'],
    art: { fixed: true, size: 6, top: 2.53, tickerFirst: true, tickerCap: 0.155 },
    print: { w: 11, h: 14, dpi: 300, tech: 'Digital', placement: 'default' } },
  /* Kiss Cut Sheet (505), A5, the one size it comes in. Printful cuts around each
     SEPARATE object on the sheet and adds its own white border to each, so six opaque
     cells with transparent gutters come back as six stickers that peel off one at a
     time. Their guidance asks for at least 0.25 in between objects; this grid leaves
     0.37 across and 0.30 down. Excess paper is trimmed, so the layout fills the sheet.
     Six at $7.50 the sheet beats one 4 in holographic at $6.50 for a product whose
     whole point is that people stick them on things. */
  { id: 'sticker',   label: 'STICKERS',        pid: 505, vid: 12917, price: 15,  shape: 'flat',
    noTpl: true, sheet: true, backing: '#eceef2', minDpi: 100,
    sizes: ['5.83\u2033\u00d78.27\u2033'], styles: ['centered'],
    tile: { cols: 2, rows: 3, cell: 2.35, art: 1.14, artTop: 0.15, gap: 0.09, radius: 0.16 },
    /* The print FILE is the whole A5 sheet, which is a production detail. What the
       customer is buying is a 2.35 in sticker, so that is what the spec line says. */
    spec: { w: 2.35, h: 2.35, dpi: 300, tech: 'Digital', note: 'individual sticker size' },
    print: { w: 5.83, h: 8.27, dpi: 300, tech: 'Digital', placement: 'default' } }
];
function productById(id) {
  for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
  return PRODUCTS[0];
}
/* shown on first load so the preview is never empty */
var DEMO_CA = 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm';

/* site logo, inlined so the banner never waits on a second request */
var LOGO_SRC = 'data:image/webp;base64,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';

/* ---------------- head assets ---------------- */

var CSS = [
'body{background-color:#0d0f17;color:#E2E8F0;font-family:"Inter",sans-serif}',
'#tokenmerch-root{background-color:#0d0f17}',
'.glass-panel{background:rgba(22,26,38,.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.08)}',
'.glow-accent{box-shadow:0 0 25px -5px rgba(153,69,255,.35)}',
/* The track used to carry a 1px white border, which is what showed through as a pale
   sliver where the rounded cap met the black end. The outline is now a faint slate ring
   OUTSIDE the track, so neither end is lightened. */
'#tmHue{-webkit-appearance:none;appearance:none;width:100%;height:10px;border-radius:9999px;outline:none;cursor:pointer;border:0;background:linear-gradient(to right,#FFF 0%,#FFF 6%,#F00 6%,#FF0 20.7%,#0F0 35.3%,#0FF 50%,#00F 64.7%,#F0F 79.3%,#F00 94%,#000 94%,#000 100%);box-shadow:0 0 0 1px rgba(148,163,184,.28)}',
'#tmHue::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:#fff;border:2px solid #0d0f17;box-shadow:0 1px 3px rgba(0,0,0,.65),0 0 0 1px rgba(148,163,184,.55);cursor:pointer}',
'#tmHue::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:#fff;border:2px solid #0d0f17;box-shadow:0 1px 3px rgba(0,0,0,.65),0 0 0 1px rgba(148,163,184,.55);cursor:pointer}',
'#tmWeight{-webkit-appearance:none;appearance:none;width:100%;height:10px;border-radius:9999px;outline:none;cursor:pointer;border:1px solid rgba(255,255,255,.2);background:linear-gradient(to right,#4b5563,#e2e8f0)}',
'#tmWeight::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#9945FF;border:2px solid #0d0f17;box-shadow:0 0 0 1px rgba(255,255,255,.5);cursor:pointer}',
'#tmWeight::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#9945FF;border:2px solid #0d0f17;box-shadow:0 0 0 1px rgba(255,255,255,.5);cursor:pointer}',
'#tmWeight:disabled{cursor:not-allowed}',
'#tmWeightRow{transition:opacity .15s ease}',
'@keyframes tmspin{to{transform:rotate(360deg)}}',
'.tm-spinner{width:34px;height:34px;border-radius:9999px;border:3px solid rgba(255,255,255,.12);border-top-color:#9945FF;animation:tmspin .8s linear infinite}',
'@media (max-width:639px){#tmNet{display:none !important}}',
'.tm-wordmark{font-family:"Orbitron","Inter",sans-serif;font-weight:700;letter-spacing:.03em;text-shadow:0 0 18px rgba(153,69,255,.28)}',
'.tm-wordmark:hover{color:#fff}',
'#tokenmerch-root ::-webkit-scrollbar{width:6px;height:6px}',
'#tokenmerch-root ::-webkit-scrollbar-track{background:#0d0f17}',
'#tokenmerch-root ::-webkit-scrollbar-thumb{background:#272d3f;border-radius:3px}'
].join('');

var TW_CONFIG = {
  darkMode: 'class',
  theme: { extend: {
    colors: { brand: {
      bg: '#0d0f17', card: '#161a26', cardHover: '#1f2434', accent: '#9945FF',
      solana: '#14F195', cyber: '#00F0FF', border: '#272d3f', borderLight: '#374151'
    } },
    fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }
  } }
};

function addHead() {
  document.documentElement.classList.add('dark');
  var head = document.head;
  function link(href) {
    if (head.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; head.appendChild(l);
  }
  link('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Archivo+Black&family=Orbitron:wght@700;900&display=swap');
  link('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
  var st = document.createElement('style');
  st.id = 'tm-style'; st.textContent = CSS; head.appendChild(st);
}

function addTailwind(done) {
  if (window.tailwind) { window.tailwind.config = TW_CONFIG; done(); return; }
  var s = document.createElement('script');
  s.src = 'https://cdn.tailwindcss.com';
  s.onload = function () { try { window.tailwind.config = TW_CONFIG; } catch (e) {} done(); };
  s.onerror = function () { console.error('Tailwind failed to load'); done(); };
  document.head.appendChild(s);
}

/* ---------------- markup ---------------- */

var MARKUP = [
'<header class="border-b border-brand-border/80 bg-brand-bg/90 sticky top-0 z-40 backdrop-blur-md">',
'<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center gap-3 sm:gap-4 relative">',
/* logo square, left */
'<a href="/" class="shrink-0 block w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-brand-card border border-brand-border/70 shadow-lg shadow-brand-accent/10"><img src="' + LOGO_SRC + '" alt="TokenMerch" width="64" height="64" class="w-full h-full object-cover"></a>',
/* wordmark, centered */
'<div class="flex-1"></div>',
'<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><a href="/" class="tm-wordmark pointer-events-auto text-xl sm:text-4xl lg:text-5xl text-white whitespace-nowrap">tokenmerch<span class="text-brand-accent">.xyz</span></a></div>',
/* links, right */
'<div class="shrink-0 flex items-center gap-1.5 sm:gap-2">',
'<a id="tmXLink" href="#" target="_blank" rel="noopener" title="TokenMerch on X" aria-label="TokenMerch on X" class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-brand-card hover:bg-brand-cardHover text-slate-300 hover:text-white border border-brand-border transition-all text-base sm:text-lg"><i class="fa-brands fa-x-twitter"></i></a>',
'<a id="tmMailLink" href="#" title="Email TokenMerch" aria-label="Email TokenMerch" class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-brand-card hover:bg-brand-cardHover text-slate-300 hover:text-white border border-brand-border transition-all text-base sm:text-lg"><i class="fa-solid fa-envelope"></i></a>',
'</div>',
'</div></header>',

'<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">',

/* search bar */
'<section class="glass-panel rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden">',
'<div class="absolute -right-16 -top-16 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none"></div>',
'<div class="absolute -left-16 -bottom-16 w-64 h-64 bg-brand-solana/10 rounded-full blur-3xl pointer-events-none"></div>',
'<div class="max-w-3xl mx-auto text-center mb-4">',
'<h1 class="text-xl sm:text-3xl font-extrabold tracking-tight">Drop the CA <i class="fa-solid fa-arrow-right text-brand-accent text-lg"></i> <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-solana to-brand-cyber">Get the Merch</span></h1>',
'</div>',
'<div class="max-w-3xl mx-auto">',
'<div class="relative flex flex-col sm:flex-row items-stretch gap-2 bg-brand-bg/90 p-2 rounded-xl border border-brand-border focus-within:border-brand-accent transition-all glow-accent">',
'<div class="flex-grow flex items-center px-3 space-x-3">',
'<i class="fa-solid fa-magnifying-glass text-slate-500"></i>',
'<input id="caInput" type="text" placeholder="Paste Solana Mint Contract Address (e.g., EKpQGS...)" style="background:transparent;border:0;box-shadow:none;color:#fff" class="w-full text-xs sm:text-sm placeholder-slate-500 focus:outline-none font-mono py-2">',
'<button id="pasteBtn" title="Paste from Clipboard" class="text-slate-400 hover:text-brand-solana p-1.5 rounded transition-colors text-xs font-mono flex items-center gap-1"><i class="fa-regular fa-paste"></i><span class="hidden sm:inline">Paste</span></button>',
'</div>',
'<div id="tmNet" class="font-mono uppercase whitespace-nowrap" style="display:flex;align-items:center;gap:0.5rem;padding:0 0.75rem;font-size:10px;letter-spacing:.1em"><span class="animate-ping" style="width:10px;height:10px;border-radius:9999px;background:#14F195;flex:0 0 auto"></span><span style="color:#14F195;font-weight:600">Solana Mainnet</span></div>',
'<button id="fetchBtn" class="bg-gradient-to-r from-brand-accent to-purple-600 hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md text-sm"><span id="fetchBtnText">Drop</span><i id="fetchSpinner" class="fa-solid fa-spinner fa-spin hidden"></i></button>',
'</div>',
'</div></section>',

/* workspace */
'<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">',

/* left column */
'<div class="lg:col-span-5 flex flex-col space-y-5">',
'<div class="glass-panel rounded-2xl p-5 relative">',
'<div class="flex items-center space-x-4">',
'<img id="tokenImgSidebar" referrerpolicy="no-referrer" alt="Token" class="w-14 h-14 rounded-2xl ring-2 ring-brand-accent/50 shadow-md object-cover bg-brand-bg">',
'<div class="overflow-hidden">',
'<h2 class="text-lg font-bold text-white flex items-center gap-2 truncate"><span id="tokenName">&nbsp;</span><span id="tokenTicker" class="text-xs font-mono bg-brand-border px-2 py-0.5 rounded text-brand-solana"></span></h2>',
'<p id="tokenCaDisplay" class="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-[220px]"></p>',
'</div></div>',
'<div class="mt-4 pt-4 border-t border-brand-border">',
'<div class="flex items-center justify-between mb-2">',
'<span class="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Price chart</span>',
'<div id="tmRanges" class="flex items-center gap-1"></div>',
'</div>',
'<div class="relative bg-brand-bg/80 rounded-xl border border-brand-border overflow-hidden h-24 lg:h-[200px]">',
'<canvas id="tmChart" width="1600" height="384" class="w-full h-full block"></canvas>',
'<div id="tmChartMsg" class="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-500 pointer-events-none"></div>',
'</div></div></div>',

'<div class="glass-panel rounded-2xl p-5 space-y-4 uppercase">',
'<h3 class="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold border-b border-brand-border pb-2 flex items-center justify-between"><span><i class="fa-solid fa-sliders text-brand-accent mr-2"></i> Merch Customizer</span></h3>',

'<div><label class="block text-xs font-mono text-slate-400 mb-2">COLOR <span id="tmColorName" class="text-slate-500"></span></label>',
'<div id="tmColors" class="bg-brand-bg p-2.5 rounded-xl border border-brand-border" style="display:flex;flex-wrap:wrap;gap:7px;max-height:104px;overflow-y:auto"></div></div>',

'<div><label class="block text-xs font-mono text-slate-400 mb-2">POSITION</label>',
/* The options are filled in by paintStyleOptions() from the product's own `styles`
   list, so the menu only ever offers placements that product can actually print. */
'<select id="printStyleSelect" class="w-full bg-brand-bg text-slate-200 border border-brand-border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-brand-accent"></select></div>',

/* text under logo */
'<div><label class="block text-xs font-mono text-slate-400 mb-2">TEXT</label>',
'<div class="space-y-3 bg-brand-bg p-3 rounded-xl border border-brand-border text-xs font-mono">',
'<label class="flex items-center justify-between cursor-pointer"><span class="text-slate-300">Contract address</span><input id="tmShowCA" type="checkbox" class="w-4 h-4 accent-purple-500"></label>',
'<label class="flex items-center justify-between cursor-pointer"><span class="text-slate-300">$TICKER</span><input id="tmShowTicker" type="checkbox" class="w-4 h-4 accent-purple-500"></label>',
'<div id="tmColorRow" class="pt-3 border-t border-brand-border space-y-2">',
'<div class="flex items-center justify-between gap-2"><span class="text-slate-400 shrink-0">Address font</span><select id="tmCaFont" class="bg-brand-card text-slate-200 border border-brand-border rounded-lg px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-brand-accent"></select></div>',
'<div class="flex items-center justify-between gap-2"><span class="text-slate-400 shrink-0">Ticker font</span><select id="tmTkFont" class="bg-brand-card text-slate-200 border border-brand-border rounded-lg px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-brand-accent"></select></div>',
'<div class="flex items-center justify-between"><span class="text-slate-400">Text colour <span class="text-slate-500">(both lines)</span></span><span class="flex items-center gap-2"><span id="tmColorHex" class="text-slate-300">#FFFFFF</span><span id="tmColorSwatch" class="inline-block w-6 h-6 rounded border border-white/30" style="background:#FFFFFF"></span></span></div>',
'<input id="tmHue" type="range" min="0" max="1000" value="0">',
'<div id="tmWeightRow" class="pt-2 space-y-2">',
'<div class="flex items-center justify-between"><span class="text-slate-400">Font weight</span><span id="tmWeightVal" class="text-slate-300">700</span></div>',
'<input id="tmWeight" type="range" min="400" max="900" step="100" value="700">',
'</div>',
'</div></div></div>',

'<div><label class="block text-xs font-mono text-slate-400 mb-2">SIZE</label>',
'<div id="tmSizes" class="font-mono text-xs" style="display:grid;grid-auto-flow:row;grid-template-columns:repeat(5,minmax(0,1fr));gap:0.375rem"></div>',
'<div id="tmSizeGuideWrap" class="mt-2 text-[10px] font-mono" style="position:relative;display:inline-block">',
'<button id="tmSizeGuideBtn" class="text-brand-accent hover:text-white transition-colors" style="background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:2px">SIZE GUIDE</button>',
'<div id="tmSizeGuide" class="rounded-xl border border-brand-border bg-brand-card shadow-2xl" style="display:none;position:absolute;z-index:60;left:0;bottom:100%;margin-bottom:8px;width:392px;max-width:88vw;max-height:260px;overflow:auto;padding:12px"></div>',
'</div></div>',
'</div>',


'<div class="glass-panel rounded-2xl p-5 space-y-4">',
'<div class="flex items-center justify-between">',
'<div><span class="text-[10px] text-slate-400 font-mono block uppercase">Total Price</span><span id="priceUsd" class="text-2xl font-black text-white font-mono">$68.00</span></div>',
'<div class="text-right"><span class="text-[10px] text-slate-400 font-mono block uppercase">Crypto Approx.</span><span id="priceSol" class="text-xs font-mono text-brand-solana font-bold">-</span></div>',
'</div>',
'<button id="checkoutBtn" class="w-full bg-gradient-to-r from-brand-solana via-emerald-400 to-brand-cyber hover:opacity-95 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm"><i class="fa-solid fa-cart-shopping text-base"></i><span>ADD TO SHOPIFY CART</span></button>',
'</div></div>',

/* right column: preview */
'<div class="lg:col-span-7 lg:sticky lg:top-24">',

/* product slots, above the preview */
'<div class="glass-panel rounded-2xl p-5 mb-6">',
'<h3 class="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold border-b border-brand-border pb-2 mb-4 flex items-center justify-between"><span><i class="fa-solid fa-shirt text-brand-accent mr-2"></i> Product</span></h3>',
'<div id="tmProductGrid" class="font-mono text-xs" style="display:grid;grid-auto-flow:row;grid-template-columns:repeat(5,minmax(0,1fr));gap:0.5rem">',
PRODUCTS.map(function (p) { return '<button class="tm-product" data-product="' + p.id + '">' + p.label + '</button>'; }).join(''),
'</div>',
'<div id="tmDesc" class="mt-4 pt-3 border-t border-brand-border/60">',
'<div id="tmDescTitle" class="text-[10px] font-mono uppercase tracking-wider text-brand-accent/80 mb-1.5"></div>',
'<button id="tmSpecsToggle" class="mt-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors" style="display:none">+ Specs</button>',
'<ul id="tmSpecs" class="mt-2 text-[11px] leading-relaxed text-slate-500 m-0 pl-0" style="display:none;list-style:none"></ul>',
'</div>',
'</div>',

'<div class="glass-panel rounded-2xl p-6 relative flex flex-col items-center justify-center min-h-[520px]">',
'<div class="w-full flex items-center justify-between mb-4 text-xs font-mono border-b border-brand-border pb-3">',
'<div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded-full bg-brand-solana animate-ping"></span><span class="text-slate-300 font-bold uppercase tracking-wider">Preview</span></div>',
'</div>',
'<div class="relative w-full aspect-square max-w-[620px] mx-auto flex items-center justify-center bg-brand-bg/60 rounded-xl border border-brand-border/60 p-2 shadow-2xl">',
'<canvas id="mockupCanvas" width="1200" height="1200" class="w-full h-full object-contain rounded-lg"></canvas>',
/* Covers the canvas while Printful's template image is still in flight. Without it the
   renderer fell through to the drawn placeholder garment for a beat on every product
   switch, which read as a glitch. Layout is inline: Horizon overrides utility classes. */
'<div id="tmLoading" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:rgba(13,15,23,.72);border-radius:.75rem;z-index:5">',
'<div class="tm-spinner"></div>',
'<span class="font-mono uppercase" style="font-size:10px;letter-spacing:.12em;color:#64748b">Loading preview</span>',
'</div>',
'<div class="absolute top-3 right-3 bg-brand-card/90 border border-brand-border rounded-lg backdrop-blur" style="display:flex;align-items:center;gap:2px;padding:3px">',
'<button id="tmPrev" title="Previous view" class="w-7 h-7 rounded-md text-slate-300 hover:text-white hover:bg-brand-cardHover transition-all" style="display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-chevron-left text-[11px]"></i></button>',
'<span id="tmViewCount" class="text-[10px] font-mono text-slate-400" style="min-width:26px;text-align:center">1/2</span>',
'<button id="tmNext" title="Next view" class="w-7 h-7 rounded-md text-slate-300 hover:text-white hover:bg-brand-cardHover transition-all" style="display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-chevron-right text-[11px]"></i></button>',
'</div>',
'</div>',
'<div class="w-full mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] font-mono text-slate-500 pt-2 border-t border-brand-border/60">',
'<span class="flex items-center gap-x-3 gap-y-1 flex-wrap">',
'<span>Source <span id="sourceResText" class="text-slate-300">-</span></span>',
'<span>Print <span id="upscaleResText" class="text-slate-300">1800 x 1800 px</span></span>',
'<span id="tmPrintSizeLabel">12 x 12 in</span>',
'<span id="tmTechLabel" class="text-brand-accent/80">DTG</span>',
'<span id="tmDpiLabel" class="text-brand-solana/70">150 DPI</span>',
'</span>',
'</div>',
'<div id="tmQualityWarn" class="w-full mt-2 text-[11px] font-mono rounded-lg px-3 py-2" style="display:none;background:rgba(245,158,11,.10);border:1px solid rgba(245,158,11,.35);color:#fbbf24">',
'<i class="fa-solid fa-triangle-exclamation mr-1"></i><span id="tmQualityText"></span>',
'</div>',
'</div></div>',

'</div></main>',

/* architecture modal */
'<div id="archModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 hidden items-center justify-center p-4">',
'<div class="glass-panel max-w-3xl w-full rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-brand-border">',
'<div class="flex items-center justify-between border-b border-brand-border pb-3"><h3 class="text-lg font-bold text-white font-mono flex items-center gap-2"><i class="fa-solid fa-network-wired text-brand-accent"></i> How TokenMerch Works</h3><button id="closeArchBtn" class="text-slate-400 hover:text-white p-1 text-xl">&times;</button></div>',
'<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">',
'<div class="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-2"><div class="text-brand-solana font-bold text-sm">1. Token lookup</div><p class="text-slate-400">You paste a Solana contract address. We read the token name, ticker and artwork from DexScreener, falling back to Jupiter.</p></div>',
'<div class="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-2"><div class="text-brand-cyber font-bold text-sm">2. Print file</div><p class="text-slate-400">The design is rendered server-side as a 1800 x 1800 px transparent PNG, the exact print size Printful wants for this garment.</p></div>',
'<div class="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-2"><div class="text-brand-accent font-bold text-sm">3. Print on demand</div><p class="text-slate-400">Your order goes to Printful with that print file attached, and they print and ship it.</p></div>',
'</div></div></div>',

'<footer class="border-t border-brand-border py-4 text-center text-xs font-mono text-slate-500"><p>TokenMerch - powered by Solana and Printful</p></footer>'
].join('');

/* ---------------- state ---------------- */

var token = { ca: '', name: '', ticker: 'TOKEN', price: '-', change: '-', img: '', pair: '' };
var product = 'tee';
var garment = '#1b1b1c';
var colorName = '';
var curVariant = 0;
var style = 'centered';
var size = '';
var view = 0;            /* index into viewsFor(product) */
var showCA = false, showTicker = false, textColor = '#FFFFFF', textWeight = 700;
var inkTouched = false;   /* has the customer moved the colour slider themselves? */
var caFont = 'archivo', tickerFont = 'archivo';
var palettes = {};        /* product id -> { sizes, colors } from Printful */

var chartRange = 'm5', chartShown = null, chartData = null, chartTimer = null;
var chartCache = {}, chartPending = {}, chartHoverX = -1;
var CHART_TTL = 30000;   /* GeckoTerminal edge-caches on-chain data for 30 s */
/* When GeckoTerminal throttles us it answers WITHOUT an Access-Control-Allow-Origin
   header, so the browser reports a CORS failure and fetch rejects with a bare
   "Failed to fetch" -- the status never reaches us. Testing a message for 429 misses
   it entirely, so the old code read a throttle as a hiccup and stepped down to a finer
   candle, spending another call while already rate limited. Both now back off. */
var CHART_COOLDOWN = 90000;
var chartBlockedUntil = 0;
function chartThrottled(e) {
  var m = (e && e.message) || '';
  return /429/.test(m) || /failed to fetch|networkerror|load failed/i.test(m);
}

var canvas, ctx, logoImg = null, logoReady = false;
var modelImgs = {};
var tplCache = {};        /* 'product|placement' -> { t, img } */
var tplPending = {};      /* same key -> true while a fetch is in flight */
var tplFailed = {};       /* same key -> true once Printful has no usable template */

/* ---------------- token lookup ---------------- */

var ADDR = /[1-9A-HJ-NP-Za-km-z]{32,44}/;

function getJson(url) {
  return fetch(url).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}
function cleanTicker(s) { return String(s || 'TOKEN').replace(/^\$+/, ''); }
function fmtPrice(p) {
  p = parseFloat(p);
  if (!isFinite(p)) return 'n/a';
  if (p >= 1) return '$' + p.toFixed(2);
  if (p >= 0.01) return '$' + p.toFixed(4);
  if (p <= 0) return '$0';
  /* most memecoins are sub-cent: spell the number out to 3 significant
     digits instead of letting toPrecision turn it into 2.82e-7 */
  return '$' + p.toFixed(Math.min(12, 2 - Math.floor(Math.log10(p))));
}
function fmtChange(c) {
  c = parseFloat(c);
  if (!isFinite(c)) return '0%';
  return (c > 0 ? '+' : '') + c.toFixed(2) + '%';
}
function fromPairs(pairs, mint) {
  pairs = (pairs || []).filter(function (p) { return p && p.chainId === 'solana'; });
  if (!pairs.length) return null;
  pairs.sort(function (a, b) {
    return ((b.liquidity && b.liquidity.usd) || 0) - ((a.liquidity && a.liquidity.usd) || 0);
  });
  var p = pairs[0];
  var isQuote = !!(mint && p.quoteToken && p.quoteToken.address === mint);
  var t = isQuote ? p.quoteToken : p.baseToken;
  return {
    ca: t.address,
    name: t.name || 'Solana Token',
    ticker: cleanTicker(t.symbol),
    price: isQuote ? 'n/a' : fmtPrice(p.priceUsd),
    change: isQuote ? '0%' : fmtChange(p.priceChange && p.priceChange.h24),
    img: (!isQuote && p.info && p.info.imageUrl) || '',
    pair: p.pairAddress || '',
    /* every pool, richest first. The chart provider does not index all of them -- a
       pool quoted in something other than SOL or a stablecoin is often missing -- so
       the chart walks this list rather than giving up on the top one. */
    pools: pairs.map(function (x) { return x.pairAddress; }).filter(Boolean),
    /* DexScreener's own 24 h volume, used only to tell "nobody is trading this" apart
       from "our chart provider has no data for this pool" */
    vol24: (p.volume && p.volume.h24) || 0
  };
}
function fromJupiter(mint) {
  return getJson('https://lite-api.jup.ag/tokens/v2/search?query=' + mint).then(function (d) {
    var t = (d || []).filter(function (x) { return x.id === mint; })[0];
    if (!t) return null;
    return {
      ca: t.id, name: t.name || 'Solana Token', ticker: cleanTicker(t.symbol),
      price: fmtPrice(t.usdPrice), change: fmtChange(t.stats24h && t.stats24h.priceChange),
      img: t.icon || '', pair: ''
    };
  });
}
function lookup(raw) {
  raw = String(raw || '').trim();
  var m = raw.match(ADDR);
  if (!m) return Promise.reject(new Error('No Solana address found in what you pasted.'));
  var addr = m[0];
  var first = /dexscreener\.com/i.test(raw)
    ? Promise.resolve(null)
    : getJson('https://api.dexscreener.com/tokens/v1/solana/' + addr)
        .then(function (d) { return fromPairs(d, addr); })
        .catch(function () { return null; });
  return first.then(function (t) {
    if (t) return t;
    return getJson('https://api.dexscreener.com/latest/dex/pairs/solana/' + addr)
      .then(function (d) { return fromPairs(d.pairs || (d.pair ? [d.pair] : [])); })
      .catch(function () { return null; });
  }).then(function (t) {
    if (t && t.img) return t;
    return fromJupiter(t ? t.ca : addr).catch(function () { return null; }).then(function (j) {
      if (!t) return j;
      if (j && j.img) t.img = j.img;
      return t;
    });
  }).then(function (t) {
    if (t && !t.img) t.img = 'https://placehold.co/600x600/151922/14F195?text=' + encodeURIComponent(t.ticker);
    return t;
  });
}

/* ---- picking the sharpest source ------------------------------------------
   DexScreener and Jupiter disagree about which holds the better artwork, and neither
   wins often enough to simply order them. Measured over ten established tokens:
   DexScreener loaded 10/10 in under 70 ms and was the larger 8 times; Jupiter loaded
   only 3/10 -- half the tokens had no icon at all, and its IPFS gateways (ipfs.io,
   nftstorage.link) never answered, while every arweave.net one did -- but when Jupiter
   won it won big: BONK 192 -> 640, TRUMP 800 -> 2811.

   So render from DexScreener at once, because it is fast and always there, then race
   Jupiter in the background and swap only if its image really is larger. A dead gateway
   costs one request nobody waited on. Both candidates are measured at the moment of
   comparison rather than trusting whichever probe happened to land first. */
var artBest = {};   /* ca -> the sharpest url found for it */

function measureImage(url, ms) {
  return new Promise(function (res) {
    if (!url) return res(0);
    var img = new Image(), done = false;
    var t = setTimeout(function () { if (!done) { done = true; res(0); } }, ms || 2500);
    function finish(w) { if (!done) { done = true; clearTimeout(t); res(w); } }
    img.onload = function () { finish(img.naturalWidth || 0); };
    img.onerror = function () { finish(0); };
    img.src = url;
  });
}

function useArtwork(ca, url) {
  if (!token || token.ca !== ca || !url) return;
  token.img = url;
  var el = document.getElementById('tokenImgSidebar');
  if (el) el.src = url;
  loadLogo(url);
}

function upgradeArtwork(t) {
  if (!t || !t.ca) return;
  var known = artBest[t.ca];
  if (known) {
    /* Already decided for this token, so apply the answer instead of racing again.
       This branch matters: every fresh lookup resets token.img to DexScreener's url,
       so without it a second paste of the same address quietly lost the upgrade. */
    if (known !== t.img) useArtwork(t.ca, known);
    return;
  }
  artBest[t.ca] = t.img;            /* provisional -- what is on screen right now */
  fromJupiter(t.ca).catch(function () { return null; }).then(function (j) {
    if (!j || !j.img || j.img === t.img) return null;
    return Promise.all([measureImage(t.img, 3000), measureImage(j.img, 2500)]).then(function (r) {
      if (r[1] > r[0]) {
        artBest[t.ca] = j.img;
        useArtwork(t.ca, j.img);    /* no-ops if the customer has moved on */
      }
    });
  });
}

function fetchToken(raw) {
  var btn = document.getElementById('fetchBtnText');
  var spin = document.getElementById('fetchSpinner');
  btn.innerText = 'Loading...';
  spin.classList.remove('hidden');
  return lookup(raw).then(function (t) {
    if (!t) { alert('Could not find that token on DexScreener or Jupiter. Double-check the contract address.'); return; }
    token = t;
    document.getElementById('caInput').value = t.ca;
    updateTokenUI();
  }).catch(function (err) {
    console.error('Token lookup error:', err);
    alert('Token lookup failed: ' + err.message);
  }).then(function () {
    btn.innerText = 'Drop';
    spin.classList.add('hidden');
  });
}

function updateTokenUI() {
  document.getElementById('tokenName').innerText = token.name;
  document.getElementById('tokenTicker').innerText = '$' + token.ticker;
  document.getElementById('tokenCaDisplay').innerText = token.ca;
  document.getElementById('tokenImgSidebar').src = token.img;
  loadChart();
  loadLogo(token.img);
  upgradeArtwork(token);
}

function loadLogo(url) {
  logoReady = false;
  setStatus('<i class="fa-solid fa-spinner fa-spin text-brand-accent"></i> Loading artwork...');
  /* Measure the ORIGINAL first. The resizer below returns whatever size it is asked
     for, so the Source line used to read "1200 x 1200" for a 400 px token and the
     quality check had nothing real to go on. */
  srcW = 0; srcH = 0;
  var probe = new Image();
  probe.onload = function () {
    srcW = probe.naturalWidth || 0; srcH = probe.naturalHeight || 0;
    updateSourceLabel(); render(); start();
  };
  probe.onerror = function () { updateSourceLabel(); start(); };
  probe.src = url;

  function start() {
    /* Ask for what the source actually has rather than a flat 1200, which was quietly
       throwing away a 2811 px icon. Floored at 1200 so a thin source still arrives
       smoothly resampled, capped at 3000 so nothing silly comes back. */
    var want = Math.max(1200, Math.min(3000, srcW || 0));
    var tries = [
      'https://wsrv.nl/?url=' + encodeURIComponent(url) + '&w=' + want + '&h=' + want + '&fit=cover&output=png',
      url
    ];
    var i = 0;
    function attempt() {
      if (i >= tries.length) {
        logoImg = null; logoReady = false;
        setStatus('<i class="fa-solid fa-triangle-exclamation text-amber-400"></i> Artwork unavailable');
        render();
        return;
      }
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        logoImg = img; logoReady = true;
        setStatus('<i class="fa-solid fa-circle-check text-brand-solana"></i> Ready');
        updateSourceLabel();
        render();
      };
      img.onerror = function () { i++; attempt(); };
      img.src = tries[i];
    }
    attempt();
  }
}

function setStatus(html) {
  var el = document.getElementById('canvasStatusText');
  if (el) el.innerHTML = html;
}

/* ---------------- drawing ----------------
   The design is drawn into a square "print area" of width W.
   All positions are fractions of W, so the same code serves the
   small garment preview, the zoomed-in view and any future layout. */

function fitFont(p, text, weight, family, maxW, cap) {
  p.font = weight + ' 100px ' + family;
  var w = p.measureText(text).width || 1;
  return Math.min(cap, 100 * maxW / w);
}

/* The printed text can use any of these. Each is pulled from Google Fonts
   the first time it is picked, not up front, so choosing a font costs one
   request and the page starts with only the default. */
var FONTS = [
  /* the family really is "Archivo Black" -- Black is its weight -- but next to a colour
     picker it reads as one, so the menu just says ARCHIVO. */
  { id: 'archivo', label: 'ARCHIVO', css: '"Archivo Black", sans-serif', google: 'Archivo+Black', weights: [400] },
  { id: 'chakra', label: 'CHAKRA PETCH', css: '"Chakra Petch", sans-serif', google: 'Chakra+Petch', weights: [400, 500, 600, 700] },
  { id: 'inter', label: 'INTER', css: '"Inter", sans-serif', google: 'Inter', weights: [400, 500, 600, 700, 800, 900] },
  { id: 'grotesk', label: 'SPACE GROTESK', css: '"Space Grotesk", sans-serif', google: 'Space+Grotesk', weights: [400, 500, 600, 700] },
  { id: 'mono', label: 'SPACE MONO', css: '"Space Mono", monospace', google: 'Space+Mono', weights: [400, 700] }
];

var DEFAULT_FONT = 'archivo';

function fontById(id) {
  var i;
  for (i = 0; i < FONTS.length; i++) if (FONTS[i].id === id) return FONTS[i];
  for (i = 0; i < FONTS.length; i++) if (FONTS[i].id === DEFAULT_FONT) return FONTS[i];
  return FONTS[0];
}

/* a font may not ship the weight the slider is on, so snap to its nearest */
function nearestWeight(f, w) {
  var best = f.weights[0];
  for (var i = 0; i < f.weights.length; i++) {
    if (Math.abs(f.weights[i] - w) < Math.abs(best - w)) best = f.weights[i];
  }
  return best;
}

var fontAsked = { archivo: true };
function ensureFont(f) {
  if (fontAsked[f.id]) return;
  fontAsked[f.id] = true;
  var href = 'https://fonts.googleapis.com/css2?family=' + f.google +
    (f.weights.length > 1 ? ':wght@' + f.weights.join(';') : '') + '&display=swap';
  var l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  l.onload = function () {
    if (document.fonts && document.fonts.load) {
      Promise.all(f.weights.map(function (w) {
        return document.fonts.load(w + ' 16px ' + f.css);
      })).then(render, render);
    } else {
      render();
    }
  };
  document.head.appendChild(l);
}

/* contract address on one line, then the big $TICKER under it.
   caW is how wide the address line is allowed to run; tickerW sizes
   the $TICKER. Both use the website's own fonts: JetBrains Mono for
   the address, Inter for the ticker. */
function drawCaption(p, cx, tickerW, caW, top, caLines, art, IN) {
  if (!showCA && !showTicker) return top;
  p.save();
  p.fillStyle = inkColor();
  p.textAlign = 'center';
  p.textBaseline = 'top';
  var y = top + tickerW * 0.05;

  function drawTicker() {
    if (!showTicker || !token.ticker) return;
    var t = '$' + token.ticker;
    var tf = fontById(tickerFont), twt = nearestWeight(tf, textWeight);
    /* The ticker is the headline, so it is capped as a share of the artwork's width
       rather than simply fitted to it -- otherwise a three-letter ticker grows to fill
       six inches and swamps everything under it. */
    var fs = fitFont(p, t, twt, tf.css, tickerW, tickerW * ((art && art.tickerCap) || 0.22));
    p.font = twt + ' ' + fs + 'px ' + tf.css;
    p.fillText(t, cx, y);
    y += fs * 1.1;
  }

  function drawAddr() {
    if (!showCA || !token.ca) return;
    var cf = fontById(caFont), cwt = nearestWeight(cf, textWeight);
    /* A 44-character address squeezed into a narrow graphic prints at well under half a
       millimetre of stroke, which is below the safe range for fabric. Two lines roughly
       doubles it. The split is now forced whenever one line would fall under
       ART.caMinIn, not only when the caller asks for it. */
    var one = fitFont(p, token.ca, cwt, cf.css, caW, caW * 0.075);
    var minPx = IN ? ART.caMinIn * IN : 0;
    if ((caLines === 2 || (minPx && one < minPx)) && token.ca.length > 24) {
      var cut = Math.ceil(token.ca.length / 2);
      var l1 = token.ca.slice(0, cut), l2 = token.ca.slice(cut);
      var fs2 = Math.min(fitFont(p, l1, cwt, cf.css, caW, caW * 0.10),
                         fitFont(p, l2, cwt, cf.css, caW, caW * 0.10));
      p.font = cwt + ' ' + fs2 + 'px ' + cf.css;
      p.fillText(l1, cx, y); y += fs2 * 1.12;
      p.fillText(l2, cx, y); y += fs2 * 1.5;
    } else {
      p.font = cwt + ' ' + one + 'px ' + cf.css;
      p.fillText(token.ca, cx, y);
      y += one * 1.5;
    }
  }

  /* the poster leads with the ticker and sets the address under it; the garments keep
     the original order, where the address sits tight under the artwork */
  if (art && art.tickerFirst) { drawTicker(); y += tickerW * 0.03; drawAddr(); }
  else { drawAddr(); drawTicker(); }

  p.restore();
  return y;
}

/* contract address curved along the bottom of a round badge.
   Returns the y of the lowest point the text reaches. */
function drawArcCA(p, cx, cy, r, W) {
  var text = token.ca;
  if (!text) return cy + r;
  var gap = r * 0.16;
  var span = 2.97;                                  /* ~170 deg of wrap */
  var af = fontById(caFont), awt = nearestWeight(af, textWeight);
  p.font = awt + ' 100px ' + af.css;
  var adv = p.measureText(text).width / 100;        /* advance per 1px of font */
  var denom = adv - span * 0.45;
  var fs = denom > 0 ? Math.min(span * (r + gap) / denom, W * 0.05) : r * 0.2;
  p.save();
  p.font = awt + ' ' + fs + 'px ' + af.css;
  p.fillStyle = inkColor();
  p.textAlign = 'center';
  p.textBaseline = 'middle';
  var rMid = r + gap + fs * 0.45;
  var widths = [], total = 0, i;
  for (i = 0; i < text.length; i++) {
    var w = p.measureText(text.charAt(i)).width;
    widths.push(w);
    total += w;
  }
  /* y grows downward, so a larger angle is further left: start at the
     left end of the arc and walk right, each glyph turned to sit on the
     curve with its top facing the badge */
  var a = Math.PI / 2 + (total / rMid) / 2;
  for (i = 0; i < text.length; i++) {
    var th = a - (widths[i] / 2) / rMid;
    p.save();
    p.translate(cx + rMid * Math.cos(th), cy + rMid * Math.sin(th));
    p.rotate(th - Math.PI / 2);
    p.fillText(text.charAt(i), 0, 0);
    p.restore();
    a -= widths[i] / rMid;
  }
  p.restore();
  return cy + rMid + fs * 0.6;
}

/* draws the artwork + text into a square print area of width W */
/* Both styles that print on the back and mark the chest. */
function twoSided() {
  return style === 'back-badge' || style === 'back-ticker';
}

/* Only products with a back placement can offer the two-sided styles. */
/* Which print styles a product offers. Two gates: a product with no back placement
   cannot do the two-sided styles, and a product may narrow the list further with its
   own `styles` array, which an unusual shape may need -- an all-over panel that runs
   shoulder to hem, say, where a centred graphic would land at the waist. */
function styleAllowed(p, v) {
  if ((v === 'back-badge' || v === 'back-ticker') && !p.backPrint) return false;
  if (p.styles && p.styles.indexOf(v) < 0) return false;
  return true;
}

/* A product may also narrow the size list Printful returns, the same way `styles`
   narrows the print styles. Printful's size list is still the source of truth for what
   exists and for the variant ids; this only decides what the store puts on sale. */
function sizesFor(p, all) {
  if (!p || !p.sizes || !all) return all || [];
  return all.filter(function (z) { return p.sizes.indexOf(z) >= 0; });
}

/* Every placement the store knows how to print, in menu order. A product offers the
   subset its own `styles` list names and may relabel any of them -- the joggers call
   theirs by leg rather than by chest side. */
var STYLE_OPTS = [
  ['centered',       'CENTERED GRAPHIC IMAGE'],
  ['centered-small', 'CENTERED GRAPHIC IMAGE SMALL'],
  ['badge-left',     'IMAGE BADGE LEFT'],
  ['badge-right',    'IMAGE BADGE RIGHT'],
  ['square-left',    'IMAGE BADGE LEFT (SQUARE)'],
  ['square-right',   'IMAGE BADGE RIGHT (SQUARE)'],
  ['back-badge',     'BACK PRINT + CHEST BADGE'],
  ['back-ticker',    'BACK PRINT + TICKER BADGE']
];

/* The menu is rebuilt per product rather than greyed out. A disabled option still reads
   as something the customer nearly has -- six entries with four struck through on the
   tank taught nothing except that the store could not do it. */
function paintStyleOptions() {
  var sel = document.getElementById('printStyleSelect');
  if (!sel) return;
  var p = productById(product);
  var lbl = p.styleLabels || {};
  var list = STYLE_OPTS.filter(function (o) { return styleAllowed(p, o[0]); });
  if (!list.length) list = [['centered', 'CENTERED GRAPHIC IMAGE']];
  sel.innerHTML = list.map(function (o) {
    return '<option value="' + o[0] + '">' + (lbl[o[0]] || o[1]) + '</option>';
  }).join('');
  /* if the style we arrived on is not offered here, fall back to the first that is */
  if (!styleAllowed(p, style)) { style = list[0][0]; view = 0; }
  sel.value = style;
}

/* The chest mark: either the logo roundel with the ticker under it, or the ticker on
   its own. No address either way, since that lives on the back. Wearer's left is the
   right-hand side of a front view. */
/* ---- print placement, in real inches -----------------------------------
   Researched against the industry standard; sources in claude/print-placement.md.
     - full-front graphic: top of the art about 3 in below the collar
     - left-chest mark: 3-4 in wide, centre 3.5-4 in from centre front,
       centre about 2.5-3 in below the collar
   Those are quoted off a crew neck, so they are restated here against the
   SHOULDER LINE, which is the same on every garment: a crew tee's collar sits
   2.28 in below it, so "3 in below the collar" is 5.3-5.5 in below the shoulder.
   Nothing can print above Printful's print area, so where the area starts too
   low (the men's hoodie at 4.94 in, the tank at 6.34 in) the mark is clamped
   to the top of the area and sits lower than the standard asks. */
var PLACE = {
  /* 2.6 in is deliberately under the published 3-4 in left-chest range. At a true
     3.5 in the mark read as oversized against these garments in the preview, so it
     was taken down ~26% by eye. Still inside the wider 2.5-5 in range Printify
     quotes, and the position rules below are unchanged. */
  badgeDia: 2.60,         /* in, left-chest mark */
  badgeFromCentre: 3.75,  /* in, mark centre to centre front (standard 3.5-4) */
  badgeCentreDrop: 5.50,  /* in below the shoulder line */
  artTopDrop: 5.30,       /* in below the shoulder line, top of a centred graphic */
  minMargin: 0.15         /* in, keep ink off the very edge of the print area */
};

/* pixels per inch inside a design canvas that is `inW` inches wide */
function perInch(W, inW) { return W / (inW || 12); }

/* Cut-and-sew panels are printed oversized: a 34x38 panel file covers only about
   20x22 in of VISIBLE garment once seam allowance and the wrap around the sides are
   taken off. Placement is specified in real inches, so layout has to use the visible
   scale or a 2.6 in badge comes out at roughly 1.5 in. `placeScale` is file inches
   per visible inch; every product in the store today is 1. */
function placeInW(pr, inches) { return inches.w / (pr.placeScale || 1); }

/* ---- how big the artwork prints -------------------------------------------
   The token image is whatever the chain gave us. Measured across 52 trending Solana
   tokens: 2% under 300 px, 17% at 400, 21% at 500-690, 60% at 800+. Printing every one
   of them at the same size means the thin ones go soft, so the centred graphic shrinks
   until the pixels carry it, down to a floor. A badge is small enough never to need it.

   Nothing upstream will catch a thin source for us: we always generate the print file
   at its full pixel size (1800x2400 for a 12x16 tee), so Printful's own check -- which
   looks at file dimensions -- passes an upscaled 400 px token without comment. */
var ART = {
  targetDpi: 110,   /* print the artwork at this when it has the pixels */
  dynMin: 4.5,      /* in, the smallest the centred graphic will shrink to */
  caMinIn: 0.16     /* in, smallest font size the address may print at */
};
var srcW = 0, srcH = 0;   /* the artwork's TRUE pixel size, not the upscaled copy */
var artIn = 0;            /* in, what the last render actually drew */

/* 'centered-small' is 76% of 'centered' and has to STAY that way. Scaling only the big
   one meant that on a thin source the big graphic hit its 4.5 in floor while the small
   one sat at its fixed 5.0 in -- so picking "small" printed LARGER than picking "big".
   Both now come off the same computed size. */
var SMALL_RATIO = 0.4167 / 0.55;

function artSizeIn(pr, inW, small) {
  var a = pr && pr.art;
  var max = (a && a.size) || 0.55 * inW;
  var S;
  if (a && a.fixed) S = max;             /* the poster: one size, always */
  else if (!srcW) S = max;               /* nothing measured yet */
  else {
    /* the floor can never exceed the ceiling -- the stickers' area is smaller than it */
    var floor = Math.min(ART.dynMin, max);
    S = Math.max(floor, Math.min(max, srcW / ART.targetDpi));
  }
  return small ? S * SMALL_RATIO : S;
}

/* ---- ink colour -----------------------------------------------------------
   The colour picker starts at #FFFFFF, which is right on a black tee and invisible on
   anything light: a poster is white paper and the mug is white glaze, so the ticker and
   the address were being drawn in white on white. Until the customer moves the slider
   themselves, the ink follows whatever it is printing on. */
function substrateHex() {
  var pr = productById(product);
  if (pr.sheet) return '#FFFFFF';
  if (pr.color) return pr.color;
  return garment || '#1b1b1c';
}

function isLightHex(hex) {
  var h = String(hex || '').replace('#', '');
  if (h.length !== 6) return false;
  var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/* every draw reads this rather than textColor, so it follows a colour change with no
   re-binding and no stale value */
function inkColor() {
  /* Pure black rather than near-black so the automatic colour is exactly reachable on
     the slider: spectrumHex puts white at 0 and black at 1000, the two flat ends. */
  return inkTouched ? textColor : (isLightHex(substrateHex()) ? '#000000' : '#FFFFFF');
}

/* Keep the control honest: while the ink is automatic, park the slider on the end it
   is actually using -- white on a dark garment, black on a white one -- so the picker
   never shows something different from what is being drawn. Setting .value in script
   fires no input event, so this cannot be mistaken for the customer taking over. */
function syncInkSlider() {
  if (inkTouched) return;
  var light = isLightHex(substrateHex());
  var el = document.getElementById('tmHue');
  if (el) el.value = light ? 1000 : 0;
  var hx = document.getElementById('tmColorHex');
  var sw = document.getElementById('tmColorSwatch');
  if (hx) hx.innerText = inkColor() + ' auto';
  if (sw) sw.style.background = inkColor();
}

/* Below this the warning fires. Fabric hides softness that paper shows -- ink wicks
   into cotton and the weave is a texture in its own right -- so DTG gets a lower bar. */
function minDpiFor(pr) {
  if (pr && pr.minDpi) return pr.minDpi;
  return /DTG|DTF/i.test(((printFor(pr) || {}).tech || '')) ? 80 : 100;
}

/* Everything the print renderer needs to reproduce exactly what is on screen. The
   server used to re-derive all of this -- and re-look-up the token -- which is how the
   two drifted apart. It now receives resolved numbers and renders them. */
function printParams(pr, side) {
  var inches = (side === 'back' && pr.back) ? pr.back : printFor(pr);
  var a = pr.art || {};
  var q = {
    ca: token.ca || '',
    style: style,
    side: side === 'back' ? 'back' : 'front',
    showCA: showCA ? '1' : '0',
    showTicker: showTicker ? '1' : '0',
    color: inkColor().replace('#', ''),
    w: Math.round(inches.w * inches.dpi),
    h: Math.round(inches.h * inches.dpi),
    dpi: inches.dpi,
    scale: pr.placeScale || 1,
    shTop: pr.shTop == null ? '' : pr.shTop,
    caFont: caFont,
    tickerFont: tickerFont,
    weight: textWeight,
    img: token.img || '',
    srcW: srcW || 0,
    artIn: +artIn.toFixed(4),
    caMin: ART.caMinIn
  };
  if (pr.leg) {
    q.legDia = pr.leg.dia;
    if (pr.leg.top != null) q.legTop = pr.leg.top; else q.legBottom = pr.leg.bottom;
  }
  if (a.top != null) q.artTop = a.top;
  if (a.tickerFirst) q.tickerFirst = '1';
  if (a.tickerCap) q.tickerCap = a.tickerCap;
  return q;
}

function printUrl(pr, side) {
  var q = printParams(pr, side), parts = [];
  Object.keys(q).forEach(function (k) {
    if (q[k] === '' || q[k] == null) return;
    parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(q[k]));
  });
  return API + '/api/print?' + parts.join('&');
}

function updateQuality() {
  var box = document.getElementById('tmQualityWarn');
  if (!box) return;
  var txt = document.getElementById('tmQualityText');
  var dpi = (srcW && artIn) ? Math.round(srcW / artIn) : 0;
  if (!dpi || dpi >= minDpiFor(productById(product))) { box.style.display = 'none'; return; }
  if (txt) txt.innerText = 'The token image source may result in a suboptimal print \u2014 ' +
    srcW + ' px artwork printed at ' + artIn.toFixed(1) + ' in is about ' + dpi + ' DPI.';
  box.style.display = 'block';
}

function updateSourceLabel() {
  var el = document.getElementById('sourceResText');
  if (!el) return;
  if (srcW) el.innerText = srcW + ' x ' + (srcH || srcW) + ' px';
  else if (logoImg) el.innerText = (logoImg.naturalWidth || '?') + ' x ' + (logoImg.naturalHeight || '?') + ' px';
  else el.innerText = '-';
}

/* Keep a mark `half` inches wide (half-width) inside the print area when it is
   pushed `off` inches off centre. The curved contract address wraps well outside
   the badge, and at 3.75 in off centre it ran past the edge of a 12 in area. */
function clampOffset(off, half, inW) {
  var limit = (inW || 12) / 2 - half;
  return Math.max(0, Math.min(off, limit));
}

/* Where something lands inside the print area, given that the area itself starts
   `pr.shTop` inches below the shoulder line. `drop` is the target distance below
   the shoulder; `half` is half the mark's height when the target is its centre. */
function dropInArea(pr, drop, half) {
  /* the mug, poster and stickers have no shoulder line to measure from, so their art
     just sits a little inside the top of its print area. Note the test is for an
     ABSENT shTop, not a falsy one: an all-over panel starts at the shoulder seam, so
     a shTop of 0 is meaningful. */
  if (!pr || pr.shTop == null) return Math.max(PLACE.minMargin, 0.9 - (half || 0));
  return Math.max(PLACE.minMargin, drop - pr.shTop - (half || 0));
}

function drawChestBadge(p, W, tickerOnly, inW) {
  var IN = perInch(W, inW);
  var pr = productById(product);
  var s = PLACE.badgeDia * IN;
  var y = dropInArea(pr, PLACE.badgeCentreDrop, PLACE.badgeDia / 2) * IN;
  /* the mark sits on the wearer's left, which is the right of a front view */
  var off = clampOffset(PLACE.badgeFromCentre, PLACE.badgeDia * 0.6, inW);
  var cx = W / 2 + off * IN, cy = y + s / 2;
  var x = cx - s / 2;
  var tb = '$' + (token.ticker || '');
  var bf = fontById(tickerFont), bwt = nearestWeight(bf, textWeight);

  if (tickerOnly) {
    if (!token.ticker) return;
    var fs = fitFont(p, tb, bwt, bf.css, s * 1.45, s * 0.52);
    p.save();
    p.fillStyle = inkColor();
    p.textAlign = 'center';
    p.textBaseline = 'middle';
    p.font = bwt + ' ' + fs + 'px ' + bf.css;
    p.fillText(tb, cx, cy);
    p.restore();
    return;
  }

  if (!logoReady || !logoImg) return;
  p.save();
  p.beginPath();
  p.arc(cx, cy, s / 2, 0, Math.PI * 2);
  p.clip();
  p.drawImage(logoImg, x, y, s, s);
  p.restore();
  if (showTicker && token.ticker) {
    var fsb = fitFont(p, tb, bwt, bf.css, s * 1.2, s * 0.26);
    p.save();
    p.fillStyle = inkColor();
    p.textAlign = 'center';
    p.textBaseline = 'top';
    p.font = bwt + ' ' + fsb + 'px ' + bf.css;
    p.fillText(tb, cx, y + s + s * 0.06);
    p.restore();
  }
}

/* A wrap or an all-over panel is far wider than it is tall. A centred graphic sized off
   the canvas WIDTH -- correct for a garment front, where the area is portrait -- runs
   straight off such an area, so those size the art off the HEIGHT and centre the whole
   block vertically instead of hanging it from the standard top drop. */
function wideArea(p) {
  return !!(p && p.canvas && p.canvas.height && p.canvas.height < p.canvas.width * 0.8);
}

function drawDesign(p, W, side, inW) {
  var IN = perInch(W, inW);
  var top = dropInArea(productById(product), PLACE.artTopDrop, 0) * IN;
  if (twoSided() && productById(product).backPrint) {
    if (side === 'front') { drawChestBadge(p, W, style === 'back-ticker', inW); return; }
    /* the back carries the full centred artwork */
    if (logoReady && logoImg) {
      var sb = 0.55 * W, xb = 0.225 * W, yb = top;
      artIn = sb / IN;
      p.drawImage(logoImg, xb, yb, sb, sb);
      drawCaption(p, W / 2, sb, sb, yb + sb);
      return;
    }
  }
  if (logoReady && logoImg) {
    var prT = productById(product);
    if (prT.tile) {
      artIn = prT.tile.art;
      drawTiles(p, W, inW, prT.tile);
      return;
    }
    /* A leg mark. The area is a narrow vertical strip, so there is no left/right offset
       to make inside it -- the strip IS the side. Centred across the 3.5 in, anchored up
       from the bottom of the area so it lands just above the cuff, and square or round
       depending on the style. The address goes underneath on two lines; an arc around
       the circle, as on the chest, would run straight off a 3.5 in area. */
    var legCfg = prT.leg;
    if (legCfg) {
      var HL = p.canvas.height;
      var sqL = (style === 'square-left' || style === 'square-right');
      var sL = legCfg.dia * IN;
      artIn = legCfg.dia;
      var yL = legCfg.top != null
        ? legCfg.top * IN
        : Math.max(PLACE.minMargin * IN, HL - (legCfg.bottom + legCfg.dia) * IN);
      p.save();
      if (!sqL) {
        p.beginPath();
        p.arc(W / 2, yL + sL / 2, sL / 2, 0, Math.PI * 2);
        p.clip();
      }
      p.drawImage(logoImg, (W - sL) / 2, yL, sL, sL);
      p.restore();
      drawCaption(p, W / 2, sL, W * 0.96, yL + sL, 2, null, IN);
      return;
    }
    if (style === 'badge-left' || style === 'badge-right') {
      /* badge-left prints on the wearer's left chest, which is the
         right-hand side of a front view; badge-right is its mirror */
      var s1 = PLACE.badgeDia * IN;
      artIn = PLACE.badgeDia;
      var y1 = dropInArea(productById(product), PLACE.badgeCentreDrop, PLACE.badgeDia / 2) * IN;
      var off1 = clampOffset(PLACE.badgeFromCentre, PLACE.badgeDia * 0.76, inW);
      var bcx = W / 2 + (style === 'badge-left' ? off1 : -off1) * IN;
      var bcy = y1 + s1 / 2;
      var x1 = bcx - s1 / 2;
      p.save();
      p.beginPath();
      p.arc(bcx, bcy, s1 / 2, 0, Math.PI * 2);
      p.clip();
      p.drawImage(logoImg, x1, y1, s1, s1);
      p.restore();
      var below = y1 + s1;
      if (showCA && token.ca) below = drawArcCA(p, bcx, bcy, s1 / 2, W);
      if (showTicker && token.ticker) {
        var tb = '$' + token.ticker;
        var bf = fontById(tickerFont), bwt = nearestWeight(bf, textWeight);
        var fsb = fitFont(p, tb, bwt, bf.css, s1 * 1.2, s1 * 0.26);
        p.save();
        p.fillStyle = inkColor();
        p.textAlign = 'center';
        p.textBaseline = 'top';
        p.font = bwt + ' ' + fsb + 'px ' + bf.css;
        p.fillText(tb, bcx, below + s1 * 0.06);
        p.restore();
      }
    } else if (style === 'centered-small') {
      /* small graphic: the address is split over two lines so it fits the image
         and still prints large enough to read */
      var H2 = p.canvas.height;
      var s2 = wideArea(p) ? 0.45 * H2 : artSizeIn(productById(product), inW, true) * IN;
      var x2 = (W - s2) / 2;
      var y2 = wideArea(p) ? Math.max(0, (H2 - s2 * 1.5) / 2) : top;
      artIn = s2 / IN;
      p.drawImage(logoImg, x2, y2, s2, s2);
      drawCaption(p, W / 2, s2, s2, y2 + s2, 2, null, IN);
    } else {
      /* big centred graphic: the address stays inside the image's width */
      var H3 = p.canvas.height;
      var pr3 = productById(product);
      var s3 = wideArea(p) ? 0.62 * H3 : artSizeIn(pr3, inW) * IN;
      var x3 = (W - s3) / 2;
      var y3 = wideArea(p) ? Math.max(0, (H3 - s3 * 1.34) / 2)
             : ((pr3.art && pr3.art.top != null) ? pr3.art.top * IN : top);
      artIn = s3 / IN;
      p.drawImage(logoImg, x3, y3, s3, s3);
      drawCaption(p, W / 2, s3, s3, y3 + s3, 0, pr3.art, IN);
    }
  } else {
    var HE = p.canvas.height, wE = wideArea(p);
    var r = wE ? 0.22 * HE : 0.1875 * W, cx = W / 2, cy = wE ? HE * 0.42 : top + r;
    p.fillStyle = '#14F195';
    p.beginPath();
    p.arc(cx, cy, r, 0, Math.PI * 2);
    p.fill();
    p.fillStyle = '#0d0f17';
    var ff = fontById(tickerFont);
    p.font = nearestWeight(ff, textWeight) + ' ' + 0.0667 * W + 'px ' + ff.css;
    p.textAlign = 'center';
    p.textBaseline = 'middle';
    p.fillText('$' + token.ticker, cx, cy);
    drawCaption(p, cx, wE ? 2 * r : 0.375 * W, wE ? 2.4 * r : W * 0.8, cy + r);
  }
}

function designCanvas(W, H, side, inW) {
  var c = document.createElement('canvas');
  c.width = W; c.height = H || W;
  drawDesign(c.getContext('2d'), W, side, inW);
  return c;
}

/* Inches of the print area the preview composites into. Now that everything prints
   DTG this is always the product's own print area -- the mockup template describes
   exactly what we print on. `tplIn` is kept as an override in case a product ever
   prints on an area the template does not show again. */
/* A product's print area can depend on the size picked -- the mug's band is 3.5 in on
   the 11 oz and 3.8 on the 15 -- so nothing should read `.print` directly. */
function printFor(pr) {
  if (pr && pr.printBySize && pr.printBySize[size]) return pr.printBySize[size];
  return pr && pr.print;
}
function tplInches(pr) { return (pr.tplIn || printFor(pr)); }

/* How much taller this size's mug is than the photographed one. */
function sizeStretch(m) {
  return (m && m.stretchBySize && m.stretchBySize[size]) || 1;
}

/* The same cylinder, scaled vertically about the point where the mug meets the surface,
   so a taller capacity grows upward out of the same base rather than floating. */
function stretchCyl(cy, st) {
  if (st === 1) return cy;
  var base = cy.yBase + cy.bBase;
  var f = function (y) { return base + (y - base) * st; };
  return { cx: cy.cx, a: cy.a,
           yRim: f(cy.yRim), bRim: cy.bRim * st,
           yBase: f(cy.yBase), bBase: cy.bBase * st,
           mTop: cy.mTop * st, mBot: cy.mBot * st };
}

/* simple drawn t-shirt / mug, in an 800-unit space */
function drawCartoonGarment(p, k) {
  var pr = productById(product);
  var body = pr.color || garment;
  p.fillStyle = body;
  if (pr.shape === 'mug') {
    p.beginPath(); p.roundRect(240 * k, 180 * k, 320 * k, 460 * k, 35 * k); p.fill();
    p.strokeStyle = body; p.lineWidth = 44 * k;
    p.beginPath(); p.arc(220 * k, 410 * k, 90 * k, 0.5 * Math.PI, 1.5 * Math.PI); p.stroke();
    p.strokeStyle = 'rgba(255,255,255,0.2)'; p.lineWidth = 6 * k;
    p.beginPath(); p.ellipse(400 * k, 180 * k, 160 * k, 20 * k, 0, 0, Math.PI * 2); p.stroke();
    return;
  }
  p.beginPath(); p.roundRect(140 * k, 140 * k, 520 * k, 620 * k, 35 * k); p.fill();
  p.beginPath(); p.roundRect(60 * k, 170 * k, 130 * k, 340 * k, 30 * k); p.fill();
  p.beginPath(); p.roundRect(610 * k, 170 * k, 130 * k, 340 * k, 30 * k); p.fill();
  p.fillStyle = '#0a0c12';
  p.beginPath(); p.arc(400 * k, 140 * k, 85 * k, 0, Math.PI); p.fill();
  p.strokeStyle = '#272d3f'; p.lineWidth = 4 * k;
  p.beginPath(); p.arc(400 * k, 140 * k, 83 * k, 0, Math.PI); p.stroke();
}

/* The print area is often not square (a tank is tall, a mug is wide), and the design
   is square, so fit the largest centred square inside it. Template coordinates. */
function printSquare(tpl) {
  var s = Math.min(tpl.print_area_width, tpl.print_area_height);
  var pr = productById(product);
  /* the art is top-anchored, so the close-up frames the top of the area rather than its
     middle -- except on a leg, where the mark hangs off the BOTTOM of a 14.5 in strip and
     framing the top would show nothing but blank fabric */
  var y = tpl.print_area_top;
  if (pr.leg) {
    /* and the crop is not the strip's width either: the mark is 2.6 in but the address
       and ticker underneath need the rest of `leg.bottom`, so the close-up is as tall as
       the whole block and spills a little onto the fabric either side of the strip. */
    var pxIn = tpl.print_area_width / printFor(pr).w;
    if (pr.leg.top != null) {
      s = Math.round((pr.leg.top + pr.leg.dia + 1.65) * pxIn);
      y = tpl.print_area_top;
    } else {
      s = Math.round((pr.leg.dia + pr.leg.bottom + 0.45) * pxIn);
      y = tpl.print_area_top + tpl.print_area_height - s + Math.round(0.1 * pxIn);
    }
  }
  return { s: s, x: tpl.print_area_left + (tpl.print_area_width - s) / 2, y: y };
}

function printRect(tpl) {
  return {
    x: tpl.print_area_left, y: tpl.print_area_top,
    w: tpl.print_area_width, h: tpl.print_area_height
  };
}

/* The gallery: two canvas composites for every product, plus any calibrated
   model photos that product has.

   NOTE: no product carries a `models` array any more. Photographs only existed for the
   tee and the tank, and a gallery where two slots out of ten had people in them and the
   rest did not read as inconsistent -- so every product is composites only, and every
   product reads 1/2 (1/3 on the two-sided styles).

   The model machinery below is left intact and inert: loadModel / modelComposite /
   renderModel, the 'model' view kind, and the flat-mockup branch here. Re-enabling it is
   a matter of putting a `models` array back on a product. The calibration numbers for the
   four photos we had are in claude/model-shots.md, and the pipeline that produces more is
   documented there too. */
function viewsFor(p) {
  var ms = p.models || [];
  /* a flat photo is tagged with the side it shows; untagged means the front */
  function flatFor(side) {
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].flat && (ms[i].side || 'front') === side) return i;
    }
    return -1;
  }
  var flatIdx = flatFor('front');
  var flatBack = flatFor('back');
  var v = [];
  /* two-sided style: the artwork is on the back, a small badge on the chest */
  if (twoSided() && p.backPrint) {
    if (flatIdx >= 0 && flatBack >= 0) {
      /* no template for this product, so both sides come off calibrated photos */
      v.push({ kind: 'model', idx: flatBack, side: 'back', label: 'Back print' });
      v.push({ kind: 'model', idx: flatIdx, side: 'front', label: 'Chest badge' });
      v.push({ kind: 'zoom', side: 'back', from: flatBack, label: 'Print close-up' });
    } else {
      v.push({ kind: 'front', side: 'back', label: 'Back print' });
      v.push({ kind: 'front', side: 'front', label: 'Chest badge' });
      v.push({ kind: 'zoom', side: 'back', from: -1, label: 'Print close-up' });
    }
    ms.forEach(function (m, j) { if (!m.flat) v.push({ kind: 'model', idx: j, label: m.label || 'On model' }); });
    return v;
  }
  /* Printful's template photo is a flat laydown for some products and a worn torso for
     others, which made the first view inconsistent. A calibrated Flat mockup wins when
     the product has one. */
  if (flatIdx >= 0) {
    /* `noFull` drops the tight framing, leaving the pulled-back one to lead */
    if (!ms[flatIdx].noFull) {
      v.push({ kind: 'model', idx: flatIdx, side: 'front', label: ms[flatIdx].label || 'Full garment' });
    }
  } else {
    v.push({ kind: 'front', label: 'Full garment' });
  }
  /* a product may ask for a second, pulled-back framing of the same composite */
  if (flatIdx >= 0 && ms[flatIdx].wide) {
    v.push({ kind: 'model', idx: flatIdx, side: 'front', fit: ms[flatIdx].wide,
             label: ms[flatIdx].wideLabel || 'Wide shot' });
  }
  v.push({ kind: 'zoom', label: 'Print close-up', from: flatIdx, side: 'front' });
  ms.forEach(function (m, j) {
    if (!m.flat) v.push({ kind: 'model', idx: j, label: m.label || 'On model' });
  });
  return v;
}

/* A photo can't be recoloured, so for products where colour matters we render the flat
   shot once per colour and pick the file that matches the swatch. */
function slugify(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function modelSrc(m) {
  if (m && m.byColor && colorName) {
    var sl = slugify(colorName);
    if (!m.colorSlugs || m.colorSlugs.indexOf(sl) >= 0) return m.byColor + sl + '.webp';
  }
  return m ? m.src : '';
}

/* true when this view really is showing the colour the customer picked */
function modelMatchesColor(m) {
  if (!m) return true;
  if (m.byColor && colorName) {
    var sl = slugify(colorName);
    if (!m.colorSlugs || m.colorSlugs.indexOf(sl) >= 0) return true;
  }
  return !m.shotIn || !colorName || m.shotIn === colorName;
}

function loadModel(src) {
  if (modelImgs[src]) return;
  var img = new Image();
  modelImgs[src] = img;
  img.onload = function () { render(); };
  img.onerror = function () { console.warn('Model photo failed:', src); };
  img.src = API + src;
}

/* Draws the square design onto a model photo using the measured print-area map.
   The default is source-over, because printed ink is opaque and that is the only mode
   that stays accurate across a whole colour range: screen washes the design out on a
   light garment, multiply kills it on a dark one. Worn shots on dark fabric set
   blend: 'screen' so the folds lift through the print. */
function modelComposite(m, C, side) {
  var img = modelImgs[modelSrc(m)];
  var c = document.createElement('canvas');
  c.width = C; c.height = C;
  var p = c.getContext('2d');
  p.fillStyle = '#ffffff';
  p.fillRect(0, 0, C, C);
  if (!img || !img.complete || !img.naturalWidth) return null;
  var st = sizeStretch(m);
  if (st !== 1 && m.cyl) {
    /* stretch about the base line, so the mug grows upward off the same surface */
    var baseY = (m.cyl.yBase + m.cyl.bBase) * C;
    p.save();
    p.translate(0, baseY); p.scale(1, st); p.translate(0, -baseY);
    p.drawImage(img, 0, 0, C, C);
    p.restore();
  } else {
    p.drawImage(img, 0, 0, C, C);
  }
  /* The affine maps the print area's unit square onto the photo, so the design canvas
     has to carry that area's own aspect or the artwork comes out stretched. It used to
     be a fixed 512 square, which was fine only because every model photo was a 12x16
     garment whose square design box happened to match. */
  var pr = productById(product);
  var inches = (side === 'back' && pr.back) ? pr.back : tplInches(pr);
  /* the cylinder warp resamples column by column and squeezes the design towards the
     edges, so it needs more source pixels than the affine does */
  var DW = m.cyl ? 1536 : 512;
  var DH = Math.max(1, Math.round(DW * inches.h / inches.w));
  var D = designCanvas(DW, DH, side, placeInW(pr, inches));
  if (m.cyl) { cylWrap(p, stretchCyl(m.cyl, st), C, D); return c; }
  var vTop = m.vTop == null ? 0 : m.vTop;
  var vH = m.vH == null ? 1 : m.vH;
  p.save();
  p.globalCompositeOperation = m.blend || 'source-over';
  p.transform(m.ax * C / DW, m.ay * C / DW, m.bx * vH * C / DH, m.by * vH * C / DH,
    (m.x0 + m.bx * vTop) * C, (m.y0 + m.by * vTop) * C);
  p.drawImage(D, 0, 0);
  p.restore();
  return c;
}

/* Wraps the design around a cylinder instead of mapping it with an affine.
   A mug is not a flat panel: the print file is 9 in of CIRCUMFERENCE, so horizontal
   position across the visible face goes through sin(theta) and the artwork compresses
   towards both silhouette edges. The top and bottom of the band follow the rim and base
   ellipses, which is why they bow -- a horizontal circle seen slightly from above
   projects to an ellipse, lowest at the centre of the near side.

   `cyl` is in fractions of the photo's width: cx/a are the body's centre and half-width,
   yRim/yBase the two ellipse centres with bRim/bBase their semi-minor axes, mTop/mBot
   the margins that inset the print band from rim and base.

   Drawn with MULTIPLY, unlike the flat model shots: the mug is white and glossy, so the
   photograph's own shading and highlights have to come through the ink or the print
   looks like a sticker lying on top of the photo. */
function cylWrap(p, cy, C, D) {
  var cx = cy.cx * C, a = cy.a * C;
  var yT0 = (cy.yRim + cy.mTop) * C, yB0 = (cy.yBase - cy.mBot) * C;
  var bT = cy.bRim * C, bB = cy.bBase * C;
  var w = document.createElement('canvas');
  w.width = C; w.height = C;
  var q = w.getContext('2d');
  var DW = D.width, DH = D.height;
  var x0 = Math.ceil(cx - a) + 1, x1 = Math.floor(cx + a) - 1;
  for (var X = x0; X <= x1; X++) {
    var th = Math.asin(Math.max(-1, Math.min(1, (X - cx) / a)));
    var u = 0.5 + th / (2 * Math.PI);
    var u2 = 0.5 + Math.asin(Math.max(-1, Math.min(1, (X + 1 - cx) / a))) / (2 * Math.PI);
    /* how much of the design this one output column covers: tiny at the centre,
       wide at the edges, which is the compression */
    var sw = Math.max(0.5, (u2 - u) * DW);
    var c = Math.cos(th);
    var yT = yT0 + bT * c, yB = yB0 + bB * c;
    /* 1.02 wide, not 1: a hairline overlap, or the columns show seams */
    q.drawImage(D, u * DW, 0, sw, DH, X, yT, 1.02, yB - yT);
  }
  p.save();
  p.globalCompositeOperation = 'multiply';
  p.drawImage(w, 0, 0);
  p.restore();
}

/* The print square's bounding box in photo coordinates, so the close-up can crop to it. */
function modelPrintBox(m, C) {
  if (m.cyl) {
    /* only the middle of the wrap is ever facing us, so the close-up frames a square
       the height of the band, centred on the front of the mug. The band moves with the
       size, so this has to read the stretched cylinder, not the photographed one. */
    var cy = stretchCyl(m.cyl, sizeStretch(m));
    var yT = (cy.yRim + cy.mTop) * C;
    var yB = (cy.yBase - cy.mBot + cy.bBase) * C;
    var hh = yB - yT;
    return { x: cy.cx * C - hh / 2, y: yT, w: hh, h: hh };
  }
  var vTop = m.vTop == null ? 0 : m.vTop, vH = m.vH == null ? 1 : m.vH;
  var xs = [], ys = [];
  [[0, vTop], [1, vTop], [0, vTop + vH], [1, vTop + vH]].forEach(function (uv) {
    xs.push((m.x0 + uv[0] * m.ax + uv[1] * m.bx) * C);
    ys.push((m.y0 + uv[0] * m.ay + uv[1] * m.by) * C);
  });
  var x1 = Math.min.apply(null, xs), x2 = Math.max.apply(null, xs);
  var y1 = Math.min.apply(null, ys), y2 = Math.max.apply(null, ys);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function renderModel(m, crop, side, fit) {
  var C = canvas.width;
  if (!modelImgs[modelSrc(m)]) loadModel(modelSrc(m));
  var c = modelComposite(m, C, side || 'front');
  /* the photo is fetched like a template is, so hold the spinner rather than flashing
     a blank white square while it arrives */
  if (!c) { setLoading(true); ctx.fillStyle = '#0d0f17'; ctx.fillRect(0, 0, C, C); return; }
  setLoading(false);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, C, C);
  if (!crop) {
    /* `fit` pulls the camera back: the composite is drawn smaller inside the frame.
       1 (or absent) is the normal full view. */
    if (fit && fit !== 1) {
      var fw = C * fit, fo = (C - fw) / 2;
      ctx.drawImage(c, 0, 0, C, C, fo, fo, fw, fw);
    } else {
      ctx.drawImage(c, 0, 0);
    }
    return;
  }
  var b = modelPrintBox(m, C);
  /* named `box`, not `side`: that is the parameter above, and reusing it here worked
     only by accident of ordering */
  /* leave fabric around the print, like the template close-up. A wrap already frames
     tightly, so those set their own smaller factor. */
  var box = Math.max(b.w, b.h) * (m.zoom || 1.7);
  var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  ctx.drawImage(c, cx - box / 2, cy - box / 2, box, box, 0, 0, C, C);
}

function setLoading(on) {
  var el = document.getElementById('tmLoading');
  if (el) el.style.display = on ? 'flex' : 'none';
}

/* Where each sticker sits on the sheet, in inches. Shared by the print file and by the
   preview's cut outlines so the two can never disagree. */
function tileRects(t, inW, inH) {
  var gx = (inW - t.cell * t.cols) / (t.cols + 1);
  var gy = (inH - t.cell * t.rows) / (t.rows + 1);
  var out = [];
  for (var r = 0; r < t.rows; r++) {
    for (var c = 0; c < t.cols; c++) {
      out.push({ x: gx + c * (t.cell + gx), y: gy + r * (t.cell + gy), s: t.cell });
    }
  }
  return out;
}

/* One sticker: a single opaque rounded square, which is the object Printful cuts
   around. Everything -- artwork, ticker, address -- sits inside it, because an element
   drawn outside would be cut out as a sticker of its own. */
function drawTile(p, S, IN, t) {
  p.save();
  p.beginPath();
  p.roundRect(0, 0, S, S, t.radius * IN);
  p.fillStyle = '#ffffff';
  p.fill();
  p.clip();
  var aS = t.art * IN, aTop = t.artTop * IN;
  p.drawImage(logoImg, (S - aS) / 2, aTop, aS, aS);
  /* The address is given the whole cell's width rather than the artwork's, and forced
     onto two lines: at this size one line of 44 characters prints at about 6 pt, which
     is under the safe range. Two lines put it at roughly 12 pt. */
  drawCaption(p, S / 2, aS, S - 0.14 * IN, aTop + aS + t.gap * IN, 2,
              { tickerFirst: true }, IN);
  p.restore();
}

function drawTiles(p, W, inW, t) {
  var IN = perInch(W, inW);
  var inH = p.canvas.height / IN;
  tileRects(t, inW, inH).forEach(function (r) {
    p.save();
    p.translate(r.x * IN, r.y * IN);
    drawTile(p, r.s * IN, IN, t);
    p.restore();
  });
}

/* ---- flat sheet products --------------------------------------------------
   A poster is a piece of paper: no shape to model and nothing to wrap. Printful's
   template for one is the same flat "Safe Print area" guide the mug gets -- a dashed
   rectangle with a caption under it -- and the preview was compositing the artwork onto
   that, caption and all, over a black fill. So the sheet is drawn here instead. */
function sheetBox(pr, C, pad) {
  var inches = printFor(pr);
  var ar = inches.w / inches.h;
  var avail = C * (1 - pad * 2);
  var w = avail, h = w / ar;
  if (h > avail) { h = avail; w = h * ar; }
  return { x: (C - w) / 2, y: (C - h) / 2, w: w, h: h, inches: inches };
}

function sheetComposite(pr, C) {
  var b = sheetBox(pr, C, 0.075);
  var c = document.createElement('canvas');
  c.width = C; c.height = C;
  var p = c.getContext('2d');
  p.fillStyle = '#0d0f17';
  p.fillRect(0, 0, C, C);
  p.save();
  p.shadowColor = 'rgba(0,0,0,.55)';
  p.shadowBlur = C * 0.03;
  p.shadowOffsetY = C * 0.012;
  p.fillStyle = pr.backing || '#ffffff';
  p.fillRect(b.x, b.y, b.w, b.h);
  p.restore();
  p.drawImage(designCanvas(Math.round(b.w), Math.round(b.h), 'front', b.inches.w), b.x, b.y);
  /* Preview only: the stickers are white on white backing, so without this the sheet
     reads as one solid block. Drawn on the COMPOSITE, never into the design canvas, so
     it cannot reach the print file. */
  if (pr.tile) {
    var per = b.w / b.inches.w;
    p.save();
    p.strokeStyle = 'rgba(15,23,42,.22)';
    p.setLineDash([per * 0.06, per * 0.05]);
    p.lineWidth = Math.max(1, per * 0.008);
    tileRects(pr.tile, b.inches.w, b.inches.h).forEach(function (r) {
      p.beginPath();
      p.roundRect(b.x + r.x * per, b.y + r.y * per, r.s * per, r.s * per, pr.tile.radius * per);
      p.stroke();
    });
    p.restore();
  }
  return { canvas: c, box: b };
}

function renderSheet(p, C, zoom) {
  var pr = productById(product);
  var r = sheetComposite(pr, C);
  setLoading(false);
  if (!zoom) { p.drawImage(r.canvas, 0, 0); return; }
  /* close-up on the printed block, so the address can be read */
  var b = r.box, a = pr.art || {};
  var perIn = b.w / b.inches.w;
  var size, top, box, cx, cy;
  if (pr.tile) {
    /* one sticker, not the whole sheet */
    var one = tileRects(pr.tile, b.inches.w, b.inches.h)[0];
    box = one.s * perIn * 1.18;
    cx = b.x + (one.x + one.s / 2) * perIn;
    cy = b.y + (one.y + one.s / 2) * perIn;
    p.fillStyle = pr.backing || '#ffffff';
    p.fillRect(0, 0, C, C);
    p.drawImage(r.canvas, cx - box / 2, cy - box / 2, box, box, 0, 0, C, C);
    return;
  }
  size = (a.size || 0.55 * b.inches.w) * perIn;
  top = (a.top != null ? a.top : 0.9) * perIn;
  box = size * 1.5;
  cx = b.x + b.w / 2; cy = b.y + top + size * 0.78;
  p.fillStyle = '#ffffff';
  p.fillRect(0, 0, C, C);
  p.drawImage(r.canvas, cx - box / 2, cy - box / 2, box, box, 0, 0, C, C);
}

function render() {
  renderInner();
  updateQuality();
}

function renderInner() {
  if (!canvas) return;
  var C = canvas.width;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, C, C);

  var vs = viewsFor(productById(product));
  if (view >= vs.length) view = 0;
  var cur = vs[view];
  var side = cur.side || 'front';
  var hit = tplGet(side);
  if (!hit && !productById(product).noTpl) loadTemplate(product, side);
  var tpl = hit ? hit.t : null, tplImg = hit ? hit.img : null;
  var hasTpl = !!(tpl && tplImg);

  /* The template arrives over the network, so for the first frames after a product switch
     there is nothing real to draw. Show the spinner rather than the drawn placeholder
     garment, which looked like the preview had broken. Products that genuinely have no
     template (noTpl) or whose template failed to load still use the drawn one. */
  var key = tplKey(productById(product), side);
  if (!hasTpl && !productById(product).noTpl && !tplFailed[key]) {
    setLoading(true);
    ctx.fillStyle = '#0d0f17';
    ctx.fillRect(0, 0, C, C);
    ctx.restore();
    return;
  }
  setLoading(false);

  if (productById(product).sheet) {
    renderSheet(ctx, C, cur.kind === 'zoom');
    ctx.restore();
    return;
  }

  if (cur.kind === 'model') {
    renderModel(productById(product).models[cur.idx], false, cur.side, cur.fit);
    ctx.restore();
    return;
  }

  if (cur.kind === 'zoom' && cur.from >= 0) {
    renderModel(productById(product).models[cur.from], true, cur.side);
    ctx.restore();
    return;
  }

  if (cur.kind === 'zoom') {
    /* close-up of just the print area, so the fine print is readable */
    var pad = 0.10;
    var photoZ = productById(product).photoTpl;
    /* The close-up fills with the GARMENT colour even behind a photo template, unlike the
       full view, which fills white and reads as a catalogue shot. A leg is narrower than the
       block printed on it, so the crop runs off the edge of the garment -- and against the
       photo's white surround a white mark simply vanished. */
    ctx.fillStyle = garment;
    ctx.fillRect(0, 0, C, C);
    if (hasTpl) {
      var q = printSquare(tpl);
      var rct = printRect(tpl);
      var inches = tplInches(productById(product));
      var m = q.s * pad;
      var cx0 = q.x - m, cy0 = q.y - m;
      var cw = q.s + 2 * m;
      var k = C / cw;
      var ratio = tplImg.naturalWidth / tpl.template_width;
      var D = designCanvas(Math.round(rct.w * k), Math.round(rct.h * k), side, placeInW(productById(product), inches));
      if (photoZ) ctx.drawImage(tplImg, cx0 * ratio, cy0 * ratio, cw * ratio, cw * ratio, 0, 0, C, C);
      ctx.drawImage(D, (rct.x - cx0) * k, (rct.y - cy0) * k, rct.w * k, rct.h * k);
      ctx.globalAlpha = 1;
      if (!photoZ) ctx.drawImage(tplImg, cx0 * ratio, cy0 * ratio, cw * ratio, cw * ratio, 0, 0, C, C);
    } else {
      var inset = C * pad;
      ctx.drawImage(designCanvas(Math.round(C - inset * 2), 0, side, tplInches(productById(product)).w), inset, inset);
    }
    ctx.restore();
    return;
  }

  if (hasTpl) {
    var kk = C / tpl.template_width;
    var prF = productById(product);
    var q2 = printRect(tpl);
    var inches2 = tplInches(prF);
    var pw = Math.round(q2.w * kk), ph = Math.round(q2.h * kk);
    var DF = designCanvas(pw, ph, side, placeInW(prF, inches2));
    /* A ghost template is a semi-transparent overlay: fill the garment colour, lay the
       design in the print area, then drop the ghost over both. A photo template is an
       opaque picture of the real garment in the real colour, so there is nothing to fill
       and the design goes on top of it instead. */
    ctx.fillStyle = prF.photoTpl ? '#ffffff' : (garment || tpl.background_color || '#0c0c0c');
    ctx.fillRect(0, 0, C, C);
    if (prF.photoTpl) ctx.drawImage(tplImg, 0, 0, C, C);
    ctx.drawImage(DF, q2.x * kk, q2.y * kk, pw, ph);
    if (!prF.photoTpl) ctx.drawImage(tplImg, 0, 0, C, C);
    ctx.restore();
    return;
  }

  /* drawn t-shirt / mug */
  var k2 = C / 800;
  drawCartoonGarment(ctx, k2);
  var rect = productById(product).shape === 'mug'
    ? { x: 260 * k2, y: 230 * k2, w: 280 * k2 }
    : { x: 160 * k2, y: 200 * k2, w: 480 * k2 };
  ctx.drawImage(designCanvas(Math.round(rect.w), 0, 'front', tplInches(productById(product)).w), rect.x, rect.y, rect.w, rect.w);
  ctx.restore();
}

/* ---------------- controls ---------------- */

function spectrumHex(p) {
  if (p <= 0.06) return '#FFFFFF';
  if (p >= 0.94) return '#000000';
  var h = (p - 0.06) / 0.88 * 360, c = 255;
  var x = Math.round(255 * (1 - Math.abs(h / 60 % 2 - 1))), r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return '#' + [r, g, b].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('').toUpperCase();
}

var ON = 'px-2 py-2 rounded-lg border border-brand-accent bg-brand-accent/20 text-white font-bold transition-all text-center flex items-center justify-center leading-tight text-[10px]';
var OFF = 'px-2 py-2 rounded-lg border border-dashed border-brand-border/80 bg-brand-bg/50 text-slate-300 hover:border-brand-accent hover:text-white transition-all text-center flex items-center justify-center leading-tight text-[10px]';
var SZ_ON = 'py-2 rounded-lg border border-brand-accent bg-brand-accent/20 text-white font-bold transition-all text-center';
var SZ_OFF = 'py-2 rounded-lg border border-brand-border text-slate-300 hover:border-brand-accent transition-all text-center';

function paintProductButtons() {
  [].forEach.call(document.querySelectorAll('.tm-product'), function (b) {
    b.className = 'tm-product ' + (b.getAttribute('data-product') === product ? ON : OFF);
  });
}
function paintSizes() {
  [].forEach.call(document.querySelectorAll('.tm-size'), function (b) {
    b.className = 'tm-size ' + (b.getAttribute('data-size') === size ? SZ_ON : SZ_OFF);
  });
}
function paintColors() {
  [].forEach.call(document.querySelectorAll('.tm-color'), function (b) {
    var on = b.getAttribute('data-color') === colorName;
    b.className = 'tm-color focus:outline-none transition-all ' +
      (on ? 'ring-2 ring-brand-accent border-2 border-white' : 'border border-white/20');
  });
}
/* Colours and sizes come straight from Printful's catalog, per product. The template
   image is colour-independent: the garment colour is the fill underneath it, so
   switching colour costs nothing and needs no new request. */
/* Printful writes a blurb for every product: an intro paragraph, then bullet specs.
   Worth showing -- it is the only place the customer learns what the garment actually
   is. Cached per product id; the endpoint caches upstream for a day as well. */
var descCache = {}, specsOpen = false;

function loadDesc(id) {
  var pr = productById(id);
  if (!pr) return;
  if (descCache[pr.pid] !== undefined) { paintDesc(id); return; }
  descCache[pr.pid] = null;                       /* in flight */
  paintDesc(id);
  getJson(API + '/api/catalog?id=' + pr.pid).then(function (d) {
    descCache[pr.pid] = (d && d.product) || {};
    if (product === id) paintDesc(id);
  }).catch(function (e) {
    descCache[pr.pid] = {};
    console.warn('No description for ' + id + ':', e.message);
    if (product === id) paintDesc(id);
  });
}

function paintDesc(id) {
  var pr = productById(id);
  var d = descCache[pr.pid];
  var tEl = document.getElementById('tmDescTitle');
  var sEl = document.getElementById('tmSpecs');
  var gEl = document.getElementById('tmSpecsToggle');
  if (!tEl || !sEl || !gEl) return;

  /* Printful's marketing paragraph is deliberately not shown -- the name and the specs
     are the parts a customer can act on. */
  if (!d) { tEl.innerText = 'Loading\u2026'; sEl.style.display = 'none'; gEl.style.display = 'none'; return; }

  /* Printful's type_name usually already opens with the brand and model -- "Comfort
     Colors 1717 | Adult Ringspun Cotton Tee" -- so printing both says it twice. Where
     it does not lead with the name it is taxonomy ("Mug | Glossy | Ceramic | White"),
     which tells a customer nothing, so the name alone wins. */
  var name = [d.brand, d.model].filter(Boolean).join(' ') || pr.label;
  var full = d.type || '';
  tEl.innerText = (full && full.toLowerCase().indexOf(name.toLowerCase()) === 0) ? full : name;

  var bullets = [];
  String(d.description || '').split('\n').forEach(function (ln) {
    var t = ln.trim();
    if (t.charAt(0) !== '\u2022') return;
    t = t.replace(/^\u2022\s*/, '');
    /* Where the blank was manufactured is Printful's business, not the customer's.
       Covers both wordings: "Blank product sourced from Pakistan" on the garments and
       "Paper is sourced from Japan" on the poster. */
    if (/\bsourced from\b/i.test(t)) return;
    bullets.push(t);
  });

  sEl.innerHTML = bullets.map(function (b) {
    return '<li style="padding-left:0.85em;text-indent:-0.85em">\u00b7 ' + escapeHtml(b) + '</li>';
  }).join('');
  gEl.style.display = bullets.length ? 'block' : 'none';
  sEl.style.display = (bullets.length && specsOpen) ? 'block' : 'none';
  gEl.innerText = (specsOpen ? '\u2212' : '+') + ' Specs';
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function loadPalette(id) {
  var p = productById(id || product);
  if (palettes[p.id]) { applyPalette(p.id); return; }
  getJson(API + '/api/catalog?colors=' + p.pid).then(function (d) {
    if (!d || !d.colors) throw new Error((d && d.error) || 'no colours');
    palettes[p.id] = d;
    if (product === p.id) applyPalette(p.id);
  }).catch(function (e) {
    console.warn('No colour list for ' + p.id + ':', e.message);
  });
}

/* Pick the colour and size that the product's default variant actually is. */
function applyPalette(id) {
  var p = productById(id);
  var d = palettes[p.id];
  if (!d) return;
  var hit = null;
  d.colors.forEach(function (c) {
    Object.keys(c.ids).forEach(function (sz) { if (c.ids[sz] === p.vid) hit = { c: c, size: sz }; });
  });
  var c0 = hit ? hit.c : d.colors[0];
  colorName = c0.name;
  garment = c0.code || '#1b1b1c';
  /* the default variant's own size, but only if the store offers it */
  var sz = sizesFor(p, d.sizes);
  size = (hit && sz.indexOf(hit.size) >= 0 ? hit.size : null) ||
         (sz.indexOf('M') >= 0 ? 'M' : sz[0]);
  buildPalette();
  syncInkSlider();  /* the default colour decides which end the ink sits on */
  updateZoomUI();   /* the "shown in" note depends on the colour we just picked */
  render();
}

function buildPalette() {
  var d = palettes[product];
  var cw = document.getElementById('tmColors');
  var sw = document.getElementById('tmSizes');
  if (!d) { cw.innerHTML = ''; sw.innerHTML = ''; return; }
  cw.innerHTML = d.colors.map(function (c) {
    return '<button class="tm-color" data-color="' + c.name + '" title="' + c.name +
      '" style="background:' + (c.code || '#888') + ';width:26px;height:26px;border-radius:9999px;flex:0 0 auto"></button>';
  }).join('');
  sw.innerHTML = sizesFor(productById(product), d.sizes).map(function (z) {
    return '<button class="tm-size" data-size="' + z + '">' + z + '</button>';
  }).join('');
  paintColors(); paintSizes(); updateVariant();
}

function colorEntry() {
  var d = palettes[product];
  if (!d) return null;
  for (var i = 0; i < d.colors.length; i++) if (d.colors[i].name === colorName) return d.colors[i];
  return d.colors[0];
}

function updateVariant() {
  var c = colorEntry();
  curVariant = (c && c.ids[size]) || productById(product).vid;
  var el = document.getElementById('tmColorName');
  if (el) el.innerText = colorName ? '\u00b7 ' + colorName : '';
}

/* Printful publishes a measurement table per product. Shown on hover under the size
   row; loaded the first time it is opened and cached per product. */
var sizeGuides = {}, guidePinned = false;

function loadSizeGuide() {
  var p = productById(product);
  if (sizeGuides[p.id]) { paintSizeGuide(); return; }
  paintSizeGuide();
  getJson(API + '/api/catalog?sizes=' + p.pid).then(function (d) {
    sizeGuides[p.id] = d;
    if (product === p.id) paintSizeGuide();
  }).catch(function (e) {
    sizeGuides[p.id] = { failed: e.message };
    if (product === p.id) paintSizeGuide();
  });
}

function trim(v) {
  var n = parseFloat(v);
  return isNaN(n) ? '-' : (Math.round(n * 10) / 10);
}

function paintSizeGuide() {
  var box = document.getElementById('tmSizeGuide');
  if (!box) return;
  var d = sizeGuides[product];
  if (!d) { box.innerHTML = '<div class="text-slate-400">Loading...</div>'; return; }
  if (d.failed || !(d.tables || []).length) {
    box.innerHTML = '<div class="text-slate-400">No size guide for this item.</div>';
    return;
  }
  var t = null;
  d.tables.forEach(function (x) { if (!t && x.type === 'product_measure') t = x; });
  if (!t) t = d.tables[0];
  var sizes = d.availableSizes || [];
  var head = '<tr><th style="text-align:left"></th>' + sizes.map(function (z) {
    return '<th style="padding:0 3px;color:#cbd5e1;font-weight:600">' + z + '</th>';
  }).join('') + '</tr>';
  var rows = t.measurements.map(function (m) {
    var by = {};
    m.values.forEach(function (v) {
      by[v.size] = v.value || (v.min && v.max ? trim(v.min) + '-' + trim(v.max) : (v.min || v.max || ''));
    });
    return '<tr><td style="color:#94a3b8;padding-right:6px;white-space:nowrap">' + m.label + '</td>' +
      sizes.map(function (z) {
        return '<td style="padding:0 3px;text-align:center;color:#e2e8f0">' + (by[z] ? trim(by[z]) : '-') + '</td>';
      }).join('') + '</tr>';
  }).join('');
  box.innerHTML =
    '<div style="color:#94a3b8;margin-bottom:6px;letter-spacing:.08em">' +
      (t.type === 'product_measure' ? 'MEASURED FLAT' : 'MEASURE YOURSELF') + ' (' + t.unit + ')</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:10px">' + head + rows + '</table>' +
    '<div style="color:#64748b;margin-top:8px;font-size:9px">Supplier figures; actual sizes can vary slightly.</div>';
}

/* The print specs under the preview, straight from the product's chosen placement. */
/* What the spec line reports, which is not always the print area: a sticker sheet's
   area is the sheet, and nobody is buying a sheet. */
function specFor(pr) {
  return (pr && pr.spec) || printFor(pr);
}

function updateSpecs() {
  var p0 = productById(product);
  var pr = (twoSided() && p0.backPrint && p0.back) ? p0.back : specFor(p0);
  if (!pr) return;
  var t = document.getElementById('tmTechLabel');
  var sz = document.getElementById('tmPrintSizeLabel');
  var up = document.getElementById('upscaleResText');
  var dp = document.getElementById('tmDpiLabel');
  if (t) t.innerText = pr.tech + ((twoSided() && p0.backPrint) ? ' / BACK + CHEST' : '');
  if (sz) sz.innerText = pr.w + ' x ' + pr.h + ' in' + (pr.note ? ' \u00b7 ' + pr.note : '');
  if (up) up.innerText = Math.round(pr.w * pr.dpi) + ' x ' + Math.round(pr.h * pr.dpi) + ' px';
  if (dp) dp.innerText = pr.dpi + ' DPI';
}

function updatePrice() {
  var base = productById(product).price;
  document.getElementById('priceUsd').innerText = '$' + base + '.00';
  document.getElementById('priceSol').innerText = '~ ' + (base / 155).toFixed(2) + ' SOL';
}
function updateZoomUI() {
  var p = productById(product);
  var vs = viewsFor(p);
  if (view >= vs.length) view = 0;
  document.getElementById('tmViewCount').innerText = (view + 1) + '/' + vs.length;
  var label = vs[view].label;
  /* A model photo is a real render in one colour; the flat composite is the one that
     follows the colour picker. Say so rather than quietly showing the wrong colour. */
  var m = vs[view].kind === 'model' ? (p.models || [])[vs[view].idx]
        : (vs[view].kind === 'zoom' && vs[view].from >= 0 ? (p.models || [])[vs[view].from] : null);
  if (m && !modelMatchesColor(m)) label += ' \u00b7 shown in ' + m.shotIn;
  var lab = document.getElementById('tmViewLabel');   /* removed from the markup; the
     arrows either side of the counter already say which view you are on */
  if (lab) lab.innerText = label;
}
function step(d) {
  var vs = viewsFor(productById(product));
  view = (view + d + vs.length) % vs.length;
  var cur = vs[view];
  var ms = productById(product).models || [];
  if (cur.kind === 'model') loadModel(modelSrc(ms[cur.idx]));
  if (cur.kind === 'zoom' && cur.from >= 0) loadModel(modelSrc(ms[cur.from]));
  updateZoomUI(); render();
}

function buildControls() {
  var cw = document.getElementById('tmColors');
  var sw = document.getElementById('tmSizes');

  document.getElementById('printStyleSelect').value = style;
  paintStyleOptions();
  paintProductButtons(); updatePrice(); updateZoomUI(); updateSpecs();
  loadPalette(product);
  loadDesc(product);

  document.getElementById('tmSpecsToggle').addEventListener('click', function () {
    specsOpen = !specsOpen;
    paintDesc(product);
  });

  [].forEach.call(document.querySelectorAll('.tm-product'), function (b) {
    b.addEventListener('click', function () {
      product = b.getAttribute('data-product');
      view = 0;
      paintStyleOptions();
      guidePinned = false;
      var gbox = document.getElementById('tmSizeGuide');
      if (gbox) { gbox.style.display = 'none'; gbox.innerHTML = ''; }
      var ms0 = productById(product).models || [];
      for (var mi = 0; mi < ms0.length; mi++) if (ms0[mi].flat) loadModel(modelSrc(ms0[mi]));
      paintProductButtons(); updatePrice(); updateZoomUI(); updateSpecs(); render();
      loadPalette(product);
      loadDesc(product);
      loadTemplate(product, 'front');
      if (twoSided()) loadTemplate(product, 'back');
    });
  });
  /* The hover target is the words themselves, not the row they sit on. A short grace
     period lets the pointer travel from the link into the panel to read or scroll it. */
  var gbtn = document.getElementById('tmSizeGuideBtn');
  var gb = document.getElementById('tmSizeGuide');
  var guideTimer = null;
  function showGuide() {
    if (guideTimer) { clearTimeout(guideTimer); guideTimer = null; }
    loadSizeGuide();
    gb.style.display = 'block';
  }
  function hideGuide() {
    if (guidePinned) return;
    if (guideTimer) clearTimeout(guideTimer);
    guideTimer = setTimeout(function () { if (!guidePinned) gb.style.display = 'none'; }, 160);
  }
  gbtn.addEventListener('mouseenter', showGuide);
  gbtn.addEventListener('mouseleave', hideGuide);
  gb.addEventListener('mouseenter', function () { if (guideTimer) { clearTimeout(guideTimer); guideTimer = null; } });
  gb.addEventListener('mouseleave', hideGuide);
  gbtn.addEventListener('click', function () {
    guidePinned = !guidePinned;
    loadSizeGuide();
    gb.style.display = guidePinned ? 'block' : 'none';
  });

  sw.addEventListener('click', function (e) {
    var b = e.target.closest('.tm-size');
    if (!b) return;
    size = b.getAttribute('data-size');
    /* the mug's print area and its shape both depend on the size, so this is a real
       re-render now, not just a variant id swap */
    paintSizes(); updateVariant(); updateSpecs(); render();
  });
  cw.addEventListener('click', function (e) {
    var b = e.target.closest('.tm-color');
    if (!b) return;
    var c = null, d = palettes[product];
    for (var i = 0; d && i < d.colors.length; i++) if (d.colors[i].name === b.getAttribute('data-color')) c = d.colors[i];
    if (!c) return;
    colorName = c.name;
    garment = c.code || garment;
    (productById(product).models || []).forEach(function (m) { if (m.byColor) loadModel(modelSrc(m)); });
    paintColors(); updateVariant(); syncInkSlider(); updateZoomUI(); render();
  });
  document.getElementById('printStyleSelect').addEventListener('change', function (e) {
    style = e.target.value;
    view = 0;
    if (twoSided()) loadTemplate(product, 'back');
    updateZoomUI(); updateSpecs(); render();
  });

  function textUpdate() {
    showCA = document.getElementById('tmShowCA').checked;
    showTicker = document.getElementById('tmShowTicker').checked;
    textColor = spectrumHex(+document.getElementById('tmHue').value / 1000);
    if (!inkTouched) { textColor = inkColor(); syncInkSlider(); }
    textWeight = +document.getElementById('tmWeight').value;
    caFont = document.getElementById('tmCaFont').value;
    tickerFont = document.getElementById('tmTkFont').value;
    ensureFont(fontById(caFont));
    ensureFont(fontById(tickerFont));
    var f1 = fontById(caFont), f2 = fontById(tickerFont);
    var we1 = nearestWeight(f1, textWeight), we2 = nearestWeight(f2, textWeight);
    document.getElementById('tmWeightVal').innerText =
      (we1 === we2) ? String(we1) : ('CA ' + we1 + ' / $ ' + we2);
    /* a single-weight font cannot answer the slider, so say so rather than
       leaving a control that looks live and does nothing */
    var live = f1.weights.length > 1 || f2.weights.length > 1;
    document.getElementById('tmWeightRow').style.opacity = live ? '1' : '0.4';
    document.getElementById('tmWeight').disabled = !live;
    document.getElementById('tmColorHex').innerText = inkColor() + (inkTouched ? '' : ' auto');
    document.getElementById('tmColorSwatch').style.background = inkColor();
    document.getElementById('tmColorRow').style.opacity = (showCA || showTicker) ? '1' : '0.4';
    render();
  }
  var fontOpts = FONTS.map(function (f) { return '<option value="' + f.id + '">' + f.label + '</option>'; }).join('');
  document.getElementById('tmCaFont').innerHTML = fontOpts;
  document.getElementById('tmTkFont').innerHTML = fontOpts;
  document.getElementById('tmCaFont').value = caFont;
  document.getElementById('tmTkFont').value = tickerFont;

  ['tmShowCA', 'tmShowTicker', 'tmHue', 'tmWeight', 'tmCaFont', 'tmTkFont'].forEach(function (id) {
    var el = document.getElementById(id);
    /* moving the hue slider is the customer taking the wheel; everything else leaves
       the automatic choice in place */
    if (id === 'tmHue') el.addEventListener('input', function () { inkTouched = true; });
    el.addEventListener('input', textUpdate);
    el.addEventListener('change', textUpdate);
  });
  textUpdate();

  var rw = document.getElementById('tmRanges');
  if (rw) rw.addEventListener('click', function (e) {
    var b = e.target.closest('.tm-range');
    if (!b) return;
    chartRange = b.getAttribute('data-range');
    loadChart();
  });
  paintRangeButtons();

  var cnv = document.getElementById('tmChart');
  if (cnv) {
    cnv.addEventListener('mousemove', function (e) {
      var b = cnv.getBoundingClientRect();
      chartHoverX = (e.clientX - b.left) / b.width;
      drawChart();
    });
    cnv.addEventListener('mouseleave', function () { chartHoverX = -1; drawChart(); });
  }
  var rsz = null;
  window.addEventListener('resize', function () {
    clearTimeout(rsz);
    rsz = setTimeout(drawChart, 150);
  });

  document.getElementById('tmPrev').addEventListener('click', function () { step(-1); });
  document.getElementById('tmNext').addEventListener('click', function () { step(1); });

  document.getElementById('fetchBtn').addEventListener('click', function () {
    var v = document.getElementById('caInput').value.trim();
    if (v) fetchToken(v); else alert('Paste a Solana contract address first.');
  });
  document.getElementById('caInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('fetchBtn').click();
  });
  document.getElementById('pasteBtn').addEventListener('click', function () {
    navigator.clipboard.readText().then(function (t) {
      document.getElementById('caInput').value = t;
    }).catch(function () { alert('Your browser blocked clipboard access. Paste with Ctrl+V instead.'); });
  });

  /* the architecture modal has no trigger in the header any more; the markup and
     these handlers stay so it can be opened from anywhere later */
  var arch = document.getElementById('archModal');
  var archBtn = document.getElementById('showArchBtn');
  if (archBtn) archBtn.addEventListener('click', function () {
    arch.classList.remove('hidden'); arch.classList.add('flex');
  });
  document.getElementById('closeArchBtn').addEventListener('click', function () {
    arch.classList.add('hidden'); arch.classList.remove('flex');
  });

  document.getElementById('checkoutBtn').addEventListener('click', function () {
    alert('Checkout is not connected yet. Next step: Shopify Cart API + the Printful order webhook.');
  });
}

/* ---------------- price chart ----------------
   Candles come from GeckoTerminal's public API: no key, no account and
   no cost. The pool address is the one DexScreener already gave us, so
   finding the pool costs no extra request. One ~3 KB JSON per refresh.

   The buttons are candle sizes, finest first, the way DexScreener's are.
   24 hours is the longest view, so 1-hour candles across a day IS the
   24H view. If the chosen size has no history yet, which is normal for a
   token minted minutes ago, loadChart steps down to the next finer size
   until something draws, so the chart always populates. */

var RANGES = [
  { key: 'm1', label: '1M', path: 'minute', aggregate: 1, limit: 60 },
  { key: 'm5', label: '5M', path: 'minute', aggregate: 5, limit: 60 },
  { key: 'm15', label: '15M', path: 'minute', aggregate: 15, limit: 60 },
  { key: 'h1', label: '24H', path: 'hour', aggregate: 1, limit: 24 }
];

function rangeIndex(key) {
  for (var i = 0; i < RANGES.length; i++) if (RANGES[i].key === key) return i;
  return RANGES.length - 1;
}

function chartMsg(text) {
  var el = document.getElementById('tmChartMsg');
  if (el) el.innerText = text || '';
}

function paintRangeButtons() {
  var wrap = document.getElementById('tmRanges');
  if (!wrap) return;
  var active = chartShown || chartRange;
  wrap.innerHTML = RANGES.map(function (r) {
    var on = r.key === active;
    return '<button data-range="' + r.key + '" class="tm-range text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ' +
      (on ? 'border-brand-accent bg-brand-accent/20 text-white'
          : 'border-brand-border text-slate-400 hover:text-white') +
      '">' + r.label + '</button>';
  }).join('');
}

/* The canvas bitmap is sized from its box every draw, so the chart can
   change height (96 px on phones, 200 px from large up) without the
   picture stretching, and stays sharp on high-density screens. */
function fitCanvas(c) {
  var box = c.parentElement.getBoundingClientRect();
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var w = Math.max(240, Math.round(box.width * dpr));
  var h = Math.max(80, Math.round(box.height * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return dpr;
}

var TICK_SECONDS = [60, 300, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400];

function hhmm(ts) {
  var d = new Date(ts * 1000);
  return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

/* a round step (1, 2, 2.5 or 5 x 10^n) near range/target, so the price
   gridlines land on numbers a person would actually choose */
function niceStep(range, target) {
  var raw = range / Math.max(1, target);
  if (!(raw > 0) || !isFinite(raw)) return 1;
  var mag = Math.pow(10, Math.floor(Math.log10(raw)));
  var n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

function axisPrice(v, step) {
  var d = Math.max(0, Math.min(12, -Math.floor(Math.log10(step))));
  return v.toFixed(d);
}

function drawChart() {
  var c = document.getElementById('tmChart');
  if (!c) return;
  var S = fitCanvas(c);                 /* S: CSS px -> canvas px */
  var g = c.getContext('2d');
  var W = c.width, H = c.height, i;
  g.clearRect(0, 0, W, H);
  var rows = chartData;
  if (!rows || !rows.length) return;

  var last = rows[rows.length - 1];
  var lo = Infinity, hi = -Infinity, vmax = 0;
  for (i = 0; i < rows.length; i++) {
    if (rows[i].l < lo) lo = rows[i].l;
    if (rows[i].h > hi) hi = rows[i].h;
    if (rows[i].v > vmax) vmax = rows[i].v;
  }
  var flat = (hi === lo);
  if (flat) { hi = lo * 1.0005 || 1; lo = lo * 0.9995; }

  var roomy = H >= 150 * S;             /* volume and the time axis need height */
  var AXIS = '500 ' + (10 * S) + 'px "JetBrains Mono", monospace';
  var TAGF = '500 ' + (11 * S) + 'px "JetBrains Mono", monospace';

  /* the price axis is only as wide as the digits need: a sub-cent
     memecoin writes out far more of them than a dollar token */
  var step = niceStep(hi - lo, Math.max(2, Math.round(H / (46 * S))));
  g.font = TAGF;
  var tagTxt = fmtPrice(last.c);
  var tagW = g.measureText(tagTxt).width + 10 * S;
  g.font = AXIS;
  var gridW = Math.max(g.measureText(axisPrice(hi, step)).width,
                       g.measureText(axisPrice(lo, step)).width);

  var padT = 10 * S, padL = 4 * S, padB = 6 * S;
  var padR = Math.max(tagW + 6 * S, gridW + 12 * S);
  var axisH = roomy ? 15 * S : 0;
  var plotW = W - padL - padR;
  var volH = roomy ? (H - padT - padB - axisH) * 0.20 : 0;
  var gap = volH ? 5 * S : 0;
  var plotH = H - padT - padB - axisH - volH - gap;
  var volBase = padT + plotH + gap + volH;
  var Y = function (v) { return padT + plotH * (1 - (v - lo) / (hi - lo)); };

  var cw = plotW / rows.length;
  var bodyW = Math.max(1 * S, Math.min(cw * 0.66, 12 * S));
  var wick = Math.max(1, Math.min(cw * 0.14, 1.6 * S));
  var GRID = 'rgba(148,163,184,0.17)';

  var hoverI = -1;
  if (chartHoverX >= 0) {
    var hx = chartHoverX * W;
    if (hx >= padL && hx <= padL + plotW) {
      hoverI = Math.floor((hx - padL) / cw);
      if (hoverI < 0) hoverI = 0;
      if (hoverI > rows.length - 1) hoverI = rows.length - 1;
    }
  }

  /* horizontal gridlines, labels drawn later so the tag can mask them */
  var marks = [];
  g.lineWidth = 1;
  g.strokeStyle = GRID;
  for (var v = Math.ceil(lo / step) * step; v <= hi + step * 0.001; v += step) {
    var gy = Y(v);
    if (gy < padT - 1 || gy > padT + plotH + 1) continue;
    g.beginPath();
    g.moveTo(padL, gy);
    g.lineTo(padL + plotW, gy);
    g.stroke();
    marks.push({ y: gy, text: axisPrice(v, step) });
  }

  /* vertical gridlines on round clock times, with the times underneath */
  if (roomy && rows.length > 1) {
    var tz = new Date().getTimezoneOffset() * 60;
    var span = Math.max(1, last.t - rows[0].t);
    var maxLabels = Math.max(2, Math.floor(plotW / (76 * S)));
    var tick = TICK_SECONDS[TICK_SECONDS.length - 1];
    for (i = 0; i < TICK_SECONDS.length; i++) {
      if (span / TICK_SECONDS[i] <= maxLabels) { tick = TICK_SECONDS[i]; break; }
    }
    g.font = AXIS;
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (i = 1; i < rows.length; i++) {
      if (Math.floor((rows[i - 1].t - tz) / tick) === Math.floor((rows[i].t - tz) / tick)) continue;
      var gx = padL + cw * (i + 0.5);
      if (gx < padL + 16 * S || gx > padL + plotW - 16 * S) continue;
      g.strokeStyle = GRID;
      g.beginPath();
      g.moveTo(gx, padT);
      g.lineTo(gx, volBase);
      g.stroke();
      g.fillStyle = 'rgba(148,163,184,0.6)';
      g.fillText(hhmm(rows[i].t), gx, H - axisH + 2 * S);
    }
  }

  /* volume */
  if (volH && vmax > 0) {
    g.globalAlpha = 0.3;
    for (i = 0; i < rows.length; i++) {
      var rv = rows[i];
      g.fillStyle = (rv.c >= rv.o) ? '#14F195' : '#FB7185';
      var vh = Math.max(1, (rv.v / vmax) * volH);
      g.fillRect(padL + cw * (i + 0.5) - bodyW / 2, volBase - vh, bodyW, vh);
    }
    g.globalAlpha = 1;
  }

  /* candles */
  for (i = 0; i < rows.length; i++) {
    var r = rows[i];
    var x = padL + cw * (i + 0.5);
    var col = (r.c >= r.o) ? '#14F195' : '#FB7185';
    g.strokeStyle = col;
    g.fillStyle = col;
    g.lineWidth = wick;
    g.beginPath();
    g.moveTo(x, Y(r.h));
    g.lineTo(x, Y(r.l));
    g.stroke();
    var yo = Y(r.o), yc = Y(r.c);
    g.fillRect(x - bodyW / 2, Math.min(yo, yc), bodyW, Math.max(Math.abs(yc - yo), 1 * S));
  }

  /* last price: a dashed line across and a tag on the axis */
  var lastCol = (last.c >= last.o) ? '#14F195' : '#FB7185';
  var ly = Y(last.c);
  g.save();
  g.strokeStyle = lastCol;
  g.globalAlpha = 0.45;
  g.lineWidth = 1 * S;
  g.setLineDash([4 * S, 4 * S]);
  g.beginPath();
  g.moveTo(padL, ly);
  g.lineTo(padL + plotW, ly);
  g.stroke();
  g.restore();

  var tagH = 15 * S;
  var tagY = Math.max(tagH / 2 + 1, Math.min(padT + plotH - tagH / 2, ly));

  /* price labels, skipping any the tag sits on */
  g.font = AXIS;
  g.fillStyle = 'rgba(148,163,184,0.62)';
  g.textAlign = 'right';
  g.textBaseline = 'middle';
  for (i = 0; i < marks.length; i++) {
    if (Math.abs(marks[i].y - tagY) < tagH * 0.95) continue;
    g.fillText(marks[i].text, W - 5 * S, marks[i].y);
  }

  g.fillStyle = lastCol;
  g.beginPath();
  g.roundRect(W - tagW - 2 * S, tagY - tagH / 2, tagW, tagH, 3 * S);
  g.fill();
  g.font = TAGF;
  g.fillStyle = '#0d0f17';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(tagTxt, W - tagW / 2 - 2 * S, tagY);

  /* crosshair and the hovered candle's numbers */
  if (hoverI >= 0) {
    var hr = rows[hoverI];
    var hxp = padL + cw * (hoverI + 0.5);
    g.save();
    g.strokeStyle = 'rgba(226,232,240,0.32)';
    g.lineWidth = 1 * S;
    g.setLineDash([3 * S, 3 * S]);
    g.beginPath();
    g.moveTo(hxp, padT);
    g.lineTo(hxp, volBase);
    g.stroke();
    g.restore();

    g.font = AXIS;
    var lines = [hhmm(hr.t), 'O ' + fmtPrice(hr.o), 'H ' + fmtPrice(hr.h),
                 'L ' + fmtPrice(hr.l), 'C ' + fmtPrice(hr.c)];
    var bw = 0;
    for (i = 0; i < lines.length; i++) bw = Math.max(bw, g.measureText(lines[i]).width);
    bw += 12 * S;
    var lh = 12 * S, bh = lines.length * lh + 8 * S;
    var bx = (hxp > W / 2) ? hxp - bw - 8 * S : hxp + 8 * S;
    bx = Math.max(2 * S, Math.min(W - bw - 2 * S, bx));
    var by = Math.min(padT + 2 * S, H - bh - 2 * S);
    g.fillStyle = 'rgba(13,15,23,0.93)';
    g.strokeStyle = 'rgba(148,163,184,0.25)';
    g.lineWidth = 1 * S;
    g.beginPath();
    g.roundRect(bx, by, bw, bh, 4 * S);
    g.fill();
    g.stroke();
    g.textAlign = 'left';
    g.textBaseline = 'top';
    for (i = 0; i < lines.length; i++) {
      g.fillStyle = i === 0 ? 'rgba(148,163,184,0.75)' : '#E2E8F0';
      g.fillText(lines[i], bx + 6 * S, by + 4 * S + i * lh);
    }
  }
}

function toCandles(list) {
  return list.slice().reverse().map(function (row) {
    return { t: row[0], o: row[1], h: row[2], l: row[3], c: row[4], v: row[5] };
  });
}

function showCandles(key, rows) {
  chartShown = key;
  chartData = rows;
  chartMsg('');
  paintRangeButtons();
  drawChart();
}

/* Which pool the chart is currently asking about: index into token.pools, advanced
   when a pool turns out to have no candles. */
var poolIdx = 0, poolIdxCa = '';
function chartPool() {
  var ps = token.pools || [];
  return ps[poolIdx] || token.pair || '';
}

function loadChart(stepKey) {
  var key = stepKey || chartRange;
  if (!stepKey) {
    chartData = null;
    chartShown = null;
    /* only rewind on a NEW token: the 30 s refresh calls through here too, and
       re-walking past a dead pool every cycle just spends rate limit */
    if (poolIdxCa !== token.ca) { poolIdx = 0; poolIdxCa = token.ca; }
    drawChart();
    paintRangeButtons();
    if (!token.pair) { chartMsg('No pool for this token yet'); return; }
    chartMsg('Loading chart...');
  }
  var pool = chartPool();
  if (!pool) return;
  var r = RANGES[rangeIndex(key)];
  var ck = pool + '|' + r.key;

  /* GeckoTerminal edge-caches these for 30 s, so re-asking inside that
     window only spends rate limit. Toggling between sizes is free. */
  var hit = chartCache[ck];
  if (hit && Date.now() - hit.t < CHART_TTL) { showCandles(r.key, hit.rows); return; }
  /* still inside a back-off: asking again only deepens it */
  if (Date.now() < chartBlockedUntil) {
    if (!chartData) chartMsg('Chart busy, one moment');
    return;
  }
  if (chartPending[ck]) return;                 /* already asking for this one */
  chartPending[ck] = true;

  var url = 'https://api.geckoterminal.com/api/v2/networks/solana/pools/' + pool +
    '/ohlcv/' + r.path + '?aggregate=' + r.aggregate + '&limit=' + r.limit + '&currency=usd';
  var want = pool + '|' + chartRange;
  getJson(url).then(function (d) {
    delete chartPending[ck];
    if (want !== chartPool() + '|' + chartRange) return;   /* a newer request won */
    var list = (d && d.data && d.data.attributes && d.data.attributes.ohlcv_list) || [];
    if (list.length < 2) {
      var i = rangeIndex(key);
      if (i > 0) { loadChart(RANGES[i - 1].key); return; }  /* step to a finer candle */
      if (list.length === 1) { showCandles(r.key, toCandles(list)); return; }
      /* this pool has nothing at any candle size -- try the next one down the list */
      if (poolIdx + 1 < (token.pools || []).length) {
        poolIdx++;
        loadChart(chartRange);
        return;
      }
      /* Out of pools. "No trades yet" is only true if nobody is trading it: a pool
         quoted in something exotic (ZILLIONS/ZEC, say) can carry real volume that
         GeckoTerminal has simply never indexed, and telling that owner their token is
         dead is worse than admitting the chart is missing. */
      chartMsg(token.vol24 > 0 ? 'Chart unavailable for this pool' : 'No trades yet');
      return;
    }
    var rows = toCandles(list);
    chartCache[ck] = { t: Date.now(), rows: rows };
    showCandles(r.key, rows);
  }).catch(function (e) {
    delete chartPending[ck];
    if (chartThrottled(e)) {
      /* Rate limited, or blocked in a way that looks like it. Stepping to a finer
         candle or on to the next pool would only spend more calls, so stop and sit
         out the cool-down. */
      chartBlockedUntil = Date.now() + CHART_COOLDOWN;
      if (!chartData) chartMsg('Chart busy, one moment');
      return;
    }
    var i = rangeIndex(key);
    if (i > 0) { loadChart(RANGES[i - 1].key); return; }   /* a hiccup: try a finer one */
    console.warn('Chart unavailable:', e.message);
    chartMsg('Chart unavailable');
  });
}

function startChartPolling() {
  if (chartTimer) clearInterval(chartTimer);
  chartTimer = setInterval(function () {
    if (!document.hidden && token.pair) loadChart();
  }, 60000);
}

/* ---------------- Printful garment template ---------------- */

/* Templates are per product AND per side. Note the mockup generator has no DTF
   templates: asking for back_dtf silently returns the front one, so the preview
   always asks for the plain placement and the technique only affects the order. */
/* Which Printful placement this view needs. Normally the side -- front or back -- but a
   product whose placements are a property of the STYLE rather than the side (the joggers:
   left leg and right leg are two templates of the same flat photo) names them itself. */
function tplSide(p, side) {
  if (p && p.placementByStyle && p.placementByStyle[style]) return p.placementByStyle[style];
  return side === 'back' ? 'back' : 'front';
}

/* A ghost template is one file for every colour, so the product and the placement name it.
   A photo template is a different file per colour, so the swatch is part of the key. */
function tplKey(p, side) {
  return p.id + '|' + tplSide(p, side) + (p.tplByColor ? '|' + (colorName || '') : '');
}

function tplGet(side) {
  return tplCache[tplKey(productById(product), side)] || null;
}

/* A product whose flat laydown we made ourselves (the joggers; see pants/blanks.js) has no
   Printful template to fetch. The photo and the print rectangle come out of that file, which
   is pulled in the first time the product is opened, and a template object is built from them
   in the shape the renderer already expects. */
var blanksPending = false;
function loadBlankTemplate(p, pl, key) {
  var cfg = p.blankTpl;
  var set = window[cfg.global];
  if (!set) {
    if (!blanksPending) {
      blanksPending = true;
      var sc = document.createElement('script');
      sc.src = API + cfg.js;
      sc.onload = function () { blanksPending = false; render(); };
      sc.onerror = function () { blanksPending = false; tplFailed[key] = true; render(); };
      document.head.appendChild(sc);
    }
    return;   /* the onload calls render(), which comes straight back here */
  }
  var src = set.img[slugify(colorName)];
  var r = set.rect[pl];
  if (!src || !r) { tplFailed[key] = true; return; }
  tplPending[key] = true;
  var img = new Image();
  img.onload = function () {
    tplPending[key] = false;
    tplCache[key] = { img: img, t: {
      image_url: src, background_color: null,
      template_width: set.size, template_height: set.size,
      print_area_left: r[0], print_area_top: r[1],
      print_area_width: r[2], print_area_height: r[3]
    } };
    if (product === p.id) render();
  };
  img.onerror = function () { tplPending[key] = false; tplFailed[key] = true; render(); };
  img.src = src;
}

function loadTemplate(id, side) {
  var p = productById(id || product);
  var pl = tplSide(p, side);
  var key = tplKey(p, side);
  /* Printful only returns a real product photo for the DTG garments; the mug and any
     all-over product come back as flat pattern guides, so those use the drawn one. */
  if (p.noTpl) return;
  /* A per-colour photo template has to be asked for by the variant the customer is
     actually looking at. `curVariant` is not it: the colour list arrives over the network
     after the product switch, so for the first frames it still holds the PREVIOUS
     product's variant -- which is how a black jogger came back as the navy photograph.
     Resolve it from the loaded palette instead, and if that has not arrived yet, do
     nothing: applyPalette() ends in render(), which calls straight back here. */
  var vid = p.vid;
  if (p.tplByColor) {
    if (p.id !== product || !palettes[p.id]) return;
    var ce = colorEntry();
    vid = (ce && (ce.ids[size] || ce.ids[Object.keys(ce.ids)[0]])) || p.vid;
  }
  if (tplCache[key]) { if (product === p.id) render(); return; }
  /* render() calls this whenever the template is missing, and the spinner keeps rendering,
     so without this guard one product switch fires a burst of identical requests. */
  if (tplPending[key]) return;
  if (p.blankTpl) { loadBlankTemplate(p, pl, key); return; }
  tplPending[key] = true;
  function give_up(why) {
    tplPending[key] = false;
    tplFailed[key] = true;           /* stops the spinner; render() falls back to the drawn garment */
    console.warn('No Printful template for ' + key + ', using the drawn fallback:', why);
    if (product === p.id) render();
  }
  getJson(API + '/api/template?product=' + p.pid + '&variant=' + vid + '&placement=' + pl).then(function (t) {
    if (!t || !t.image_url) throw new Error((t && t.error) || 'no template');
    var img = new Image();
    img.onload = function () {
      tplPending[key] = false;
      tplCache[key] = { t: t, img: img };
      if (product === p.id) render();
    };
    img.onerror = function () { give_up('image failed to load'); };
    img.src = t.image_url;
  }).catch(function (e) { give_up(e.message); });
}

/* ---------------- boot ---------------- */

function start() {
  var root = document.getElementById('tokenmerch-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'tokenmerch-root';
    document.body.appendChild(root);
  }
  root.className = 'min-h-screen flex flex-col justify-between selection:bg-brand-accent selection:text-white';
  root.innerHTML = MARKUP;
  canvas = document.getElementById('mockupCanvas');
  ctx = canvas.getContext('2d');
  buildControls();
  loadTemplate(product, 'front');
  fetchToken(DEMO_CA);
  startChartPolling();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
}

function boot() {
  addHead();
  addTailwind(function () {});
  start();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
