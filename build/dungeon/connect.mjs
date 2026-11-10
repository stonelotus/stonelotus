import { writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { root, fonts, png, T, esc, profile } from "./lib.mjs";
import { readFileSync } from "node:fs";
const icons = JSON.parse(readFileSync(join(root, "shared/icons.json"), "utf8"));
const TEXT2 = "#B8A98C";
const head = (p, w, h, title, desc, css, defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${p}-title ${p}-desc">
<title id="${p}-title">${title}</title>
<desc id="${p}-desc">${desc}</desc>
<style>${css}</style>
<defs>${defs}</defs>
${body}
</svg>
`;

// ---------- link cards ----------
const cards = [
  { key: "linkedin", p: "tcl", delay: 0 },
  { key: "email", p: "tce", delay: 0.12 },
  { key: "endspec", p: "tcx", delay: 0.24 },
  { key: "github", p: "tcg", delay: 0.36 },
];
function seal(key, p) {
  const cx = 62, cy = 60;
  let fill = T.stone2, mark = "";
  if (key === "linkedin") {
    fill = "#0A66C2";
    mark = `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-family="'Rajdhani'" font-weight="700" font-size="38" fill="#fff">in</text>`;
  } else if (key === "email") {
    fill = T.parch;
    mark = `<path transform="translate(${cx - 16} ${cy - 16}) scale(1.333)" d="${icons.gmail.path}" fill="#EA4335"/>`;
  } else if (key === "github") {
    mark = `<path transform="translate(${cx - 16} ${cy - 16}) scale(1.333)" d="${icons.github.path}" fill="${T.parch}"/>`;
  } else {
    fill = T.ink;
    mark = `<g fill="${T.brass}"><rect x="${cx - 14}" y="${cy - 15}" width="28" height="7" rx="3"/><rect x="${cx - 14}" y="${cy - 3.5}" width="20" height="7" rx="3"/><rect x="${cx - 14}" y="${cy + 8}" width="28" height="7" rx="3"/></g><circle cx="${cx + 14}" cy="${cy}" r="3.5" fill="${T.candle}"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="36" fill="#000" opacity=".35"/>
<circle cx="${cx}" cy="${cy}" r="34" fill="${fill}" stroke="${T.brass}" stroke-width="2.5"/>
<circle cx="${cx}" cy="${cy}" r="29" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.2"/>
${mark}`;
}
function card({ key, p, delay }) {
  const l = profile.links[key];
  const css = `${fonts([["Cinzel", 700], ["Garamond", 500], ["Rajdhani", 700]])}
.${p}-in{animation:${p}-in .8s cubic-bezier(.2,.7,.2,1) ${delay}s both}
.${p}-arrow{animation:${p}-nudge 1.8s ease-in-out ${delay}s infinite}
@keyframes ${p}-in{from{opacity:0;transform:translateX(56px)}}
@keyframes ${p}-nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(7px)}}
@media (prefers-reduced-motion:reduce){.${p}-in,.${p}-arrow{animation:none}}`;
  const defs = `<linearGradient id="${p}-plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.stone2}"/><stop offset=".55" stop-color="${T.stone}"/><stop offset="1" stop-color="${T.ink}"/></linearGradient>
<radialGradient id="${p}-glow" cx="62" cy="60" r="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${T.candle}" stop-opacity=".16"/><stop offset="1" stop-color="${T.candle}" stop-opacity="0"/></radialGradient>`;
  const dia = (x, y) => `<path d="M${x} ${y - 4}L${x + 4} ${y}L${x} ${y + 4}L${x - 4} ${y}Z" fill="${T.brass}"/>`;
  const body = `<g class="${p}-in">
