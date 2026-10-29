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
// Every print file is fetched and inspected before the draft is created, so a URL
// that 404s, returns the wrong size, or quietly lost its token artwork can never
// reach a print job. The sha256 of the bytes goes into each item's external_id, which
// Printful keeps, so what was sent to print stays provable after the fact.
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
      lineId: line.id,
      variant_id: variant,
      quantity: Math.max(1, Number(line.quantity) || 1),
      name: line.title + (line.variant_title ? ' / ' + line.variant_title : ''),
      retail_price: String(line.price || ''),
      files
    });
  });
  return { items, skipped };
}

/* ---------- artwork provenance ---------- */

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/* Width and height live in the IHDR chunk, right after the 8-byte signature. */
function pngSize(buf) {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_MAGIC)) return null;
  if (buf.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/* The print URL carries the pixel size it was asked for, so the file can be checked
   against its own request without consulting anything else. */
function askedSize(url) {
  try {
    const q = new URL(url).searchParams;
    const w = parseInt(q.get('w'), 10), h = parseInt(q.get('h'), 10);
    return (w && h) ? { w, h } : null;
  } catch (e) { return null; }
}

async function inspectArtwork(url) {
  let r;
  try {
    r = await fetch(url, { headers: { accept: 'image/png' } });
  } catch (err) {
    return { ok: false, why: 'fetch failed: ' + err.message };
  }
  if (!r.ok) return { ok: false, why: 'HTTP ' + r.status };

  const art = r.headers.get('x-tm-art') || '';
  // 'none' is the designed fallback for a token that has no image at all, and the
  // customer saw the same thing in the preview. 'missing' means the image URL was
  // there and did not load, which would print a green placeholder badge instead of
  // the token. That must never go out.
  if (art === 'missing') return { ok: false, why: 'token artwork failed to load' };

  const buf = Buffer.from(await r.arrayBuffer());
  const size = pngSize(buf);
  if (!size) return { ok: false, why: 'not a PNG' };

  const want = askedSize(url);
  if (want && (want.w !== size.w || want.h !== size.h)) {
    return { ok: false, why: 'size ' + size.w + 'x' + size.h + ', asked ' + want.w + 'x' + want.h };
  }

  return {
    ok: true,
    bytes: buf.length,
    size: size.w + 'x' + size.h,
    art: art || 'unknown',
    source: r.headers.get('x-tm-art-source') || '',
    sha256: crypto.createHash('sha256').update(buf).digest('hex')
  };
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

  // Fetch and inspect every print file BEFORE anything is created. A draft is only
  // worth having if its artwork is real, so this fails the whole order rather than
  // sending one good item and one broken one.
  const provenance = [];
  for (const item of items) {
    for (const f of item.files) {
      const got = await inspectArtwork(f.url);
      if (!got.ok) {
        console.error('webhook: artwork rejected on ' + external_id +
          ' line ' + item.lineId + ' (' + f.type + '): ' + got.why + ' -- ' + f.url);
        // 500 so Shopify retries: a flaky fetch heals itself, and a genuinely broken
        // file exhausts the retries and shows up as a failed webhook instead of
        // becoming a print job nobody checked.
        res.status(500).json({ ok: false, created: false, reason: 'artwork failed inspection',
          line: item.lineId, placement: f.type, detail: got.why });
        return;
      }
      provenance.push({ line: item.lineId, placement: f.type, bytes: got.bytes,
        size: got.size, art: got.art, source: got.source, sha256: got.sha256 });
      console.log('webhook artwork ' + external_id + ' line ' + item.lineId +
        ' ' + f.type + ' ' + got.size + ' ' + got.bytes + 'B art=' + got.art +
        (got.source ? '/' + got.source : '') + ' sha256=' + got.sha256);
    }
    // The hash of the front file rides along in the item reference Printful stores,
    // so the order itself records which artwork it was built from.
    const headSha = (provenance.find((p) => p.line === item.lineId) || {}).sha256 || '';
    item.external_id = 'shopify-' + order.id + '-' + item.lineId +
      (headSha ? '-' + headSha.slice(0, 12) : '');
    delete item.lineId;
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
    res.status(200).json({ ok: true, created: false, reason: 'dry run', draft, provenance });
    return;
  }

  // confirm=false -> a draft a human approves in the Printful dashboard.
  const r = await printful('/orders?confirm=false', { method: 'POST', body: JSON.stringify(draft) });

  if (r.ok) {
    const id = (r.body.result || {}).id;
    console.log('webhook: created Printful draft', id, 'for', external_id);
    res.status(200).json({ ok: true, created: true, printful_order: id, skipped, provenance });
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
