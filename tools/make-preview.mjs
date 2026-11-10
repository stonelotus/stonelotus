#!/usr/bin/env node
// Build a GitHub-profile-mock HTML page for an Artifact preview of one design direction.
//   node tools/make-preview.mjs <direction-key>
// Writes _artifacts/<key>/index.html and copies the SVGs next to it (publish with `files`).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const profile = JSON.parse(readFileSync(join(root, "data/profile.json"), "utf8"));
const key = process.argv[2];

const DIRECTIONS = {
  final: {
    title: "stonelotus Profile",
    name: "Torchlit Dungeon",
    status: "Final build · what github.com/stonelotus will show",
    pitch:
      "MainQuest's medieval-cyber seam across the whole profile: a torchlit keep for the world and the cyan System for the interface. Every section is an animated SVG, rendered here exactly as GitHub shows it.",
    swatches: [["#1A1714", "stone"], ["#D9A441", "brass"], ["#F5C542", "candle"], ["#00E0FF", "system cyan"], ["#E9DCC0", "parchment"]],
    fonts: "Cinzel · EB Garamond · Rajdhani · JetBrains Mono",
    sections: [
      { svg: "hero.svg", alt: "Torchlit dungeon hero" },
      { svg: "quests.svg", alt: "Quest board of active projects" },
      { html: `<p class="center"><sub><a href="https://www.mainquest.net">MainQuest is live ↗</a> · the other quests are private and in progress</sub></p>` },
      { svg: "about-life.svg", alt: "What I build and off the clock" },
      { svg: "stack.svg", alt: "The armory: tech stack" },
      { svg: "id-dashboard.svg", alt: "Guild card and status window" },
      { html: `<p class="note">The 3D contribution city goes here. The daily workflow draws it after the first push.</p>` },
      { connect: true, noHeading: true },
    ],
  },
  glass: {
    title: "Midnight Glass Profile",
    name: "Midnight Glass",
    status: "Built · ready to ship",
    pitch:
      "The guide's look, done properly: dark glass cards, an aurora accent of cyan, violet and pink, Bricolage Grotesque and JetBrains Mono. It's calm, modern and engineer-facing.",
    swatches: [["#0d0e16", "card"], ["#22d3ee", "cyan"], ["#a78bfa", "violet"], ["#f472b6", "pink"], ["#e8e9f3", "text"]],
    fonts: "Bricolage Grotesque · JetBrains Mono",
    sections: [
      { svg: "hero.svg", alt: "Hero: stonelotus waving from a camera viewfinder" },
      { svg: "about-life.svg", alt: "What I build and off the clock" },
      { svg: "stack.svg", alt: "Tech stack orbit and chip grid" },
      { svg: "id-dashboard.svg", alt: "ID badge and live stats dashboard" },
      { table: true },
      { connect: true },
    ],
  },
  system: {
    title: "System Window Profile",
    name: "System Window",
    status: "Direction sample · hero + quest log",
    pitch:
      "This is pure MainQuest. The System opens a status window for a new player: level, class, XP, and your projects as an active quest log with rarity tiers. It uses a Solo Leveling HUD with hex grids, scanlines and glow.",
    swatches: [["#0A0E1D", "shadow blue"], ["#00E0FF", "electric cyan"], ["#FFD700", "legendary"], ["#7E3ACF", "epic"], ["#C5C9E6", "text"]],
    fonts: "Michroma · Rajdhani · JetBrains Mono",
    sections: [
      { svg: "explore/system/hero.svg", alt: "System status window for player stonelotus" },
      { svg: "explore/system/quests.svg", alt: "Quest log of active projects" },
    ],
  },
  dungeon: {
    title: "Torchlit Dungeon Profile",
    name: "Torchlit Dungeon",
    status: "Direction sample · hero + quest board",
    pitch:
      "MainQuest's landing-page seam: a torchlit stone keep with a cyan System HUD drawn over it. You're a lantern-bearing adventurer, and your projects are notices sealed in wax on the quest board.",
    swatches: [["#1A1714", "stone"], ["#D9A441", "brass"], ["#F5C542", "candle"], ["#00E0FF", "system cyan"], ["#E9DCC0", "parchment"]],
    fonts: "Cinzel · EB Garamond · Rajdhani",
    sections: [
      { svg: "explore/dungeon/hero.svg", alt: "Torchlit dungeon hero with lantern-bearing adventurer" },
      { svg: "explore/dungeon/quests.svg", alt: "Quest board of parchment notices" },
    ],
  },
  grimoire: {
    title: "Grimoire Profile",
    name: "Grimoire",
    status: "Direction sample · hero + book of quests",
    pitch:
      "This goes fully medieval: an illuminated quest book with vellum, iron-gall ink, vermilion rubrics and gold leaf that catches the light. One tiny cyan System mark keeps it MainQuest. It's the loudest choice on a GitHub page.",
    swatches: [["#EFE3C8", "vellum"], ["#2A1E14", "iron ink"], ["#B23A2A", "vermilion"], ["#2B4C9B", "ultramarine"], ["#C9A23A", "gold leaf"]],
    fonts: "Cinzel · EB Garamond · UnifrakturMaguntia",
    sections: [
      { svg: "explore/grimoire/hero.svg", alt: "Illuminated manuscript hero page" },
      { svg: "explore/grimoire/quests.svg", alt: "The Book of Quests" },
    ],
  },
};

