import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
export const root = join(here, "../..");
export const A = (n) => join(root, "assets", n);
export const b64 = (p, mime) => `data:${mime};base64,${readFileSync(p).toString("base64")}`;
export const png = (n) => b64(A(n), "image/png");
export const jpg = (n) => b64(A(n), "image/jpeg");
const css = readFileSync(join(root, "shared/fonts-mq.css"), "utf8");
export function fonts(wanted) {
  return css.split("@font-face").slice(1).filter((f) => wanted.some(([fam, w]) => f.includes(`'${fam}';font-weight:${w}`))).map((f) => "@font-face" + f.trim()).join("\n");
}
export const T = { ink: "#0A0E1D", stone: "#1A1714", stone2: "#2A241E", brass: "#D9A441", candle: "#F5C542", bronze: "#7E611F", parch: "#E9DCC0", ember: "#FF8A3D", cyan: "#00E0FF" };
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export const profile = JSON.parse(readFileSync(join(root, "data/profile.json"), "utf8"));
