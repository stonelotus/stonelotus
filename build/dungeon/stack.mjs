#!/usr/bin/env node
// stack.svg: "The Armory". Run: node build/dungeon/stack.mjs
import { writeFileSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { root, fonts, jpg, png, T, esc, profile } from "./lib.mjs";

const S = profile.stack;
const icons = JSON.parse(readFileSync(join(root, "shared/icons.json"), "utf8"));
// JBM (numbers in System windows): lib.mjs only reads fonts-mq.css, so read fonts.css here.
const jbm = (readFileSync(join(root, "shared/fonts.css"), "utf8").match(/@font-face\s*\{[^}]*\}/g) || []).find((x) => x.includes("'JBM'") && x.includes("font-weight:700"));
if (!jbm) throw new Error("JBM 700 missing");
const font = fonts([["Cinzel", 900], ["Garamond", 700], ["Rajdhani", 700]]) + "\n" + jbm;

const f = (n) => +n.toFixed(2);
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const brand = (s) => (lum(icons[s].hex) < 0.12 ? T.parch : "#" + icons[s].hex.replace("#", ""));
const names = (s) => ({ greensock: "GSAP" }[s] || icons[s].title);
const o = S.orbits;
const hostSlug = o.moons.host, moonSlugs = o.moons.moons;
const used = new Set([...S.groups.flatMap((g) => g.icons), ...o.inner, ...o.middle, ...o.outer, ...moonSlugs]);
const ITEMS = S.groups.reduce((n, g) => n + g.icons.length, 0);
if (new Set(S.groups.flatMap((g) => g.icons)).size !== ITEMS || used.size !== ITEMS) throw new Error("icon sets differ: " + used.size + " vs " + ITEMS);
const symbols = [...used].map((s) => `<symbol id="ts-i-${s}" viewBox="0 0 24 24"><path d="${icons[s].path}"/></symbol>`).join("");
const use = (s, size, x = -size / 2, y = -size / 2) => `<use href="#ts-i-${s}" x="${f(x)}" y="${f(y)}" width="${size}" height="${size}" fill="${brand(s)}"/>`;

// ---------- layout
const W = 1200, H = 692;
const GX = 612, GW = 538;               // inventory column
const SH = 40, SG = 8;                  // slot height / gap
const rowSplit = { "Frontend & Mobile": [3, 3], "Backend & Data": [3, 3], "DevOps & Infra": [3, 4], "Motion, 3D & AI": [3, 2] };
const natW = (name) => Math.ceil(12 + 22 + 9 + name.length * 9.3 + 14);
let gy = 124;
const groups = S.groups.map((g) => {
  const split = rowSplit[g.name]; let k = 0;
  const rows = split.map((n) => g.icons.slice(k, (k += n)));
  const y0 = gy; gy += 28 + rows.length * (SH + SG) - SG + 22;
  return { name: g.name, rows, y0 };
});

