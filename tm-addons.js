/* ===== TokenMerch: bold CA, zoom-on-print button, single rainbow color slider (Oct 24) ===== */
function tmDrawPrint(p, W) {
const s = W / 480, X = x => (x - 160) * s, Y = y => (y - 200) * s;
const cap = (cx, w, top) => {
if (!tmShowCA && !tmShowTicker) return top;
p.save(); p.fillStyle = tmTextColor; p.textAlign = 'center'; p.textBaseline = 'top';
let y = top + Math.max(5, w * 0.05);
if (tmShowCA && currentToken.ca) {
const fam = '"JetBrains Mono", monospace';
p.font = '700 100px ' + fam;
const fs = Math.min(w * 0.09, 100 * w / (p.measureText(currentToken.ca).width || 1));
p.font = '700 ' + fs + 'px ' + fam; p.fillText(currentToken.ca, cx, y); y += fs * 1.6;
}
if (tmShowTicker && currentToken.ticker) {
const t = '$' + currentToken.ticker, fam = '"Inter", sans-serif';
p.font = '900 100px ' + fam;
const fs = Math.min(w * 0.22, 100 * w / (p.measureText(t).width || 1));
p.font = '900 ' + fs + 'px ' + fam; p.fillText(t, cx, y); y += fs * 1.1;
}
p.restore(); return y;
};
if (isImgLoaded && loadedTokenImg) {
if (currentStyle === 'minimal') {
const size = 100 * s, x = X(270), y = Y(260);
p.save(); p.beginPath(); p.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); p.clip();
p.drawImage(loadedTokenImg, x, y, size, size); p.restore();
cap(x + size / 2, size, y + size);
} else if (currentStyle === 'arch') {
const size = 200 * s, x = X(300), y = Y(290);
p.fillStyle = '#14F195'; p.font = '900 ' + 36 * s + 'px "JetBrains Mono", sans-serif'; p.textAlign = 'center'; p.textBaseline = 'alphabetic';
p.fillText('$' + currentToken.ticker, W / 2, y - 25 * s);
p.drawImage(loadedTokenImg, x, y, size, size);
const bottom = cap(W / 2, size, y + size);
p.fillStyle = '#FFFFFF'; p.font = '600 ' + 16 * s + 'px "Inter", sans-serif'; p.textBaseline = 'alphabetic';
p.fillText('SOLANA OFFICIAL MERCH', W / 2, bottom + 30 * s);
} else {
const box = 264 * s, x = X(268), y = Y(238);
p.drawImage(loadedTokenImg, x, y, box, box);
cap(W / 2, box, y + box);
}
} else {
const r = 90 * s, cx = W / 2, cy = Y(360);
p.fillStyle = '#14F195'; p.beginPath(); p.arc(cx, cy, r, 0, Math.PI * 2); p.fill();
p.fillStyle = '#0d0f17'; p.font = '900 ' + 32 * s + 'px "JetBrains Mono", sans-serif'; p.textAlign = 'center'; p.textBaseline = 'middle';
p.fillText('$' + currentToken.ticker, cx, cy);
cap(cx, 180 * s, cy + r);
}
}
let tmZoom = false;
const tmRealRender = renderMockup;
renderMockup = function () {
if (!tmZoom || currentProduct !== 'hoodie' || !tmTpl || !tmTplImg) { tmRealRender(); return; }
const C = canvas.width, k = C / tmTpl.template_width;
const pa = { x: tmTpl.print_area_left * k, y: tmTpl.print_area_top * k, w: tmTpl.print_area_width * k, h: tmTpl.print_area_height * k };
const Z = C / (pa.w * 0.86), fx = pa.x + pa.w / 2, fy = pa.y + pa.w * 0.45;
const P = 2400, pc = document.createElement('canvas'); pc.width = P; pc.height = Math.round(P * pa.h / pa.w);
tmDrawPrint(pc.getContext('2d'), P);
ctx.save();
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
ctx.fillStyle = currentGarmentColor || tmTpl.background_color || '#0c0c0c';
ctx.fillRect(0, 0, C, C);
ctx.translate(C / 2, C / 2); ctx.scale(Z, Z); ctx.translate(-fx, -fy);
ctx.drawImage(pc, pa.x, pa.y, pa.w, pa.h);
ctx.drawImage(tmTplImg, 0, 0, C, C);
ctx.restore();
};
(function tmZoomButton() {
const wrap = canvas.parentElement;
if (!wrap || document.getElementById('tmZoomBtn')) return;
const btn = document.createElement('button');
btn.id = 'tmZoomBtn';
btn.type = 'button';
btn.className = 'mt-3 mx-auto block bg-brand-card hover:bg-brand-cardHover text-slate-200 text-xs font-mono px-4 py-2 rounded-lg border border-brand-border transition-all';
btn.textContent = '🔍 Zoom on print';
btn.addEventListener('click', () => {
tmZoom = !tmZoom;
btn.textContent = tmZoom ? '↖ Show whole hoodie' : '🔍 Zoom on print';
renderMockup();
});
wrap.insertAdjacentElement('afterend', btn);
})();
(function tmRainbowSlider() {
const row = document.getElementById('tmColorRow');
if (!row || document.getElementById('tmHue')) return;
['tmR', 'tmG', 'tmB'].forEach(id => { const el = document.getElementById(id); if (el && el.parentElement) el.parentElement.style.display = 'none'; });
const stops = [[255, 255, 255], [255, 0, 0], [255, 140, 0], [255, 255, 0], [0, 255, 0], [0, 255, 255], [0, 64, 255], [160, 0, 255], [255, 0, 200], [0, 0, 0]];
const grad = 'linear-gradient(to right,' + stops.map((c, i) => 'rgb(' + c.join(',') + ') ' + (i * 100 / (stops.length - 1)).toFixed(1) + '%').join(',') + ')';
const wrapS = document.createElement('div');
wrapS.className = 'pt-1';
wrapS.innerHTML = '<input id="tmHue" type="range" min="0" max="1000" value="0" aria-label="Text color" style="width:100%;height:14px;border-radius:7px;background:' + grad + ';-webkit-appearance:none;appearance:none;outline:none;cursor:pointer;border:1px solid rgba(255,255,255,0.25)">'
+ '<div class="flex justify-between text-[10px] text-slate-500 mt-1"><span>White</span><span>Colors</span><span>Black</span></div>';
row.appendChild(wrapS);
const st = document.createElement('style');
st.textContent = '#tmHue::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid #0d0f17;box-shadow:0 0 0 1px #fff}#tmHue::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid #0d0f17}';
document.head.appendChild(st);
const hue = document.getElementById('tmHue');
const pick = v => {
const t = (v / 1000) * (stops.length - 1), i = Math.min(Math.floor(t), stops.length - 2), f = t - i;
return stops[i].map((c, j) => Math.round(c + (stops[i + 1][j] - c) * f));
};
hue.addEventListener('input', () => {
const rgb = pick(+hue.value);
['tmR', 'tmG', 'tmB'].forEach((id, j) => { const el = document.getElementById(id); if (el) el.value = rgb[j]; });
const r = document.getElementById('tmR');
if (r) r.dispatchEvent(new Event('input'));
});
})();
renderMockup();
