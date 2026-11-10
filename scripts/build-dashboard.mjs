#!/usr/bin/env node
// Generates id-dashboard.svg (prefix tg-): Torchlit Dungeon "Guild card + Status window".
// Reads data/profile.json, data/stats.json, shared fonts and assets. Deterministic, no npm deps.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const R = (p) => resolve(root, p);
const profile = JSON.parse(readFileSync(R("data/profile.json"), "utf8"));
const stats = JSON.parse(readFileSync(R("data/stats.json"), "utf8"));
const b64 = (p, mime) => `data:${mime};base64,${readFileSync(R(p)).toString("base64")}`;
const mq = readFileSync(R("shared/fonts-mq.css"), "utf8");
const jb = readFileSync(R("shared/fonts.css"), "utf8");
const face = (css, fam, w) => {
  const m = css.match(new RegExp(`@font-face\\{font-family:'${fam}';font-weight:${w};[^}]*\\}`));
  if (!m) throw new Error(`font face ${fam} ${w} missing`);
  return m[0];
};
const fontCss = [
  face(mq, "Cinzel", 900), face(mq, "Cinzel", 700), face(mq, "Garamond", 500), face(mq, "Garamond", 700),
  face(mq, "Rajdhani", 600), face(mq, "Rajdhani", 700), face(jb, "JBM", 500), face(jb, "JBM", 700),
].join("\n");

const T = { ink: "#0A0E1D", stone: "#1A1714", stone2: "#2A241E", brass: "#D9A441", candle: "#F5C542", bronze: "#7E611F", parch: "#E9DCC0", ember: "#FF8A3D", cyan: "#00E0FF", t2: "#B8A98C" };
const ACCOUNT_CREATED = "2021-12-25";
const W = 1200, H = 670;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n) => Number(n).toLocaleString("en-US");

// ---------- odometer (static base = final digits; animation rolls from 0) ----------
const DW = 24, DH = 46;
function odometer(value, x, y, delay0) {
  let cx = x, out = "", di = 0;
  for (const ch of String(value)) {
    if (ch === ",") { out += `<text x="${cx + 5}" y="${y + 36}" class="tg-num" text-anchor="middle">,</text>`; cx += 11; continue; }
    const d = Number(ch);
    let cells = "";
    for (let i = 0; i < 20; i++) cells += `<text x="${DW / 2}" y="${i * DH + 36}" text-anchor="middle">${i % 10}</text>`;
    out += `<svg x="${cx}" y="${y}" width="${DW}" height="${DH}" viewBox="0 0 ${DW} ${DH}" overflow="hidden"><g class="tg-num tg-roll" style="transform:translateY(${-(d + 10) * DH}px);animation-delay:${(delay0 + di * 0.12).toFixed(2)}s">${cells}</g></svg>`;
    cx += DW; di++;
  }
  return out;
}
const oWidth = (v) => [...String(v)].reduce((a, c) => a + (c === "," ? 11 : DW), 0);

let ss = 7; const rnd = () => (ss = (ss * 16807) % 2147483647) / 2147483647;
let speck = ""; for (let i = 0; i < 38; i++) speck += `<circle cx="${(rnd() * 97).toFixed(1)}" cy="${(rnd() * 83).toFixed(1)}" r="${(0.5 + rnd() * 0.9).toFixed(1)}" fill="#6b4a1c" opacity="${(0.15 + rnd() * 0.25).toFixed(2)}"/>`;
// ---------- guild card (left) ----------
const CX = 225, CT = 118, CL = 60, CW = 330, CB = 630;
let chain = "";
for (let y = -340, i = 0; y < CT - 4; y += 15, i++)
  chain += i % 2 ? `<ellipse cx="${CX}" cy="${y}" rx="2.6" ry="10.5" fill="none" stroke="${T.bronze}" stroke-width="3"/>`
                 : `<ellipse cx="${CX}" cy="${y}" rx="6.5" ry="10.5" fill="none" stroke="url(#tg-brass)" stroke-width="3.2"/>`;
const arch = (x0, x1, yt, yb) => { const r = (x1 - x0) / 2; return `M${x0} ${yb}V${yt + r}A${r} ${r} 0 0 1 ${x1} ${yt + r}V${yb}Z`; };
const archIn = arch(159, 291, 164, 340), archOut = arch(151, 299, 156, 346);

