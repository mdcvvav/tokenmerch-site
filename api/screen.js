/* POST /api/screen   { ca, ticker, name, img }
   ->  200 { verdict: 'pass' }
   ->  200 { verdict: 'fail', code: '<first reason>' }
   ->  200 { verdict: 'fail', code: 'unavailable' }   (refused, not cached)

   The gate that runs the moment a contract address is pasted. Nothing reaches
   a print file until this says pass.

   Two stages, in cost order:

     1. lib/policy.js textGate() on ticker + name. Deterministic, no network,
        no model, sub-millisecond. Catches the obvious cases for free.

     2. One Haiku 5.5 call on the artwork the store will actually print. The
        model is asked to IDENTIFY -- characters, brands, people, symbols,
        visible text -- and never to judge. lib/policy.js decide() turns those
        observations into the verdict in plain code.

   Why the split: a vision model asked "is this infringing?" is guessing at law
   it has no access to, and its answer cannot be tuned without rewriting the
   prompt and re-testing every case. Asked "what do you see?" it is doing the
   thing it is actually good at, the answer is auditable months later, and the
   store's appetite for risk lives in one editable file.

   Cost at Haiku 5.5 pricing: roughly 1.5k input tokens (a 512 px image is
   about 800 of them) and 200 out, so about US$0.00025 a screen -- four
   thousand screens to the dollar. The per-CA cache means a token already
   looked at this day is free.

   Needs ANTHROPIC_API_KEY in the environment. Without it the endpoint refuses
   every token rather than waving them through.
*/
import { POLICY_VERSION, textGate, decide } from '../lib/policy.js';

export const config = { maxDuration: 30 };

const MODEL = 'claude-haiku-5-5';
const ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/* --- per-instance cache --------------------------------------------------
   Keyed on the policy version, so editing lib/policy.js invalidates every
   stored verdict instead of grandfathering tokens cleared under older rules.
   Vercel reuses a warm instance for many requests, so the hit rate on a
   token being shared around is high. It is not shared between instances and
   it does not survive a deploy -- that is acceptable for a cache whose only
   job is saving money, and when it matters it can move to a KV store without
   changing anything else here. */
const TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map();

function cacheGet(ca) {
  const k = ca + '|' + POLICY_VERSION;
  const e = cache.get(k);
  if (!e) return null;
  if (Date.now() - e.at > TTL_MS) { cache.delete(k); return null; }
  cache.delete(k); cache.set(k, e);          /* LRU touch */
  return e.val;
}

function cachePut(ca, val) {
  const k = ca + '|' + POLICY_VERSION;
  cache.set(k, { at: Date.now(), val });
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}

/* --- rate limit ----------------------------------------------------------
   A customer-facing verdict is an oracle: anyone can sit there pasting
   addresses to map exactly what the filter blocks, and every probe costs
   money. Per-instance and therefore leaky, but it stops the casual case for
   nothing. */
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX = 20;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length > RL_MAX;
}

/* --- the artwork ---------------------------------------------------------
   Routed through the same resizer the storefront uses, which normalises
   whatever the token deployer uploaded -- webp, gif, an avif nobody expected,
   a 3000 px png -- into a 512 px jpeg. That bounds the image token count and
   guarantees a media type the API accepts. Direct fetch is the fallback. */
const ACCEPT = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/* Every attempt gets its own deadline. Without one, a resizer that accepts the
   connection and then never answers holds the whole function until Vercel kills
   it at maxDuration -- which is a 30-second wait and then a refused sale, for
   an image that the direct fetch would have returned in under a second. */
const ART_TIMEOUT_MS = 7000;

async function fetchArtwork(url) {
  const via = 'https://wsrv.nl/?url=' + encodeURIComponent(url)
    + '&w=512&h=512&fit=inside&output=jpg&q=82';
  for (const [tag, u] of [['wsrv', via], ['direct', url]]) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ART_TIMEOUT_MS);
    try {
      const r = await fetch(u, { headers: { accept: 'image/*' }, signal: ctl.signal });
      if (!r.ok) continue;
      let type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const buf = Buffer.from(await r.arrayBuffer());
      if (!buf.length || buf.length > 5 * 1024 * 1024) continue;
      if (!ACCEPT.includes(type)) {
        /* sniff rather than trust a vague header */
        if (buf[0] === 0xff && buf[1] === 0xd8) type = 'image/jpeg';
        else if (buf[0] === 0x89 && buf[1] === 0x50) type = 'image/png';
        else if (buf.slice(0, 3).toString('latin1') === 'GIF') type = 'image/gif';
        else if (buf.slice(8, 12).toString('latin1') === 'WEBP') type = 'image/webp';
        else continue;
      }
      return { b64: buf.toString('base64'), type, source: tag, bytes: buf.length };
    } catch (e) { /* try the next one */ } finally { clearTimeout(timer); }
  }
  return null;
}

