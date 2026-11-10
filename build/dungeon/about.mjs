import { writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { root, fonts, jpg, png, T, esc, profile } from "./lib.mjs";

const W = 1200, H = 616;
const font = fonts([["Cinzel", 900], ["Cinzel", 700], ["Garamond", 500], ["Garamond", 700], ["Rajdhani", 700]]);
const TEXT2 = "#B8A98C", INK_P = T.stone, INK_P2 = "#5A4632";
let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
const f = (n) => (+n).toFixed(3).replace(/\.?0+$/, "");

/* ---------------- left: System window ---------------- */
const LX = 50, LY = 116, LW = 590, LH = 474;
const SY = 244;                         // pipeline centre line
const STX = [140, 320, 500], SEAL = [588, SY];
const hex = (r) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 3 * i - Math.PI / 6 + Math.PI / 6; return [r * Math.cos(a - Math.PI / 6 + Math.PI / 6 * 0), r * Math.sin(a)].map((v) => f(v)).join(" "); }).join(" ");
const hexPts = (r) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 3 * i; return f(r * Math.cos(a)) + " " + f(r * Math.sin(a)); }).join(" ");
const glyphs = [
  `<circle r="5"/><path d="M0 -15V-5M0 5V15"/>`,
  `<path d="M0 -13L12 -6V7L0 14L-12 7V-6Z M0 0V14 M0 0L-12 -6 M0 0L12 -6"/>`,
  `<path d="M-9 10L10 -10M-3 -10H10V3"/>`,
];
const labels = ["commit", "build", "ship"];
const lit = (t) => `<animate attributeName="opacity" values=".18;.18;1;1;.18;.18" keyTimes="0;${f(t)};${f(t + .04)};.94;.98;1" dur="7s" repeatCount="indefinite"/>`;
function pipeline(anim) {
  const D = 7, on = [.04, .30, .54];
  const stones = STX.map((x, i) => `<g transform="translate(${x} ${SY})">
<circle r="31" fill="none" stroke="${T.cyan}" stroke-width="1.6" opacity="${anim ? .18 : .9}">${anim ? lit(on[i]) : ""}</circle>
<circle r="27.5" fill="${T.ink}"/>
<polygon points="${hexPts(25)}" fill="${T.stone2}" stroke="${T.bronze}" stroke-width="2.2" stroke-linejoin="round"/>
<polygon points="${hexPts(19)}" fill="none" stroke="${T.bronze}" stroke-opacity=".5" stroke-width="1"/>
<g fill="none" stroke="${T.parch}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".92">${glyphs[i]}</g>
</g>
<text class="ta-pl" x="${x}" y="${SY + 58}" text-anchor="middle">${labels[i]}</text>`).join("\n");
  const seg = (x1, x2, a, b) => {
    const d = `M${x1} ${SY}H${x2}`;
    return `<path d="${d}" stroke="${T.cyan}" stroke-opacity=".22" stroke-width="2" stroke-dasharray="3 6" fill="none"/>
<path d="${d}" pathLength="1" stroke="${T.cyan}" stroke-width="2.4" stroke-linecap="round" fill="none" stroke-dasharray="1" stroke-dashoffset="0" opacity="1">${anim ? `<animate attributeName="stroke-dashoffset" values="1;1;0;0;1" keyTimes="0;${a};${b};.99;1" dur="${D}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.93;.97;1" dur="${D}s" repeatCount="indefinite"/>` : ""}</path>`;
  };
  const pk = (x1, x2, a, b) => `<g opacity="0"><circle r="11" fill="${T.cyan}" opacity=".3"/><circle r="5" fill="#CFF8FF"/>
<animateMotion path="M${x1} ${SY}H${x2}" dur="${D}s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;${a};${b};1"/>
<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${a};${f(a + .01)};${f(b - .01)};${b};1" dur="${D}s" repeatCount="indefinite"/></g>`;
  const stamp = `<g transform="translate(${SEAL[0]} ${SEAL[1]})"><g opacity="${1}">
${anim ? `<animateTransform attributeName="transform" type="scale" values="1.9;1.9;.94;1.05;1;1" keyTimes="0;.58;.64;.68;.72;1" dur="${D}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.58;.62;.94;.98;1" dur="${D}s" repeatCount="indefinite"/>` : ""}
<circle r="35" fill="none" stroke="${T.brass}" stroke-opacity=".25" stroke-width="1.5"/>
<path d="${seal(27)}" fill="url(#ta-wax)" stroke="#6a4f17" stroke-width="1.5"/>
<circle r="18.5" fill="none" stroke="#6a4f17" stroke-width="1.6" stroke-opacity=".9"/>
<path d="M-8 1L-2 7L9 -7" fill="none" stroke="#4a3610" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(0.8 1)" opacity=".55"/>
<path d="M-8 1L-2 7L9 -7" fill="none" stroke="#FCE6A0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
</g></g>
<text class="ta-shipped" x="${SEAL[0]}" y="${SY + 56}" text-anchor="middle" opacity="1">shipped${anim ? `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.64;.68;.94;.98;1" dur="${D}s" repeatCount="indefinite"/>` : ""}</text>`;
  return `${seg(172, 288, .06, .30)}${seg(352, 468, .30, .54)}${anim ? pk(172, 288, .06, .28) + pk(352, 468, .30, .52) : ""}
${stones}
${stamp}`;
}
function seal(r) { // scalloped wax edge
  const n = 14; let d = "";
  for (let i = 0; i < n; i++) { const a0 = i / n * 2 * Math.PI, a1 = (i + .5) / n * 2 * Math.PI, a2 = (i + 1) / n * 2 * Math.PI; const j = 1 + (i % 3) * .02;
    const p = (a, rr) => f(rr * Math.cos(a)) + " " + f(rr * Math.sin(a));
    d += (i ? "" : "M" + p(a0, r)) + `Q${p(a1, r * 1.16 * j)} ${p(a2, r)}`; }
  return d + "Z";
}
const icons = [
  `<path d="M0 -15L14 -8V8L0 15L-14 8V-8Z M0 0V15 M0 0L-14 -8 M0 0L14 -8"/><path d="M0 -15V-24M-5 -19L0 -24L5 -19" transform="translate(0 4) scale(.8)"/>`,
  `<rect x="-14" y="-15" width="28" height="9" rx="2"/><rect x="-14" y="-4" width="28" height="9" rx="2"/><rect x="-14" y="7" width="28" height="9" rx="2"/><path d="M-9 -10.5H-6M-9 .5H-6M-9 11.5H-6M7 -10.5H10M7 .5H10M7 11.5H10"/>`,
  `<path d="M0 -16C6 -12 11 -11 15 -11V1C15 9 8 14 0 17C-8 14 -15 9 -15 1V-11C-11 -11 -6 -12 0 -16Z"/><path d="M-6 1L-1.5 6L7 -4"/>`,
];
const rows = profile.capabilities.map((c, i) => {
  const y = 352 + i * 76;
  return `<g transform="translate(${LX + 56} ${y + 20})">
<polygon points="${hexPts(29)}" transform="rotate(30)" fill="${T.stone2}" stroke="${T.brass}" stroke-width="2.2" stroke-linejoin="round"/>
<polygon points="${hexPts(23)}" transform="rotate(30)" fill="none" stroke="${T.brass}" stroke-opacity=".35" stroke-width="1"/>
<g fill="none" stroke="${T.candle}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[i]}</g></g>
<text class="ta-at" x="${LX + 108}" y="${y + 14}">${esc(c.title)}</text>
<text class="ta-ab" x="${LX + 108}" y="${y + 42}">${esc(c.body)}</text>`;
}).join("\n");
const brk = (x, y, w, h, o = 8, l = 14) => `M${x + o} ${y + o + l}V${y + o}H${x + o + l} M${x + w - o - l} ${y + o}H${x + w - o}V${y + o + l} M${x + w - o} ${y + h - o - l}V${y + h - o}H${x + w - o - l} M${x + o + l} ${y + h - o}H${x + o}V${y + h - o - l}`;
const left = `<g>
<rect x="${LX + 4}" y="${LY + 10}" width="${LW}" height="${LH}" fill="#000" opacity=".5" filter="url(#ta-bl)"/>
<rect x="${LX}" y="${LY}" width="${LW}" height="${LH}" fill="${T.ink}" fill-opacity=".93" stroke="${T.bronze}" stroke-width="1.8"/>
<rect x="${LX + 6}" y="${LY + 6}" width="${LW - 12}" height="${LH - 12}" fill="none" stroke="${T.cyan}" stroke-opacity=".5" stroke-width="1"/>
<path d="${brk(LX, LY, LW, LH)}" fill="none" stroke="${T.cyan}" stroke-width="2.2"/>
<text class="ta-hd" x="${LX + 30}" y="${LY + 46}">[ ABILITIES ]</text>
<text class="ta-hd2" x="${LX + LW - 30}" y="${LY + 46}" text-anchor="end">deploy pipeline</text>
<path d="M${LX + 28} ${LY + 58}H${LX + LW - 28}" stroke="${T.cyan}" stroke-opacity=".4" stroke-width="1"/>
<g class="ta-anim">${pipeline(true)}</g>
<g class="ta-twin">${pipeline(false)}</g>
<path d="M${LX + 30} 332H${LX + LW / 2 - 12}M${LX + LW / 2 + 12} 332H${LX + LW - 30}" stroke="${T.bronze}" stroke-width="1.5"/><path d="M${LX + LW / 2 - 6} 332l6 -5l6 5l-6 5z" fill="${T.brass}"/>
${rows}
</g>`;

