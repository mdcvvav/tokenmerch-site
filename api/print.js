// GET /api/print?ca=<address>&style=centered|centered-small|badge-left|badge-right
//                 &showCA=1&showTicker=1&color=FFFFFF&w=1800&h=1800
// Returns the print file as a transparent PNG.
import { lookupToken } from '../lib/token.js';
import { renderPrint, parseOptions } from '../lib/render.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const q = req.query || {};
    const token = await lookupToken(q.ca);
    if (!token) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }
    const png = await renderPrint(token, parseOptions(q));
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(png);
  } catch (err) {
    console.error('print error', err);
    res.status(500).json({ error: err.message });
  }
}
