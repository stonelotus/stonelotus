import { writeFileSync, statSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { root, fonts, jpg, png, b64, T, esc, profile } from "./lib.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const seal = (n) => b64(join(here, ".seals", n + ".png"), "image/png");
const font = fonts([["Cinzel", 900], ["Cinzel", 700], ["Garamond", 500], ["Garamond", 700], ["Rajdhani", 700]]);

// ---- text measurement from the embedded fonts (per-glyph advances; see measure.py) ----
const ADV = JSON.parse(readFileSync(join(here, ".textwidths.json"), "utf8"));
const tw = (text, face, size, ls = 0) => { const t = ADV[face]; let w = 0; for (const c of text) w += (t[c] ?? 0.6) * size + ls; return w; };
const wrap = (text, face, size, max) => { const out = []; let l = ""; for (const w of text.split(" ")) { const c = l ? l + " " + w : w; if (tw(c, face, size) > max && l) { out.push(l); l = w; } else l = c; } out.push(l); return out; };

// ---- layout ----
const W = 1200, M = 50, GX = 40, NW = 340, SH = 206, GY = 36, FH = 220, Y0 = 108;
const rowY = (r) => (r === 0 ? Y0 : Y0 + FH + GY + (r - 1) * (SH + GY));
const BOTTOM = rowY(2) + SH;
const H = BOTTOM + M;
const TAG_PAD = 14, TAG_GAP = 4, TAG_H = 28, TAG_FS = 18;
const projects = profile.projects;
const main = projects[0], sides = projects.slice(1);
const sealFile = { "SlateNode": "icon-roadmap", "Overload": "icon-boss-battles", "saas-base": "icon-inventory", "meibun": "icon-class-system", "Agents Office": "icon-achievements" };

let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
function deckle(w, h) {
  const pts = []; const j = () => (rnd() - 0.5) * 3.2; const st = 17;
  for (let x = 0; x <= w; x += st) pts.push([x, j()]);
  for (let y = st; y <= h; y += st) pts.push([w + j(), y]);
  for (let x = w - st; x >= 0; x -= st) pts.push([x, h + j()]);
  for (let y = h - st; y > 0; y -= st) pts.push([j(), y]);
  return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + "Z";
}
function tags(list, x0, y, maxW, id) {
  const ws = list.map((t) => Math.ceil(tw(t, "Garamond-700", TAG_FS) + TAG_PAD * 2));
  const tot = ws.reduce((a, b) => a + b, 0) + TAG_GAP * (list.length - 1);
  if (tot > maxW) throw new Error(`tags overflow in ${id}: ${tot} > ${maxW}`);
  let x = x0;
  return list.map((t, k) => { const g = `<rect x="${x}" y="${y}" width="${ws[k]}" height="${TAG_H}" rx="3" fill="none" stroke="${T.stone2}" stroke-width="1.5"/><text class="tq-tag" x="${x + ws[k] / 2}" y="${y + 20}" text-anchor="middle">${esc(t)}</text>`; x += ws[k] + TAG_GAP; return g; }).join("");
}
const plate = (x, y, w, h, label, cls, extra = "") => `<g ${extra}>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.ink}" stroke="${T.bronze}" stroke-width="1.5"/>
<rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" fill="${T.ink}" stroke="${T.cyan}" stroke-opacity=".6"/>
<path d="M${x + 5} ${y + 17} V${y + 5} H${x + 17} M${x + w - 17} ${y + 5} H${x + w - 5} V${y + 17} M${x + w - 5} ${y + h - 17} V${y + h - 5} H${x + w - 17} M${x + 17} ${y + h - 5} H${x + 5} V${y + h - 17}" fill="none" stroke="${T.cyan}" stroke-width="2"/>
<text class="${cls}" x="${x + w / 2}" y="${y + h / 2 + 6.5}" text-anchor="middle">${label}</text></g>`;

// ---- flagship ----
const FW = W - 2 * M, FX = M, FY = Y0;
const fPath = deckle(FW, FH);
const mTitle = main.name.toUpperCase();
const mLines = wrap(main.oneLiner, "Garamond-500", 26, 500);
const liveLabel = `LIVE · ${main.url.replace(/^https?:\/\/(www\.)?/, "").toUpperCase()}`;
const livePW = Math.ceil(tw(liveLabel, "Rajdhani-700", 20, 2.4) + 56), livePX = FW - 40 - livePW;
const flagship = `<g transform="translate(${FX} ${FY}) rotate(-.4 ${FW / 2} 6)">
<rect x="-9" y="-9" width="${FW + 18}" height="${FH + 18}" fill="${T.ink}" opacity=".9"/>
<path d="${fPath}" fill="#000" opacity=".55" transform="translate(6 10)" filter="url(#tq-bl)"/>
<path d="${fPath}" fill="${T.parch}"/><path d="${fPath}" fill="url(#tq-burn)"/>
<rect width="${FW}" height="${FH}" filter="url(#tq-grain)" opacity=".5" style="mix-blend-mode:multiply" clip-path="url(#tq-fc)"/>
<rect x="16" y="16" width="${FW - 32}" height="${FH - 32}" fill="none" stroke="${T.bronze}" stroke-width="1.5" stroke-opacity=".8"/>
<rect x="21" y="21" width="${FW - 42}" height="${FH - 42}" fill="none" stroke="${T.bronze}" stroke-width=".8" stroke-opacity=".6"/>
${[[16, 16], [FW - 16, 16], [16, FH - 16], [FW - 16, FH - 16]].map(([x, y]) => `<path d="M${x - 6} ${y} l6 -6 l6 6 l-6 6z" fill="${T.bronze}"/>`).join("")}
<circle cx="116" cy="112" r="56" fill="#000" opacity=".45" transform="translate(3 6)"/>
<g class="tq-stamp" style="transform-origin:116px 112px"><image href="${seal("icon-quest-system")}" x="52" y="48" width="128" height="128"/></g>
<text class="tq-main" x="226" y="78">${esc(mTitle)}</text>
<path d="M226 94 H720" stroke="${T.bronze}" stroke-width="1.5"/><path d="M720 94 l6 -5 l6 5 l-6 5z" fill="${T.bronze}"/>
${mLines.map((l, k) => `<text class="tq-big" x="226" y="${134 + k * 34}">${esc(l)}</text>`).join("")}
<g>${plate(livePX, 52, livePW, 52, esc(liveLabel), "tq-live")}</g>
${tags(main.stack, livePX + livePW - (() => { const ws = main.stack.map((t) => Math.ceil(tw(t, "Garamond-700", TAG_FS) + TAG_PAD * 2)); return ws.reduce((a, b) => a + b, 0) + TAG_GAP * (ws.length - 1); })(), 132, 400, main.name)}
</g>`;
const lx0 = FX - 16, lx1 = FX + FW + 16, ly0 = FY - 16, ly1 = FY + FH + 16, A = 48;
const lock = `<g class="tq-lock" style="transform-origin:${W / 2}px ${FY + FH / 2}px" fill="none" stroke="${T.cyan}" stroke-width="3.5" stroke-linecap="square">
<path d="M${lx0} ${ly0 + A} V${ly0} H${lx0 + A}"/><path d="M${lx1 - A} ${ly0} H${lx1} V${ly0 + A}"/><path d="M${lx1} ${ly1 - A} V${ly1} H${lx1 - A}"/><path d="M${lx0 + A} ${ly1} H${lx0} V${ly1 - A}"/></g>`;

// ---- side quests ----
const sideCells = [[0, 1], [1, 1], [2, 1], [0, 2], [1, 2]];
const tilt = [-.9, .7, -.6, .8, -.7];
const sideNotices = sides.map((p, i) => {
  const [c, r] = sideCells[i], x = M + c * (NW + GX), y = rowY(r);
  const path = deckle(NW, SH);
  const lines = wrap(p.oneLiner, "Garamond-500", 20, NW - 48);
  if (lines.length > 3) throw new Error("too many lines " + p.name);
  const title = p.name.toUpperCase();
  if (tw(title, "Cinzel-700", 24, 2) > NW - 48) throw new Error("title too wide " + p.name);
  const label = "PRIVATE · IN PROGRESS";
  const pw = Math.ceil(tw(label, "Rajdhani-700", 18, 2) + 36);
  return `<g transform="translate(${x} ${y}) rotate(${tilt[i]} ${NW / 2} 6)">
<path d="${path}" fill="#000" opacity=".55" transform="translate(5 9)" filter="url(#tq-bl)"/>
<path d="${path}" fill="${T.parch}"/><path d="${path}" fill="url(#tq-burn)"/>
<rect width="${NW}" height="${SH}" filter="url(#tq-grain)" opacity=".5" style="mix-blend-mode:multiply" clip-path="url(#tq-sc)"/>
<circle cx="44" cy="12" r="24" fill="#000" opacity=".45" transform="translate(2 4)"/>
<g class="tq-stamp" style="transform-origin:44px 12px"><image href="${seal(sealFile[p.name])}" x="20" y="-12" width="48" height="48"/></g>
<text class="tq-ttl" x="24" y="68">${esc(title)}</text>
<path d="M24 80 H${NW - 24}" stroke="${T.bronze}" stroke-width="1.2"/>
${lines.map((l, k) => `<text class="tq-obj" x="24" y="${106 + k * 24}">${esc(l)}</text>`).join("")}
${tags(p.stack, 22, 154, NW - 44, p.name)}
<rect x="${NW - 20 - pw}" y="${SH - 6}" width="${pw}" height="30" rx="3" fill="${T.stone2}" stroke="${T.bronze}" stroke-width="1.5"/>
<text class="tq-pill" x="${NW - 20 - pw / 2}" y="${SH + 15}" text-anchor="middle">${label}</text>
</g>`;
}).join("\n");

// adventurer reads the board in the last cell
const bw = 190, bh = Math.round(bw * 355 / 300), bx = M + 2 * (NW + GX) + (NW - bw) / 2, by = BOTTOM - bh - 6;
const bust = `<ellipse cx="${bx + bw / 2}" cy="${by + bh * .55}" rx="170" ry="130" fill="url(#tq-pool)" class="tq-fl3"/><image href="${png("dungeon-bust.png")}" x="${bx}" y="${by}" width="${bw}" height="${bh}"/>`;

const hudLabel = `${1} MAIN · ${sides.length} SIDE`;
const hudW = Math.ceil(tw(hudLabel, "Rajdhani-700", 18, 2.6) + 64);
const desc = "A quest board of six notices: " + projects.map((p) => `${p.name}, ${p.oneLiner} (${p.status === "live" ? "live at " + p.url.replace(/^https?:\/\//, "") : "private, in progress"})`).join("; ") + ".";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="tq-title tq-desc">
<title id="tq-title">Quest board: one main quest and five side quests</title>
<desc id="tq-desc">${esc(desc)}</desc>
<defs>
<style>
${font}
.tq-bt{font:900 40px 'Cinzel',serif;letter-spacing:6px}
.tq-main{font:900 48px 'Cinzel',serif;letter-spacing:4px;fill:${T.stone}}
.tq-big{font:500 26px 'Garamond',serif;fill:${T.stone}}
.tq-ttl{font:700 24px 'Cinzel',serif;letter-spacing:2px;fill:${T.stone}}
.tq-obj{font:500 20px 'Garamond',serif;fill:${T.stone}}
.tq-tag{font:700 18px 'Garamond',serif;fill:#3a2e22}
.tq-pill{font:700 18px 'Rajdhani',sans-serif;letter-spacing:2px;fill:${T.parch}}
.tq-live{font:700 20px 'Rajdhani',sans-serif;letter-spacing:2.4px;fill:${T.cyan}}
.tq-hud{font:700 18px 'Rajdhani',sans-serif;letter-spacing:2.6px;fill:${T.cyan}}
.tq-stamp{animation:tq-stamp .6s cubic-bezier(.2,.7,.2,1) .15s both}
@keyframes tq-stamp{from{transform:scale(1.35)}}
.tq-scan{opacity:0;animation:tq-scan 2s cubic-bezier(.45,.05,.4,1) .5s both}
@keyframes tq-scan{0%{opacity:0;transform:translateX(-30px)}8%{opacity:1}88%{opacity:1}100%{opacity:0;transform:translateX(1230px)}}
.tq-lock{animation:tq-lock .45s cubic-bezier(.2,.7,.2,1) 2.1s both}
@keyframes tq-lock{from{opacity:0;transform:scale(1.045)}}
.tq-live{animation:tq-lit .5s ease-out 2.1s both}
@keyframes tq-lit{from{opacity:.3}}
.tq-fl1{animation:tq-fl 3.1s ease-in-out infinite}.tq-fl2{animation:tq-fl 3.9s ease-in-out -1.2s infinite}.tq-fl3{animation:tq-fl 4.4s ease-in-out -2s infinite}
@keyframes tq-fl{0%,100%{opacity:.85}14%{opacity:1}31%{opacity:.62}50%{opacity:.95}66%{opacity:.7}83%{opacity:1}}
@media (prefers-reduced-motion:reduce){.tq-stamp,.tq-scan,.tq-lock,.tq-live,.tq-fl1,.tq-fl2,.tq-fl3{animation:none}}
</style>
<linearGradient id="tq-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.candle}"/><stop offset=".55" stop-color="${T.brass}"/><stop offset="1" stop-color="#A8792A"/></linearGradient>
<radialGradient id="tq-burn" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#8a6a35" stop-opacity="0"/><stop offset="1" stop-color="#6b4a1c" stop-opacity=".4"/></radialGradient>
<radialGradient id="tq-pool"><stop offset="0" stop-color="${T.candle}" stop-opacity=".5"/><stop offset=".4" stop-color="${T.ember}" stop-opacity=".2"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient>
<radialGradient id="tq-vig" cx=".5" cy=".5" r=".78"><stop offset=".5" stop-color="${T.ink}" stop-opacity="0"/><stop offset="1" stop-color="${T.ink}" stop-opacity=".8"/></radialGradient>
<linearGradient id="tq-trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.cyan}" stop-opacity="0"/><stop offset="1" stop-color="${T.cyan}" stop-opacity=".22"/></linearGradient>
<filter id="tq-bl" x="-10%" y="-10%" width="120%" height="125%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="tq-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .33  0 0 0 0 .15  0 0 0 .55 0"/></filter>
<clipPath id="tq-sc"><rect width="${NW}" height="${SH}"/></clipPath><clipPath id="tq-fc"><rect width="${FW}" height="${FH}"/></clipPath>
<clipPath id="tq-clip"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#tq-clip)">
<rect width="${W}" height="${H}" fill="${T.ink}"/>
<image href="${jpg("candlelit-keep.jpg")}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" opacity=".72"/>
<rect width="${W}" height="${H}" fill="${T.ink}" opacity=".3"/>
<rect width="${W}" height="${H}" fill="url(#tq-vig)"/>
<text x="${M + 2}" y="72" class="tq-bt" fill="${T.bronze}" transform="translate(0 3)">QUEST BOARD</text>
<text x="${M + 2}" y="72" class="tq-bt" fill="url(#tq-gold)">QUEST BOARD</text>
${plate(W - M - hudW, 36, hudW, 46, hudLabel, "tq-hud")}
<circle cx="105" cy="20" r="260" fill="url(#tq-pool)" class="tq-fl1"/>
<circle cx="1190" cy="260" r="250" fill="url(#tq-pool)" class="tq-fl2"/>
<circle cx="640" cy="${H}" r="240" fill="url(#tq-pool)" class="tq-fl3"/>
${flagship}
${sideNotices}
${bust}
${lock}
<g class="tq-scan"><rect x="-120" y="${Y0 - 20}" width="120" height="${BOTTOM - Y0 + 40}" fill="url(#tq-trail)"/><rect x="-5" y="${Y0 - 20}" width="10" height="${BOTTOM - Y0 + 40}" fill="${T.ink}" opacity=".6"/><rect x="-1" y="${Y0 - 20}" width="2" height="${BOTTOM - Y0 + 40}" fill="${T.cyan}"/></g>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17" fill="none" stroke="${T.bronze}" stroke-opacity=".8" stroke-width="3"/>
</g>
</svg>`;
const out = join(root, "quests.svg");
writeFileSync(out, svg);
console.log("quests.svg", (statSync(out).size / 1024).toFixed(0) + " KB", W + "x" + H);