const d = DIRECTIONS[key];
if (!d) {
  console.error("usage: make-preview.mjs " + Object.keys(DIRECTIONS).join("|"));
  process.exit(2);
}
const out = join(root, "_artifacts", key);
mkdirSync(out, { recursive: true });
const files = {};
const pub = (src) => {
  const p = basename(src);
  copyFileSync(join(root, src), join(out, p));
  files[p] = join("_artifacts", key, p);
  return p;
};
copyFileSync(join(root, key === "final" ? "assets/dungeon-bust.png" : "_source/unused-assets/portrait.png"), join(out, "avatar.png"));
files["avatar.png"] = join("_artifacts", key, "avatar.png");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const L = profile.links;
let body = "";
for (const s of d.sections) {
  if (s.svg) {
    if (!existsSync(join(root, s.svg))) throw new Error("missing " + s.svg);
    body += `<p class="center"><img src="${pub(s.svg)}" alt="${esc(s.alt)}" width="100%"></p>\n`;
  } else if (s.table) {
    body += `<h3>Things I'm building</h3><div class="tablewrap"><table><thead><tr><th>Project</th><th>What it is</th><th>Built with</th><th></th></tr></thead><tbody>${profile.projects
      .map(
        (p) =>
          `<tr><td><strong>${p.url ? `<a href="${p.url}">${esc(p.name)}</a>` : esc(p.name)}</strong></td><td>${esc(p.oneLiner)}</td><td>${p.stack.join(
            " · "
          )}</td><td>${p.url ? `<a href="${p.url}">live ↗</a>` : "private"}</td></tr>`
      )
      .join("")}</tbody></table></div>
<p class="note">The 3D contribution city goes here. The daily workflow draws it after the first push.</p>`;
  } else if (s.html) {
    body += s.html + "\n";
  } else if (s.connect) {
    body += `${s.noHeading ? "" : "<h3>Say hi</h3>"}<div class="connect"><img class="who" src="${pub("connect.svg")}" alt="stonelotus pointing at the links">
<div class="cards">
<a href="${L.linkedin.url}"><img src="${pub("connect-linkedin.svg")}" alt="LinkedIn"></a>
<a href="${L.email.url}"><img src="${pub("connect-email.svg")}" alt="Email"></a>
<a href="${L.endspec.url}"><img src="${pub("connect-endspec.svg")}" alt="EndSpec"></a>
<a href="${L.github.url}"><img src="${pub("connect-github.svg")}" alt="GitHub"></a>
</div></div>`;
  }
}

const swatches = d.swatches
  .map(([hex, label]) => `<li><span class="chip" style="background:${hex}"></span><span>${label}</span><code>${hex}</code></li>`)
  .join("");

