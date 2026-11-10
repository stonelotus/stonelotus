#!/usr/bin/env node
// Render README.md through GitHub's own markdown API (same sanitizer as github.com),
// style it with github-markdown-css, and screenshot it like a profile page.
//
//   node tools/preview-readme.mjs [--widths 846,390] [--wait 3500] [--theme dark|light|both]
//
// Needs `gh` logged in (used only to call POST /markdown). Writes _check/readme/*.png
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

const root = resolve(new URL("..", import.meta.url).pathname);
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d);
const widths = opt("widths", "846,390").split(",").map(Number);
const wait = Number(opt("wait", "3500"));
const themes = opt("theme", "both") === "both" ? ["dark", "light"] : [opt("theme")];
const out = join(root, "_check", "readme");
mkdirSync(out, { recursive: true });

const md = readFileSync(join(root, "README.md"), "utf8");
const html = execFileSync("gh", ["api", "markdown", "-f", `text=${md}`, "-f", "mode=gfm", "-f", "context=stonelotus/stonelotus"], {
  encoding: "utf8",
});
writeFileSync(join(out, "body.html"), html);

const cssDir = join(root, "_source", "css_dl");
function page(theme) {
  const css = readFileSync(join(cssDir, `gh-${theme}.css`), "utf8");
  const bg = theme === "dark" ? "#0d1117" : "#ffffff";
  return `<!doctype html><html><head><meta charset="utf-8"><base href="${pathToFileURL(root).href}/">
<style>${css}
body{margin:0;background:${bg}}
.markdown-body{box-sizing:border-box;padding:24px;background:${bg}}
.markdown-body img[align=left]{float:left;padding-right:20px}
.markdown-body img[align=right]{float:right;padding-left:20px}
</style></head><body><article class="markdown-body">${html}</article></body></html>`;
}

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = join(homedir(), ".cache", "ms-playwright");
  for (const d of readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
    const p = join(base, d, "chrome-linux64", "chrome");
    if (existsSync(p)) return p;
  }
}
const browser = await chromium.launch({ executablePath: findChrome() });
for (const theme of themes) {
  const file = join(out, `readme-${theme}.html`);
  writeFileSync(file, page(theme));
  for (const w of widths) {
    const p = await browser.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(pathToFileURL(file).href);
    // size the viewport to the whole page FIRST: a fullPage capture resizes the viewport,
    // which restarts every SVG animation at t=0 and screenshots blank entrance frames
    await p.waitForTimeout(300);
    const docH = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.setViewportSize({ width: w, height: docH });
    await p.waitForTimeout(wait);
    const broken = await p.evaluate(() =>
      [...document.images].filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute("src"))
    );
    const shot = join(out, `${theme}-${w}.png`);
    await p.screenshot({ path: shot });
    console.log(`${theme} ${w}px -> ${shot}${broken.length ? "  BROKEN: " + broken.join(", ") : ""}`);
    await p.close();
  }
}
await browser.close();
