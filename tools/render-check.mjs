#!/usr/bin/env node
// Render-check an animated SVG the way GitHub will show it, at several timestamps.
//
//   node tools/render-check.mjs hero.svg [--times 0,0.4,1,2,4] [--width 1000] [--out _check/hero]
//
// Produces, in --out:
//   t-<sec>.png        timeline frozen at <sec> (SMIL setCurrentTime + CSS currentTime), SVG opened as a document
//   static.png         every SMIL element removed and CSS animation disabled -> must still show the FINISHED card
//   reduced.png        prefers-reduced-motion: reduce, after 1.5 s of real time, loaded as <img>
//   img-live.png       loaded through <img> on GitHub's dark background after 2.5 s of real time (what visitors see)
//   sheet.png          all of the above side by side
// and prints a lint report: size, external references, scripts, event handlers.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync, readdirSync } from "node:fs";
import { resolve, basename, dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const file = resolve(args[0] ?? "");
if (!args[0] || !existsSync(file)) {
  console.error("usage: render-check.mjs <file.svg> [--times 0,1,2] [--width 1000] [--out dir]");
  process.exit(2);
}
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const times = opt("times", "0,0.5,1,2,4").split(",").map(Number);
const width = Number(opt("width", "1000"));
const out = resolve(opt("out", join(dirname(file), "_check", basename(file, ".svg"))));
mkdirSync(out, { recursive: true });

// ---------- lint ----------
const src = readFileSync(file, "utf8");
const problems = [];
const warn = [];
if (/<script/i.test(src)) problems.push("contains <script> (GitHub strips it / img mode never runs it)");
if (/\son[a-z]+\s*=/i.test(src)) problems.push("contains on* event handler attributes");
const ext = [...src.matchAll(/(?:href|src)\s*=\s*["'](https?:[^"']+)["']|url\(\s*["']?(https?:[^)"']+)/gi)]
  .map((m) => m[1] || m[2])
  .filter((u) => !u.startsWith("http://www.w3.org/"));
if (ext.length) problems.push(`external references (will NOT load in <img>): ${[...new Set(ext)].slice(0, 5).join(", ")}`);
if (/@import/i.test(src)) problems.push("contains @import (will not load)");
if (/<foreignObject/i.test(src)) warn.push("uses <foreignObject> (renders in Chrome img mode, unreliable elsewhere)");
if (/data:image\/webp/i.test(src)) problems.push("embeds WebP (use PNG/JPEG per the guide)");
if (!/prefers-reduced-motion/.test(src)) warn.push("no prefers-reduced-motion media query");
const ids = [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
if (dup.length) problems.push(`duplicate ids: ${[...new Set(dup)].slice(0, 8).join(", ")}`);
const kb = statSync(file).size / 1024;
if (kb > 1500) problems.push(`file is ${kb.toFixed(0)} KB (> 1.5 MB budget)`);

// ---------- browser ----------
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = join(homedir(), ".cache", "ms-playwright");
  const dirs = existsSync(base) ? readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
  for (const d of dirs) {
    const p = join(base, d, "chrome-linux64", "chrome");
    if (existsSync(p)) return p;
  }
  return undefined;
}
const browser = await chromium.launch({ executablePath: findChrome() });
const consoleErrors = [];
const url = pathToFileURL(file).href;

// natural size from viewBox
const vb = src.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
const aspect = vb ? Number(vb[2]) / Number(vb[1]) : 0.5;
const height = Math.ceil(width * aspect);

async function docPage(reduced = false) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: reduced ? "reduce" : "no-preference" });
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  // wrap in HTML so the svg scales to the viewport width
  await page.setContent(
    `<html><body style="margin:0;background:#0d1117">${src.replace(/<\?xml[^>]*>/, "").replace(
      /<svg\b/,
      `<svg data-rc="1" style="display:block;width:${width}px;height:auto"`
    )}</body></html>`,
    { waitUntil: "load" }
  );
  await page.evaluate(() => document.fonts && document.fonts.ready);
  return page;
}

const shots = [];
{
  const page = await docPage();
  for (const t of times) {
    await page.evaluate((t) => {
      const svg = document.querySelector("svg[data-rc]");
      svg.pauseAnimations();
      svg.setCurrentTime(t);
      for (const a of document.getAnimations()) {
        a.pause();
        a.currentTime = t * 1000;
      }
    }, t);
    await page.waitForTimeout(60);
    const p = join(out, `t-${t}.png`);
    await page.screenshot({ path: p });
    shots.push([p, `t=${t}s`]);
  }
  await page.close();
}
{
  // static: renderer ignoring animation
  const page = await docPage();
  await page.evaluate(() => {
    document.querySelectorAll("animate,animateTransform,animateMotion,set,animateColor").forEach((n) => n.remove());
    const s = document.createElement("style");
    s.textContent = "*{animation:none!important;transition:none!important}";
    document.querySelector("svg").appendChild(s);
  });
  await page.waitForTimeout(60);
  const p = join(out, "static.png");
  await page.screenshot({ path: p });
  shots.push([p, "no animation"]);
  await page.close();
}
// <img> mode = GitHub fidelity (no scripts, no network). Served from a file:// page so the img may load.
const imgHtml = join(out, "_img.html");
writeFileSync(
  imgHtml,
  `<html><body style="margin:0;background:#0d1117"><img id="i" src="${url}?v=${Date.now()}" style="display:block;width:${width}px"></body></html>`
);
async function imgShot(name, label, wait, reduced) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: reduced ? "reduce" : "no-preference" });
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  await page.goto(pathToFileURL(imgHtml).href);
  const ok = await page.evaluate(() => {
    const i = document.getElementById("i");
    return i.complete && i.naturalWidth > 0;
  });
  if (!ok) problems.push(`${name}: <img> failed to load the SVG (invalid XML?)`);
  await page.waitForTimeout(wait);
  const p = join(out, name);
  await page.screenshot({ path: p });
  shots.push([p, label]);
  await page.close();
}
await imgShot("img-live.png", "<img> live 2.5s", 2500, false);
{
  // Chromium's reduced-motion emulation does not reach SVG documents inside <img>,
  // so check it on the SVG as a document after 1.5 s of real time (SMIL keeps running there).
  const page = await docPage(true);
  await page.waitForTimeout(1500);
  const p = join(out, "reduced.png");
  await page.screenshot({ path: p });
  shots.push([p, "reduced motion (1.5s live)"]);
  await page.close();
}
await browser.close();

// contact sheet
try {
  const montageArgs = [];
  for (const [p, label] of shots) montageArgs.push("-label", label, p);
  execFileSync("magick", [
    "montage", ...montageArgs, "-tile", "2x", "-geometry", `${Math.min(width, 900)}x+6+6`,
    "-background", "#111", "-fill", "#ddd", "-pointsize", "16", join(out, "sheet.png"),
  ]);
} catch (e) {
  warn.push("contact sheet failed: " + e.message.split("\n")[0]);
}

console.log(`\n${basename(file)}  ${kb.toFixed(0)} KB  viewBox aspect ${aspect.toFixed(3)}`);
for (const p of problems) console.log("  PROBLEM  " + p);
for (const w of warn) console.log("  warn     " + w);
for (const e of [...new Set(consoleErrors)].slice(0, 10)) console.log("  console  " + e);
if (!problems.length) console.log("  lint ok");
console.log(`  shots -> ${out}/  (sheet.png = all frames)`);
process.exit(problems.length ? 1 : 0);
