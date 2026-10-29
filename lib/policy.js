/* ---------------------------------------------------------------------------
   The rule layer. Everything tunable lives in this file.

   The model never decides. api/screen.js asks Haiku to *identify* what is in
   the artwork -- characters, brands, people, symbols, visible text -- and this
   file turns those observations into a verdict in plain code. That split is
   deliberate:

     - a verdict is explainable from the logged JSON months later
     - loosening or tightening is editing a list or a constant here, not
       rewriting a prompt and re-testing every case
     - the same observation can be judged differently as the store's appetite
       changes, without re-screening anything

   POLICY_VERSION is part of the cache key. Bump it on any change below, or
   old greenlights get grandfathered under rules that no longer apply.
--------------------------------------------------------------------------- */

export const POLICY_VERSION = 2;

/* --- what we do with each kind of finding ---------------------------------
   'block'  -> red light, sale refused
   'allow'  -> ignored
   Michele's call, Oct 2026: refuse rather than queue. There is no manual
   review tier, so anything not 'allow' ends the sale on the spot. */
export const STANCE = {
  slur: 'block',
  hate_symbol: 'block',
  csam_or_minor_sexual: 'block',
  genitalia_or_sex_act: 'block',
  suggestive: 'allow',        /* his line is genitalia, not nudity */
  gore: 'block',
  character: 'block',         /* fictional/IP-owned characters, incl. restyled fan art */
  brand: 'block',
  real_person: 'allow',       /* see note */
  illegal_or_terror: 'block',
  weapon_sales: 'allow',      /* a gun *drawn* on a shirt is not a gun being sold */
  self_harm: 'block'
};

/* real_person = 'allow' is the one place this knowingly diverges from
   Printful's written policy, which requires right-of-publicity compliance.
   Michele's reasoning: $TRUMP, $ELON and BIKE TYSON are the bread and butter
   of this market and a living public figure rarely sues over a memecoin tee.
   Flip it to 'block' and celebrity tokens stop passing -- that is the whole
   change. Worth knowing the risk is not symmetric: estates of dead
   celebrities enforce right of publicity far more aggressively than the
   living do, and a few states give it a long post-mortem term. */

/* --- confidence floors ---------------------------------------------------
   The model reports how sure it is. Below the floor for that finding, it is
   ignored. Lower = stricter (more blocks).

   Not one number, because the categories are not alike. $WIF was the lesson:
   the artwork is a photograph of a real puppy in a knitted hat, and the model
   reported it as the character "dogwifhat" at 0.6 -- hedging, because it is a
   dog, not a drawing someone owns. One of the largest tokens on Solana was
   being refused on a hedge. Identity findings (is this a known character, a
   real brand, a real person?) need the model to be fairly sure before a sale
   is lost; the safety categories do not get that benefit of the doubt, because
   there the cost of being wrong runs the other way. */
export const CONFIDENCE_FLOOR = {
  default: 0.55,
  character: 0.7,
  brand: 0.7,
  real_person: 0.7
};

function floorFor(code) {
  if (typeof CONFIDENCE_FLOOR === 'number') return CONFIDENCE_FLOOR;
  return CONFIDENCE_FLOOR[code] != null ? CONFIDENCE_FLOOR[code] : CONFIDENCE_FLOOR.default;
}

/* --- text normalisation --------------------------------------------------
   Tickers are adversarial by nature: anyone who wants a slur through will
   spell it with a zero, a Cyrillic а, a zero-width joiner or a doubled
   letter. Normalise hard before matching, and match on the squeezed form too
   so "niiiggger" collapses to the same string as "nigger". */
const LEET = {
  '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's', '6': 'g',
  '7': 't', '8': 'b', '9': 'g', '$': 's', '@': 'a', '!': 'i', '|': 'l',
  '+': 't', '(': 'c', '€': 'e', '£': 'l', '₿': 'b'
};

export function normalize(s) {
  s = String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')          /* strip diacritics */
    .replace(/[​-‏⁠﻿]/g, '') /* zero-width junk */
    .toLowerCase();
  /* homoglyphs that survive NFKD */
  s = s.replace(/[а]/g, 'a').replace(/[е]/g, 'e').replace(/[о]/g, 'o')
       .replace(/[рρ]/g, 'p').replace(/[с]/g, 'c').replace(/[хх]/g, 'x')
       .replace(/[іı]/g, 'i').replace(/[ѕ]/g, 's').replace(/[ԁ]/g, 'd');
  s = s.replace(/./g, function (c) { return LEET[c] || c; });
  return s.replace(/[^a-z0-9]+/g, '');
}

/* "aaabbb" -> "ab": kills padding without losing distinct words */
export function squeeze(s) { return String(s || '').replace(/(.)\1+/g, '$1'); }

/* Confusable shapes that survive normalisation because they are genuinely
   different letters: capital-I / lowercase-l / digit-1 all render as a bare
   stroke, "rn" reads as "m", "vv" as "w". Collapsing them catches NlKE and
   ADlDAS, which are the two spellings a determined customer reaches for
   first. Only ever used as an EXTRA match attempt, never as the stored
   form, so it cannot corrupt anything downstream. */