/* ---------------- right: parchment ---------------- */
const PX = 672, PY = 116, NW = 478, NH = 474;
function deckle() {
  const pts = []; const j = () => (rnd() - 0.5) * 3.4;
  for (let x = 0; x <= NW; x += 17) pts.push([x, j()]);
  for (let y = 17; y <= NH; y += 17) pts.push([NW + j(), y]);
  for (let x = NW - 17; x >= 0; x -= 17) pts.push([x, NH + j()]);
  for (let y = NH - 17; y > 0; y -= 17) pts.push([j(), y]);
  return "M" + pts.map((p) => f(p[0]) + " " + f(p[1])).join(" L") + "Z";
}
const dk = deckle();
const sw = { stroke: INK_P, "stroke-width": 2.4 };
const sawBlade = (() => { let d = "M62 14L214 26"; const x0 = 214, y0 = 33, x1 = 62, y1 = 50, n = 15;
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; d += i ? `L${f(x + 5)} ${f(y + 8)}L${f(x)} ${f(y)}`.replace(/^L(\S+ \S+)L(\S+ \S+)$/, "L$1L$2") : `L${f(x)} ${f(y)}`; }
  return d + "Z"; })();
const ill = {
  craft: `<g fill="none" stroke="${INK_P}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
<!-- bench -->
<rect x="28" y="140" width="344" height="17" rx="2" fill="${T.parch}"/>
<path d="M44 157V198M356 157V198M44 176H356M70 157L44 176M330 157L356 176" />
<path d="M40 150H70M120 148H170M240 151H300M320 148H350" stroke="${INK_P2}" stroke-width="1.3"/>
<path d="M36 198H64M336 198H364" stroke="${INK_P2}" stroke-width="1.5"/>
<!-- claw hammer, standing -->
<rect x="119" y="80" width="14" height="60" rx="3" fill="${T.parch}"/>
<path d="M124 90V132M128 94V128" stroke="${INK_P2}" stroke-width="1.1"/>
<path d="M92 64H138Q162 64 174 90L167 94Q157 78 138 80H92Z" fill="${T.parch}" stroke-width="2.6"/>
<path d="M112 64V80" stroke-width="2"/>
<path d="M96 69H108M142 69Q156 70 164 82" stroke="${INK_P2}" stroke-width="1.2"/>
<path d="M119 140H133" stroke-width="3"/>
<!-- hand saw on the wall -->
<path fill-rule="evenodd" d="M22 12H62V52H24Q12 52 12 40V24Q12 12 22 12ZM26 22H48V42H26Z" fill="${T.parch}"/>
<path d="${sawBlade}" fill="${T.parch}" stroke-width="2.2"/>
<path d="M74 24L190 31M74 30L190 36" stroke="${INK_P2}" stroke-width="1.1"/>
<circle cx="70" cy="30" r="2.2" fill="${INK_P}"/>
<!-- block -->
<path d="M214 100L240 82H334L306 100Z" fill="${T.parch}"/>
<path d="M306 100L334 82V124L306 140Z" fill="#CDBB96"/>
<rect x="214" y="100" width="92" height="40" fill="${T.parch}"/>
<path d="M222 108H298M222 132H298" stroke="${INK_P2}" stroke-width=".9" opacity=".5"/>
<path d="M240 108L229 120L240 132 M262 107L254 133 M280 108L291 120L280 132" stroke-width="3.2"/>
<path d="M310 106L330 90M310 118L330 102" stroke="${INK_P2}" stroke-width="1.1"/>
<!-- shavings -->
<path d="M190 138C178 128 186 118 196 124C204 129 198 138 190 134" stroke-width="1.8"/>
<path d="M340 138C350 126 362 130 358 138C356 143 348 141 350 136" stroke-width="1.8"/>
<path d="M160 150L168 158M290 152L296 160" stroke="${INK_P2}" stroke-width="1.2"/>
</g>`,
  learn: `<g fill="none" stroke="${INK_P}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
<circle class="ta-glow" cx="300" cy="104" r="78" fill="url(#ta-cg)" stroke="none"/>
<path d="M20 172H380" />
<path d="M60 172L50 196M340 172L350 196" stroke="${INK_P2}" stroke-width="1.5"/>
<!-- stacked books -->
<rect x="322" y="154" width="58" height="18" rx="2" fill="${T.parch}"/><path d="M330 160H372M330 166H372" stroke="${INK_P2}" stroke-width="1"/>
<rect x="326" y="138" width="50" height="16" rx="2" fill="${T.parch}"/><path d="M334 143H368" stroke="${INK_P2}" stroke-width="1"/>
<!-- open book -->
<path d="M44 150Q104 144 150 158Q196 144 256 150V160Q196 154 150 168Q104 154 44 160Z" fill="#CDBB96"/>
<path d="M150 154Q104 136 52 146V100Q104 90 150 106Z" fill="${T.parch}"/>
<path d="M150 154Q196 136 248 146V100Q196 90 150 106Z" fill="${T.parch}"/>
<path d="M150 106V154"/>
<path d="M68 112Q104 106 136 118M68 122Q104 116 136 128M68 132Q104 126 136 138M164 118Q196 106 232 112M164 128Q196 116 232 122M164 138Q196 126 232 132" stroke="${INK_P2}" stroke-width="1.3"/>
<path d="M158 156V176L162 172L166 176V158" fill="${INK_P}" stroke="none" opacity=".8"/>
<!-- candle -->
<ellipse cx="300" cy="170" rx="24" ry="5" fill="${T.parch}"/>
<rect x="291" y="112" width="18" height="56" rx="2" fill="${T.parch}"/>
<path d="M293 122C293 130 296 132 296 138 M306 118V128" stroke="${INK_P2}" stroke-width="1.2"/>
<path d="M300 112V104" stroke-width="1.8"/>
<g class="ta-flame"><path d="M300 76C309 90 310 100 300 106C290 100 291 90 300 76Z" fill="${T.ember}" stroke="${INK_P}" stroke-width="1.8"/><path d="M300 90C303 96 303 100 300 102C297 100 297 96 300 90Z" fill="${T.candle}" stroke="none"/></g>
</g>`,
};
const slides = profile.hobbies.map((h, i) => ({ ...h, id: ["craft", "learn"][i] }));
function slideBody(h, i, anim) {
  const attrs = (i === 0) ? `opacity="1"` : `opacity="${anim ? 0 : 0}"`;
  const ani = anim ? (i === 0
    ? `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;.45;.5;.95;1" dur="8s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 0;-40 0;40 0;0 0" keyTimes="0;.45;.5;.95;1" dur="8s" repeatCount="indefinite"/>`
    : `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.45;.5;.95;1" dur="8s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="40 0;40 0;0 0;0 0;-40 0" keyTimes="0;.45;.5;.95;1" dur="8s" repeatCount="indefinite"/>`) : "";
  return `<g ${attrs}>${ani}<use href="#ta-ill-${h.id}" transform="translate(19 66) scale(1.1)"/>
<text class="ta-sn" x="${NW / 2}" y="318" text-anchor="middle">${esc(h.name.toUpperCase())}</text>
<text class="ta-sc" x="${NW / 2}" y="350" text-anchor="middle">${esc(h.caption)}</text></g>`;
}
const segW = 205, segG = 8, segX = (NW - 2 * segW - segG) / 2, segY = 52;
function bars(anim) {
  const mk = (x, w0, vals) => `<rect x="${x}" y="${segY}" width="${segW}" height="8" rx="4" fill="${INK_P}" fill-opacity=".2"/><rect x="${x}" y="${segY}" width="${w0}" height="8" rx="4" fill="url(#ta-gold)" stroke="#6a4f17" stroke-width="1">${anim ? `<animate attributeName="width" values="${vals}" keyTimes="0;.5;.96;1" dur="8s" repeatCount="indefinite"/>` : ""}</rect>`;
  return mk(segX, segW, `0;${segW};${segW};0`) + mk(segX + segW + segG, 0, `0;0;${segW};0`);
}
const RC = 2 * Math.PI * 17, rings = profile.dailyRings, pct = { craft: .8, learn: .65, ship: .9 };
function dials(anim) {
  return rings.map((r, i) => {
    const cx = 74 + i * 136, cy = 423, off = RC * (1 - pct[r]);
    const a = .08 + i * .06, b = a + .3;
    return `<g transform="translate(${cx} ${cy})">
<circle r="25" fill="none" stroke="${T.bronze}" stroke-width="2" stroke-dasharray="1.2 6.1" stroke-opacity=".9"/>
<circle r="17" fill="none" stroke="#3A2F1C" stroke-width="6"/>
<circle r="17" fill="none" stroke="url(#ta-gold)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${f(RC)}" stroke-dashoffset="${f(off)}" transform="rotate(-90)">${anim ? `<animate attributeName="stroke-dashoffset" values="${f(RC)};${f(RC)};${f(off)};${f(off)};${f(RC)}" keyTimes="0;${f(a)};${f(b)};.94;.99" dur="8s" repeatCount="indefinite"/>` : ""}</circle>
<circle r="3" fill="${T.candle}"/></g>
<text class="ta-rl" x="${cx + 32}" y="${cy + 6}">${r}</text>`;
  }).join("\n");
}
const plate = (n) => `<rect x="30" y="388" width="${NW - 60}" height="70" fill="${T.ink}" stroke="${T.bronze}" stroke-width="1.5"/>
<rect x="36" y="394" width="${NW - 72}" height="58" fill="${T.ink}" stroke="${T.cyan}" stroke-opacity=".5"/>
<path d="${brk(36, 394, NW - 72, 58, 0, 12)}" fill="none" stroke="${T.cyan}" stroke-width="2"/>`;
const right = `<g transform="rotate(-.6 ${PX + NW / 2} ${PY + NH / 2}) translate(${PX} ${PY})">
<path d="${dk}" fill="#000" opacity=".55" transform="translate(5 10)" filter="url(#ta-bl)"/>
<path d="${dk}" fill="${T.parch}"/><path d="${dk}" fill="url(#ta-burn)"/>
<rect width="${NW}" height="${NH}" filter="url(#ta-grain)" opacity=".5" style="mix-blend-mode:multiply" clip-path="url(#ta-nc)"/>
<path d="M36 372H${NW / 2 - 12}M${NW / 2 + 12} 372H${NW - 36}" stroke="${T.bronze}" stroke-width="1.3"/><path d="M${NW / 2 - 5} 346l5 -4l5 4l-5 4z" fill="${T.bronze}" transform="translate(0 26)"/>
<g class="ta-anim">${bars(true)}<g clip-path="url(#ta-sclip)">${slides.map((h, i) => slideBody(h, i, true)).join("")}</g></g>
<g class="ta-twin">${bars(false)}${slideBody(slides[0], 0, false)}</g>
${plate()}
<g class="ta-anim">${dials(true)}</g><g class="ta-twin">${dials(false)}</g>
<image href="${png("icon-class-system.png")}" x="${NW / 2 - 29}" y="-26" width="58" height="58" filter="url(#ta-pin)"/>
</g>`;