// ---------- orbit geometry
const CX = 308, CY = 406, RING = 262, CORE_R = 42;
const MOON_R = 41, MOON_CHIP = 15, HOST_CHIP = 22, CHIP = 22;
const orbits = [
  { key: "inner", rx: 98, ry: 68, tilt: -8, T: 14, dir: 1, icons: o.inner.filter((s) => s !== hostSlug) },
  { key: "middle", rx: 156, ry: 124, tilt: 4, T: 24, dir: -1, icons: o.middle.filter((s) => !moonSlugs.includes(s)) },
  { key: "outer", rx: 240, ry: 212, tilt: 4, T: 36, dir: 1, icons: o.outer, host: hostSlug },
];
const rad = (d) => (d * Math.PI) / 180;
const pt = (ob, th) => { const c = Math.cos(rad(ob.tilt)), s = Math.sin(rad(ob.tilt)); const x = ob.rx * Math.cos(th), y = ob.ry * Math.sin(th); return [CX + x * c - y * s, CY + x * s + y * c]; };
function table(ob) {
  const N = 4000, th = [], L = [0];
  for (let i = 0; i <= N; i++) th.push((2 * Math.PI * i) / N);
  for (let i = 1; i <= N; i++) { const a = pt(ob, th[i - 1]), b = pt(ob, th[i]); L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  ob.tab = { th, L, total: L[N] };
}
const thetaAt = (ob, frac) => {
  const { th, L, total } = ob.tab; const target = (((frac % 1) + 1) % 1) * total;
  let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= target) lo = m; else hi = m; }
  const k = (target - L[lo]) / (L[hi] - L[lo] || 1); return th[lo] + k * (th[hi] - th[lo]);
};
orbits.forEach(table);
const START = { inner: 0.08, middle: 0.15, outer: 0.0 };
for (const ob of orbits) {
  const riders = ob.icons.map((s) => ({ s }));
  if (ob.host) riders.splice(2, 0, { s: ob.host, host: true });
  riders.forEach((r, i) => { r.frac = START[ob.key] + i / riders.length; r.p = pt(ob, thetaAt(ob, r.frac)); });
  ob.riders = riders;
}
const motionPath = (ob, r) => {
  const dx = 2 * (CX - r.p[0]), dy = 2 * (CY - r.p[1]); const sw = ob.dir > 0 ? 1 : 0;
  return `M0 0A${ob.rx} ${ob.ry} ${ob.tilt} 0 ${sw} ${f(dx)} ${f(dy)}A${ob.rx} ${ob.ry} ${ob.tilt} 0 ${sw} 0 0z`;
};

// ---------- sigil chip: stone, bronze rim, tiny cyan inner hairline (2.5px of dark stone between)
const chip = (s, r) => `<circle r="${r}" fill="url(#ts-chip)" stroke="${T.bronze}" stroke-width="2"/><circle r="${r - 4}" fill="${T.parch}" fill-opacity=".09" stroke="none"/><circle r="${r - 4}" fill="none" stroke="${T.cyan}" stroke-opacity=".5" stroke-width=".7"/>${use(s, Math.round(r * 1.05))}`;
const MOON_PERIOD = 9, MOON_PHASE = 20;
const moonsMarkup = (animated) => moonSlugs.map((s, i) => {
  const a0 = 360 * (i / moonSlugs.length) + MOON_PHASE;
  const spin = animated ? `<animateTransform attributeName="transform" type="rotate" from="${a0} 0 0" to="${a0 + 360} 0 0" dur="${MOON_PERIOD}s" begin="0s" repeatCount="indefinite"/>` : "";
  const counter = animated ? `<animateTransform attributeName="transform" type="rotate" from="${-a0} 0 0" to="${-a0 - 360} 0 0" dur="${MOON_PERIOD}s" begin="0s" repeatCount="indefinite"/>` : "";
  const base = animated ? "" : ` transform="rotate(${a0})"`, cbase = animated ? "" : ` transform="rotate(${-a0})"`;
  return `<g${base}>${spin}<g transform="translate(${MOON_R} 0)"><g${cbase}>${counter}${chip(s, MOON_CHIP)}</g></g></g>`;
}).join("");
const hostMarkup = (animated) => `<circle r="${MOON_R}" fill="none" stroke="${T.bronze}" stroke-opacity=".7" stroke-width="1" stroke-dasharray="2 5"/>${chip(hostSlug, HOST_CHIP)}${moonsMarkup(animated)}`;