export function skel(s) {
  return String(s || '')
    .replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/[l1]/g, 'i');
}

/* --- seed slur list ------------------------------------------------------
   Deliberately short. This is a zero-cost zero-latency pre-filter for the
   unambiguous cases, NOT the slur detector -- Haiku does that job in the
   same call that reads the image, and it handles novel spellings and
   coinages a list never will. Matched as substrings of the normalised
   ticker+name, so prefixes and suffixes are covered.

   Keep this list to terms that have no innocent substring collision. Adding
   a short one is how you accidentally block a hundred clean tokens. */
export const SLUR_SEED = [
  'nigger', 'nigga', 'niggr', 'niggah',
  'faggot', 'fagot', 'faggy',
  'kike', 'spic', 'wetback', 'chink', 'gook', 'coonass',
  'tranny', 'shemale',
  'retard',
  'raghead', 'towelhead',
  'heilhitler', 'gasthejews', 'whitepower', 'whitepride', 'kkklan',
  'sieg heil', '1488', 'groyper'
];

/* --- distinctive brand marks --------------------------------------------
   ONLY names with no ordinary-English meaning. This was the flaw in the
   first sketch of the filter: a top-500-companies list blocks $APPLE,
   $TARGET, $SHELL, $BLOCK, $META, $VISA, $GAP and $ORACLE, all of which are
   just words people name tokens after. Those are caught by the *image* step
   instead, where an actual logo is unambiguous. The name is only a prior.

   So: block on text only where the string itself is the trademark. */
export const BRAND_SEED = [
  'nike', 'adidas', 'reebok', 'underarmour', 'lululemon',
  'gucci', 'chanel', 'louisvuitton', 'louisvitton', 'balenciaga', 'versace',
  'prada', 'burberry', 'hermes',
  'rolex', 'cartier', 'tiffanyco', 'omegawatch',
  'ferrari', 'lamborghini', 'porsche', 'bugatti', 'maserati', 'mercedesbenz',
  'bmw', 'audi', 'toyota', 'volkswagen', 'hyundai',
  'mcdonalds', 'starbucks', 'pepsi', 'cocacola', 'redbull', 'doritos',
  'budweiser', 'heineken', 'jackdaniels', 'hennessy',
  'disney', 'pixar', 'marvel', 'dccomics', 'nickelodeon', 'cartoonnetwork',
  'pokemon', 'nintendo', 'playstation', 'xbox', 'ubisoft', 'blizzard',
  'netflix', 'spotify', 'tiktok', 'snapchat', 'youtube', 'instagram',
  'nvidia', 'ryzen', 'qualcomm', 'cisco', 'microsoft', 'iphone', 'macbook',
  'tesla', 'spacex', 'starlink',
  'walmart', 'costco', 'ikea', 'lego', 'hasbro', 'mattel', 'barbie',
  'offwhite', 'yeezy',
  'harrypotter', 'starwars', 'jurassicpark', 'minecraft', 'roblox', 'fortnite'
];

/* --- litigious crypto-native IP -----------------------------------------
   Michele's step 2. Small list, large effect: these rights holders are
   *inside* this market, see the storefront, and have enforced before.
   Pepe is the canonical case -- Matt Furie holds the copyright and has
   actually sued. */
export const CRYPTO_IP_SEED = [
  'pepe', 'mattfurie', 'feelsgoodman',
  'chillguy', 'chillhouse', 'justachillguy',
  'nyancat', 'grumpycat',
  'boredape', 'bayc', 'mutantape', 'cryptopunk', 'cryptopunks',
  'azuki', 'clonex', 'pudgypenguin', 'moonbird', 'miladymaker',
  'nounsdao'
];

/* --- exchange tickers of mega-caps --------------------------------------
   Matched EXACTLY against the normalised ticker, never as a substring: these
   are three- and four-letter strings and a substring rule on them would
   block half the market. $NVDA was Michele's example -- nobody is printing
   the Nvidia stock ticker on a shirt from this store. */
export const EXCHANGE_TICKER_SEED = [
  'nvda', 'aapl', 'msft', 'tsla', 'amzn', 'googl', 'nflx', 'amd', 'intc',
  'avgo', 'adbe', 'csco', 'qcom', 'txn', 'smci', 'mcd', 'sbux', 'wmt',
  'nke', 'baba', 'pfe', 'jnj', 'unh', 'lly', 'xom', 'cvx'
];

/* Deliberately NOT here, though they are real tickers: COIN, HOOD, MSTR,
   GME, AMC, SPY, QQQ, MU, HD, DIS, PEP. Every one of them is either an
   ordinary word or something this market names tokens after in good faith,
   and blocking $COIN on a crypto merch store would be absurd. */

