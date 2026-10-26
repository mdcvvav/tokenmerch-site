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
      const data = await pf('/v2/catalog-products/' + styles + '/mockup-styles', true);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.status(200).json(data);
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
