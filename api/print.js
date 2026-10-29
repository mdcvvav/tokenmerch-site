// GET /api/print?ca=<address>&style=centered|centered-small|badge-left|badge-right
//                 &showCA=1&showTicker=1&color=FFFFFF&w=1800&h=1800
// Returns the print file as a transparent PNG.
//
// With pin=1 the caller is supplying the token's resolved ticker and image URL and
// no live lookup happens. That matters for an order placed hours earlier: DexScreener
// ranks pairs by liquidity and the ranking moves, so a fresh lookup can hand back a
// different symbol or a different image than the customer approved.
//
// Response headers describe what was actually drawn, so the order webhook can refuse
// a file that lost its artwork:
//   X-TM-Art         ok | missing | none
//   X-TM-Art-Source  wsrv | direct | (absent)
//   X-TM-Size        <width>x<height>
import { lookupToken } from '../lib/token.js';
import { renderPrint, parseOptions } from '../lib/render.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'X-TM-Art, X-TM-Art-Source, X-TM-Size');
  try {
    const q = req.query || {};
    const pinned = q.pin === '1' || q.pin === 'true';
    let token;
    if (pinned) {
      token = { ca: String(q.ca || ''), ticker: String(q.ticker || ''), img: String(q.img || '') };
      if (!token.ca) {
        res.status(400).json({ error: 'pin=1 needs ca' });
        return;
      }
    } else {
      token = await lookupToken(q.ca);
      if (!token) {
        res.status(404).json({ error: 'Token not found' });
        return;
      }
    }
    const report = {};
    const png = await renderPrint(token, parseOptions(q), report);
    res.setHeader('X-TM-Art', report.art || 'none');
    if (report.artSource) res.setHeader('X-TM-Art-Source', report.artSource);
    res.setHeader('X-TM-Size', (report.width || 0) + 'x' + (report.height || 0));
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(png);
  } catch (err) {
    console.error('print error', err);
    res.status(500).json({ error: err.message });
  }
}
