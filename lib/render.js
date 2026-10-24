// Draws the print file (transparent PNG) for the front of the hoodie.
// Layout mirrors the website preview: the preview's chest area (x 160-640, from y 200 down)
// is mapped onto the full width of the print file.
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

const FONT_SOURCES = [
  { family: 'Inter', css: 'https://fonts.googleapis.com/css2?family=Inter:wght@600;900' },
  { family: 'JetBrains Mono', css: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;900' }
];

let fontsPromise = null;
export function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      for (const f of FONT_SOURCES) {
        try {
          // An old user agent makes Google Fonts return plain TTF files.
          const css = await (await fetch(f.css, { headers: { 'User-Agent': 'Mozilla/4.0' } })).text();
          const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
          for (const u of urls) {
            const buf = Buffer.from(await (await fetch(u)).arrayBuffer());
            GlobalFonts.register(buf, f.family);
          }
        } catch (e) {
          console.error('Font load failed for', f.family, e.message);
        }
      }
    })();
  }
  return fontsPromise;
}

async function loadTokenImage(url) {
  if (!url) return null;
  const tries = [
    'https://wsrv.nl/?url=' + encodeURIComponent(url) + '&w=1200&h=1200&fit=cover&output=png',
    url
  ];
  for (const u of tries) {
    try {
      const r = await fetch(u);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      return await loadImage(buf);
    } catch (e) { /* try next */ }
  }
  return null;
}

function fitFont(ctx, text, weight, family, maxW, maxSize) {
  ctx.font = weight + ' 100px "' + family + '"';
  const w = ctx.measureText(text).width || 1;
  return Math.min(maxSize, (100 * maxW) / w);
}

// Contract address on one line (exactly the logo's width) and a large $TICKER below.
function drawCaption(ctx, opts, token, cx, w, top) {
  if (!opts.showCA && !opts.showTicker) return top;
  ctx.save();
  ctx.fillStyle = opts.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let y = top + Math.max(5, w * 0.05);
  if (opts.showCA && token.ca) {
    const fs = fitFont(ctx, token.ca, 500, 'JetBrains Mono', w, w * 0.09);
    ctx.font = '500 ' + fs + 'px "JetBrains Mono"';
    ctx.fillText(token.ca, cx, y);
    y += fs * 1.6;
  }
  if (opts.showTicker && token.ticker) {
    const t = '$' + token.ticker;
    const fs = fitFont(ctx, t, 900, 'Inter', w, w * 0.22);
    ctx.font = '900 ' + fs + 'px "Inter"';
    ctx.fillText(t, cx, y);
    y += fs * 1.1;
  }
  ctx.restore();
  return y;
}

/**
 * opts: { style: 'minimal'|'vintage'|'arch', showCA, showTicker, color: '#RRGGBB', width, height }
 * token: { ca, ticker, img }
 */
export async function renderPrint(token, opts) {
  await loadFonts();
  const W = opts.width, H = opts.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const s = W / 480;                 // preview units -> print pixels
  const X = (x) => (x - 160) * s;    // preview x -> print x
  const Y = (y) => (y - 200) * s;    // preview y -> print y
  const img = await loadTokenImage(token.img);

  if (img) {
    if (opts.style === 'minimal') {
      const size = 100 * s, x = X(270), y = Y(260);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
      drawCaption(ctx, opts, token, x + size / 2, size, y + size);
    } else if (opts.style === 'arch') {
      const size = 200 * s, x = X(300), y = Y(290);
      ctx.fillStyle = '#14F195';
      ctx.font = '900 ' + 36 * s + 'px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('$' + token.ticker, W / 2, y - 25 * s);
      ctx.drawImage(img, x, y, size, size);
      const bottom = drawCaption(ctx, opts, token, W / 2, size, y + size);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 ' + 16 * s + 'px "Inter"';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('SOLANA OFFICIAL MERCH', W / 2, bottom + 30 * s);
    } else {
      // 'vintage' (Centered Graphic Box) is the default: logo only, no border,
      // sized to fill the square the old frame used to occupy.
      const box = 264 * s, x = X(268), y = Y(238);
      ctx.drawImage(img, x, y, box, box);
      drawCaption(ctx, opts, token, W / 2, box, y + box);
    }
  } else {
    // Fallback badge when the logo can't be loaded
    const r = 90 * s, cx = W / 2, cy = Y(360);
    ctx.fillStyle = '#14F195';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d0f17';
    ctx.font = '900 ' + 32 * s + 'px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$' + token.ticker, cx, cy);
    drawCaption(ctx, opts, token, cx, 180 * s, cy + r);
  }
  return canvas.toBuffer('image/png');
}

export function parseOptions(q) {
  const hex = String(q.color || 'FFFFFF').replace(/[^0-9a-fA-F]/g, '').slice(0, 6).padEnd(6, 'F');
  const style = ['minimal', 'vintage', 'arch'].includes(q.style) ? q.style : 'vintage';
  const width = Math.min(Math.max(parseInt(q.w, 10) || 1800, 200), 6000);
  const height = Math.min(Math.max(parseInt(q.h, 10) || 2400, 200), 8000);
  return {
    style,
    showCA: q.showCA === '1' || q.showCA === 'true',
    showTicker: q.showTicker === '1' || q.showTicker === 'true',
    color: '#' + hex.toUpperCase(),
    width,
    height
  };
}
