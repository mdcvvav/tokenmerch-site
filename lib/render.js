// Draws the print file (transparent PNG) for the front of the hoodie.
// The design is laid out in a square print area of width W with every position a
// fraction of W, exactly as app.js does it, so the print matches the preview.
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

// The fonts the printed text can use. Mirrors the FONTS list in app.js.
export const FONT_FAMILIES = {
  grotesk: { google: 'Space+Grotesk', weights: [300, 400, 500, 600, 700] },
  mono: { google: 'Space+Mono', weights: [400, 700] },
  chakra: { google: 'Chakra+Petch', weights: [300, 400, 500, 600, 700] },
  archivo: { google: 'Archivo+Black', weights: [400] },
  inter: { google: 'Inter', weights: [300, 400, 500, 600, 700, 800, 900] }
};

export function nearestWeight(weights, w) {
  let best = weights[0];
  for (const x of weights) if (Math.abs(x - w) < Math.abs(best - w)) best = x;
  return best;
}

// One font at one weight per alias ("chakra700"). Several weights sharing a
// family name are not reliably resolved by the canvas font matcher, and the
// symptom is every weight printing identically.
const alias = (id, w) => id + w;

// Fonts are fetched the first time a request actually needs them, and cached
// for the life of the instance. Loading the whole catalogue up front would
// put a dozen downloads in front of the first print file.
const fontJobs = new Map();
function loadFont(id, weight) {
  const key = alias(id, weight);
  if (!fontJobs.has(key)) {
    fontJobs.set(key, (async () => {
      const fam = FONT_FAMILIES[id];
      const url = 'https://fonts.googleapis.com/css2?family=' + fam.google +
        (fam.weights.length > 1 ? ':wght@' + weight : '');
      // An old user agent makes Google Fonts return plain TTF files.
      const css = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/4.0' } })).text();
      const m = css.match(/url\((https:[^)]+)\)/);
      if (!m) throw new Error('no font file for ' + key);
      const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer());
      GlobalFonts.register(buf, key);
    })().catch((e) => {
      console.error('Font load failed for', key, e.message);
      fontJobs.delete(key);          // let a later request try again
    }));
  }
  return fontJobs.get(key);
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

function fitFont(ctx, text, family, maxW, maxSize) {
  ctx.font = '100px "' + family + '"';
  const w = ctx.measureText(text).width || 1;
  return Math.min(maxSize, (100 * maxW) / w);
}

// the family alias for the weight the customer picked
const caFace = (o) => '"' + alias(o.caFont, o.caWeight) + '"';
const tkFace = (o) => '"' + alias(o.tickerFont, o.tickerWeight) + '"';

// Contract address on one line, then the big $TICKER under it.
// caW is how wide the address may run; tickerW sizes the $TICKER.
function drawCaption(ctx, opts, token, cx, tickerW, caW, top) {
  if (!opts.showCA && !opts.showTicker) return top;
  ctx.save();
  ctx.fillStyle = opts.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let y = top + tickerW * 0.05;
  if (opts.showCA && token.ca) {
    const fs = fitFont(ctx, token.ca, alias(opts.caFont, opts.caWeight), caW, caW * 0.075);
    ctx.font = fs + 'px ' + caFace(opts);
    ctx.fillText(token.ca, cx, y);
    y += fs * 1.5;
  }
  if (opts.showTicker && token.ticker) {
    const t = '$' + token.ticker;
    const fs = fitFont(ctx, t, alias(opts.tickerFont, opts.tickerWeight), tickerW, tickerW * 0.22);
    ctx.font = fs + 'px ' + tkFace(opts);
    ctx.fillText(t, cx, y);
    y += fs * 1.1;
  }
  ctx.restore();
  return y;
}

// Contract address curved along the bottom of a round badge.
function drawArcCA(ctx, opts, token, cx, cy, r, W) {
  const text = token.ca;
  if (!text) return cy + r;
  const gap = r * 0.16;
  const span = 2.97; // ~170 deg of wrap
  ctx.font = '100px ' + caFace(opts);
  const adv = ctx.measureText(text).width / 100;
  const denom = adv - span * 0.45;
  const fs = denom > 0 ? Math.min((span * (r + gap)) / denom, W * 0.05) : r * 0.2;
  ctx.save();
  ctx.font = fs + 'px ' + caFace(opts);
  ctx.fillStyle = opts.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const rMid = r + gap + fs * 0.45;
  const widths = [];
  let total = 0;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    widths.push(w);
    total += w;
  }
  // y grows downward, so a larger angle is further left: start at the left
  // end of the arc and walk right, each glyph turned to sit on the curve.
  let a = Math.PI / 2 + total / rMid / 2;
  for (let i = 0; i < text.length; i++) {
    const th = a - widths[i] / 2 / rMid;
    ctx.save();
    ctx.translate(cx + rMid * Math.cos(th), cy + rMid * Math.sin(th));
    ctx.rotate(th - Math.PI / 2);
    ctx.fillText(text.charAt(i), 0, 0);
    ctx.restore();
    a -= widths[i] / rMid;
  }
  ctx.restore();
  return cy + rMid + fs * 0.6;
}

