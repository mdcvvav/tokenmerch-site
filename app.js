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
var PRESET_CAS = {
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr'
};

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
  link('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
  link('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
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
'<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">',
'<div class="flex items-center space-x-3">',
'<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent to-brand-solana flex items-center justify-center shadow-lg shadow-brand-accent/20"><i class="fa-solid fa-shirt text-brand-bg text-xl font-black"></i></div>',
'<div><span class="text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-brand-solana bg-clip-text text-transparent">TOKEN<span class="text-brand-accent">MERCH</span></span>',
'<span class="hidden sm:inline-block text-[10px] uppercase tracking-widest font-mono bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded border border-brand-accent/30 ml-2">Solana Engine</span></div>',
'</div>',
'<div class="flex items-center space-x-3 text-xs font-mono">',
'<div class="hidden md:flex items-center space-x-2 bg-brand-card px-3 py-1.5 rounded-lg border border-brand-border"><span class="w-2 h-2 rounded-full bg-brand-solana animate-pulse"></span><span class="text-slate-400">Network:</span><span class="text-brand-solana font-semibold">Solana Mainnet</span></div>',
'<button id="showArchBtn" class="bg-brand-card hover:bg-brand-cardHover text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-brand-border transition-all flex items-center space-x-1.5"><i class="fa-solid fa-network-wired text-brand-accent"></i><span class="hidden sm:inline">System Architecture</span></button>',
'</div></div></header>',

'<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">',

/* search bar */
'<section class="glass-panel rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden">',
'<div class="absolute -right-16 -top-16 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none"></div>',
'<div class="absolute -left-16 -bottom-16 w-64 h-64 bg-brand-solana/10 rounded-full blur-3xl pointer-events-none"></div>',
'<div class="max-w-3xl mx-auto text-center mb-4">',
'<h1 class="text-xl sm:text-3xl font-extrabold tracking-tight mb-1">Drop Solana CA <i class="fa-solid fa-arrow-right text-brand-accent text-lg"></i> <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-solana to-brand-cyber">Instant High-Res Merch</span></h1>',
'<p class="text-slate-400 text-xs sm:text-sm">Paste any Solana contract address. We pull the token artwork and print it on demand.</p>',
'</div>',
'<div class="max-w-3xl mx-auto">',
'<div class="relative flex flex-col sm:flex-row items-stretch gap-2 bg-brand-bg/90 p-2 rounded-xl border border-brand-border focus-within:border-brand-accent transition-all glow-accent">',
'<div class="flex-grow flex items-center px-3 space-x-3">',
'<i class="fa-solid fa-magnifying-glass text-slate-500"></i>',
'<input id="caInput" type="text" placeholder="Paste Solana Mint Contract Address (e.g., EKpQGS...)" style="background:transparent;border:0;box-shadow:none;color:#fff" class="w-full text-xs sm:text-sm placeholder-slate-500 focus:outline-none font-mono py-2">',
'<button id="pasteBtn" title="Paste from Clipboard" class="text-slate-400 hover:text-brand-solana p-1.5 rounded transition-colors text-xs font-mono flex items-center gap-1"><i class="fa-regular fa-paste"></i><span class="hidden sm:inline">Paste</span></button>',
'</div>',
'<button id="fetchBtn" class="bg-gradient-to-r from-brand-accent to-purple-600 hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md text-sm"><span id="fetchBtnText">Fetch Token</span><i id="fetchSpinner" class="fa-solid fa-spinner fa-spin hidden"></i></button>',
'</div>',
'<div class="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">',
'<span class="text-slate-500 font-mono text-[11px]">Popular Solana Presets:</span>',
'<button data-preset="WIF" class="tm-preset bg-brand-card hover:bg-brand-cardHover text-slate-300 hover:text-brand-solana px-3 py-1 rounded-full border border-brand-border transition-all font-mono font-medium">$WIF</button>',
'<button data-preset="BONK" class="tm-preset bg-brand-card hover:bg-brand-cardHover text-slate-300 hover:text-brand-solana px-3 py-1 rounded-full border border-brand-border transition-all font-mono font-medium">$BONK</button>',
'<button data-preset="POPCAT" class="tm-preset bg-brand-card hover:bg-brand-cardHover text-slate-300 hover:text-brand-solana px-3 py-1 rounded-full border border-brand-border transition-all font-mono font-medium">$POPCAT</button>',
'</div></div></section>',

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
'<h3 class="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold border-b border-brand-border pb-2 flex items-center justify-between"><span><i class="fa-solid fa-sliders text-brand-accent mr-2"></i> Merch Customizer</span><span class="text-[10px] text-brand-solana">Real-time Render</span></h3>',

'<div><label class="block text-xs font-mono text-slate-400 mb-2">1. PRODUCT SELECTION</label>',
'<div class="grid grid-cols-3 gap-2 font-mono text-xs">',
'<button data-product="tshirt" class="tm-product py-2 px-3 rounded-lg border border-brand-border text-slate-300 hover:border-brand-accent transition-all text-center flex items-center justify-center space-x-1"><i class="fa-solid fa-shirt"></i> <span>T-SHIRT</span></button>',
'<button data-product="hoodie" class="tm-product py-2 px-3 rounded-lg border border-brand-border text-slate-300 hover:border-brand-accent transition-all text-center flex items-center justify-center space-x-1"><i class="fa-solid fa-shirt"></i> <span>HOODIE</span></button>',
'<button data-product="mug" class="tm-product py-2 px-3 rounded-lg border border-brand-border text-slate-300 hover:border-brand-accent transition-all text-center flex items-center justify-center space-x-1"><i class="fa-solid fa-mug-hot"></i> <span>MUG</span></button>',
'</div></div>',

'<div><label class="block text-xs font-mono text-slate-400 mb-2">2. GARMENT COLOR</label>',
'<div id="tmColors" class="flex items-center space-x-2.5 bg-brand-bg p-2.5 rounded-xl border border-brand-border"></div></div>',

'<div><label class="block text-xs font-mono text-slate-400 mb-2">3. GRAPHIC PRINT STYLE</label>',
'<select id="printStyleSelect" class="w-full bg-brand-bg text-slate-200 border border-brand-border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-brand-accent">',
'<option value="centered">CENTERED GRAPHIC IMAGE</option>',
'<option value="centered-small">CENTERED GRAPHIC IMAGE SMALL</option>',
'<option value="badge-left">IMAGE BADGE LEFT</option>',
'<option value="badge-right">IMAGE BADGE RIGHT</option>',
'</select></div>',

/* text under logo */
'<div><label class="block text-xs font-mono text-slate-400 mb-2">TEXT UNDER LOGO</label>',
'<div class="space-y-3 bg-brand-bg p-3 rounded-xl border border-brand-border text-xs font-mono">',
'<label class="flex items-center justify-between cursor-pointer"><span class="text-slate-300">Contract address</span><input id="tmShowCA" type="checkbox" class="w-4 h-4 accent-purple-500"></label>',
'<label class="flex items-center justify-between cursor-pointer"><span class="text-slate-300">$TICKER</span><input id="tmShowTicker" type="checkbox" class="w-4 h-4 accent-purple-500"></label>',
'<div id="tmColorRow" class="pt-3 border-t border-brand-border space-y-2">',
'<div class="flex items-center justify-between gap-2"><span class="text-slate-400 shrink-0">Address font</span><select id="tmCaFont" class="bg-brand-card text-slate-200 border border-brand-border rounded-lg px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-brand-accent"></select></div>',
'<div class="flex items-center justify-between gap-2"><span class="text-slate-400 shrink-0">Ticker font</span><select id="tmTkFont" class="bg-brand-card text-slate-200 border border-brand-border rounded-lg px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-brand-accent"></select></div>',
'<div class="flex items-center justify-between"><span class="text-slate-400">Text colour <span class="text-slate-500">(both lines)</span></span><span class="flex items-center gap-2"><span id="tmColorHex" class="text-slate-300">#FFFFFF</span><span id="tmColorSwatch" class="inline-block w-6 h-6 rounded border border-white/30" style="background:#FFFFFF"></span></span></div>',
'<input id="tmHue" type="range" min="0" max="1000" value="0">',
'<div class="flex items-center justify-between pt-2"><span class="text-slate-400">Font weight</span><span id="tmWeightVal" class="text-slate-300">700</span></div>',
'<input id="tmWeight" type="range" min="400" max="900" step="100" value="700">',
'</div></div></div>',

'<div><label class="block text-xs font-mono text-slate-400 mb-2">4. SELECT SIZE</label>',
'<div id="tmSizes" class="grid grid-cols-5 gap-1.5 font-mono text-xs"></div></div>',
'</div>',

'<div class="glass-panel rounded-2xl p-4 border border-brand-solana/20 bg-brand-solana/5 space-y-2">',
'<div class="flex items-center justify-between text-xs font-mono"><span class="text-brand-solana font-bold flex items-center gap-1.5"><i class="fa-solid fa-wand-magic-sparkles"></i> Print-Ready Pipeline</span><span class="bg-brand-solana/20 text-brand-solana px-2 py-0.5 rounded text-[10px]">150 DPI</span></div>',
'<div class="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">',
'<div><span class="text-slate-500 block">Source Resolution:</span><span id="sourceResText" class="font-bold">-</span></div>',
'<div><span class="text-slate-500 block">Print File Output:</span><span id="upscaleResText" class="font-bold text-brand-solana">1800 x 1800 px</span></div>',
'</div>',
'<div class="w-full bg-brand-bg rounded-full h-1.5 overflow-hidden mt-1"><div class="bg-gradient-to-r from-brand-accent to-brand-solana h-full w-full"></div></div>',
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
'<div class="glass-panel rounded-2xl p-6 relative flex flex-col items-center justify-center min-h-[520px]">',
'<div class="w-full flex items-center justify-between mb-4 text-xs font-mono border-b border-brand-border pb-3">',
'<div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded-full bg-brand-solana animate-ping"></span><span class="text-slate-300 font-bold uppercase tracking-wider">Preview</span></div>',
'<div class="text-slate-400"><span id="canvasStatusText" class="text-brand-solana"><i class="fa-solid fa-circle-check"></i> Ready</span></div>',
'</div>',
'<div class="relative w-full aspect-square max-w-[620px] mx-auto flex items-center justify-center bg-brand-bg/60 rounded-xl border border-brand-border/60 p-2 shadow-2xl">',
'<canvas id="mockupCanvas" width="1200" height="1200" class="w-full h-full object-contain rounded-lg"></canvas>',
'<button id="tmZoomBtn" title="Zoom to the print" class="absolute top-3 right-3 bg-brand-card/90 hover:bg-brand-cardHover text-slate-200 border border-brand-border rounded-lg px-3 py-1.5 text-[11px] font-mono flex items-center gap-1.5 transition-all backdrop-blur"><i class="fa-solid fa-magnifying-glass-plus"></i><span id="tmZoomLabel">Zoom print</span></button>',
'</div>',
'<div class="w-full mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2">',
'<span><i class="fa-solid fa-arrows-rotate text-brand-accent mr-1"></i> <span id="tmViewLabel">Full garment</span></span>',
'<span id="tmPrintSizeLabel">12 x 12 in print area</span>',
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
var product = 'hoodie';
var garment = '#121212';
var style = 'centered';
var size = 'L';
var zoom = false;
var showCA = false, showTicker = false, textColor = '#FFFFFF', textWeight = 700;
var caFont = 'grotesk', tickerFont = 'grotesk';
var PRICES = { tshirt: 38, hoodie: 68, mug: 24 };
var COLORS = [
  ['#121212', 'Jet Black'], ['#FFFFFF', 'White'], ['#4B5563', 'Heather Grey'],
  ['#1E293B', 'Navy'], ['#581C87', 'Purple'], ['#F5F5DC', 'Cream']
];
var SIZES = ['S', 'M', 'L', 'XL', '2XL'];

var chartRange = 'h1', chartShown = null, chartData = null, chartTimer = null;
var chartCache = {}, chartPending = {}, chartHoverX = -1;
var CHART_TTL = 30000;   /* GeckoTerminal edge-caches on-chain data for 30 s */

var canvas, ctx, logoImg = null, logoReady = false;
var tpl = null, tplImg = null;

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
  btn.innerText = 'Fetching...';
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
    btn.innerText = 'Fetch Token';
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

var DEFAULT_FONT = 'grotesk';

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

var fontAsked = { grotesk: true };
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
function drawCaption(p, cx, tickerW, caW, top) {
  if (!showCA && !showTicker) return top;
  p.save();
  p.fillStyle = textColor;
  p.textAlign = 'center';
  p.textBaseline = 'top';
  var y = top + tickerW * 0.05;
  if (showCA && token.ca) {
    var cf = fontById(caFont), cwt = nearestWeight(cf, textWeight);
    var fs = fitFont(p, token.ca, cwt, cf.css, caW, caW * 0.075);
    p.font = cwt + ' ' + fs + 'px ' + cf.css;
    p.fillText(token.ca, cx, y);
    y += fs * 1.5;
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
      /* small graphic: the address may run wider than the image */
      var s2 = 0.4167 * W, x2 = 0.2917 * W, y2 = 0.1875 * W;
      p.drawImage(logoImg, x2, y2, s2, s2);
      drawCaption(p, W / 2, s2, Math.min(s2 * 2, W * 0.92), y2 + s2);
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
  p.fillStyle = garment;
  if (product === 'mug') {
    p.beginPath(); p.roundRect(240 * k, 180 * k, 320 * k, 460 * k, 35 * k); p.fill();
    p.strokeStyle = garment; p.lineWidth = 44 * k;
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

function render() {
  if (!canvas) return;
  var C = canvas.width;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, C, C);

  var realHoodie = (product === 'hoodie' && tpl && tplImg);

  if (zoom) {
    /* close-up of just the print area, so the fine print is readable */
    var pad = 0.10;
    ctx.fillStyle = garment;
    ctx.fillRect(0, 0, C, C);
    if (realHoodie) {
      var m = tpl.print_area_width * pad;
      var cx0 = tpl.print_area_left - m, cy0 = tpl.print_area_top - m;
      var cw = tpl.print_area_width + 2 * m;
      var k = C / cw;
      var ratio = tplImg.naturalWidth / tpl.template_width;
      var D = designCanvas(Math.round(tpl.print_area_width * k));
      ctx.drawImage(D, (tpl.print_area_left - cx0) * k, (tpl.print_area_top - cy0) * k,
        tpl.print_area_width * k, tpl.print_area_height * k);
      ctx.globalAlpha = 1;
      ctx.drawImage(tplImg, cx0 * ratio, cy0 * ratio, cw * ratio, cw * ratio, 0, 0, C, C);
    } else {
      var inset = C * pad;
      ctx.drawImage(designCanvas(Math.round(C - inset * 2)), inset, inset);
    }
    ctx.restore();
    return;
  }

  if (realHoodie) {
    var kk = C / tpl.template_width;
    ctx.fillStyle = garment || tpl.background_color || '#0c0c0c';
    ctx.fillRect(0, 0, C, C);
    var pw = tpl.print_area_width * kk;
    ctx.drawImage(designCanvas(Math.round(pw)), tpl.print_area_left * kk, tpl.print_area_top * kk,
      pw, tpl.print_area_height * kk);
    ctx.drawImage(tplImg, 0, 0, C, C);
    ctx.restore();
    return;
  }

  /* drawn t-shirt / mug */
  var k2 = C / 800;
  drawCartoonGarment(ctx, k2);
  var rect = product === 'mug'
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

var ON = 'py-2 px-3 rounded-lg border border-brand-accent bg-brand-accent/20 text-white font-bold transition-all text-center flex items-center justify-center space-x-1';
var OFF = 'py-2 px-3 rounded-lg border border-brand-border text-slate-300 hover:border-brand-accent transition-all text-center flex items-center justify-center space-x-1';
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
    var on = b.getAttribute('data-color').toLowerCase() === garment.toLowerCase();
    b.className = 'tm-color w-7 h-7 rounded-full focus:outline-none transition-all ' +
      (on ? 'ring-2 ring-brand-accent border-2 border-white' : 'border border-white/20');
  });
}
function updatePrice() {
  var base = PRICES[product];
  document.getElementById('priceUsd').innerText = '$' + base + '.00';
  document.getElementById('priceSol').innerText = '~ ' + (base / 155).toFixed(2) + ' SOL';
}
function updateZoomUI() {
  document.getElementById('tmZoomLabel').innerText = zoom ? 'Full garment' : 'Zoom print';
  document.getElementById('tmZoomBtn').querySelector('i').className =
    zoom ? 'fa-solid fa-magnifying-glass-minus' : 'fa-solid fa-magnifying-glass-plus';
  document.getElementById('tmViewLabel').innerText = zoom ? 'Print close-up' : 'Full garment';
}

function buildControls() {
  var cw = document.getElementById('tmColors');
  cw.innerHTML = COLORS.map(function (c) {
    return '<button class="tm-color" data-color="' + c[0] + '" title="' + c[1] +
      '" style="background:' + c[0] + '"></button>';
  }).join('');
  var sw = document.getElementById('tmSizes');
  sw.innerHTML = SIZES.map(function (s) {
    return '<button class="tm-size" data-size="' + s + '">' + s + '</button>';
  }).join('');

  document.getElementById('printStyleSelect').value = style;
  paintProductButtons(); paintSizes(); paintColors(); updatePrice(); updateZoomUI();

  [].forEach.call(document.querySelectorAll('.tm-product'), function (b) {
    b.addEventListener('click', function () {
      product = b.getAttribute('data-product');
      paintProductButtons(); updatePrice(); render();
    });
  });
  [].forEach.call(document.querySelectorAll('.tm-size'), function (b) {
    b.addEventListener('click', function () { size = b.getAttribute('data-size'); paintSizes(); });
  });
  cw.addEventListener('click', function (e) {
    var b = e.target.closest('.tm-color');
    if (!b) return;
    garment = b.getAttribute('data-color');
    paintColors(); render();
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
    var we1 = nearestWeight(fontById(caFont), textWeight);
    var we2 = nearestWeight(fontById(tickerFont), textWeight);
    document.getElementById('tmWeightVal').innerText =
      (we1 === we2) ? String(we1) : ('CA ' + we1 + ' / $ ' + we2);
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

  document.getElementById('tmZoomBtn').addEventListener('click', function () {
    zoom = !zoom; updateZoomUI(); render();
  });

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
  [].forEach.call(document.querySelectorAll('.tm-preset'), function (b) {
    b.addEventListener('click', function () { fetchToken(PRESET_CAS[b.getAttribute('data-preset')]); });
  });

  var arch = document.getElementById('archModal');
  document.getElementById('showArchBtn').addEventListener('click', function () {
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

function loadTemplate() {
  getJson(API + '/api/template?variant=' + PRINTFUL_VARIANT).then(function (t) {
    if (!t || !t.image_url) throw new Error((t && t.error) || 'no template');
    var img = new Image();
    img.onload = function () { tpl = t; tplImg = img; render(); };
    img.onerror = function () { console.warn('Garment template image failed to load'); };
    img.src = t.image_url;
  }).catch(function (e) {
    console.warn('Realistic hoodie unavailable, using the drawn one:', e.message);
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
  loadTemplate();
  fetchToken(PRESET_CAS.WIF);
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
