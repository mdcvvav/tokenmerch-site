// POST /api/shopify-webhook?key=<TM_WEBHOOK_KEY>
//
// Shopify orders/paid -> Printful DRAFT order (confirm=false).
// Nothing is submitted for printing automatically: the draft lands in the Printful
// dashboard and a human presses Confirm. That is deliberate while the store is new.
//
// Each Shopify line carries the hidden properties app.js writes in cartProps():
//   _print_file         absolute URL to /api/print?... (the artwork, transparent PNG)
//   _print_file_back    same, for two-sided garments
//   _printful_variant   Printful catalog variant id
//   _placement          Printful placement id ('front', 'leg_front_left', ...)
// A line without _print_file is not ours and is skipped.
//
// Env:
//   PRINTFUL_API_TOKEN       required
//   PRINTFUL_STORE_ID        optional (only for multi-store tokens)
//   SHOPIFY_WEBHOOK_SECRET   the signing secret from Settings > Notifications > Webhooks
//   TM_WEBHOOK_KEY           optional - a ?key= secret in the URL, as a second gate
//                            and to unlock the GET selftest below
// At least one of those two must be set or every request is refused.
//   TM_WEBHOOK_DRYRUN        optional - '1' logs the payload and creates nothing

import crypto from 'node:crypto';

export const config = { api: { bodyParser: false }, maxDuration: 30 };

/* ---------- helpers ---------- */

function timingSafeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  if (x.length !== y.length || !x.length) return false;
  return crypto.timingSafeEqual(x, y);
}

/* Vercel may already have consumed the stream to build req.body. Read the raw
   bytes when they are still there, because HMAC only works over exact bytes. */
async function readRaw(req) {
  if (req.readableEnded || req.readableAborted) return null;
  const chunks = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const buf = Buffer.concat(chunks);
  return buf.length ? buf : null;
}

function verifyHmac(raw, header) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return 'no-secret';
  if (!raw) return 'no-raw-body';
  if (!header) return 'no-header';
  const digest = crypto.createHmac('sha256', secret).update(raw).digest('base64');
  return timingSafeEqual(digest, header) ? 'ok' : 'mismatch';
}

/* Printful wants a country-specific state code for these; elsewhere it must be absent. */
const STATE_REQUIRED = new Set(['US', 'CA', 'AU', 'JP', 'IT', 'ES', 'MX', 'BR']);

function recipientFrom(order) {
  const a = order.shipping_address || order.billing_address || {};
  const r = {
    name: [a.first_name, a.last_name].filter(Boolean).join(' ') || a.name || order.email || 'Customer',
    address1: a.address1 || '',
    city: a.city || '',
    country_code: (a.country_code || '').toUpperCase(),
    zip: a.zip || '',
    email: order.email || order.contact_email || ''
  };
  if (a.address2) r.address2 = a.address2;
  if (a.company) r.company = a.company;
  if (a.phone || order.phone) r.phone = a.phone || order.phone;
  const st = (a.province_code || '').toUpperCase();
  if (st && STATE_REQUIRED.has(r.country_code)) r.state_code = st;
  return r;
}

function propsOf(line) {
  const out = {};
  const p = line.properties;
  if (Array.isArray(p)) p.forEach((kv) => { if (kv && kv.name) out[kv.name] = kv.value; });
  else if (p && typeof p === 'object') Object.assign(out, p);
  return out;
}

function itemsFrom(order) {
  const items = [];
  const skipped = [];
  (order.line_items || []).forEach((line) => {
    const pr = propsOf(line);
    const variant = Number(pr._printful_variant);
    const front = pr._print_file;
    if (!front || !variant) { skipped.push(line.title || line.id); return; }

    const files = [{ type: pr._placement || 'default', url: front }];
    if (pr._print_file_back) files.push({ type: 'back', url: pr._print_file_back });

    items.push({
      external_id: 'shopify-' + order.id + '-' + line.id,
      variant_id: variant,
      quantity: Math.max(1, Number(line.quantity) || 1),
      name: line.title + (line.variant_title ? ' / ' + line.variant_title : ''),
      retail_price: String(line.price || ''),
      files
    });
  });
  return { items, skipped };
}

