import { writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { root, fonts, jpg, png, T, esc, profile } from "./lib.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const W = 1200, H = 560;
const roles = profile.roles;
const font = fonts([["Cinzel", 900], ["Cinzel", 700], ["Garamond", 500], ["Garamond", 700], ["Rajdhani", 600], ["Rajdhani", 700]]);

// background placement: gate arch moved right so the left stays calm for text
const BX = 300, BY = -60;
// character
const CW = 381, CH = 440, CX = 712, CY = 120;
const LX = CX + 0.22 * CW, LY = CY + 0.30 * CH; // lantern

// embers
const embers = [];
let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 20; i++) {
  const nearL = i % 3 !== 0;
  const x = nearL ? 535 + (rnd() - 0.5) * 70 : LX + (rnd() - 0.5) * 60;
  const y = nearL ? 500 - rnd() * 20 : LY + 10;
  const r = 1.2 + rnd() * 1.6, dur = 5 + rnd() * 4, dl = -rnd() * dur, dx = (rnd() - 0.5) * 60, rise = 150 + rnd() * 150;
  embers.push(`<circle class="td-em" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" style="--dx:${dx.toFixed(0)}px;--rise:-${rise.toFixed(0)}px;animation-duration:${dur.toFixed(1)}s;animation-delay:${dl.toFixed(1)}s"/>`);
}

