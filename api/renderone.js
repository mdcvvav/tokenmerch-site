// GET /api/renderone?product=586&variant=15114&image=<public png url>
//     [&variants=15114,15124,...]  several variants in ONE mockup task
//     [&groups=Men's,Women's 2][&views=Front,Left Front]
// groups/views map to Printful's mockup option groups (the model or flat style families)
// and the camera views inside them; leave them off for the default flat set.
// One-off mockup render with an arbitrary image. Used at build time only, to produce
// the calibration shot and the blank model shot for a product; never called by visitors.
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const productId = Number(req.query.product);
    const many = String(req.query.variants || '').split(',').map(Number).filter(Boolean);
    const variantId = Number(req.query.variant) || many[0];
    const variantIds = many.length ? many : [variantId];
    const imageUrl = String(req.query.image || '');
    if (!productId || !variantId || !imageUrl) throw new Error('Need product, variant(s) and image');

    const pfs = await pf('/mockup-generator/printfiles/' + productId);
    const placements = Object.keys(pfs.available_placements || {});
    const placement = ['front', 'default', 'front_dtf'].find((p) => placements.includes(p)) || placements[0];
    const vp = (pfs.variant_printfiles || []).find((v) => v.variant_id === variantId);
    const pfId = vp && vp.placements && vp.placements[placement];
    const printfile = (pfs.printfiles || []).find((p) => p.printfile_id === pfId) || (pfs.printfiles || [])[0];
    const W = printfile.width, H = printfile.height;

    const list = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
    const groups = list(req.query.groups);
    const views = list(req.query.views);

    const task = await pf('/mockup-generator/create-task/' + productId, {
      method: 'POST',
      body: JSON.stringify({
        variant_ids: variantIds,
        format: 'jpg',
        ...(groups.length ? { option_groups: groups } : {}),
        ...(views.length ? { options: views } : {}),
        files: [{
          placement,
          image_url: imageUrl,
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
      res.status(502).json({ error: 'not ready', status: result && result.status, details: result && result.error });
      return;
    }
    res.status(200).json({
      placement,
      printfile: { width: W, height: H },
      mockups: (result.mockups || []).map((m) => ({
        placement: m.placement,
        variant_ids: m.variant_ids || null,
        url: m.mockup_url,
        extra: (m.extra || []).map((e) => ({ title: e.title, option: e.option, url: e.url }))
      }))
    });
  } catch (err) {
    console.error('renderone error', err);
    res.status(500).json({ error: err.message });
  }
}