/* --- the model call ------------------------------------------------------ */
const SYSTEM = [
  'You are an image and text cataloguer for a print-on-demand shop. You do not',
  'decide what may be printed. You report only what is observably present, and a',
  'separate rule engine makes every decision.',
  '',
  'Report what an ordinary person would recognise. Be specific with names. Do not',
  'speculate: if a frog is just a frog, it is not Pepe, and a generic swoosh-like',
  'curve is not the Nike mark. Confidence is how sure you are the thing named is',
  'really there, from 0 to 1.',
  '',
  'Definitions you must follow exactly:',
  '- characters: fictional characters, mascots, or creatures owned by someone --',
  '  cartoon, film, game, comic, anime, or a well-known internet character such as',
  '  Pepe the Frog or Wojak. A restyled or redrawn version still counts. A generic',
  '  animal, person, or object invented for this token does NOT count, and neither',
  '  does a PHOTOGRAPH of a real animal, person, or object. The token having a name',
  '  is not evidence that its artwork is someone else\'s character: report a',
  '  character only when you recognise the depicted character from somewhere other',
  '  than this token. If you are hedging, say so with a low confidence.',
  '- brands: company names, logos, wordmarks, or distinctive trade dress visible in',
  '  the image. Name the company.',
  '- real_people: real, identifiable individuals, living or dead. Name them. An',
  '  AI-generated or caricatured likeness still counts if the person is recognisable.',
  '- hate_symbols: symbols or insignia of hate movements, e.g. swastika, SS runes,',
  '  Confederate battle flag, 1488, hate-group logos.',
  '- slurs: racial, ethnic, religious, sexual, gender, or disability slurs in any',
  '  text visible in the image, including deliberate misspellings and leetspeak, and',
  '  in the ticker and token name given to you.',
  '- sexual: "none", "suggestive" (nudity, implied sex, or revealing clothing with no',
  '  genitals or sex act shown), or "genitalia_or_sex_act" (visible genitals, or a',
  '  sex act depicted).',
  '- minors_sexualized: true only if someone who appears to be under 18 is shown in a',
  '  sexual way.',
  '- gore: true for graphic injury, mutilation, or realistic corpses.',
  '- illegal_or_terror: true for terror-group imagery, or imagery promoting or',
  '  instructing serious crime.',
  '- self_harm: true for imagery depicting or encouraging suicide or self-injury.',
  '- visible_text: every piece of text legible in the image, verbatim.',
  '- description: ONE short sentence, twenty words at most. It is a sanity check',
  '  for a human reading the log later, not a caption.',
  '',
  'Reply with one JSON object and nothing else.'
].join('\n');

const SHAPE = [
  '{',
  '  "characters": [{"name": string, "confidence": number}],',
  '  "brands": [{"name": string, "confidence": number}],',
  '  "real_people": [{"name": string, "confidence": number}],',
  '  "hate_symbols": [{"name": string, "confidence": number}],',
  '  "slurs": [{"name": string, "confidence": number}],',
  '  "sexual": "none" | "suggestive" | "genitalia_or_sex_act",',
  '  "minors_sexualized": boolean,',
  '  "gore": boolean,',
  '  "illegal_or_terror": boolean,',
  '  "self_harm": boolean,',
  '  "visible_text": string,',
  '  "description": string   // one short sentence, 20 words max',
  '}'
].join('\n');

function parseJson(text) {
  const s = String(text || '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
}

async function observe(art, ticker, name) {
  const body = {
    model: MODEL,
    /* Generous, because a truncated reply is unparseable and an unparseable
       reply is a refused sale. 700 was not enough: the description ran long
       and the JSON was cut off mid-string. */
    max_tokens: 1500,
    /* No `temperature`: Haiku 5.5 rejects it outright ("`temperature` is
       deprecated for this model"), and a 400 here is a refused sale. */
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: art.type, data: art.b64 } },
          {
            type: 'text',
            text: 'Ticker: $' + (ticker || '(none)') + '\nToken name: ' + (name || '(none)')
              + '\n\nCatalogue the image above, and include any slur found in the ticker'
              + ' or token name. Use exactly this shape:\n' + SHAPE
          }
        ]
      }
    ]
  };

  const ctl = new AbortController();
  /* 15 s, not 20: two 7 s artwork attempts can precede this and the function
     dies at 30. A deadline that outlives its own budget is not a deadline. */
  const timer = setTimeout(() => ctl.abort(), 15000);
  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
  } finally {
    clearTimeout(timer);
  }

  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error('model HTTP ' + r.status + ' ' + t.slice(0, 300));
  }
  const d = await r.json();
  /* No assistant prefill: Haiku 5.5 refuses a conversation that does not end
     with a user message. parseJson takes the first { to the last }, so a
     stray sentence either side of the object is harmless. */
  const text = (d.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const obs = parseJson(text);
  if (!obs) throw new Error('model returned unparseable output: ' + text.slice(0, 300));
  obs._usage = d.usage || null;
  return obs;
}

