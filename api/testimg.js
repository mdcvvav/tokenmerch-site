// GET /api/testimg?kind=calib  -> a four-quadrant calibration PNG (red/green/blue/yellow)
// GET /api/testimg?kind=blank  -> a fully transparent PNG
// Printful downloads these when we build a one-off mockup, so they must be public.
// calib lets us find where the print area lands in a model photo; blank gives us the
// same photo with nothing printed on it.
import { createCanvas } from '@napi-rs/canvas';

const S = 1000;

export default function handler(req, res) {
  const kind = String(req.query.kind || 'calib');
  const c = createCanvas(S, S);
  const p = c.getContext('2d');

  if (kind === 'calib') {
    const half = S / 2;
    const quads = [['#FF0000', 0, 0], ['#00FF00', half, 0], ['#0000FF', 0, half], ['#FFFF00', half, half]];
    quads.forEach(function (q) { p.fillStyle = q[0]; p.fillRect(q[1], q[2], half, half); });
    // thin white cross so the quadrant boundaries stay findable by eye too
    p.strokeStyle = '#FFFFFF'; p.lineWidth = 4;
    p.beginPath(); p.moveTo(half, 0); p.lineTo(half, S); p.moveTo(0, half); p.lineTo(S, half); p.stroke();
    p.strokeRect(2, 2, S - 4, S - 4);
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600');
  res.status(200).send(c.toBuffer('image/png'));
}