let ringsSvg = "", ridersAnim = "", ridersStatic = "";
const runeDash = (len, n) => `${f(len / n * 0.16)} ${f(len / n * 0.84)}`;
const ellLen = (ob) => ob.tab.total;
for (const ob of orbits) {
  const tr = `transform="rotate(${ob.tilt} ${CX} ${CY})"`;
  ringsSvg += `<ellipse cx="${CX}" cy="${CY}" rx="${ob.rx}" ry="${ob.ry}" ${tr} fill="none" stroke="${T.ink}" stroke-opacity=".7" stroke-width="5"/>`
    + `<ellipse cx="${CX}" cy="${CY}" rx="${ob.rx}" ry="${ob.ry}" ${tr} fill="none" stroke="${T.brass}" stroke-opacity=".7" stroke-width="1.6"/>`
    + `<ellipse cx="${CX}" cy="${CY}" rx="${ob.rx}" ry="${ob.ry}" ${tr} fill="none" stroke="${T.bronze}" stroke-opacity=".95" stroke-width="9" stroke-dasharray="${runeDash(ellLen(ob), Math.round(ellLen(ob) / 11))}"/>`;
  for (const r of ob.riders) {
    ridersAnim += `<g transform="translate(${f(r.p[0])} ${f(r.p[1])})"><g><animateMotion path="${motionPath(ob, r)}" dur="${ob.T}s" begin="0s" repeatCount="indefinite" rotate="0"/>${r.host ? hostMarkup(true) : chip(r.s, CHIP)}</g></g>`;
    ridersStatic += `<g transform="translate(${f(r.p[0])} ${f(r.p[1])})">${r.host ? hostMarkup(false) : chip(r.s, CHIP)}</g>`;
  }
}

{ const gap=(a,b)=>{let m=1e9;for(let i=0;i<720;i++){const p=pt(a,i/720*2*Math.PI);for(let j=0;j<720;j++){const q=pt(b,j/720*2*Math.PI);m=Math.min(m,Math.hypot(p[0]-q[0],p[1]-q[1]));}}return m;};
console.log("curve gaps inner-mid",gap(orbits[0],orbits[1]).toFixed(1),"mid-outer",gap(orbits[1],orbits[2]).toFixed(1)); }
// ---------- verification sweep (LCM of 14,24,36 = 504s)
{
  const pos = (ob, r, t) => pt(ob, thetaAt(ob, r.frac + ob.dir * (t / ob.T)));
  const host = orbits[2].riders.find((r) => r.host);
  let minCore = 1e9, minMoonNb = 1e9, minMoonName = "", minChip = 1e9, minChipPair = "", minMoonCore = 1e9;
  const all = orbits.flatMap((ob) => ob.riders.map((r) => ({ ob, r, rad: r.host ? HOST_CHIP : CHIP })));
  for (let t = 0; t <= 504; t += 0.1) {
    const P = all.map((a) => pos(a.ob, a.r, t));
    const hp = pos(orbits[2], host, t);
    for (let i = 0; i < moonSlugs.length; i++) {
      const a = rad(360 * (i / moonSlugs.length) + MOON_PHASE) + (2 * Math.PI * t) / MOON_PERIOD;
      const mp = [hp[0] + MOON_R * Math.cos(a), hp[1] + MOON_R * Math.sin(a)];
      minMoonCore = Math.min(minMoonCore, Math.hypot(mp[0] - CX, mp[1] - CY) - MOON_CHIP - CORE_R);
      all.forEach((x, k) => { if (x.r === host) return; const d = Math.hypot(mp[0] - P[k][0], mp[1] - P[k][1]) - MOON_CHIP - CHIP; if (d < minMoonNb) { minMoonNb = d; minMoonName = x.r.s; } });
    }
    all.forEach((x, k) => {
      minCore = Math.min(minCore, Math.hypot(P[k][0] - CX, P[k][1] - CY) - x.rad - CORE_R);
      for (let j = k + 1; j < all.length; j++) { const d = Math.hypot(P[k][0] - P[j][0], P[k][1] - P[j][1]) - x.rad - all[j].rad; if (d < minChip) { minChip = d; minChipPair = x.r.s + "~" + all[j].r.s; } }
    });
  }
  console.log(`clearance (504s sweep): chips to core >= ${minCore.toFixed(1)}px; moons to core >= ${minMoonCore.toFixed(1)}px; moons to nearest other chip >= ${minMoonNb.toFixed(1)}px (${minMoonName}); chip to chip >= ${minChip.toFixed(1)}px (${minChipPair})`);
  console.log(`orbit periods: inner ${orbits[0].T}s, middle ${orbits[1].T}s, outer ${orbits[2].T}s, moons ${MOON_PERIOD}s`);
}

