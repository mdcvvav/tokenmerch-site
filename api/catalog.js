// GET /api/catalog                 -> the whole Printful catalog, trimmed (id, type, brand, model, image)
// GET /api/catalog?q=hoodie        -> only products whose brand/model/type matches
// GET /api/catalog?id=294          -> that product's variants (id, name, size, color, price)
// Read-only. The API token stays server-side.
let listCache = null;
const variantCache = new Map();

async function pf(path, raw) {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) throw new Error('PRINTFUL_API_TOKEN is not set in Vercel');
  const headers = { Authorization: 'Bearer ' + token };
  if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
  const r = await fetch('https://api.printful.com' + path, { headers });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Printful ' + r.status + ': ' + JSON.stringify(body.error || r.statusText));
  return raw ? body : body.result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // ?styles=<catalog product id> -> the mockup views Printful can render for it (v2 API)
    const styles = Number(req.query.styles);
    if (styles) {
      // the v2 endpoint pages at 10 by default, which silently hides placements
      const data = await pf('/v2/catalog-products/' + styles + '/mockup-styles?limit=100', true);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.status(200).json(data);
    }

    // ?placements=<catalog product id> -> what can be printed where, and what it adds
    const plFor = Number(req.query.placements);
    if (plFor) {
      const data = await pf('/products/' + plFor);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.status(200).json({
        product: { id: data.product.id, model: data.product.model, type: data.product.type_name },
        techniques: data.product.techniques || null,
        files: (data.product.files || []).map((f) => ({
          id: f.id, type: f.type, title: f.title,
          additionalPrice: f.additional_price,
          width: f.width, height: f.height, dpi: f.dpi,
          fillMode: f.fill_mode, options: (f.options || []).map((o) => o.id)
        })),
        options: (data.product.options || []).map((o) => ({
          id: o.id, title: o.title, type: o.type, additionalPrice: o.additional_price
        }))
      });
    }

    // ?sizes=<catalog product id>[&unit=inches|cm] -> Printful's size guide tables
    const sizesFor = Number(req.query.sizes);
    if (sizesFor) {
      const unit = req.query.unit === 'cm' ? 'cm' : 'inches';
      const data = await pf('/products/' + sizesFor + '/sizes?unit=' + unit);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.status(200).json({
        productId: data.product_id,
        availableSizes: data.available_sizes || [],
        tables: (data.size_tables || []).map((t) => ({
          type: t.type,
          unit: t.unit,
          description: t.description || null,
          imageUrl: t.image_url || null,
          imageDescription: t.image_description || null,
          measurements: (t.measurements || []).map((m) => ({
            label: m.type_label,
            values: (m.values || []).map((v) => ({
              size: v.size,
              value: v.value || null,
              min: v.min_value || null,
              max: v.max_value || null
            }))
          }))
        }))
      });
    }

    // ?colors=<catalog product id> -> compact colour + size table for the customizer
    const colorsFor = Number(req.query.colors);
    if (colorsFor) {
      const data = await pf('/products/' + colorsFor);
      const ORDER = ['XS','S','M','L','XL','2XL','3XL','4XL','5XL'];
      const colors = new Map();
      const sizes = new Set();
      for (const v of data.variants || []) {
        const name = v.color || 'Default';
        if (!colors.has(name)) colors.set(name, { name, code: v.color_code || null, ids: {} });
        const size = v.size || 'One size';
        colors.get(name).ids[size] = v.id;
        sizes.add(size);
      }
      const sizeList = [...sizes].sort((a, b) => {
        const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.status(200).json({
        product: { id: data.product.id, type: data.product.type_name, model: data.product.model },
        sizes: sizeList,
        colors: [...colors.values()].sort((a, b) => a.name.localeCompare(b.name))
      });
    }

    const id = Number(req.query.id);
    if (id) {
      if (!variantCache.has(id)) {
        const data = await pf('/products/' + id);
        variantCache.set(id, {
          product: {
            id: data.product.id, type: data.product.type_name,
            brand: data.product.brand, model: data.product.model
          },
          variants: (data.variants || []).map((v) => ({
            id: v.id, name: v.name, size: v.size, color: v.color,
            color_code: v.color_code, price: v.price, image: v.image
          }))
        });
      }
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.status(200).json(variantCache.get(id));
    }

    if (!listCache) {
      listCache = (await pf('/products')).map((p) => ({
        id: p.id, type: p.type_name, brand: p.brand, model: p.model, image: p.image
      }));
    }
    const q = String(req.query.q || '').trim().toLowerCase();
    const out = q
      ? listCache.filter((p) => (p.brand + ' ' + p.model + ' ' + p.type).toLowerCase().includes(q))
      : listCache;
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.status(200).json({ count: out.length, products: out });
  } catch (err) {
    console.error('catalog error', err);
    res.status(500).json({ error: err.message });
  }
}