/* --- marks we let through ------------------------------------------------
   Crypto-native logomarks. These are trademarks too, but they are the
   furniture of this market, Michele's own storefront already carries the
   Solana mark, and a chain logo in a token's artwork is the normal case
   rather than the infringing one. Matched against what the model *sees*, so
   a Solana-derived image is not refused as "a brand". */
export const BRAND_ALLOW = [
  'solana', 'sol', 'phantom', 'jupiter', 'raydium', 'pumpfun', 'pump.fun',
  'dexscreener', 'bitcoin', 'btc', 'ethereum', 'eth', 'tether', 'usdc',
  'binance', 'bnb', 'metamask', 'magiceden', 'birdeye', 'jito', 'marinade',
  'bonk', 'tokenmerch'
];

/* --- matching ------------------------------------------------------------ */
function hit(norm, list) {
  var sq = squeeze(norm), sk = skel(norm), sksq = skel(sq), out = [];
  for (var i = 0; i < list.length; i++) {
    var needle = normalize(list[i]);
    if (!needle) continue;
    if (norm.indexOf(needle) >= 0
      || sq.indexOf(squeeze(needle)) >= 0
      || sk.indexOf(skel(needle)) >= 0
      || sksq.indexOf(skel(squeeze(needle))) >= 0) out.push(list[i]);
  }
  return out;
}

export function allowedBrand(name) {
  var n = normalize(name);
  if (!n) return false;
  for (var i = 0; i < BRAND_ALLOW.length; i++) {
    var a = normalize(BRAND_ALLOW[i]);
    if (a && (n === a || n.indexOf(a) >= 0 || a.indexOf(n) >= 0)) return true;
  }
  return false;
}

/* The deterministic pre-filter: runs on ticker + name before anything is
   fetched or any model is called. A hit here costs nothing and ends it. */
export function textGate(ticker, name) {
  var norm = normalize(ticker + ' ' + name);
  if (!norm) return null;
  var s = hit(norm, SLUR_SEED);
  if (s.length) return { code: 'slur', detail: s };
  var b = hit(norm, BRAND_SEED);
  if (b.length) return { code: 'brand', detail: b };
  var c = hit(norm, CRYPTO_IP_SEED);
  if (c.length) return { code: 'character', detail: c };
  var tick = normalize(ticker);
  if (tick && EXCHANGE_TICKER_SEED.indexOf(tick) >= 0) {
    return { code: 'brand', detail: ['exchange ticker ' + tick.toUpperCase()] };
  }
  return null;
}

/* --- the decision -------------------------------------------------------
   `obs` is the model's observation object. Shape is documented in
   api/screen.js. Returns { verdict: 'pass'|'fail', reasons: [...] }.
   Nothing here calls out; it is pure, which is what makes it testable. */
export function decide(obs) {
  var reasons = [];

  function flag(code, detail) {
    if (STANCE[code] === 'block') reasons.push({ code: code, detail: detail });
  }
  function sure(x) {
    /* findings arrive as {name, confidence} or as bare strings */
    if (typeof x === 'string') return { name: x, confidence: 1 };
    var c = typeof x.confidence === 'number' ? x.confidence : 1;
    return { name: String(x.name || x.label || ''), confidence: c };
  }
  function listOf(v, code) {
    var floor = floorFor(code);
    return Array.isArray(v) ? v.map(sure).filter(function (f) { return f.name && f.confidence >= floor; }) : [];
  }

  listOf(obs.hate_symbols, 'hate_symbol').forEach(function (f) { flag('hate_symbol', f.name); });
  listOf(obs.characters, 'character').forEach(function (f) { flag('character', f.name); });

  listOf(obs.brands, 'brand').forEach(function (f) {
    if (allowedBrand(f.name)) return;
    flag('brand', f.name);
  });

  listOf(obs.real_people, 'real_person').forEach(function (f) { flag('real_person', f.name); });

  listOf(obs.slurs, 'slur').forEach(function (f) { flag('slur', f.name); });

  if (obs.sexual === 'genitalia_or_sex_act') flag('genitalia_or_sex_act', obs.sexual);
  if (obs.sexual === 'suggestive') flag('suggestive', obs.sexual);
  if (obs.minors_sexualized === true) flag('csam_or_minor_sexual', 'depicted minor in sexual context');
  if (obs.gore === true) flag('gore', 'graphic violence or gore');
  if (obs.illegal_or_terror === true) flag('illegal_or_terror', 'illegal activity or terror imagery');
  if (obs.self_harm === true) flag('self_harm', 'self-harm imagery');

  /* Any visible text in the artwork gets the same treatment as the ticker.
     Cheap, and it closes the obvious hole: a clean ticker over a picture of
     the word spelled out. */
  if (obs.visible_text) {
    var t = textGate(String(obs.visible_text), '');
    if (t) reasons.push({ code: t.code, detail: 'in artwork text: ' + t.detail.join(', ') });
  }

  return { verdict: reasons.length ? 'fail' : 'pass', reasons: reasons };
}
