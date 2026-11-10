#!/usr/bin/env node
// Screenshot a local HTML page at given widths after it settles: node tools/shot-page.mjs page.html out-prefix [1280,400] [dark|light]
import { chromium } from "playwright-core";
import { readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
const [file, prefix, ws = "1280,400", scheme = "dark"] = process.argv.slice(2);
const base = join(homedir(), ".cache", "ms-playwright");
const exe = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse().map((d) => join(base, d, "chrome-linux64", "chrome")).find(existsSync);
const b = await chromium.launch({ executablePath: exe });
for (const w of ws.split(",").map(Number)) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
  await p.goto(pathToFileURL(resolve(file)).href);
  await p.waitForTimeout(300);
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await p.setViewportSize({ width: w, height: Math.min(h, 7000) });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `${prefix}-${w}.png` });
  console.log(`${w}px h=${h}${overflow ? " HORIZONTAL OVERFLOW" : ""} -> ${prefix}-${w}.png`);
}
await b.close();