// role line: CSS cross-fade, 3s each in a 12s cycle. Founder is first so the rest frame shows it.
const order = [roles.find((r) => /founder/i.test(r)), ...roles.filter((r) => !/founder/i.test(r))];
const N = order.length;
const roleTexts = order.map((r, i) => `<text class="td-role${i ? " td-alt" : ""}" x="70" y="236" style="animation-delay:${(i * 3 - 0.6).toFixed(1)}s">${esc(r)}</text>`).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="td-title td-desc">
<title id="td-title">stonelotus (Constantin-Iulian), Tinkerer class: Founder @ EndSpec, Builder, DevOps Engineer, Software Engineer</title>
<desc id="td-desc">${esc(profile.pitch)} A torchlit dungeon gate with a cyan wireframe tracing its arch, the name stonelotus carved in gold, the class plate CLASS: TINKERER, roles cycling between Founder @ EndSpec, Builder, DevOps Engineer and Software Engineer, and an adventurer holding a glowing lantern.</desc>
<defs>
<style>
${font}
.td-name{font:900 78px 'Cinzel',serif;letter-spacing:4px}
.td-full{font:500 24px 'Garamond',serif;letter-spacing:3px;fill:#B8A98C}
.td-pitch{font:500 22px 'Garamond',serif;fill:${T.parch}}
.td-co{font:700 19px 'Cinzel',serif;letter-spacing:4px;fill:${T.brass}}
.td-url{font:500 19px 'Garamond',serif;fill:${T.parch};fill-opacity:.8}
.td-lab{font:700 19px 'Rajdhani',sans-serif;letter-spacing:3px;fill:${T.cyan}}
.td-role{font:700 24px 'Rajdhani',sans-serif;letter-spacing:4px;fill:${T.parch};text-transform:uppercase;opacity:0;animation:td-role 12s linear infinite both}\n.td-role:first-of-type{opacity:1}\n@keyframes td-role{0%{opacity:0}5%{opacity:1}20%{opacity:1}25%,100%{opacity:0}}
.td-lat{fill:none;stroke:${T.cyan};stroke-width:1.1;stroke-opacity:.6;stroke-linecap:round}
.td-latd{fill:none;stroke:${T.cyan};stroke-width:.8;stroke-opacity:.32}
.td-draw{stroke-dasharray:1;stroke-dashoffset:0;animation:td-draw 3.2s cubic-bezier(.2,.7,.2,1) both}
.td-d2{animation-delay:.5s}.td-d3{animation-delay:1s}
@keyframes td-draw{from{stroke-dashoffset:1}}
.td-em{fill:${T.ember};opacity:.7;animation:td-rise 6s linear infinite}
@keyframes td-rise{0%{transform:translate(0,0);opacity:0}15%{opacity:.9}100%{transform:translate(var(--dx),var(--rise));opacity:0}}
.td-in{animation:td-in .5s cubic-bezier(.2,.7,.2,1) both}
.td-in2{animation-delay:.06s}.td-in3{animation-delay:.12s}.td-in4{animation-delay:.18s}
@keyframes td-in{from{opacity:0;transform:translateY(8px)}}
.td-glow{animation:td-gl 4.6s ease-in-out infinite}
@keyframes td-gl{0%,100%{opacity:.8}50%{opacity:1}}
.td-fl1{animation:td-f1 3.3s linear infinite}
@keyframes td-f1{0%,100%{opacity:.85}14%{opacity:1}31%{opacity:.7}46%{opacity:.95}63%{opacity:.78}82%{opacity:1}}
.td-fl2{animation:td-f2 4.1s linear infinite}
@keyframes td-f2{0%,100%{opacity:.55}20%{opacity:.8}35%{opacity:.5}55%{opacity:.72}70%{opacity:.6}86%{opacity:.8}}
.td-lant{transform-box:fill-box;transform-origin:center;animation:td-lt 4.6s ease-in-out infinite}
@keyframes td-lt{0%,100%{opacity:.6;transform:scale(.8)}28%{opacity:.95;transform:scale(1.02)}50%{opacity:.7;transform:scale(.86)}78%{opacity:1;transform:scale(1.08)}}
.td-nameglow{animation:td-ng 3.7s ease-in-out infinite}
@keyframes td-ng{0%,100%{opacity:.35}30%{opacity:.6}50%{opacity:.4}80%{opacity:.62}}
@media (prefers-reduced-motion:reduce){.td-in,.td-draw,.td-em,.td-glow,.td-fl1,.td-fl2,.td-lant,.td-nameglow,.td-role{animation:none}.td-alt{display:none}.td-em{opacity:.5}.td-role{opacity:1}}
</style>
<linearGradient id="td-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.candle}"/><stop offset=".55" stop-color="${T.brass}"/><stop offset="1" stop-color="#A8792A"/></linearGradient>
<radialGradient id="td-pool"><stop offset="0" stop-color="${T.candle}" stop-opacity=".62"/><stop offset=".35" stop-color="${T.ember}" stop-opacity=".26"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient>
<radialGradient id="td-lan"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9"/><stop offset=".25" stop-color="${T.candle}" stop-opacity=".5"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient>
<linearGradient id="td-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.ink}" stop-opacity=".93"/><stop offset=".42" stop-color="${T.ink}" stop-opacity=".8"/><stop offset=".62" stop-color="${T.ink}" stop-opacity=".25"/><stop offset="1" stop-color="${T.ink}" stop-opacity=".35"/></linearGradient>
<radialGradient id="td-vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="${T.ink}" stop-opacity="0"/><stop offset="1" stop-color="${T.ink}" stop-opacity=".85"/></radialGradient>
<linearGradient id="td-fadeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".2" stop-color="#fff"/></linearGradient>
<mask id="td-gm"><rect x="${BX}" y="0" width="${W - BX}" height="${H}" fill="url(#td-fadeL)"/></mask>
<filter id="td-blur" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="td-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000" flood-opacity=".6"/></filter>
<clipPath id="td-clip"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#td-clip)">
<rect width="${W}" height="${H}" fill="${T.ink}"/>
<image href="${jpg("candlelit-keep.jpg")}" x="0" y="-60" width="1200" height="670" preserveAspectRatio="none" opacity=".5"/>
<g mask="url(#td-gm)"><image href="${jpg("dungeon-gate.jpg")}" x="${BX}" y="${BY}" width="1200" height="675" opacity=".95"/></g>
<rect width="${W}" height="${H}" fill="url(#td-shade)"/>
<rect width="${W}" height="${H}" fill="url(#td-vig)"/>

<!-- torch pools -->
<g class="td-pools">
<circle class="td-fl1" cx="535" cy="470" r="250" fill="url(#td-pool)"/>
<circle class="td-fl2" cx="1150" cy="120" r="230" fill="url(#td-pool)" opacity=".6"/>
</g>

<!-- System lattice: the System rendering the world -->
<g id="td-lattice">
<path class="td-lat td-draw" pathLength="1" d="M722 565 L720 130 C735 52 815 6 900 4 C990 6 1072 58 1088 132 L1092 565"/>
<path class="td-lat td-draw td-d2" pathLength="1" d="M694 565 L690 126 C706 20 805 -34 900 -36 C1000 -34 1100 20 1112 126 L1118 565"/>
<path class="td-latd td-draw td-d3" pathLength="1" d="M705 130 L735 118 M720 90 L752 80 M752 52 L778 66 M800 26 L822 44 M900 -10 L900 8 M1000 26 L980 44 M1048 52 L1024 66 M1080 90 L1048 80 M1096 130 L1066 118"/>
<path class="td-latd td-draw td-d3" pathLength="1" d="M690 210 H722 M690 300 H722 M690 390 H722 M690 480 H722 M1092 210 H1118 M1092 300 H1118 M1092 390 H1118 M1092 480 H1118"/>
</g>

<!-- left brazier flicker overlay -->
<!-- lantern -->
<circle class="td-glow" cx="${LX.toFixed(1)}" cy="${LY.toFixed(1)}" r="150" fill="url(#td-lan)"/>
<image href="${png("dungeon.png")}" x="${CX}" y="${CY}" width="${CW}" height="${CH}" filter="url(#td-sh)"/>
<circle class="td-lant" cx="${LX.toFixed(1)}" cy="${LY.toFixed(1)}" r="64" fill="url(#td-lan)" style="mix-blend-mode:screen"/>
${embers.join("\n")}

<!-- name -->
<ellipse cx="330" cy="120" rx="330" ry="95" fill="${T.ink}" opacity=".55" filter="url(#td-blur)"/>
<ellipse class="td-nameglow" cx="280" cy="112" rx="300" ry="76" fill="url(#td-pool)"/>
<g class="td-in">
<text x="68" y="148" class="td-name" fill="${T.ember}" opacity=".35" filter="url(#td-blur)">stonelotus</text>
<text x="68" y="152" class="td-name" fill="${T.bronze}">stonelotus</text>
<text x="68" y="148" class="td-name" fill="none" stroke="${T.ink}" stroke-width="5" stroke-linejoin="round">stonelotus</text>
<text x="68" y="148" class="td-name" fill="url(#td-gold)" stroke="#6a4f17" stroke-width=".8">stonelotus</text>
<text class="td-full" x="70" y="184">Constantin-Iulian</text>
</g>
<g class="td-in td-in2">
<path d="M70 202 H300" stroke="${T.bronze}" stroke-width="2"/><path d="M300 202 H460" stroke="${T.bronze}" stroke-width="1" stroke-opacity=".6"/><path d="M466 202 l7 -7 l7 7 l-7 7z" fill="${T.brass}"/>
${roleTexts}
</g>

<!-- System readout: static class -->
<g class="td-in td-in3">
<rect x="70" y="262" width="404" height="58" fill="${T.ink}" stroke="${T.bronze}" stroke-width="1.5"/>
<rect x="76" y="268" width="392" height="46" fill="${T.ink}" stroke="${T.cyan}" stroke-opacity=".55" stroke-width="1"/>
<path d="M76 282 V268 H90 M454 268 H468 V282 M468 298 V314 H454 M90 314 H76 V298" fill="none" stroke="${T.cyan}" stroke-width="2"/>
<image href="${png("emblem-tinkerer.png")}" x="94" y="272" width="38" height="38"/>
<text class="td-lab" x="144" y="298">CLASS · TINKERER</text>
</g>

<g class="td-in td-in4">
<text class="td-pitch" x="70" y="368">I build products end to end, and at EndSpec</text>
<text class="td-pitch" x="70" y="398">we fix, harden and scale AI-built software.</text>
<circle cx="78" cy="454" r="7" fill="none" stroke="${T.brass}" stroke-width="2"/><circle cx="78" cy="454" r="2.5" fill="${T.candle}"/>
<text class="td-co" x="98" y="461">ENDSPEC</text><text class="td-url" x="222" y="461">endspec.net</text>
</g>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17" fill="none" stroke="${T.bronze}" stroke-opacity=".8" stroke-width="3"/>
</g>
</svg>`;
const out = join(root, "hero.svg");
writeFileSync(out, svg);
console.log("hero.svg", (statSync(out).size / 1024).toFixed(0) + " KB");