const html = `<title>${esc(d.title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: a GitHub profile page at true scale: identity sidebar, then the README column at 846px, where the SVGs render as visitors see them. */
:root{
  --ground:#ffffff; --panel:#f6f8fa; --fg:#1f2328; --muted:#59636e; --line:#d1d9e0; --link:#0969da; --accent:#0969da;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--ground:#0d1117;--panel:#151b23;--fg:#f0f6fc;--muted:#9198a1;--line:#3d444d;--link:#4493f8;--accent:#4493f8;color-scheme:dark}}
:root[data-theme="dark"]{--ground:#0d1117;--panel:#151b23;--fg:#f0f6fc;--muted:#9198a1;--line:#3d444d;--link:#4493f8;--accent:#4493f8;color-scheme:dark}
body{background:var(--ground);color:var(--fg);font:15px/1.5 var(--sans)}
a{color:var(--link)}
.wrap{max-width:1280px;margin:0 auto;padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.brief{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px 32px;align-items:end;border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:20px 22px;margin-bottom:28px}
.brief .eyebrow{font:600 12px/1 var(--mono);color:var(--muted);letter-spacing:.04em}
.brief h1{margin:8px 0 6px;font-size:26px;line-height:1.15;text-wrap:balance}
.brief p{margin:0;max-width:62ch;color:var(--muted)}
.brief .meta{display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.swatches{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0}
.swatches li{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
.swatches code{font:11px var(--mono);opacity:.8}
.chip{width:14px;height:14px;border-radius:4px;border:1px solid var(--line)}
.fonts{font:12px var(--mono);color:var(--muted)}
.ground{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.ground button{font:600 12px var(--sans);padding:6px 12px;background:transparent;color:var(--fg);border:0;cursor:pointer}
.ground button[aria-pressed="true"]{background:var(--accent);color:#fff}
.ground button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.page{display:grid;grid-template-columns:296px minmax(0,1fr);gap:32px}
.side img{width:100%;max-width:296px;aspect-ratio:1;object-fit:cover;object-position:50% 12%;border-radius:50%;border:1px solid var(--line);background:#0d0e16}
.side h2{margin:14px 0 0;font-size:24px;line-height:1.25}
.side .login{font-size:20px;font-weight:300;color:var(--muted)}
.side .bio{margin:12px 0 0}
.side ul{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:4px;color:var(--muted);font-size:14px}
.readme{border:1px solid var(--line);border-radius:6px;min-width:0}
.readme .head{font:12px var(--mono);color:var(--muted);padding:10px 16px;border-bottom:1px solid var(--line)}
.md{padding:24px;max-width:846px}
.md p{margin:0 0 16px}
.md .center{text-align:center}
.md img{max-width:100%;vertical-align:middle}
.md h3{font-size:1.25em;margin:24px 0 16px}
.tablewrap{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{border:1px solid var(--line);padding:6px 13px;text-align:left}
tbody tr:nth-child(2n){background:var(--panel)}
.note{font-size:13px;color:var(--muted);border:1px dashed var(--line);border-radius:6px;padding:12px 14px;margin-top:16px}
.connect{display:flow-root}
.connect .who{float:left;width:40%;padding-right:20px;box-sizing:content-box}
.connect .cards img{width:54%;display:block;margin:0 0 4px auto;margin-left:0}
@media (max-width:860px){.page{grid-template-columns:1fr}.side{display:grid;grid-template-columns:96px 1fr;gap:4px 16px;align-items:center}.side img{width:96px}.side h2{margin:0}.side .bio,.side ul{grid-column:1/-1}.brief{grid-template-columns:1fr}.md{padding:16px}}
@media (max-width:480px){.connect .who{width:36%;padding-right:12px}.connect .cards img{width:58%}}
</style>
<div class="wrap">
  <header class="brief">
    <div>
      <div class="eyebrow">${esc(d.status)}</div>
      <h1>${esc(d.name)}</h1>
      <p>${esc(d.pitch)}</p>
    </div>
    <div class="meta">
      <ul class="swatches">${swatches}</ul>
      <div class="fonts">${esc(d.fonts)}</div>
      <div class="ground" role="group" aria-label="GitHub background">
        <button id="g-dark" type="button" aria-pressed="false">GitHub dark</button>
        <button id="g-light" type="button" aria-pressed="false">GitHub light</button>
      </div>
    </div>
  </header>
  <div class="page">
    <aside class="side">
      <img src="avatar.png" alt="stonelotus avatar">
      <h2>${esc(profile.fullName)}<div class="login">${esc(profile.handle)}</div></h2>
      <p class="bio">Builder · DevOps · Engineer. Founder of <a href="${esc(profile.companyUrl)}">EndSpec</a>.</p>
      <ul><li>EndSpec</li><li><a href="${L.linkedin.url}">LinkedIn</a></li><li>${esc(L.email.handle)}</li></ul>
    </aside>
    <main class="readme">
      <div class="head">stonelotus / README.md</div>
      <article class="md">
${body}
      </article>
    </main>
  </div>
</div>
<script>
(function(){
  var r=document.documentElement, d=document.getElementById('g-dark'), l=document.getElementById('g-light');
  function cur(){var t=r.getAttribute('data-theme'); if(t) return t; return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  function sync(){var c=cur(); d.setAttribute('aria-pressed', String(c==='dark')); l.setAttribute('aria-pressed', String(c==='light'));}
  d.addEventListener('click',function(){r.setAttribute('data-theme','dark');sync();});
  l.addEventListener('click',function(){r.setAttribute('data-theme','light');sync();});
  sync();
})();
</script>
`;
writeFileSync(join(out, "index.html"), html);
writeFileSync(join(out, "files.json"), JSON.stringify(files, null, 1));
console.log("wrote", join(out, "index.html"), Object.keys(files).length, "files");