/**
 * opts: { style: 'centered'|'centered-small'|'badge-left'|'badge-right',
 *         showCA, showTicker, color: '#RRGGBB', width, height }
 * token: { ca, ticker, img }
 *
 * The design is laid out in a square print area of width W, with every
 * position a fraction of W, so this matches the website preview exactly.
 */
export async function renderPrint(token, opts) {
  await Promise.all([
    loadFont(opts.caFont, opts.caWeight),
    loadFont(opts.tickerFont, opts.tickerWeight)
  ]);
  const W = opts.width, H = opts.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const img = await loadTokenImage(token.img);
  const style = opts.style;

  if (img) {
    if (style === 'badge-left' || style === 'badge-right') {
      // badge-left prints on the wearer's left chest, which is the
      // right-hand side of a front view; badge-right is its mirror
      const s1 = 0.2083 * W, y1 = 0.125 * W;
      const x1 = style === 'badge-left' ? W - 0.229 * W - s1 : 0.229 * W;
      const bcx = x1 + s1 / 2, bcy = y1 + s1 / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(bcx, bcy, s1 / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x1, y1, s1, s1);
      ctx.restore();
      let below = y1 + s1;
      if (opts.showCA && token.ca) below = drawArcCA(ctx, opts, token, bcx, bcy, s1 / 2, W);
      if (opts.showTicker && token.ticker) {
        const tb = '$' + token.ticker;
        const fsb = fitFont(ctx, tb, alias(opts.tickerFont, opts.tickerWeight), s1 * 1.2, s1 * 0.26);
        ctx.save();
        ctx.fillStyle = opts.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = fsb + 'px ' + tkFace(opts);
        ctx.fillText(tb, bcx, below + s1 * 0.06);
        ctx.restore();
      }
    } else if (style === 'centered-small') {
      // small graphic: the address may run wider than the image
      const s2 = 0.4167 * W, x2 = 0.2917 * W, y2 = 0.1875 * W;
      ctx.drawImage(img, x2, y2, s2, s2);
      drawCaption(ctx, opts, token, W / 2, s2, Math.min(s2 * 2, W * 0.92), y2 + s2);
    } else {
      // big centred graphic: the address stays inside the image's width
      const s3 = 0.55 * W, x3 = 0.225 * W, y3 = 0.0792 * W;
      ctx.drawImage(img, x3, y3, s3, s3);
      drawCaption(ctx, opts, token, W / 2, s3, s3, y3 + s3);
    }
  } else {
    // Fallback badge when the logo can't be loaded
    const r = 0.1875 * W, cx = W / 2, cy = 0.3333 * W;
    ctx.fillStyle = '#14F195';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d0f17';
    ctx.font = 0.0667 * W + 'px ' + tkFace(opts);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$' + token.ticker, cx, cy);
    drawCaption(ctx, opts, token, cx, 0.375 * W, W * 0.8, cy + r);
  }
  return canvas.toBuffer('image/png');
}

const STYLES = ['centered', 'centered-small', 'badge-left', 'badge-right'];
// older names kept working so saved links don't break
const LEGACY = { vintage: 'centered', arch: 'centered-small', minimal: 'badge-right' };

export function parseOptions(q) {
  const hex = String(q.color || 'FFFFFF').replace(/[^0-9a-fA-F]/g, '').slice(0, 6).padEnd(6, 'F');
  const wanted = LEGACY[q.style] || q.style;
  const style = STYLES.includes(wanted) ? wanted : 'centered';
  const width = Math.min(Math.max(parseInt(q.w, 10) || 1800, 200), 6000);
  const height = Math.min(Math.max(parseInt(q.h, 10) || 1800, 200), 8000);
  const asked = Math.min(900, Math.max(100, Math.round((parseInt(q.weight, 10) || 700) / 100) * 100));
  const caFont = FONT_FAMILIES[q.caFont] ? q.caFont : 'grotesk';
  const tickerFont = FONT_FAMILIES[q.tickerFont] ? q.tickerFont : 'grotesk';
  return {
    style,
    caFont,
    tickerFont,
    caWeight: nearestWeight(FONT_FAMILIES[caFont].weights, asked),
    tickerWeight: nearestWeight(FONT_FAMILIES[tickerFont].weights, asked),
    showCA: q.showCA === '1' || q.showCA === 'true',
    showTicker: q.showTicker === '1' || q.showTicker === 'true',
    color: '#' + hex.toUpperCase(),
    width,
    height
  };
}
