// GET /api/img?url=<printful cdn url>
// Same-origin proxy so the browser can read Printful images pixel by pixel
// (their CDN sends no CORS header, which taints a canvas). Printful hosts only.
const ALLOWED = ['files.cdn.printful.com', 'printful-upload.s3-accelerate.amazonaws.com'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const raw = String(req.query.url || '');
    const u = new URL(raw);
    if (!ALLOWED.includes(u.hostname)) throw new Error('Host not allowed: ' + u.hostname);
    const r = await fetch(u.toString());
    if (!r.ok) throw new Error('Upstream ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.status(200).send(buf);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
