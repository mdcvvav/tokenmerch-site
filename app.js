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
var PRODUCTS = [
  { id: 'tee',       label: 'T-SHIRT',         pid: 586, vid: 15114, price: 45,  shape: 'tee',
    print: { w: 12, h: 16, dpi: 150, tech: 'DTF', placement: 'front_dtf' },
    /* Printful model shots with the print area measured off a calibration render.
       x0/y0/ax/ay/bx/by are fractions of the photo's width: the unit square of the
       print area maps to (x0 + u*ax + v*bx, y0 + u*ay + v*by). vTop/vH place the
       square design inside a 1800 x 2400 print area. */
    models: [
      { src: '/models/tee-male.webp',   label: 'On model', shotIn: 'Black', blend: 'screen',
        x0: 0.3865, y0: 0.3355, ax: 0.2342, ay: -0.0001, bx: 0.0009, by: 0.3447, vTop: 0.125, vH: 0.75 },
      { src: '/models/tee-female.webp', label: 'On model 2', shotIn: 'Black', blend: 'screen',
        x0: 0.3959, y0: 0.1981, ax: 0.1435, ay: -0.0014, bx: 0.0281, by: 0.1983, vTop: 0.125, vH: 0.75 }
    ] },
  { id: 'oversized', label: 'OVERSIZED T',     pid: 823, vid: 21005, price: 62,  shape: 'tee',
    print: { w: 12, h: 16, dpi: 150, tech: 'DTG', placement: 'front' } },
  { id: 'ribbed',    label: 'RIBBED NECK',     pid: 818, vid: 20716, price: 46,  shape: 'tee',
    print: { w: 12, h: 16, dpi: 150, tech: 'DTG', placement: 'front' } },
  { id: 'hoodie',    label: 'HOODIE',          pid: 602, vid: 15572, price: 92,  shape: 'tee',
    print: { w: 15, h: 12, dpi: 150, tech: 'DTF', placement: 'front_dtf' } },
  { id: 'premium',   label: 'PREMIUM HOODIE',  pid: 380, vid: 10779, price: 80,  shape: 'tee',
    print: { w: 12, h: 12, dpi: 150, tech: 'DTG', placement: 'front' } },
  { id: 'tank',      label: 'TANK TOP',        pid: 537, vid: 13627, price: 48,  shape: 'tee',
    print: { w: 12, h: 16, dpi: 150, tech: 'DTG', placement: 'front' },
    models: [
      { src: '/models/tank-flat.webp', label: 'Full garment', flat: true, shotIn: 'Navy',
        byColor: '/models/tank-flat-', colorSlugs: ['athletic-heather','black','charcoal-heather','coral','harbor-blue','military-green','mint','navy','pacific-blue','red','squash','team-royal','white'],
        x0: 0.3075, y0: 0.2735, ax: 0.3840, ay: 0, bx: 0, by: 0.5120, vTop: 0.125, vH: 0.75 },
      { src: '/models/tank-m1.webp', label: 'On model', shotIn: 'Navy', blend: 'screen',
        x0: 0.3778, y0: 0.4041, ax: 0.2500, ay: 0.0001, bx: 0.0008, by: 0.3585, vTop: 0.125, vH: 0.75 },
      { src: '/models/tank-m2.webp', label: 'On model 2', shotIn: 'Navy', blend: 'screen',
        x0: 0.4001, y0: 0.4083, ax: 0.2349, ay: -0.0001, bx: 0.0013, by: 0.3555, vTop: 0.125, vH: 0.75 }
    ] },
  { id: 'wind',      label: 'WINDBREAKER',     pid: 615, vid: 15714, price: 116, shape: 'tee', noTpl: true, color: '#E8EAED',
    print: { w: 34, h: 38, dpi: 150, tech: 'Cut & sew', placement: 'front' } },
  { id: 'mug',       label: 'COFFEE MUG',      pid: 19,  vid: 1320,  price: 18,  shape: 'mug', noTpl: true, color: '#FFFFFF',
    print: { w: 9, h: 3.5, dpi: 300, tech: 'Sublimation', placement: 'default' } },
  { id: 'poster',    label: 'POSTER',          pid: 2,   vid: 4651,  price: 59,  shape: 'flat',
    print: { w: 8, h: 10, dpi: 300, tech: 'Giclee', placement: 'default' } },
  { id: 'sticker',   label: 'STICKERS',        pid: 505, vid: 12917, price: 15,  shape: 'flat',
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
'#tmHue{-webkit-appearance:none;appearance:none;width:100%;height:14px;border-radius:9999px;outline:none;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:linear-gradient(to right,#FFF 0%,#FFF 6%,#F00 6%,#FF0 20.7%,#0F0 35.3%,#0FF 50%,#00F 64.7%,#F0F 79.3%,#F00 94%,#000 94%,#000 100%)}',
'#tmHue::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid #0d0f17;box-shadow:0 0 0 1px rgba(255,255,255,.6);cursor:pointer}',
'#tmHue::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid #0d0f17;box-shadow:0 0 0 1px rgba(255,255,255,.6);cursor:pointer}',
'#tmWeight{-webkit-appearance:none;appearance:none;width:100%;height:10px;border-radius:9999px;outline:none;cursor:pointer;border:1px solid rgba(255,255,255,.2);background:linear-gradient(to right,#4b5563,#e2e8f0)}',
'#tmWeight::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#9945FF;border:2px solid #0d0f17;box-shadow:0 0 0 1px rgba(255,255,255,.5);cursor:pointer}',
'#tmWeight::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#9945FF;border:2px solid #0d0f17;box-shadow:0 0 0 1px rgba(255,255,255,.5);cursor:pointer}',
'#tmWeight:disabled{cursor:not-allowed}',
'#tmWeightRow{transition:opacity .15s ease}',
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
'<select id="printStyleSelect" class="w-full bg-brand-bg text-slate-200 border border-brand-border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-brand-accent">',
'<option value="centered">CENTERED GRAPHIC IMAGE</option>',
'<option value="centered-small">CENTERED GRAPHIC IMAGE SMALL</option>',
'<option value="badge-left">IMAGE BADGE LEFT</option>',
'<option value="badge-right">IMAGE BADGE RIGHT</option>',
'</select></div>',

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
'<h3 class="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold border-b border-brand-border pb-2 mb-4 flex items-center justify-between"><span><i class="fa-solid fa-shirt text-brand-accent mr-2"></i> Product</span><span class="text-[10px] text-slate-500">10 SLOTS</span></h3>',
'<div id="tmProductGrid" class="font-mono text-xs" style="display:grid;grid-auto-flow:row;grid-template-columns:repeat(5,minmax(0,1fr));gap:0.5rem">',
PRODUCTS.map(function (p) { return '<button class="tm-product" data-product="' + p.id + '">' + p.label + '</button>'; }).join(''),
'</div></div>',

'<div class="glass-panel rounded-2xl p-6 relative flex flex-col items-center justify-center min-h-[520px]">',
'<div class="w-full flex items-center justify-between mb-4 text-xs font-mono border-b border-brand-border pb-3">',
'<div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded-full bg-brand-solana animate-ping"></span><span class="text-slate-300 font-bold uppercase tracking-wider">Preview</span></div>',
'</div>',
'<div class="relative w-full aspect-square max-w-[620px] mx-auto flex items-center justify-center bg-brand-bg/60 rounded-xl border border-brand-border/60 p-2 shadow-2xl">',
'<canvas id="mockupCanvas" width="1200" height="1200" class="w-full h-full object-contain rounded-lg"></canvas>',
'<div class="absolute top-3 right-3 bg-brand-card/90 border border-brand-border rounded-lg backdrop-blur" style="display:flex;align-items:center;gap:2px;padding:3px">',
'<button id="tmPrev" title="Previous view" class="w-7 h-7 rounded-md text-slate-300 hover:text-white hover:bg-brand-cardHover transition-all" style="display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-chevron-left text-[11px]"></i></button>',
'<span id="tmViewCount" class="text-[10px] font-mono text-slate-400" style="min-width:26px;text-align:center">1/2</span>',
'<button id="tmNext" title="Next view" class="w-7 h-7 rounded-md text-slate-300 hover:text-white hover:bg-brand-cardHover transition-all" style="display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-chevron-right text-[11px]"></i></button>',
'</div>',
'</div>',
'<div class="w-full mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] font-mono text-slate-500 pt-2 border-t border-brand-border/60">',
'<span class="text-slate-400"><i class="fa-solid fa-arrows-rotate text-brand-accent mr-1"></i> <span id="tmViewLabel">Full garment</span></span>',
'<span class="flex items-center gap-x-3 gap-y-1 flex-wrap">',
'<span>Source <span id="sourceResText" class="text-slate-300">-</span></span>',
'<span>Print <span id="upscaleResText" class="text-slate-300">1800 x 1800 px</span></span>',
'<span id="tmPrintSizeLabel">12 x 12 in</span>',
'<span id="tmTechLabel" class="text-brand-accent/80">DTF</span>',
'<span id="tmDpiLabel" class="text-brand-solana/70">150 DPI</span>',
'</span>',
'</div>',
'</div></div>',

'</div></main>',

/* architecture modal */
'<div id="archModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 hidden items-center justify-center p-4">',
'<div class="glass-panel max-w-3xl w-full rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-brand-border">',
'<div class="flex items-center justify-between border-b border-brand-border pb-3"><h3 class="text-lg font-bold text-white font-mono flex items-center gap-2"><i class="fa-solid fa-network-wired text-brand-accent"></i> How TokenMerch Works</h3><button id="closeArchBtn" class="text-slate-400 hover:text-white p-1 text-xl">&times;</button></div>',
'<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">',
'<div class="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-2"><div class="text-brand-solana font-bold text-sm">1. Token lookup</div><p class="text-slate-400">You paste a Solana contract address. We read the token name, ticker and artwork from DexScreener, falling back to Jupiter.</p></div>',
'<div class="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-2"><div class="text-brand-cyber font-bold text-sm">2. Print file</div><p class="text-slate-400">The design is rendered server-side as a 1800 x 1800 px transparent PNG, the exact print size Printful wants for this hoodie.</p></div>',
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
var caFont = 'archivo', tickerFont = 'archivo';
var palettes = {};        /* product id -> { sizes, colors } from Printful */

var chartRange = 'm5', chartShown = null, chartData = null, chartTimer = null;
var chartCache = {}, chartPending = {}, chartHoverX = -1;
var CHART_TTL = 30000;   /* GeckoTerminal edge-caches on-chain data for 30 s */

var canvas, ctx, logoImg = null, logoReady = false;
var modelImgs = {};
var tpl = null, tplImg = null, tplCache = {};

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
    pair: p.pairAddress || ''
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
}

function loadLogo(url) {
  logoReady = false;
  setStatus('<i class="fa-solid fa-spinner fa-spin text-brand-accent"></i> Loading artwork...');
  var tries = [
    'https://wsrv.nl/?url=' + encodeURIComponent(url) + '&w=1200&h=1200&fit=cover&output=png',
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
      document.getElementById('sourceResText').innerText =
        (img.naturalWidth || '?') + ' x ' + (img.naturalHeight || '?') + ' px';
      render();
    };
    img.onerror = function () { i++; attempt(); };
    img.src = tries[i];
  }
  attempt();
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
  { id: 'archivo', label: 'ARCHIVO BLACK', css: '"Archivo Black", sans-serif', google: 'Archivo+Black', weights: [400] },
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
function drawCaption(p, cx, tickerW, caW, top, caLines) {
  if (!showCA && !showTicker) return top;
  p.save();
  p.fillStyle = textColor;
  p.textAlign = 'center';
  p.textBaseline = 'top';
  var y = top + tickerW * 0.05;
  if (showCA && token.ca) {
    var cf = fontById(caFont), cwt = nearestWeight(cf, textWeight);
    /* A 44-character address squeezed into a narrow graphic prints at about 0.11 in
       tall with sub-0.5 mm strokes, which is under the safe range for DTF on fabric.
       Over two lines it roughly doubles, so it stays legible inside the image. */
    if (caLines === 2 && token.ca.length > 24) {
      var cut = Math.ceil(token.ca.length / 2);
      var l1 = token.ca.slice(0, cut), l2 = token.ca.slice(cut);
      var fs2 = Math.min(fitFont(p, l1, cwt, cf.css, caW, caW * 0.10),
                         fitFont(p, l2, cwt, cf.css, caW, caW * 0.10));
      p.font = cwt + ' ' + fs2 + 'px ' + cf.css;
      p.fillText(l1, cx, y); y += fs2 * 1.12;
      p.fillText(l2, cx, y); y += fs2 * 1.5;
    } else {
      var fs = fitFont(p, token.ca, cwt, cf.css, caW, caW * 0.075);
      p.font = cwt + ' ' + fs + 'px ' + cf.css;
      p.fillText(token.ca, cx, y);
      y += fs * 1.5;
    }
  }
  if (showTicker && token.ticker) {
    var t = '$' + token.ticker;
    var tf = fontById(tickerFont), twt = nearestWeight(tf, textWeight);
    var fs2 = fitFont(p, t, twt, tf.css, tickerW, tickerW * 0.22);
    p.font = twt + ' ' + fs2 + 'px ' + tf.css;
    p.fillText(t, cx, y);
    y += fs2 * 1.1;
  }
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
  p.fillStyle = textColor;
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
function drawDesign(p, W) {
  if (logoReady && logoImg) {
    if (style === 'badge-left' || style === 'badge-right') {
      /* badge-left prints on the wearer's left chest, which is the
         right-hand side of a front view; badge-right is its mirror */
      var s1 = 0.2083 * W, y1 = 0.125 * W;
      var x1 = (style === 'badge-left') ? W - 0.229 * W - s1 : 0.229 * W;
      var bcx = x1 + s1 / 2, bcy = y1 + s1 / 2;
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
        p.fillStyle = textColor;
        p.textAlign = 'center';
        p.textBaseline = 'top';
        p.font = bwt + ' ' + fsb + 'px ' + bf.css;
        p.fillText(tb, bcx, below + s1 * 0.06);
        p.restore();
      }
    } else if (style === 'centered-small') {
      /* small graphic: the address is split over two lines so it fits the image
         and still prints large enough to read */
      var s2 = 0.4167 * W, x2 = 0.2917 * W, y2 = 0.1875 * W;
      p.drawImage(logoImg, x2, y2, s2, s2);
      drawCaption(p, W / 2, s2, s2, y2 + s2, 2);
    } else {
      /* big centred graphic: the address stays inside the image's width */
      var s3 = 0.55 * W, x3 = 0.225 * W, y3 = 0.0792 * W;
      p.drawImage(logoImg, x3, y3, s3, s3);
      drawCaption(p, W / 2, s3, s3, y3 + s3);
    }
  } else {
    var r = 0.1875 * W, cx = W / 2, cy = 0.3333 * W;
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
    drawCaption(p, cx, 0.375 * W, W * 0.8, cy + r);
  }
}

function designCanvas(W) {
  var c = document.createElement('canvas');
  c.width = W; c.height = W;
  drawDesign(c.getContext('2d'), W);
  return c;
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
function printSquare() {
  var s = Math.min(tpl.print_area_width, tpl.print_area_height);
  return {
    s: s,
    x: tpl.print_area_left + (tpl.print_area_width - s) / 2,
    y: tpl.print_area_top + (tpl.print_area_height - s) / 2
  };
}

/* The gallery: two canvas composites for every product, plus any calibrated
   model photos that product has. */
function viewsFor(p) {
  var ms = p.models || [];
  var flatIdx = -1;
  for (var i = 0; i < ms.length; i++) if (ms[i].flat) { flatIdx = i; break; }
  var v = [];
  /* Printful's template photo is a flat laydown for some products and a worn torso for
     others, which made the first view inconsistent. A calibrated Flat mockup wins when
     the product has one. */
  if (flatIdx >= 0) v.push({ kind: 'model', idx: flatIdx, label: ms[flatIdx].label || 'Full garment' });
  else v.push({ kind: 'front', label: 'Full garment' });
  v.push({ kind: 'zoom', label: 'Print close-up', from: flatIdx });
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
function modelComposite(m, C) {
  var img = modelImgs[modelSrc(m)];
  var c = document.createElement('canvas');
  c.width = C; c.height = C;
  var p = c.getContext('2d');
  p.fillStyle = '#ffffff';
  p.fillRect(0, 0, C, C);
  if (!img || !img.complete || !img.naturalWidth) return null;
  p.drawImage(img, 0, 0, C, C);
  var D = designCanvas(512);
  var vTop = m.vTop == null ? 0 : m.vTop;
  var vH = m.vH == null ? 1 : m.vH;
  p.save();
  p.globalCompositeOperation = m.blend || 'source-over';
  p.transform(m.ax * C / 512, m.ay * C / 512, m.bx * vH * C / 512, m.by * vH * C / 512,
    (m.x0 + m.bx * vTop) * C, (m.y0 + m.by * vTop) * C);
  p.drawImage(D, 0, 0);
  p.restore();
  return c;
}

/* The print square's bounding box in photo coordinates, so the close-up can crop to it. */
function modelPrintBox(m, C) {
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

function renderModel(m, crop) {
  var C = canvas.width;
  if (!modelImgs[modelSrc(m)]) loadModel(modelSrc(m));
  var c = modelComposite(m, C);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, C, C);
  if (!c) return;
  if (!crop) { ctx.drawImage(c, 0, 0); return; }
  var b = modelPrintBox(m, C);
  var side = Math.max(b.w, b.h) * 1.7;   /* leave fabric around the print, like the template close-up */
  var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  ctx.drawImage(c, cx - side / 2, cy - side / 2, side, side, 0, 0, C, C);
}

function render() {
  if (!canvas) return;
  var C = canvas.width;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, C, C);

  var hasTpl = !!(tpl && tplImg);
  var vs = viewsFor(productById(product));
  if (view >= vs.length) view = 0;
  var cur = vs[view];

  if (cur.kind === 'model') {
    renderModel(productById(product).models[cur.idx], false);
    ctx.restore();
    return;
  }

  if (cur.kind === 'zoom' && cur.from >= 0) {
    renderModel(productById(product).models[cur.from], true);
    ctx.restore();
    return;
  }

  if (cur.kind === 'zoom') {
    /* close-up of just the print area, so the fine print is readable */
    var pad = 0.10;
    ctx.fillStyle = garment;
    ctx.fillRect(0, 0, C, C);
    if (hasTpl) {
      var q = printSquare();
      var m = q.s * pad;
      var cx0 = q.x - m, cy0 = q.y - m;
      var cw = q.s + 2 * m;
      var k = C / cw;
      var ratio = tplImg.naturalWidth / tpl.template_width;
      var D = designCanvas(Math.round(q.s * k));
      ctx.drawImage(D, (q.x - cx0) * k, (q.y - cy0) * k, q.s * k, q.s * k);
      ctx.globalAlpha = 1;
      ctx.drawImage(tplImg, cx0 * ratio, cy0 * ratio, cw * ratio, cw * ratio, 0, 0, C, C);
    } else {
      var inset = C * pad;
      ctx.drawImage(designCanvas(Math.round(C - inset * 2)), inset, inset);
    }
    ctx.restore();
    return;
  }

  if (hasTpl) {
    var kk = C / tpl.template_width;
    ctx.fillStyle = garment || tpl.background_color || '#0c0c0c';
    ctx.fillRect(0, 0, C, C);
    var q2 = printSquare();
    var pw = Math.round(q2.s * kk);
    ctx.drawImage(designCanvas(pw), q2.x * kk, q2.y * kk, pw, pw);
    ctx.drawImage(tplImg, 0, 0, C, C);
    ctx.restore();
    return;
  }

  /* drawn t-shirt / mug */
  var k2 = C / 800;
  drawCartoonGarment(ctx, k2);
  var rect = productById(product).shape === 'mug'
    ? { x: 260 * k2, y: 230 * k2, w: 280 * k2 }
    : { x: 160 * k2, y: 200 * k2, w: 480 * k2 };
  ctx.drawImage(designCanvas(Math.round(rect.w)), rect.x, rect.y, rect.w, rect.w);
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
  size = (hit && hit.size) || (d.sizes.indexOf('M') >= 0 ? 'M' : d.sizes[0]);
  buildPalette();
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
  sw.innerHTML = d.sizes.map(function (z) {
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
function updateSpecs() {
  var pr = productById(product).print;
  if (!pr) return;
  var t = document.getElementById('tmTechLabel');
  var sz = document.getElementById('tmPrintSizeLabel');
  var up = document.getElementById('upscaleResText');
  var dp = document.getElementById('tmDpiLabel');
  if (t) t.innerText = pr.tech;
  if (sz) sz.innerText = pr.w + ' x ' + pr.h + ' in';
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
  document.getElementById('tmViewLabel').innerText = label;
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
  paintProductButtons(); updatePrice(); updateZoomUI(); updateSpecs();
  loadPalette(product);

  [].forEach.call(document.querySelectorAll('.tm-product'), function (b) {
    b.addEventListener('click', function () {
      product = b.getAttribute('data-product');
      view = 0;
      guidePinned = false;
      var gbox = document.getElementById('tmSizeGuide');
      if (gbox) { gbox.style.display = 'none'; gbox.innerHTML = ''; }
      var cached = tplCache[product];
      tpl = cached ? cached.t : null;
      tplImg = cached ? cached.img : null;
      var ms0 = productById(product).models || [];
      for (var mi = 0; mi < ms0.length; mi++) if (ms0[mi].flat) loadModel(modelSrc(ms0[mi]));
      paintProductButtons(); updatePrice(); updateZoomUI(); updateSpecs(); render();
      loadPalette(product);
      if (!cached) loadTemplate(product);
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
    paintSizes(); updateVariant();
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
    paintColors(); updateVariant(); updateZoomUI(); render();
  });
  document.getElementById('printStyleSelect').addEventListener('change', function (e) {
    style = e.target.value; render();
  });

  function textUpdate() {
    showCA = document.getElementById('tmShowCA').checked;
    showTicker = document.getElementById('tmShowTicker').checked;
    textColor = spectrumHex(+document.getElementById('tmHue').value / 1000);
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
    document.getElementById('tmColorHex').innerText = textColor;
    document.getElementById('tmColorSwatch').style.background = textColor;
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

function loadChart(stepKey) {
  var key = stepKey || chartRange;
  if (!stepKey) {
    chartData = null;
    chartShown = null;
    drawChart();
    paintRangeButtons();
    if (!token.pair) { chartMsg('No pool for this token yet'); return; }
    chartMsg('Loading chart...');
  }
  if (!token.pair) return;
  var r = RANGES[rangeIndex(key)];
  var ck = token.pair + '|' + r.key;

  /* GeckoTerminal edge-caches these for 30 s, so re-asking inside that
     window only spends rate limit. Toggling between sizes is free. */
  var hit = chartCache[ck];
  if (hit && Date.now() - hit.t < CHART_TTL) { showCandles(r.key, hit.rows); return; }
  if (chartPending[ck]) return;                 /* already asking for this one */
  chartPending[ck] = true;

  var url = 'https://api.geckoterminal.com/api/v2/networks/solana/pools/' + token.pair +
    '/ohlcv/' + r.path + '?aggregate=' + r.aggregate + '&limit=' + r.limit + '&currency=usd';
  var want = token.pair + '|' + chartRange;
  getJson(url).then(function (d) {
    delete chartPending[ck];
    if (want !== token.pair + '|' + chartRange) return;   /* a newer request won */
    var list = (d && d.data && d.data.attributes && d.data.attributes.ohlcv_list) || [];
    if (list.length < 2) {
      var i = rangeIndex(key);
      if (i > 0) { loadChart(RANGES[i - 1].key); return; }  /* step to a finer candle */
      if (list.length === 1) { showCandles(r.key, toCandles(list)); return; }
      chartMsg('No trades yet');
      return;
    }
    var rows = toCandles(list);
    chartCache[ck] = { t: Date.now(), rows: rows };
    showCandles(r.key, rows);
  }).catch(function (e) {
    delete chartPending[ck];
    if (/429/.test(e.message)) {
      /* rate limited: stepping finer would only spend another call */
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

function loadTemplate(id) {
  var p = productById(id || product);
  /* Printful only returns a real product photo for the DTG garments; the mug and the
     all-over windbreaker come back as flat pattern guides, so those use the drawn one. */
  if (p.noTpl) return;
  if (tplCache[p.id]) {
    if (product === p.id) { tpl = tplCache[p.id].t; tplImg = tplCache[p.id].img; render(); }
    return;
  }
  getJson(API + '/api/template?product=' + p.pid + '&variant=' + p.vid).then(function (t) {
    if (!t || !t.image_url) throw new Error((t && t.error) || 'no template');
    var img = new Image();
    img.onload = function () {
      tplCache[p.id] = { t: t, img: img };
      if (product === p.id) { tpl = t; tplImg = img; render(); }
    };
    img.onerror = function () { console.warn('Template image failed for ' + p.id); };
    img.src = t.image_url;
  }).catch(function (e) {
    console.warn('No Printful template for ' + p.id + ', using the drawn fallback:', e.message);
  });
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
  loadTemplate(product);
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
