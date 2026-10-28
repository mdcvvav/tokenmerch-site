// GET /api/mockup?ca=<address>&style=vintage&showCA=1&showTicker=1&color=FFFFFF&variant=9229
// Asks Printful's mockup generator for a real product photo of the hoodie wearing the print.
// Uses the PRINTFUL_API_TOKEN environment variable (never sent to the browser).
const PRODUCT_ID = 294;          // Bella + Canvas 3719 Unisex Pullover Hoodie
const DEFAULT_VARIANT = 9229;    // Black / L
const ALLOWED_VARIANTS = [9227, 9228, 9229, 9230, 9231]; // Black S-2XL

export const config = { maxDuration: 60 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let printfileCache = null;

async function pf(path, options = {}) {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) throw new Error('PRINTFUL_API_TOKEN is not set in Vercel');
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
  const r = await fetch('https://api.printful.com' + path, { ...options, headers });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (body && (body.error && (body.error.message || body.error.reason))) || body.result || r.statusText;
    throw new Error('Printful ' + r.status + ': ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
  }
  return body.result;
}

async function getFrontPrintfile(variantId) {
  if (!printfileCache) printfileCache = await pf('/mockup-generator/printfiles/' + PRODUCT_ID);
  const pfs = printfileCache;
  const placements = Object.keys(pfs.available_placements || {});
  const placement = ['front', 'default', 'front_dtf'].find((p) => placements.includes(p)) || placements[0];
  const vp = (pfs.variant_printfiles || []).find((v) => v.variant_id === variantId);
  const printfileId = vp && vp.placements && vp.placements[placement];
  const printfile = (pfs.printfiles || []).find((p) => p.printfile_id === printfileId) || (pfs.printfiles || [])[0];
  return { placement, printfile, placements };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const q = req.query || {};
    if (!q.ca) { res.status(400).json({ error: 'Missing ca' }); return; }
    const variantId = ALLOWED_VARIANTS.includes(Number(q.variant)) ? Number(q.variant) : DEFAULT_VARIANT;
    const { placement, printfile, placements } = await getFrontPrintfile(variantId);
    if (!printfile) throw new Error('No printfile found for placement ' + placement);
    const W = printfile.width, H = printfile.height;

    // Public URL of our own print-file endpoint, which Printful downloads.
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const params = new URLSearchParams({
      ca: String(q.ca),
      style: String(q.style || 'vintage'),
      showCA: q.showCA === '1' ? '1' : '0',
      showTicker: q.showTicker === '1' ? '1' : '0',
      color: String(q.color || 'FFFFFF').replace('#', ''),
      w: String(W),
      h: String(H)
    });
    // Forward the layout the preview resolved. Dropping any of these here puts us back
    // where we were: the renderer re-deriving a size, a colour or an image url and
    // quietly printing something other than what the customer approved.
    ['dpi', 'scale', 'shTop', 'side', 'caFont', 'tickerFont', 'weight',
     'img', 'srcW', 'artIn', 'artTop', 'tickerFirst', 'tickerCap', 'caMin']
      .forEach((k) => { if (q[k] !== undefined && q[k] !== '') params.set(k, String(q[k])); });
    const printUrl = 'https://' + host + '/api/print?' + params.toString();

    const task = await pf('/mockup-generator/create-task/' + PRODUCT_ID, {
      method: 'POST',
      body: JSON.stringify({
        variant_ids: [variantId],
        format: 'jpg',
        files: [{
          placement,
          image_url: printUrl,
          position: { area_width: W, area_height: H, width: W, height: H, top: 0, left: 0 }
        }]
      })
    });

    let result = null;
    for (let i = 0; i < 25; i++) {
      await sleep(2000);
      result = await pf('/mockup-generator/task?task_key=' + encodeURIComponent(task.task_key));
      if (result.status === 'completed' || result.status === 'failed') break;
    }
    if (!result || result.status !== 'completed') {
      res.status(502).json({ error: 'Mockup not ready', status: result && result.status, details: result && result.error, printUrl });
      return;
    }
    res.status(200).json({
      placement,
      placements,
      printfile: { width: W, height: H, dpi: printfile.dpi },
      printUrl,
      mockups: (result.mockups || []).map((m) => ({
        placement: m.placement,
        url: m.mockup_url,
        extra: (m.extra || []).map((e) => ({ title: e.title, url: e.url }))
      }))
    });
  } catch (err) {
    console.error('mockup error', err);
    res.status(500).json({ error: err.message });
  }
}
