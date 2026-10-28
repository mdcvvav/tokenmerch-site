// GET /api/blank?png=blank|grid&w=&h=
//     -> serves the artwork Printful's mockup generator should print: either nothing at all
//        (a transparent file, which renders the garment blank) or a calibration pattern.
// GET /api/blank?product=342&variant=9927&placement=leg_left&group=Flat&view=Front&design=blank
//     -> runs a mockup task with that artwork and returns the rendered photo URLs.
//
// This exists because Printful publishes no flat laydown TEMPLATE for some products -- the
// joggers come back as a worn model photo -- but its mockup generator can still render the
// flat view. Generating a blank one gives us a product photo to composite on ourselves, and
// generating a calibration one tells us exactly where the print area lands on it.
// One-off tooling, not part of the storefront's hot path.
import { createCanvas } from '@napi-rs/canvas';

export const config = { maxDuration: 60 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pf(path, options = {}) {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) throw new Error('PRINTFUL_API_TOKEN is not set in Vercel');
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
  const r = await fetch('https://api.printful.com' + path, { ...options, headers });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (body && body.error && (body.error.message || body.error.reason)) || r.statusText;
    throw new Error('Printful ' + r.status + ': ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
  }
  return body.result;
}

/* The calibration sheet: a 1px-inset outline plus a solid block in each corner and one in the
   middle of the top edge, which is what makes the orientation unambiguous once it comes back
   wrapped around a photographed garment. Magenta because nothing on a sweatpant is magenta. */
function gridPng(w, h) {
  const c = createCanvas(w, h);
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#FF00FF';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#00FF00';
  const m = Math.max(4, Math.round(Math.min(w, h) * 0.12));
  g.fillRect(0, 0, m, m);
  g.fillRect(w - m, 0, m, m);
  g.fillRect(0, h - m, m, m);
  g.fillRect(w - m, h - m, m, m);
  g.fillStyle = '#000000';
  g.fillRect(Math.round(w / 2 - m / 2), 0, m, m);
  return c.toBuffer('image/png');
}

function blankPng() {
  const c = createCanvas(8, 8);
  c.getContext('2d').clearRect(0, 0, 8, 8);
  return c.toBuffer('image/png');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = req.query || {};
  try {
    if (q.png) {
      const w = Math.min(4000, Math.max(8, parseInt(q.w, 10) || 8));
      const h = Math.min(8000, Math.max(8, parseInt(q.h, 10) || 8));
      const buf = q.png === 'grid' ? gridPng(w, h) : blankPng();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600');
      return res.status(200).send(buf);
    }

    const product = Number(q.product);
    const variant = Number(q.variant);
    const placement = String(q.placement || 'front').replace(/[^a-z0-9_]/gi, '');
    if (!product || !variant) throw new Error('product and variant are required');

    const pfs = await pf('/mockup-generator/printfiles/' + product);
    const vp = (pfs.variant_printfiles || []).find((v) => v.variant_id === variant);
    const pid = vp && vp.placements && vp.placements[placement];
    const file = (pfs.printfiles || []).find((p) => p.printfile_id === pid);
    if (!file) throw new Error('No printfile for ' + placement + ' on variant ' + variant);
    const W = file.width, H = file.height;

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const art = 'https://' + host + '/api/blank?png=' + (q.design === 'grid' ? 'grid' : 'blank') +
      '&w=' + W + '&h=' + H;

    const body = {
      variant_ids: [variant],
      format: 'png',
      files: [{ placement, image_url: art,
        position: { area_width: W, area_height: H, width: W, height: H, top: 0, left: 0 } }]
    };
    if (q.group) body.option_groups = [String(q.group)];
    if (q.view) body.options = [String(q.view)];

    const task = await pf('/mockup-generator/create-task/' + product, {
      method: 'POST', body: JSON.stringify(body)
    });

    let result = null;
    for (let i = 0; i < 25; i++) {
      await sleep(2000);
      result = await pf('/mockup-generator/task?task_key=' + encodeURIComponent(task.task_key));
      if (result.status === 'completed' || result.status === 'failed') break;
    }
    if (!result || result.status !== 'completed') {
      return res.status(502).json({ error: 'Mockup not ready', status: result && result.status,
        details: result && result.error, art });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      printfile: { width: W, height: H, dpi: file.dpi }, art,
      mockups: (result.mockups || []).map((m) => ({
        placement: m.placement, style: m.style_id || null, url: m.mockup_url,
        extra: (m.extra || []).map((e) => ({ title: e.title, option: e.option, url: e.url }))
      }))
    });
  } catch (err) {
    console.error('blank error', err);
    res.status(500).json({ error: err.message });
  }
}
