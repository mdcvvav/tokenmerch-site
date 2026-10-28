// Draws the print file (transparent PNG) for the front of the hoodie.
// The design is laid out in a square print area of width W with every position a
// fraction of W, exactly as app.js does it, so the print matches the preview.
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

// The fonts the printed text can use. Mirrors the FONTS list in app.js.
export const FONT_FAMILIES = {
  archivo: { google: 'Archivo+Black', weights: [400] },
  chakra: { google: 'Chakra+Petch', weights: [400, 500, 600, 700] },
  inter: { google: 'Inter', weights: [400, 500, 600, 700, 800, 900] },
  grotesk: { google: 'Space+Grotesk', weights: [400, 500, 600, 700] },
  mono: { google: 'Space+Mono', weights: [400, 700] }
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
// Mirrors drawCaption in app.js. Both sides must stay identical; the client sends the
// resolved numbers (ticker order and cap, the address's minimum size) so this renderer
// never has to re-derive a layout decision and silently disagree with the preview.
function drawCaption(ctx, opts, token, cx, tickerW, caW, top, caLines, IN) {
  if (!opts.showCA && !opts.showTicker) return top;
  ctx.save();
  ctx.fillStyle = opts.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let y = top + tickerW * 0.05;

  const drawTicker = () => {
    if (!opts.showTicker || !token.ticker) return;
    const t = '$' + token.ticker;
    const fs = fitFont(ctx, t, alias(opts.tickerFont, opts.tickerWeight), tickerW,
                       tickerW * (opts.tickerCap || 0.22));
    ctx.font = fs + 'px ' + tkFace(opts);
    ctx.fillText(t, cx, y);
    y += fs * 1.1;
  };

  const drawAddr = () => {
    if (!opts.showCA || !token.ca) return;
    const face = alias(opts.caFont, opts.caWeight);
    const one = fitFont(ctx, token.ca, face, caW, caW * 0.075);
    const minPx = IN ? (opts.caMin || 0.16) * IN : 0;
    // Two lines inside a narrow graphic, rather than one line too thin to print.
    if ((caLines === 2 || (minPx && one < minPx)) && token.ca.length > 24) {
      const cut = Math.ceil(token.ca.length / 2);
      const l1 = token.ca.slice(0, cut), l2 = token.ca.slice(cut);
      const fs2 = Math.min(fitFont(ctx, l1, face, caW, caW * 0.10),
                           fitFont(ctx, l2, face, caW, caW * 0.10));
      ctx.font = fs2 + 'px ' + caFace(opts);
      ctx.fillText(l1, cx, y); y += fs2 * 1.12;
      ctx.fillText(l2, cx, y); y += fs2 * 1.5;
    } else {
      ctx.font = one + 'px ' + caFace(opts);
      ctx.fillText(token.ca, cx, y);
      y += one * 1.5;
    }
  };

  if (opts.tickerFirst) { drawTicker(); y += tickerW * 0.03; drawAddr(); }
  else { drawAddr(); drawTicker(); }

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
/* Mirrors PLACE in app.js -- see claude/print-placement.md. Both renderers must
   agree, and until now they did not: the preview centred the design square in the
   print area while this file anchored it to the top, which put the chest badge 2 in
   lower in the preview than in the actual print file on a 12x16 garment. */
const PLACE = {
  badgeDia: 2.60, badgeFromCentre: 3.75,
  badgeCentreDrop: 5.50, artTopDrop: 5.30, minMargin: 0.15
};
function clampOffset(off, half, inW) {
  const limit = (inW || 12) / 2 - half;
  return Math.max(0, Math.min(off, limit));
}
// `shTop` is how far below the shoulder line the print area starts, passed in by
// the caller because this renderer only sees pixels. Default is a plain tee.
function dropInArea(shTop, drop, half) {
  // no shoulder line (mug, poster, stickers, windbreaker): sit just inside the top
  if (!shTop) return Math.max(PLACE.minMargin, 0.9 - (half || 0));
  return Math.max(PLACE.minMargin, drop - shTop - (half || 0));
}

export async function renderPrint(token, opts) {
  await Promise.all([
    loadFont(opts.caFont, opts.caWeight),
    loadFont(opts.tickerFont, opts.tickerWeight)
  ]);
  const W = opts.width, H = opts.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  // The url the CUSTOMER'S preview settled on, not whatever a fresh lookup returns now.
  // lookupToken takes DexScreener first and only falls back to Jupiter, and liquidity
  // rankings move, so re-deriving it here can print a different image than was shown.
  const img = await loadTokenImage(opts.img || token.img);
  const style = opts.style;
  const side = opts.side === 'front' ? 'front' : 'back';

  // Two-sided style: the chest badge is its own print file, the artwork is the other.
  if (img && (style === 'back-badge' || style === 'back-ticker')) {
    if (side === 'front') {
      const IN = W / (opts.inW || 12);
      const s = PLACE.badgeDia * IN;
      const y = dropInArea(opts.shTop, PLACE.badgeCentreDrop, PLACE.badgeDia / 2) * IN;
      const off = clampOffset(PLACE.badgeFromCentre, PLACE.badgeDia * 0.6, opts.inW);
      const cx = W / 2 + off * IN, cy = y + s / 2;
      const x = cx - s / 2;
      const tb = '$' + (token.ticker || '');
      if (style === 'back-ticker') {
        // the ticker on its own, filling the same chest footprint
        if (token.ticker) {
          const fs = fitFont(ctx, tb, alias(opts.tickerFont, opts.tickerWeight), s * 1.45, s * 0.52);
          ctx.save();
          ctx.fillStyle = opts.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = fs + 'px ' + tkFace(opts);
          ctx.fillText(tb, cx, cy);
          ctx.restore();
        }
        return canvas.toBuffer('image/png');
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, s, s);
      ctx.restore();
      if (opts.showTicker && token.ticker) {
        const fsb = fitFont(ctx, tb, alias(opts.tickerFont, opts.tickerWeight), s * 1.2, s * 0.26);
        ctx.save();
        ctx.fillStyle = opts.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = fsb + 'px ' + tkFace(opts);
        ctx.fillText(tb, cx, y + s + s * 0.06);
        ctx.restore();
      }
    } else {
      const IN3 = W / (opts.inW || 12);
      const s3 = opts.artIn ? opts.artIn * IN3 : 0.55 * W;
      const x3 = (W - s3) / 2;
      const y3 = dropInArea(opts.shTop, PLACE.artTopDrop, 0) * IN3;
      ctx.drawImage(img, x3, y3, s3, s3);
      drawCaption(ctx, opts, token, W / 2, s3, s3, y3 + s3, 0, IN3);
    }
    return canvas.toBuffer('image/png');
  }

  if (img) {
    if (style === 'badge-left' || style === 'badge-right') {
      // badge-left prints on the wearer's left chest, which is the
      // right-hand side of a front view; badge-right is its mirror
      const IN1 = W / (opts.inW || 12);
      const s1 = PLACE.badgeDia * IN1;
      const y1 = dropInArea(opts.shTop, PLACE.badgeCentreDrop, PLACE.badgeDia / 2) * IN1;
      const off1 = clampOffset(PLACE.badgeFromCentre, PLACE.badgeDia * 0.76, opts.inW);
      const bcx = W / 2 + (style === 'badge-left' ? off1 : -off1) * IN1;
      const bcy = y1 + s1 / 2;
      const x1 = bcx - s1 / 2;
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
    } else {
      const IN = W / (opts.inW || 12);
      const small = style === 'centered-small';
      // `artIn` is the size the preview actually drew, in inches -- it varies with the
      // source artwork's resolution and the poster pins it outright. The old fixed
      // 0.55 / 0.4167 fractions are the fallback for a caller that sends neither.
      const s = opts.artIn ? opts.artIn * IN : (small ? 0.4167 : 0.55) * W;
      const x = (W - s) / 2;
      const y = opts.artTop != null
        ? opts.artTop * IN
        : dropInArea(opts.shTop, PLACE.artTopDrop, 0) * IN;
      ctx.drawImage(img, x, y, s, s);
      drawCaption(ctx, opts, token, W / 2, s, s, y + s, small ? 2 : 0, IN);
    }
  } else {
    // Fallback badge when the logo can't be loaded
    const r = 0.1875 * W, cx = W / 2, cy = dropInArea(opts.shTop, PLACE.artTopDrop, 0) * (W / (opts.inW || 12)) + r;
    ctx.fillStyle = '#14F195';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d0f17';
    ctx.font = 0.0667 * W + 'px ' + tkFace(opts);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$' + token.ticker, cx, cy);
    drawCaption(ctx, opts, token, cx, 0.375 * W, W * 0.8, cy + r, 0, W / (opts.inW || 12));
  }
  return canvas.toBuffer('image/png');
}

const STYLES = ['centered', 'centered-small', 'badge-left', 'badge-right', 'back-badge', 'back-ticker'];
// older names kept working so saved links don't break
const LEGACY = { vintage: 'centered', arch: 'centered-small', minimal: 'badge-right' };

export function parseOptions(q) {
  const hex = String(q.color || 'FFFFFF').replace(/[^0-9a-fA-F]/g, '').slice(0, 6).padEnd(6, 'F');
  const wanted = LEGACY[q.style] || q.style;
  const style = STYLES.includes(wanted) ? wanted : 'centered';
  const width = Math.min(Math.max(parseInt(q.w, 10) || 1800, 200), 6000);
  const height = Math.min(Math.max(parseInt(q.h, 10) || 1800, 200), 8000);
  // 400 is the floor: thinner strokes break up in DTG print on dark garments
  const asked = Math.min(900, Math.max(400, Math.round((parseInt(q.weight, 10) || 700) / 100) * 100));
  // the print area in inches, so placement can be reasoned about in real units
  const dpi = Math.min(600, Math.max(72, parseInt(q.dpi, 10) || 150));
  // Cut-and-sew panels print oversized: the windbreaker's 34x38 file covers only about
  // 20x22 in of visible garment. `scale` is file inches per visible inch, so placement
  // stays specified in real inches. 1 for every other product. Mirrors placeScale in app.js.
  const placeScale = Math.min(4, Math.max(0.25, parseFloat(q.scale) || 1));
  const caFont = FONT_FAMILIES[q.caFont] ? q.caFont : 'archivo';
  const tickerFont = FONT_FAMILIES[q.tickerFont] ? q.tickerFont : 'archivo';
  return {
    style,
    caFont,
    tickerFont,
    caWeight: nearestWeight(FONT_FAMILIES[caFont].weights, asked),
    tickerWeight: nearestWeight(FONT_FAMILIES[tickerFont].weights, asked),
    showCA: q.showCA === '1' || q.showCA === 'true',
    showTicker: q.showTicker === '1' || q.showTicker === 'true',
    color: '#' + hex.toUpperCase(),
    side: q.side === 'front' ? 'front' : 'back',
    dpi,
    inW: +((width / dpi) / placeScale).toFixed(4),
    placeScale,
    // inches from the shoulder line to the top of this garment's print area
    shTop: Math.min(12, Math.max(0, parseFloat(q.shTop) || 3.6)),
    // ---- resolved by the preview and passed through verbatim -------------------
    // Anything re-derived here is a chance for the print file to disagree with what
    // the customer approved, so the preview sends its answers rather than its inputs.
    img: typeof q.img === 'string' && /^https?:\/\//.test(q.img) ? q.img : '',
    srcW: Math.max(0, parseInt(q.srcW, 10) || 0),
    artIn: Math.min(40, Math.max(0, parseFloat(q.artIn) || 0)),
    artTop: q.artTop == null || q.artTop === '' ? null
      : Math.min(40, Math.max(0, parseFloat(q.artTop) || 0)),
    tickerFirst: q.tickerFirst === '1' || q.tickerFirst === 'true',
    tickerCap: Math.min(0.6, Math.max(0.05, parseFloat(q.tickerCap) || 0.22)),
    caMin: Math.min(1, Math.max(0, parseFloat(q.caMin) || 0.16)),
    width,
    height
  };
}