// ---------- circle furniture
const tickRing = (r, n, w, col, op) => { const c = 2 * Math.PI * r; return `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="${w}" stroke-dasharray="${f(c / n * 0.14)} ${f(c / n * 0.86)}"/>`; };
const ring = (r, w = 1.6, op = 0.8) => `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${T.ink}" stroke-opacity=".6" stroke-width="${w + 3}"/><circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${T.brass}" stroke-opacity="${op}" stroke-width="${w}"/>`;
const diamonds = Array.from({ length: 12 }, (_, i) => { const a = rad(i * 30 - 90), x = CX + (RING + 8) * Math.cos(a), y = CY + (RING + 8) * Math.sin(a); const d = i % 3 === 0 ? 6 : 3.5; return `<path d="M${f(x)} ${f(y - d)}l${d} ${d}l${-d} ${d}l${-d} ${-d}z" fill="${T.brass}" opacity="${i % 3 === 0 ? 0.95 : 0.6}"/>`; }).join("");
// System lattice: 3 hexagons + 12 radial spokes, drawn in once. Spokes stop clear of the core.
const hex = (r, rot) => "M" + Array.from({ length: 6 }, (_, i) => { const a = rad(rot + i * 60); return f(CX + r * Math.cos(a)) + " " + f(CY + r * Math.sin(a)); }).join(" L") + "Z";
const lattice = [[96, 0], [146, 30], [206, 0], [250, 30]].map(([r, rot], i) => `<path class="ts-dr" style="animation-delay:${(0.2 + i * 0.35).toFixed(2)}s" pathLength="1" d="${hex(r, rot)}"/>`).join("")
  + Array.from({ length: 12 }, (_, i) => { const a = rad(i * 30 + 15); return `<path class="ts-dr" style="animation-delay:${(0.6 + i * 0.08).toFixed(2)}s" pathLength="1" d="M${f(CX + 64 * Math.cos(a))} ${f(CY + 64 * Math.sin(a))} L${f(CX + 250 * Math.cos(a))} ${f(CY + 250 * Math.sin(a))}"/>`; }).join("");

// ---------- inventory slots
let slotsSvg = "", si = 0;
for (const g of groups) {
  slotsSvg += `<g><path d="M${GX} ${g.y0 + 10} h12" stroke="${T.cyan}" stroke-opacity=".7" stroke-width="1.5"/><text x="${GX + 20}" y="${g.y0 + 16}" class="ts-gl">${esc(g.name.toUpperCase())}</text></g>`;
  g.rows.forEach((row, ri) => {
    const nat = row.map((s) => natW(names(s))), extra = (GW - (row.length - 1) * SG - nat.reduce((a, b) => a + b, 0)) / row.length;
    let x = GX;
    row.forEach((s, k) => {
      const w = nat[k] + extra, y = g.y0 + 28 + ri * (SH + SG);
      slotsSvg += `<g transform="translate(${f(x)} ${y})"><rect width="${f(w)}" height="${SH}" rx="6" fill="url(#ts-slot)" stroke="${T.brass}" stroke-opacity=".5" stroke-width="1.4"/>`
        + `<rect x="3" y="3" width="${f(w - 6)}" height="${SH - 6}" rx="4" fill="none" stroke="${T.bronze}" stroke-opacity=".6" stroke-width="1"/>`
        + `<g transform="translate(24 ${SH / 2})">${use(s, 22)}</g><text x="43" y="${SH / 2 + 6}" class="ts-cn">${esc(names(s))}</text>`
        + `<g class="ts-glow" style="animation-delay:${(si * 0.17).toFixed(2)}s"><rect x="-2" y="-2" width="${f(w + 4)}" height="${SH + 4}" rx="8" fill="none" stroke="${T.candle}" stroke-opacity=".28" stroke-width="4"/><rect width="${f(w)}" height="${SH}" rx="6" fill="${T.candle}" fill-opacity=".07" stroke="${T.candle}" stroke-width="1.6"/></g></g>`;
      x += w + SG; si++;
    });
  });
}