const card = `
<g class="tg-swing">
${[[14,.12],[10,.16],[6,.22]].map(([o,a]) => `<rect x="${CL + o * .5}" y="${CT + o}" width="${CW}" height="${CB - CT}" rx="${16 + o / 2}" fill="#000" opacity="${a}"/>`).join("")}
${chain}
<rect x="${CL}" y="${CT}" width="${CW}" height="${CB - CT}" rx="16" fill="url(#tg-leather)"/>
<rect x="${CL}" y="${CT}" width="${CW}" height="${CB - CT}" rx="16" fill="none" stroke="url(#tg-brass)" stroke-width="3"/>
<rect x="${CL + 6}" y="${CT + 6}" width="${CW - 12}" height="${CB - CT - 12}" rx="11" fill="none" stroke="${T.candle}" stroke-opacity=".35" stroke-width="1"/>
<rect x="${CX - 24}" y="${CT + 10}" width="48" height="12" rx="6" fill="${T.stone}" stroke="${T.bronze}" stroke-width="1.5"/>
<ellipse cx="${CX}" cy="${CT + 10}" rx="7" ry="10.5" fill="none" stroke="url(#tg-brass)" stroke-width="3.2"/>
${[[CL + 18, CT + 18], [CL + CW - 18, CT + 18], [CL + 18, CB - 18], [CL + CW - 18, CB - 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="url(#tg-brass)" stroke="${T.bronze}"/>`).join("")}
<!-- parchment -->
<rect x="80" y="148" width="290" height="466" rx="5" fill="${T.parch}"/>
<rect x="80" y="148" width="290" height="466" rx="5" fill="url(#tg-burn)"/>
<rect x="80" y="148" width="290" height="466" rx="5" fill="url(#tg-speck)" opacity=".6"/>
<rect x="80.5" y="148.5" width="289" height="465" rx="5" fill="none" stroke="${T.bronze}" stroke-opacity=".55"/>
<!-- portrait -->
<path d="${archOut}" fill="url(#tg-brass)" stroke="${T.bronze}" stroke-width="1.5"/>
<clipPath id="tg-arch"><path d="${archIn}"/></clipPath>
<g clip-path="url(#tg-arch)">
<rect x="159" y="164" width="132" height="176" fill="url(#tg-bgp)"/>
<image href="${b64("assets/dungeon-bust.png", "image/png")}" x="154" y="168" width="142" height="172" preserveAspectRatio="xMidYMax meet"/>
<rect x="159" y="164" width="132" height="176" fill="url(#tg-ivig)"/>
</g>
<path d="${archIn}" fill="none" stroke="${T.bronze}" stroke-width="2"/>
<path class="tg-glint" d="${archOut}" pathLength="100" fill="none" stroke="${T.candle}" stroke-width="4" stroke-linecap="round" stroke-dasharray="14 86"/>
<!-- class plate (System) -->
<rect x="96" y="360" width="258" height="46" fill="${T.ink}" stroke="${T.bronze}" stroke-width="1.5"/>
<rect x="101" y="365" width="248" height="36" fill="${T.ink}" stroke="${T.cyan}" stroke-opacity=".7"/>
<path d="M101 375V365H111M339 365H349V375M349 391V401H339M111 401H101V391" fill="none" stroke="${T.cyan}" stroke-width="2"/>
<image href="${b64("assets/emblem-tinkerer.png", "image/png")}" x="108" y="366" width="34" height="34"/>
<text x="150" y="390" class="tg-hud" font-size="18" letter-spacing="1" textLength="196" lengthAdjust="spacing"><tspan fill="${T.t2}">CLASS ·</tspan><tspan fill="${T.cyan}" dx="5">TINKERER</tspan></text>
<!-- identity -->
<text x="${CX}" y="453" text-anchor="middle" class="tg-name" fill="#fff" opacity=".55" transform="translate(0 1.5)">stonelotus</text>
<text x="${CX}" y="453" text-anchor="middle" class="tg-name" fill="${T.stone}">stonelotus</text>
<text x="${CX}" y="482" text-anchor="middle" class="tg-role">Builder · DevOps · Engineer</text>
<path d="M104 502H${CX - 10}M${CX + 10} 502H346" stroke="${T.bronze}" stroke-width="1.2"/><path d="M${CX - 5} 502l5 -4l5 4l-5 4z" fill="${T.bronze}"/>
<text x="104" y="530" class="tg-lab">HOUSE</text>
<text x="104" y="560" class="tg-house">EndSpec</text>
<text x="104" y="592" class="tg-role" style="font-weight:500">member since ${ACCOUNT_CREATED}</text>
<circle cx="324" cy="556" r="27" fill="#000" opacity=".4"/><image href="${b64("assets/icon-achievements.png", "image/png")}" x="294" y="522" width="62" height="62" transform="rotate(-8 325 553)"/>
<!-- foil -->
<g clip-path="url(#tg-cclip)"><g class="tg-foil"><path d="M-20 ${CB + 30} L50 ${CT - 30} L130 ${CT - 30} L60 ${CB + 30}Z" fill="url(#tg-foilg)"/></g></g>
</g>`;

// ---------- status window (right) ----------
const WX = 430, WY = 40, WW = 730, WH = 590, IX = 460, IW = 670;
const br = (x, y, sx, sy, l = 26) => `<path d="M${x} ${y + sy * l}V${y}H${x + sx * l}" fill="none" stroke="${T.cyan}" stroke-width="3" stroke-linecap="square"/>`;

const kpis = [
  { v: fmt(stats.commits12mo), cap: "commits · last 12 months", w: 250, xp: true },
  { v: String(stats.repos), cap: "repos", w: 126 },
  { v: String(profile.projects.length), cap: "products", w: 126 },
  { v: String(stats.since), cap: "since", w: 126 },
];
let tiles = "", tx = IX;
kpis.forEach((k, i) => {
  const ty = 116;
  tiles += `<g class="tg-in" style="--d:${(0.4 + i * 0.1).toFixed(2)}s">