<rect x="1" y="1" width="598" height="118" rx="14" fill="url(#${p}-plate)"/>
<rect x="1" y="1" width="598" height="118" rx="14" fill="url(#${p}-glow)"/>
<rect x="1" y="1" width="598" height="118" rx="14" fill="none" stroke="${T.bronze}" stroke-width="1.5"/>
<rect x="4.5" y="4.5" width="591" height="111" rx="11" fill="none" stroke="${T.ink}" stroke-width="3"/>
<rect x="7" y="7" width="586" height="106" rx="9.5" fill="none" stroke="${T.cyan}" stroke-opacity=".3" stroke-width="1"/>
${seal(key, p)}
<line x1="114" y1="68" x2="470" y2="68" stroke="${T.brass}" stroke-opacity=".45"/>${dia(114, 68)}
<text x="114" y="52" font-family="'Cinzel'" font-weight="700" font-size="30" letter-spacing="2" fill="${T.parch}">${esc(l.label)}</text>
<text x="114" y="97" font-family="'Garamond'" font-weight="500" font-size="22" fill="${TEXT2}">${esc(l.handle)}</text>
<text class="${p}-arrow" x="538" y="76" text-anchor="middle" font-family="'Rajdhani'" font-weight="700" font-size="40" fill="${T.cyan}">→</text>
</g>`;
  return head(p, 600, 120, `${l.label} link card`, `Link card for ${l.label}: ${l.handle}.`, css, defs, body);
}
for (const c of cards) writeFileSync(join(root, `connect-${c.key}.svg`), card(c));

// ---------- connect.svg: the tavern door ----------
const W = 480, H = 535;
const CH = 395, CW = Math.round(460 * CH / 578), CX = W - CW + 4, CY = H - CH;
let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
const spark = (x, y, r, fill, d, dur) =>
  `<circle class="tc-sp" style="animation-delay:${d}s;animation-duration:${dur}s" cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const css = `${fonts([["Cinzel", 900], ["Rajdhani", 700]])}
.tc-bob{animation:tc-bob 4.2s ease-in-out infinite}
.tc-flick{animation:tc-flick 2.9s linear infinite}
.tc-flick2{animation:tc-flick 3.7s linear -1.1s infinite}
.tc-sp{animation:tc-sp 3.2s ease-in-out infinite}
.tc-cap{animation:tc-capin .6s cubic-bezier(.2,.7,.2,1) 0s both}
.tc-sway{animation:tc-sway 6s ease-in-out infinite;transform-origin:240px 0}
@keyframes tc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes tc-sway{0%,100%{transform:rotate(-.5deg)}50%{transform:rotate(.5deg)}}
@keyframes tc-flick{0%{opacity:.85}9%{opacity:1}17%{opacity:.6}26%{opacity:.95}38%{opacity:.7}47%{opacity:1}61%{opacity:.65}74%{opacity:.95}88%{opacity:.78}100%{opacity:.85}}
@keyframes tc-sp{0%,100%{opacity:1;transform:translateY(0)}50%{opacity:.2;transform:translateY(-8px)}}
@keyframes tc-capin{from{opacity:.35;transform:translateX(-14px)}}
@media (prefers-reduced-motion:reduce){.tc-bob,.tc-flick,.tc-flick2,.tc-sp,.tc-cap,.tc-sway{animation:none}}`;
const SX = 240, SY = 62, SW = 420, SH = 82;
const defs = `<linearGradient id="tc-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2A1B"/><stop offset=".5" stop-color="#2A1D12"/><stop offset="1" stop-color="#1A120B"/></linearGradient>
<linearGradient id="tc-brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.brass}"/><stop offset=".5" stop-color="${T.candle}"/><stop offset="1" stop-color="${T.brass}"/></linearGradient>
<linearGradient id="tc-letters" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.candle}"/><stop offset="1" stop-color="${T.brass}"/></linearGradient>
<radialGradient id="tc-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${T.candle}" stop-opacity=".55"/><stop offset=".55" stop-color="${T.ember}" stop-opacity=".16"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient>
<clipPath id="tc-clip"><rect x="${SX - SW / 2}" y="${SY}" width="${SW}" height="${SH}" rx="10"/></clipPath>`;
const grain = Array.from({ length: 7 }, (_, i) => {
  const y = SY + 10 + i * 11 + rnd() * 3;
  return `<path d="M${SX - SW / 2} ${y.toFixed(1)}q${60 + rnd() * 30} ${(rnd() * 5 - 2.5).toFixed(1)} ${120 + rnd() * 60} 0t${140} 0t${120} 0" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1"/>`;
}).join("");
const chain = (x) => {
  let links = "";
  for (let y = 4; y < SY + 6; y += 12) links += `<rect x="${x - 3}" y="${y}" width="6" height="14" rx="3" fill="none" stroke="#6b6458" stroke-width="2"/>`;
  return `<g>${links}</g>`;
};
const bodyC = `<g class="tc-bob"><image x="${CX}" y="${CY}" width="${CW}" height="${CH}" href="${png("dungeon-pointing.png")}"/></g>
<g class="tc-sway">
${chain(SX - SW / 2 + 40)}${chain(SX + SW / 2 - 40)}
<rect x="${SX - SW / 2 + 31}" y="0" width="18" height="6" rx="2" fill="#6b6458"/><rect x="${SX + SW / 2 - 49}" y="0" width="18" height="6" rx="2" fill="#6b6458"/>
<rect x="${SX - SW / 2 - 2}" y="${SY - 2}" width="${SW + 4}" height="${SH + 4}" rx="12" fill="#000" opacity=".4"/>
<rect x="${SX - SW / 2}" y="${SY}" width="${SW}" height="${SH}" rx="10" fill="url(#tc-wood)" stroke="${T.bronze}" stroke-width="2.5"/>
<g clip-path="url(#tc-clip)">${grain}</g>
<rect x="${SX - SW / 2 + 6}" y="${SY + 6}" width="${SW - 12}" height="${SH - 12}" rx="6" fill="none" stroke="${T.brass}" stroke-opacity=".4"/>
<g fill="${T.brass}"><circle cx="${SX - SW / 2 + 40}" cy="${SY + 12}" r="3.5"/><circle cx="${SX + SW / 2 - 40}" cy="${SY + 12}" r="3.5"/><circle cx="${SX - SW / 2 + 16}" cy="${SY + SH - 12}" r="2.5"/><circle cx="${SX + SW / 2 - 16}" cy="${SY + SH - 12}" r="2.5"/></g>
<ellipse class="tc-flick" cx="${SX}" cy="${SY + SH / 2}" rx="210" ry="62" fill="url(#tc-glow)" clip-path="url(#tc-clip)"/>
<text x="${SX}" y="${SY + 56}" text-anchor="middle" font-family="'Cinzel'" font-weight="900" font-size="46" letter-spacing="3" fill="#000" opacity=".55" transform="translate(2 2)">stonelotus</text>
<text x="${SX}" y="${SY + 56}" text-anchor="middle" font-family="'Cinzel'" font-weight="900" font-size="46" letter-spacing="3" fill="url(#tc-letters)">stonelotus</text>
<g class="tc-flick2"><text x="${SX}" y="${SY + 56}" text-anchor="middle" font-family="'Cinzel'" font-weight="900" font-size="46" letter-spacing="3" fill="${T.candle}" opacity=".22">stonelotus</text></g>
</g>
<g class="tc-cap">
<rect x="2" y="172" width="204" height="52" rx="8" fill="${T.ink}" stroke="${T.bronze}" stroke-width="1.5"/>
<rect x="6" y="176" width="196" height="44" rx="5" fill="none" stroke="${T.ink}" stroke-width="2"/>
<rect x="8.5" y="178.5" width="191" height="39" rx="4" fill="none" stroke="${T.cyan}" stroke-opacity=".7" stroke-width="1"/>
<text x="104" y="204" text-anchor="middle" font-family="'Rajdhani'" font-weight="700" font-size="18" letter-spacing=".6" fill="${T.cyan}">[ JOIN THE PARTY ] →</text>
</g>
${spark(60, 320, 3, T.ember, 0, 3.2)}${spark(110, 400, 2.5, T.candle, 1.1, 3.8)}${spark(34, 460, 3, T.ember, 1.9, 3.4)}${spark(130, 270, 2, T.candle, 0.6, 2.9)}${spark(80, 500, 2.5, T.candle, 2.4, 3.6)}${spark(52, 380, 2, T.ember, 1.5, 3.1)}${spark(SX - 190, 160, 2.5, T.candle, .8, 3)}${spark(SX + 195, 40, 2.5, T.ember, 2, 3.3)}`;
writeFileSync(join(root, "connect.svg"), head("tc", W, H, "stonelotus, pointing at the contact links",
  "A winking adventurer points right at the contact cards beneath a carved wooden tavern sign reading stonelotus, lit by a flickering candle glow.", css, defs, bodyC));
for (const f of ["connect", "connect-linkedin", "connect-email", "connect-endspec", "connect-github"]) console.log(f, Math.round(statSync(join(root, f + ".svg")).size / 1024) + "KB");