const embers = [[CX - 70, CY + 40, 0, 5.2], [CX + 30, CY + 60, 1.7, 6.1], [CX + 80, CY + 20, 3.1, 5.6], [CX - 20, CY + 70, 4.2, 6.6]].map(([x, y, d, du]) => `<circle class="ts-ember" cx="${x}" cy="${y}" r="1.8" fill="${T.ember}" style="animation-duration:${du}s;animation-delay:${d}s"/>`).join("");

const heading = "THE ARMORY";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="ts-title ts-desc">
<title id="ts-title">The Armory</title>
<desc id="ts-desc">An arcane circle on dark stone with the Tinkerer class emblem at its centre and technology logos riding three tilted brass orbits, next to ${ITEMS} inventory slots grouped by frontend and mobile, backend and data, DevOps and infrastructure, and motion, 3D and AI.</desc>
<defs>
<style>
${font}
.ts-bt{font:900 38px 'Cinzel',serif;letter-spacing:6px}
.ts-gl{font:700 18px 'Rajdhani',sans-serif;letter-spacing:2.6px;fill:${T.cyan}}
.ts-cn{font:700 19px 'Garamond',serif;fill:${T.parch}}
.ts-hud{font:700 18px 'Rajdhani',sans-serif;letter-spacing:2.6px;fill:${T.cyan}}
.ts-num{font:700 18px 'JBM',monospace;fill:${T.cyan}}
.ts-lat path,.ts-lat{fill:none}
.ts-dr{stroke-dasharray:1;animation:ts-draw 2.6s ease-out both}
.ts-glow{opacity:0;animation:ts-sweep 18s ease-in-out infinite}
.ts-fl1{animation:ts-f1 3.4s linear infinite}
.ts-fl2{animation:ts-f2 3.1s linear infinite}
.ts-ember{opacity:.55;animation:ts-rise 6s linear infinite}
@keyframes ts-f1{0%,100%{opacity:.7}15%{opacity:1}30%{opacity:.6}50%{opacity:.9}65%{opacity:.65}83%{opacity:1}}
@keyframes ts-f2{0%,100%{opacity:.75}14%{opacity:1}31%{opacity:.65}48%{opacity:.95}66%{opacity:.7}84%{opacity:1}}
@keyframes ts-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes ts-sweep{0%{opacity:0}2.5%{opacity:1}8%{opacity:0}100%{opacity:0}}
@keyframes ts-rise{0%{opacity:0;transform:translateY(0)}15%{opacity:.85}100%{opacity:0;transform:translateY(-80px)}}
.ts-static{display:none}
@media (prefers-reduced-motion:reduce){
.ts-dr,.ts-glow,.ts-ember,.ts-fl1,.ts-fl2{animation:none!important}
.ts-glow{opacity:0}
.ts-anim{display:none}
.ts-static{display:inline}
}
</style>
<linearGradient id="ts-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.candle}"/><stop offset=".55" stop-color="${T.brass}"/><stop offset="1" stop-color="#A8792A"/></linearGradient>
<radialGradient id="ts-pool"><stop offset="0" stop-color="${T.candle}" stop-opacity=".6"/><stop offset=".4" stop-color="${T.ember}" stop-opacity=".22"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient>
<radialGradient id="ts-torch"><stop offset="0" stop-color="${T.candle}" stop-opacity=".5"/><stop offset=".45" stop-color="${T.ember}" stop-opacity=".16"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient>
<radialGradient id="ts-disc" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${T.stone2}" stop-opacity=".55"/><stop offset=".7" stop-color="${T.stone}" stop-opacity=".8"/><stop offset="1" stop-color="${T.ink}" stop-opacity=".85"/></radialGradient>
<radialGradient id="ts-chip" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#5b4e3c"/><stop offset="1" stop-color="#2c261f"/></radialGradient>
<linearGradient id="ts-slot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f2820"/><stop offset="1" stop-color="#1d1915"/></linearGradient>
<radialGradient id="ts-vig" cx=".5" cy=".5" r=".78"><stop offset=".5" stop-color="${T.ink}" stop-opacity="0"/><stop offset="1" stop-color="${T.ink}" stop-opacity=".8"/></radialGradient>
<linearGradient id="ts-panel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.ink}" stop-opacity="0"/><stop offset=".12" stop-color="${T.ink}" stop-opacity=".55"/><stop offset="1" stop-color="${T.ink}" stop-opacity=".7"/></linearGradient>
<filter id="ts-emb" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".7"/></filter>
<clipPath id="ts-clip"><rect width="${W}" height="${H}" rx="18"/></clipPath>
${symbols}
</defs>
<g clip-path="url(#ts-clip)">
<rect width="${W}" height="${H}" fill="${T.ink}"/>
<image href="${jpg("candlelit-keep.jpg")}" x="0" y="-20" width="1200" height="700" preserveAspectRatio="none" opacity=".55"/>
<rect width="${W}" height="${H}" fill="${T.ink}" opacity=".38"/>
<rect x="${GX - 40}" width="${W - GX + 40}" height="${H}" fill="url(#ts-panel)"/>
<rect width="${W}" height="${H}" fill="url(#ts-vig)"/>
<!-- header -->
<text x="52" y="74" class="ts-bt" fill="${T.bronze}" transform="translate(0 3)">${heading}</text>
<text x="52" y="74" class="ts-bt" fill="url(#ts-gold)">${heading}</text>
<path d="M54 90 H400" stroke="${T.bronze}" stroke-width="2"/><path d="M406 90 l6 -6 l6 6 l-6 6z" fill="${T.brass}"/>
<g>
<rect x="802" y="44" width="348" height="42" fill="${T.ink}" stroke="${T.bronze}" stroke-width="1.5"/>
<rect x="808" y="50" width="336" height="30" fill="${T.ink}" stroke="${T.cyan}" stroke-opacity=".55"/>
<path d="M808 62 V50 H820 M1132 50 H1144 V62 M1144 68 V80 H1132 M820 80 H808 V68" fill="none" stroke="${T.cyan}" stroke-width="2"/>
<text x="976" y="72" text-anchor="middle" class="ts-hud" xml:space="preserve">[ INVENTORY ]<tspan dx="12" class="ts-num">${ITEMS}</tspan><tspan dx="7">ITEMS</tspan></text>
</g>
<!-- torch pool, top-left -->
<circle class="ts-fl1" cx="60" cy="30" r="240" fill="url(#ts-torch)"></circle>
<!-- arcane circle -->
<circle cx="${CX}" cy="${CY}" r="${RING + 6}" fill="url(#ts-disc)"/>
<g class="ts-lat" fill="none" stroke="${T.cyan}" stroke-opacity=".2" stroke-width="1">${lattice}</g>
${ring(RING, 2, 0.85)}${ring(RING - 14, 1.2, 0.6)}${tickRing(RING - 7, 120, 9, T.bronze, 0.95)}
${diamonds}
${ring(CORE_R + 12, 1.4, 0.8)}${tickRing(CORE_R + 18, 48, 6, T.bronze, 0.9)}${ring(CORE_R + 24, 1, 0.55)}
${ringsSvg}
<!-- core: Tinkerer emblem in candle light -->
<circle class="ts-fl2" cx="${CX}" cy="${CY}" r="96" fill="url(#ts-pool)"></circle>
<circle cx="${CX}" cy="${CY}" r="${CORE_R}" fill="${T.stone}" stroke="${T.bronze}" stroke-width="2.5"/>
<image href="${png("emblem-tinkerer.png")}" x="${CX - 36}" y="${CY - 36}" width="72" height="72" filter="url(#ts-emb)"/>
${embers}
<g class="ts-anim">${ridersAnim}</g>
<g class="ts-static">${ridersStatic}</g>
${slotsSvg}
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17" fill="none" stroke="${T.bronze}" stroke-opacity=".8" stroke-width="3"/>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="13" fill="none" stroke="${T.candle}" stroke-opacity=".25" stroke-width="1"/>
</g>
</svg>
`;
const out = join(root, "stack.svg");
writeFileSync(out, svg);
console.log(`stack.svg ${(statSync(out).size / 1024).toFixed(1)} KB, ${W}x${H}, ${ITEMS} items`);
