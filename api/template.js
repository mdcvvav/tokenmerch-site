// GET /api/template?product=380&variant=10779[&placement=front]
// Returns Printful's blank product photo + the exact print-area position for that variant,
// so the website can draw the design onto the real product photo instantly.
// Defaults to the original hoodie so older links keep working.
const DEFAULT_PRODUCT = 294;   // Bella + Canvas 3719 Unisex Pullover Hoodie
const DEFAULT_VARIANT = 9229;

const cache = new Map();       // productId -> mockup-generator templates payload

async function getTemplates(productId) {
  if (cache.has(productId)) return cache.get(productId);
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) throw new Error('PRINTFUL_API_TOKEN is not set in Vercel');
  const headers = { Authorization: 'Bearer ' + token };
  if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
  const r = await fetch('https://api.printful.com/mockup-generator/templates/' + productId, { headers });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Printful ' + r.status + ': ' + JSON.stringify(body.error || body.result || r.statusText));
  cache.set(productId, body.result);
  return body.result;
}

/* Prefer the asked-for placement, then the front, then whatever the product has. */
function pickTemplate(data, variantId, wanted) {
  const maps = data.variant_mapping || [];
  const vm = maps.find((v) => v.variant_id === variantId) || maps[0];
  if (!vm) return null;
  const list = vm.templates || [];
  const order = [wanted, 'front', 'default', 'all_over'].filter(Boolean);
  let slot = null;
  for (const p of order) { slot = list.find((t) => t.placement === p); if (slot) break; }
  if (!slot) slot = list[0];
  if (!slot) return null;
  const t = (data.templates || []).find((x) => x.template_id === slot.template_id);
  return t ? { slot, t, variantId: vm.variant_id } : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const productId = Number(req.query.product) || DEFAULT_PRODUCT;
    const variantId = Number(req.query.variant) || DEFAULT_VARIANT;
    const data = await getTemplates(productId);
    const hit = pickTemplate(data, variantId, req.query.placement);
    if (!hit) throw new Error('No template for product ' + productId + ' variant ' + variantId);
    const { slot, t } = hit;
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.status(200).json({
      productId,
      variantId: hit.variantId,
      placement: slot.placement,
      image_url: t.image_url,
      background_url: t.background_url || null,
      background_color: t.background_color || null,
      template_width: t.template_width,
      template_height: t.template_height,
      print_area_left: t.print_area_left,
      print_area_top: t.print_area_top,
      print_area_width: t.print_area_width,
      print_area_height: t.print_area_height,
      is_template_on_front: !!t.is_template_on_front
    });
  } catch (err) {
    console.error('template error', err);
    res.status(500).json({ error: err.message });
  }
}
