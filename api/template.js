// GET /api/template?variant=9229
// Returns Printful's blank product photo + exact print-area position for the hoodie front,
// so the website can draw the design onto the real garment photo instantly.
const PRODUCT_ID = 294; // Bella + Canvas 3719 Unisex Pullover Hoodie
const ALLOWED_VARIANTS = [9227, 9228, 9229, 9230, 9231]; // Black S-2XL

let cache = null;

async function getTemplates() {
  if (cache) return cache;
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) throw new Error('PRINTFUL_API_TOKEN is not set in Vercel');
  const headers = { Authorization: 'Bearer ' + token };
  if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
  const r = await fetch('https://api.printful.com/mockup-generator/templates/' + PRODUCT_ID, { headers });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Printful ' + r.status + ': ' + JSON.stringify(body.error || body.result || r.statusText));
  cache = body.result;
  return cache;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const variantId = ALLOWED_VARIANTS.includes(Number(req.query.variant)) ? Number(req.query.variant) : 9229;
    const data = await getTemplates();
    const vm = (data.variant_mapping || []).find((v) => v.variant_id === variantId);
    const slot = vm && (vm.templates || []).find((t) => t.placement === 'front' || t.placement === 'default');
    const t = slot && (data.templates || []).find((x) => x.template_id === slot.template_id);
    if (!t) throw new Error('No front template for variant ' + variantId);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.status(200).json({
      variantId,
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