async function printful(path, init) {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) throw new Error('PRINTFUL_API_TOKEN is not set in Vercel');
  const headers = Object.assign(
    { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    init && init.headers
  );
  if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
  const r = await fetch('https://api.printful.com' + path, Object.assign({}, init, { headers }));
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

/* ---------- handler ---------- */

export default async function handler(req, res) {
  const raw = await readRaw(req);

  // GET ?selftest=1 reports which env vars exist. Never the values. It is only
  // reachable once TM_WEBHOOK_KEY is set, because there is nothing else to gate it on.
  if (req.method === 'GET') {
    if (!process.env.TM_WEBHOOK_KEY) {
      res.status(404).json({ error: 'selftest disabled: TM_WEBHOOK_KEY is not set' });
      return;
    }
    if (!timingSafeEqual(req.query.key, process.env.TM_WEBHOOK_KEY)) {
      res.status(401).json({ error: 'bad key' });
      return;
    }
    res.status(200).json({
      ok: true,
      printful_token: !!process.env.PRINTFUL_API_TOKEN,
      printful_store_id: !!process.env.PRINTFUL_STORE_ID,
      webhook_key: !!process.env.TM_WEBHOOK_KEY,
      shopify_hmac_secret: !!process.env.SHOPIFY_WEBHOOK_SECRET,
      dry_run: process.env.TM_WEBHOOK_DRYRUN === '1'
    });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  // Two independent gates, either of which is enough. Refuse everything until at
  // least one is configured, so a half-finished deploy is never an open endpoint.
  const haveKey = !!process.env.TM_WEBHOOK_KEY;
  const haveSecret = !!process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!haveKey && !haveSecret) {
    console.error('webhook refused: neither SHOPIFY_WEBHOOK_SECRET nor TM_WEBHOOK_KEY is set');
    res.status(503).json({ error: 'webhook not configured' });
    return;
  }

  if (haveKey && !timingSafeEqual(req.query.key, process.env.TM_WEBHOOK_KEY)) {
    console.warn('webhook rejected: bad or missing ?key');
    res.status(401).json({ error: 'bad key' });
    return;
  }

  // A missing header once a secret IS set means it did not come from Shopify,
  // because Shopify always signs. 'no-raw-body' means the platform consumed the
  // stream before we could hash it, which is survivable only if the ?key gate held.
  const hmac = verifyHmac(raw, req.headers['x-shopify-hmac-sha256']);
  if (hmac === 'mismatch' || hmac === 'no-header' || (hmac === 'no-raw-body' && !haveKey)) {
    console.warn('webhook rejected: signature ' + hmac);
    res.status(401).json({ error: 'bad signature' });
    return;
  }

  let order;
  try {
    order = raw ? JSON.parse(raw.toString('utf8')) : req.body;
    if (typeof order === 'string') order = JSON.parse(order);
  } catch (err) {
    console.error('webhook: unparseable body', err.message);
    res.status(400).json({ error: 'bad json' });
    return;
  }
  if (!order || !order.id) {
    res.status(400).json({ error: 'no order id' });
    return;
  }

  const topic = req.headers['x-shopify-topic'] || 'orders/paid';
  const external_id = 'shopify-' + order.id;
  const { items, skipped } = itemsFrom(order);
  console.log('webhook', topic, 'order', order.name || order.id,
    'hmac=' + hmac, items.length + ' printable', skipped.length + ' skipped');

  // Always 200 for things we simply have nothing to do about, so Shopify does not
  // retry them for two days.
  if (!items.length) {
    console.warn('webhook: no printable lines on', external_id, skipped);
    res.status(200).json({ ok: true, created: false, reason: 'no printable lines', skipped });
    return;
  }

  const recipient = recipientFrom(order);
  const missing = ['address1', 'city', 'country_code', 'zip'].filter((k) => !recipient[k]);
  if (missing.length) {
    console.error('webhook: incomplete address on', external_id, missing);
    res.status(200).json({ ok: false, created: false, reason: 'incomplete address', missing });
    return;
  }

  const draft = {
    external_id,
    shipping: 'STANDARD',
    recipient,
    items,
    retail_costs: {
      currency: order.currency || 'CAD',
      subtotal: String(order.subtotal_price || ''),
      discount: String(order.total_discounts || '0.00'),
      shipping: String(((order.total_shipping_price_set || {}).shop_money || {}).amount || '0.00'),
      tax: String(order.total_tax || '0.00')
    }
  };

  if (process.env.TM_WEBHOOK_DRYRUN === '1') {
    console.log('webhook DRY RUN, would create:', JSON.stringify(draft));
    res.status(200).json({ ok: true, created: false, reason: 'dry run', draft });
    return;
  }

  // confirm=false -> a draft a human approves in the Printful dashboard.
  const r = await printful('/orders?confirm=false', { method: 'POST', body: JSON.stringify(draft) });

  if (r.ok) {
    const id = (r.body.result || {}).id;
    console.log('webhook: created Printful draft', id, 'for', external_id);
    res.status(200).json({ ok: true, created: true, printful_order: id, skipped });
    return;
  }

  // Printful rejects a duplicate external_id, which is exactly the idempotency we
  // want: Shopify retries a webhook it thinks failed, and the second one is a no-op.
  const msg = JSON.stringify(r.body.error || r.body.result || r.body || '');
  if (r.status === 409 || /external[_ ]id/i.test(msg)) {
    console.log('webhook: draft already exists for', external_id);
    res.status(200).json({ ok: true, created: false, reason: 'already exists' });
    return;
  }

  // A real Printful failure: 500 so Shopify retries, and the order is visible in
  // the Vercel logs either way.
  console.error('webhook: Printful ' + r.status + ' for ' + external_id + ' ' + msg);
  res.status(500).json({ ok: false, created: false, printful_status: r.status, printful_error: msg });
}