/* --- CORS ----------------------------------------------------------------
   TM_SCREEN_ORIGINS is a comma-separated allowlist. Unset means allow any
   origin, which is the right default while the storefront domain is still
   moving around; set it before launch so the endpoint is not a free
   classifier for the internet. */
function cors(req, res) {
  const allow = (process.env.TM_SCREEN_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (!allow.length) res.setHeader('Access-Control-Allow-Origin', '*');
  else if (allow.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  else return false;
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Max-Age', '86400');
  return true;
}

export default async function handler(req, res) {
  if (!cors(req, res)) { res.status(403).json({ error: 'origin not allowed' }); return; }
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    res.status(429).json({ verdict: 'fail', code: 'rate_limited', version: POLICY_VERSION });
    return;
  }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};

  const ca = String(b.ca || '').trim();
  const ticker = String(b.ticker || '').trim().replace(/^\$+/, '').slice(0, 64);
  const name = String(b.name || '').trim().slice(0, 160);
  const img = String(b.img || '').trim().slice(0, 2048);

  if (!ADDR.test(ca)) { res.status(400).json({ error: 'bad ca' }); return; }

  /* A pass is only a pass for exactly what was screened. In practice the
     ticker, name and artwork all follow from the address, so this still
     behaves as a per-CA cache -- but they are not guaranteed to: DexScreener
     and Jupiter disagree about symbols, and DexScreener's pair ranking moves,
     so the same address can resolve to a different symbol or a different
     image an hour later. Keying on every input the verdict depended on means
     a changed input is re-screened instead of inheriting an old greenlight. */
  const key = [ca, ticker, name, img].join('|');
  const hitv = cacheGet(key);
  if (hitv) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(Object.assign({ cached: true }, hitv));
    return;
  }

  /* Stage 1: free. */
  const t = textGate(ticker, name);
  if (t) {
    const out = { verdict: 'fail', code: t.code, version: POLICY_VERSION };
    cachePut(key, out);
    console.log('screen', ca, '$' + ticker, 'FAIL text', t.code, JSON.stringify(t.detail));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(out);
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('screen refused: ANTHROPIC_API_KEY is not set');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ verdict: 'fail', code: 'unavailable', version: POLICY_VERSION });
    return;
  }

  /* Stage 2: the artwork. No image means nothing to print, which is not a
     content failure -- the storefront substitutes its own ticker placard. */
  if (!img) {
    const out = { verdict: 'pass', version: POLICY_VERSION, note: 'no artwork' };
    cachePut(key, out);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(out);
    return;
  }

  try {
    const art = await fetchArtwork(img);
    if (!art) throw new Error('artwork could not be fetched: ' + img);

    const obs = await observe(art, ticker, name);
    const d = decide(obs);

    /* One line per screen, and it is the audit trail. It records what the
       model saw, not just the answer, so a verdict can be re-judged later
       under different rules -- and it is the evidence that this store screens
       at all, which is the difference between an innocent and a wilful
       infringement if a notice ever lands. */
    console.log('screen', JSON.stringify({
      ca, ticker, name, img,
      artSource: art.source, artBytes: art.bytes,
      policy: POLICY_VERSION,
      verdict: d.verdict,
      reasons: d.reasons,
      saw: {
        characters: obs.characters, brands: obs.brands, real_people: obs.real_people,
        hate_symbols: obs.hate_symbols, slurs: obs.slurs, sexual: obs.sexual,
        minors_sexualized: obs.minors_sexualized, gore: obs.gore,
        illegal_or_terror: obs.illegal_or_terror, self_harm: obs.self_harm,
        visible_text: obs.visible_text, description: obs.description
      },
      usage: obs._usage
    }));

    const out = d.verdict === 'pass'
      ? { verdict: 'pass', version: POLICY_VERSION }
      : { verdict: 'fail', code: d.reasons[0].code, version: POLICY_VERSION };
    cachePut(key, out);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(out);
  } catch (err) {
    /* Michele's call: refuse and lose the sale rather than print something
       nobody looked at. NOT cached -- a timeout must not condemn a token
       forever, and the customer pressing Drop again is the retry. */
    console.error('screen', ca, '$' + ticker, 'UNAVAILABLE', err && err.message);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ verdict: 'fail', code: 'unavailable', version: POLICY_VERSION });
  }
}