<rect x="${tx}" y="${ty}" width="${k.w}" height="118" fill="#0F1530" stroke="${T.cyan}" stroke-opacity=".3"/>
<rect x="${tx}" y="${ty}" width="34" height="3" fill="${T.cyan}"/>
${odometer(k.v, tx + 18, ty + 26, 0.6 + i * 0.05)}
${k.xp ? `<text x="${tx + 18 + oWidth(k.v) + 12}" y="${ty + 62}" class="tg-hud" font-size="28" fill="${T.cyan}">XP</text>` : ""}
<text x="${tx + 18}" y="${ty + 104}" class="tg-cap">${esc(k.cap)}</text>
</g>`;
  tx += k.w + 14;
});

const langs = stats.languages.slice(0, 6);
const maxPct = Math.max(...langs.map((l) => l[1]));
const BX0 = 610, BMAX = 380;
let bars = "";
langs.forEach(([name, pct], i) => {
  const y = 330 + i * 30, bw = Math.max(8, (pct / maxPct) * BMAX), d = (0.9 + i * 0.12).toFixed(2);
  bars += `<g class="tg-in" style="--d:${d}s">
<text x="${IX + 20}" y="${y}" class="tg-hud" font-size="18" letter-spacing="1.4" fill="${T.parch}">${esc(name.toUpperCase())}</text>
<rect x="${BX0}" y="${y - 12}" width="${BMAX}" height="12" fill="${T.cyan}" fill-opacity=".1"/>
<rect class="tg-bar" x="${BX0}" y="${y - 12}" width="${bw.toFixed(1)}" height="12" fill="${T.cyan}" style="animation-delay:${d}s"/>
<text x="${IX + IW - 4}" y="${y}" class="tg-n5" text-anchor="end" fill="${T.parch}">${pct.toFixed(1)}%</text></g>`;
});

const QY = 524;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="tg-title tg-desc">
<title id="tg-title">stonelotus guild card and status window</title>
<desc id="tg-desc">A brass-framed leather guild card for stonelotus, class Tinkerer, house EndSpec, member since ${ACCOUNT_CREATED}, beside a System status window: ${fmt(stats.commits12mo)} XP from commits in the last 12 months, ${stats.repos} repos, ${profile.projects.length} products, on GitHub since ${stats.since}, top skill ${esc(langs[0][0])} at ${langs[0][1].toFixed(1)} percent, and the current quest: ${esc(profile.now)}.</desc>
<defs>
<style>
${fontCss}
.tg-hud{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:2px}
.tg-cap{font:600 18px 'Rajdhani',sans-serif;letter-spacing:.3px;fill:${T.t2}}
.tg-num{font:700 40px 'JBM',monospace;font-variant-numeric:tabular-nums;fill:${T.parch}}
.tg-n5{font:500 18px 'JBM',monospace;font-variant-numeric:tabular-nums}
.tg-name{font:900 34px 'Cinzel',serif;letter-spacing:2px}
.tg-role{font:700 19px 'Garamond',serif;fill:#5A4632}
.tg-lab{font:700 18px 'Cinzel',serif;letter-spacing:3px;fill:#5A4632}
.tg-house{font:700 25px 'Cinzel',serif;letter-spacing:2px;fill:${T.stone}}
.tg-now{font:500 22px 'Garamond',serif;fill:${T.parch}}
.tg-swing{transform-origin:${CX}px 0px;animation:tg-swing 4.6s linear both}
@keyframes tg-swing{
 0%{transform:translateY(-70px) rotate(0);animation-timing-function:cubic-bezier(.5,0,.9,.55)}
 12%{transform:translateY(0) rotate(0);animation-timing-function:ease-out}
 13%{transform:translateY(0) rotate(0);animation-timing-function:ease-in-out}
 28%{transform:rotate(3.4deg);animation-timing-function:ease-in-out}
 43%{transform:rotate(-2.3deg);animation-timing-function:ease-in-out}
 57%{transform:rotate(1.4deg);animation-timing-function:ease-in-out}
 70%{transform:rotate(-.8deg);animation-timing-function:ease-in-out}
 83%{transform:rotate(.35deg);animation-timing-function:ease-in-out}
 100%{transform:rotate(0)}}
.tg-roll{animation:tg-roll 1.6s cubic-bezier(.2,.7,.2,1) both}
@keyframes tg-roll{from{transform:translateY(0)}}
.tg-in{animation:tg-in .5s cubic-bezier(.2,.7,.2,1) var(--d,0s) both}
@keyframes tg-in{from{opacity:.3;transform:translateY(6px)}}
.tg-bar{transform-box:fill-box;transform-origin:left center;animation:tg-grow 1.2s cubic-bezier(.2,.7,.2,1) both}
@keyframes tg-grow{from{transform:scaleX(0)}}
.tg-pulse{transform-box:fill-box;transform-origin:center;animation:tg-pulse 2.2s ease-out infinite}
@keyframes tg-pulse{0%{opacity:.6;transform:scale(.6)}100%{opacity:0;transform:scale(2)}}
.tg-glint{animation:tg-glint 6s linear 1.5s infinite}
@keyframes tg-glint{from{stroke-dashoffset:0}to{stroke-dashoffset:-100}}
.tg-foil{transform:translateX(-200px);animation:tg-foil 8s ease-in-out 2.6s infinite}
@keyframes tg-foil{0%{transform:translateX(-200px)}40%,100%{transform:translateX(480px)}}
.tg-scan{opacity:0;animation:tg-scan 9s linear 3s infinite}
@keyframes tg-scan{0%{opacity:0;transform:translateY(0)}6%{opacity:.5}30%{opacity:.5;transform:translateY(540px)}34%,100%{opacity:0;transform:translateY(540px)}}
.tg-fl1{opacity:.85;animation:tg-fl1 3.3s linear infinite}
@keyframes tg-fl1{0%,100%{opacity:.7}15%{opacity:1}30%{opacity:.6}50%{opacity:.9}65%{opacity:.65}83%{opacity:1}}
.tg-fl2{opacity:.65;animation:tg-fl2 4.4s linear infinite}
@keyframes tg-fl2{0%,100%{opacity:.5}17%{opacity:.75}33%{opacity:.45}50%{opacity:.7}68%{opacity:.55}85%{opacity:.8}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.tg-glint,.tg-foil,.tg-scan{display:none}}
</style>
<linearGradient id="tg-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.candle}"/><stop offset=".55" stop-color="${T.brass}"/><stop offset="1" stop-color="#A8792A"/></linearGradient>
<linearGradient id="tg-leather" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A2D22"/><stop offset="1" stop-color="#1F1913"/></linearGradient>
<linearGradient id="tg-foilg" x1="0" x2="1"><stop offset="0" stop-color="${T.candle}" stop-opacity="0"/><stop offset=".5" stop-color="${T.candle}" stop-opacity=".26"/><stop offset="1" stop-color="${T.candle}" stop-opacity="0"/></linearGradient>
<radialGradient id="tg-burn" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#8a6a35" stop-opacity="0"/><stop offset="1" stop-color="#6b4a1c" stop-opacity=".4"/></radialGradient>
<radialGradient id="tg-bgp" cx=".5" cy=".7" r=".8"><stop offset="0" stop-color="#5A4020"/><stop offset="1" stop-color="${T.stone}"/></radialGradient>
<radialGradient id="tg-ivig" cx=".5" cy=".55" r=".75"><stop offset=".6" stop-color="${T.ink}" stop-opacity="0"/><stop offset="1" stop-color="${T.ink}" stop-opacity=".55"/></radialGradient>
<radialGradient id="tg-pool"><stop offset="0" stop-color="${T.candle}" stop-opacity=".5"/><stop offset=".4" stop-color="${T.ember}" stop-opacity=".18"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient>
<radialGradient id="tg-vig" cx=".5" cy=".5" r=".78"><stop offset=".5" stop-color="${T.ink}" stop-opacity="0"/><stop offset="1" stop-color="${T.ink}" stop-opacity=".8"/></radialGradient>
<linearGradient id="tg-rule" x1="0" x2="1"><stop offset="0" stop-color="${T.cyan}" stop-opacity=".9"/><stop offset="1" stop-color="${T.cyan}" stop-opacity="0"/></linearGradient>
<pattern id="tg-speck" width="97" height="83" patternUnits="userSpaceOnUse">${speck}</pattern>
<clipPath id="tg-cclip"><rect x="${CL}" y="${CT}" width="${CW}" height="${CB - CT}" rx="16"/></clipPath>
<clipPath id="tg-root"><rect width="${W}" height="${H}" rx="18"/></clipPath>
<clipPath id="tg-wclip"><rect x="${WX + 6}" y="${WY + 6}" width="${WW - 12}" height="${WH - 12}"/></clipPath>
</defs>
<g clip-path="url(#tg-root)">
<rect width="${W}" height="${H}" fill="${T.ink}"/>
<image href="${b64("assets/dungeon-gate.jpg", "image/jpeg")}" x="0" y="-18" width="1200" height="675" preserveAspectRatio="none" opacity=".7"/>
<rect width="${W}" height="${H}" fill="${T.ink}" opacity=".35"/>
<rect width="${W}" height="${H}" fill="url(#tg-vig)"/>
<circle class="tg-fl1" cx="225" cy="150" r="290" fill="url(#tg-pool)"/>
<circle class="tg-fl2" cx="1180" cy="${H}" r="240" fill="url(#tg-pool)"/>
${card}
<!-- System window -->
<g>
<rect x="${WX}" y="${WY}" width="${WW}" height="${WH}" fill="${T.ink}" fill-opacity=".92" stroke="${T.bronze}" stroke-width="2"/>
<rect x="${WX + 6}" y="${WY + 6}" width="${WW - 12}" height="${WH - 12}" fill="none" stroke="${T.cyan}" stroke-opacity=".6" stroke-width="1"/>
<g clip-path="url(#tg-wclip)"><rect class="tg-scan" x="${WX + 6}" y="${WY + 6}" width="${WW - 12}" height="2" fill="${T.cyan}"/></g>
${br(WX + 6, WY + 6, 1, 1)}${br(WX + WW - 6, WY + 6, -1, 1)}${br(WX + 6, WY + WH - 6, 1, -1)}${br(WX + WW - 6, WY + WH - 6, -1, -1)}
</g>
<text x="${IX}" y="86" class="tg-hud" font-size="21" letter-spacing="3.5" fill="${T.cyan}">[ STATUS ]</text>
<text x="${IX + IW}" y="86" text-anchor="end" class="tg-hud" font-size="18" letter-spacing="2" fill="${T.t2}">${esc(profile.handle.toUpperCase())} · ${esc(profile.company.toUpperCase())}</text>
<rect x="${IX}" y="98" width="${IW}" height="1.5" fill="url(#tg-rule)"/>
${tiles}
<text x="${IX}" y="276" class="tg-hud" font-size="18" letter-spacing="3" fill="${T.cyan}">SKILLS</text>
<text x="${IX + IW}" y="276" text-anchor="end" class="tg-cap">top languages · by code volume</text>
<rect x="${IX}" y="286" width="${IW}" height="1" fill="${T.cyan}" opacity=".3"/>
${bars}
<g class="tg-in" style="--d:1.5s">
<rect x="${IX}" y="${QY}" width="${IW}" height="94" fill="#0F1530" stroke="${T.cyan}" stroke-opacity=".5"/>
<circle class="tg-pulse" cx="${IX + 24}" cy="${QY + 28}" r="7" fill="${T.cyan}"/>
<circle cx="${IX + 24}" cy="${QY + 28}" r="5" fill="${T.cyan}"/>
<text x="${IX + 42}" y="${QY + 34}" class="tg-hud" font-size="18" letter-spacing="3" fill="${T.cyan}">CURRENT QUEST</text>
<text x="${IX + IW - 18}" y="${QY + 34}" text-anchor="end" class="tg-n5" font-size="18" fill="${T.t2}">updated ${esc(stats.updated)}</text>
<text x="${IX + 20}" y="${QY + 74}" class="tg-now">${esc(profile.now)}</text>
</g>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17" fill="none" stroke="${T.bronze}" stroke-opacity=".8" stroke-width="3"/>
</g>
</svg>
`;
writeFileSync(R("id-dashboard.svg"), svg);
console.log(`wrote id-dashboard.svg (${(svg.length / 1024).toFixed(0)} KB)`);