/* ---------------- embers ---------------- */
const embers = [];
for (let i = 0; i < 14; i++) {
  const x = 640 + rnd() * 32, y = H - 24 - rnd() * 40, r = 1.2 + rnd() * 1.6, dur = 5 + rnd() * 4, dl = -rnd() * dur, dx = (rnd() - .5) * 50, rise = 160 + rnd() * 180;
  embers.push(`<circle class="ta-em" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" style="--dx:${f(dx)}px;--rise:-${f(rise)}px;animation-duration:${f(dur)}s;animation-delay:${f(dl)}s"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="ta-title ta-desc">
<title id="ta-title">What I build and off the clock</title>
<desc id="ta-desc">Left, a System window listing three abilities beside a commit, build, ship pipeline that ends in a wax seal. Right, a parchment notice with a looping carousel of hobbies, craft and learn, above three daily dials.</desc>
<defs>
<style>
${font}
.ta-bt{font:900 38px 'Cinzel',serif;letter-spacing:6px}
.ta-hd{font:700 20px 'Rajdhani',sans-serif;letter-spacing:3px;fill:${T.cyan}}
.ta-hd2{font:700 18px 'Rajdhani',sans-serif;letter-spacing:2.2px;fill:${T.cyan};fill-opacity:.8;text-transform:uppercase}
.ta-pl{font:700 18px 'Rajdhani',sans-serif;letter-spacing:2.4px;fill:${T.parch};text-transform:uppercase}
.ta-shipped{font:700 22px 'Garamond',serif;fill:${T.brass};letter-spacing:1px}
.ta-at{font:700 22px 'Garamond',serif;fill:${T.parch}}
.ta-ab{font:500 20px 'Garamond',serif;fill:${TEXT2}}
.ta-sn{font:700 30px 'Cinzel',serif;letter-spacing:5px;fill:${INK_P}}
.ta-sc{font:500 20px 'Garamond',serif;fill:${INK_P2}}
.ta-rl{font:700 18px 'Rajdhani',sans-serif;letter-spacing:2.4px;fill:${T.parch};text-transform:uppercase}
.ta-twin{display:none}
.ta-tc1{animation:ta-tf 3.1s linear infinite}.ta-tc2{animation:ta-tf 3.9s linear -1.3s infinite}.ta-tc3{animation:ta-tf 4.4s linear -2.1s infinite}
@keyframes ta-tf{0%,100%{opacity:.7}15%{opacity:1}30%{opacity:.6}50%{opacity:.9}65%{opacity:.65}83%{opacity:1}}
.ta-flame{transform-box:fill-box;transform-origin:50% 100%;animation:ta-fl 2.3s ease-in-out infinite}
@keyframes ta-fl{0%,100%{transform:scale(1,1)}25%{transform:scale(.94,1.07) rotate(-2deg)}55%{transform:scale(1.04,.95)}80%{transform:scale(.96,1.05) rotate(2deg)}}
.ta-glow{animation:ta-gl 3.1s ease-in-out infinite}
@keyframes ta-gl{0%,100%{opacity:.75}40%{opacity:1}70%{opacity:.6}}
.ta-em{fill:${T.ember};opacity:.7;animation:ta-rise 6s linear infinite}
@keyframes ta-rise{0%{transform:translate(0,0);opacity:0}15%{opacity:.9}100%{transform:translate(var(--dx),var(--rise));opacity:0}}
@media (prefers-reduced-motion:reduce){.ta-anim{display:none}.ta-twin{display:inline}.ta-flame,.ta-glow,.ta-em,.ta-tc1,.ta-tc2,.ta-tc3{animation:none}.ta-em{opacity:.45}}
</style>
<linearGradient id="ta-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.candle}"/><stop offset=".55" stop-color="${T.brass}"/><stop offset="1" stop-color="#A8792A"/></linearGradient>
<radialGradient id="ta-wax" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#F0C255"/><stop offset=".6" stop-color="${T.brass}"/><stop offset="1" stop-color="#9A7126"/></radialGradient>
<radialGradient id="ta-burn" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#8a6a35" stop-opacity="0"/><stop offset="1" stop-color="#6b4a1c" stop-opacity=".42"/></radialGradient>
<radialGradient id="ta-cg"><stop offset="0" stop-color="${T.candle}" stop-opacity=".55"/><stop offset="1" stop-color="${T.candle}" stop-opacity="0"/></radialGradient>
<radialGradient id="ta-pool"><stop offset="0" stop-color="${T.candle}" stop-opacity=".55"/><stop offset=".4" stop-color="${T.ember}" stop-opacity=".2"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient>
<radialGradient id="ta-vig" cx=".5" cy=".5" r=".78"><stop offset=".5" stop-color="${T.ink}" stop-opacity="0"/><stop offset="1" stop-color="${T.ink}" stop-opacity=".8"/></radialGradient>
<filter id="ta-bl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="ta-pin" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".6"/></filter>
<filter id="ta-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .33  0 0 0 0 .15  0 0 0 .55 0"/></filter>
<clipPath id="ta-nc"><rect width="${NW}" height="${NH}"/></clipPath>
<clipPath id="ta-sclip"><rect x="16" y="64" width="${NW - 32}" height="300"/></clipPath>
<clipPath id="ta-clip"><rect width="${W}" height="${H}" rx="18"/></clipPath>
<g id="ta-ill-craft">${ill.craft}</g>
<g id="ta-ill-learn">${ill.learn}</g>
</defs>
<g clip-path="url(#ta-clip)">
<rect width="${W}" height="${H}" fill="${T.ink}"/>
<image href="${jpg("candlelit-keep.jpg")}" x="0" y="-40" width="1200" height="670" preserveAspectRatio="none" opacity=".7"/>
<rect width="${W}" height="${H}" fill="${T.ink}" opacity=".35"/>
<rect width="${W}" height="${H}" fill="url(#ta-vig)"/>
<circle class="ta-tc1" cx="40" cy="10" r="250" fill="url(#ta-pool)"/>
<circle class="ta-tc2" cx="1200" cy="40" r="230" fill="url(#ta-pool)"/>
<circle class="ta-tc3" cx="656" cy="${H}" r="210" fill="url(#ta-pool)"/>
<!-- titles -->
<text x="52" y="74" class="ta-bt" fill="${T.bronze}" transform="translate(0 3)">WHAT I BUILD</text>
<text x="52" y="74" class="ta-bt" fill="url(#ta-gold)">WHAT I BUILD</text>
<path d="M54 90H380" stroke="${T.bronze}" stroke-width="2"/><path d="M386 90l6 -6l6 6l-6 6z" fill="${T.brass}"/>
<text x="${PX}" y="74" class="ta-bt" fill="${T.bronze}" transform="translate(0 3)">OFF THE CLOCK</text>
<text x="${PX}" y="74" class="ta-bt" fill="url(#ta-gold)">OFF THE CLOCK</text>
<path d="M${PX + 2} 90H${PX + 390}" stroke="${T.bronze}" stroke-width="2"/><path d="M${PX + 396} 90l6 -6l6 6l-6 6z" fill="${T.brass}"/>
${left}
${right}
<g class="ta-ems">${embers.join("")}</g>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17" fill="none" stroke="${T.bronze}" stroke-opacity=".8" stroke-width="3"/>
</g>
</svg>`;
const out = join(root, "about-life.svg");
writeFileSync(out, svg);
console.log("about-life.svg", (statSync(out).size / 1024).toFixed(0) + " KB");
