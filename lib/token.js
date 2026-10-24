// Token lookup: DexScreener first (highest-liquidity Solana pair), Jupiter as fallback.
// Same logic as the website's tmLookup().
const ADDR = /[1-9A-HJ-NP-Za-km-z]{32,44}/;

async function getJson(url) {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' from ' + new URL(url).host);
  return r.json();
}

const cleanTicker = (s) => String(s || 'TOKEN').replace(/^\$+/, '');

function fromPairs(pairs, mint) {
  pairs = (pairs || []).filter((p) => p && p.chainId === 'solana');
  if (!pairs.length) return null;
  pairs.sort((a, b) => ((b.liquidity && b.liquidity.usd) || 0) - ((a.liquidity && a.liquidity.usd) || 0));
  const p = pairs[0];
  const isQuote = !!(mint && p.quoteToken && p.quoteToken.address === mint);
  const tok = isQuote ? p.quoteToken : p.baseToken;
  return {
    ca: tok.address,
    name: tok.name || 'Solana Token',
    ticker: cleanTicker(tok.symbol),
    img: (!isQuote && p.info && p.info.imageUrl) || ''
  };
}

async function fromJupiter(mint) {
  const d = await getJson('https://lite-api.jup.ag/tokens/v2/search?query=' + mint);
  const t = (d || []).find((x) => x.id === mint);
  if (!t) return null;
  return { ca: t.id, name: t.name || 'Solana Token', ticker: cleanTicker(t.symbol), img: t.icon || '' };
}

export async function lookupToken(raw) {
  raw = String(raw || '').trim();
  const m = raw.match(ADDR);
  if (!m) throw new Error('No Solana address found');
  const addr = m[0];
  let t = null;
  try {
    t = fromPairs(await getJson('https://api.dexscreener.com/tokens/v1/solana/' + addr), addr);
  } catch (e) { /* fall through */ }
  if (!t) {
    const d = await getJson('https://api.dexscreener.com/latest/dex/pairs/solana/' + addr).catch(() => ({}));
    t = fromPairs(d.pairs || (d.pair ? [d.pair] : []));
  }
  if (!t || !t.img) {
    const jup = await fromJupiter(t ? t.ca : addr).catch(() => null);
    if (!t) t = jup;
    else if (jup && jup.img) t.img = jup.img;
  }
  return t;
}
