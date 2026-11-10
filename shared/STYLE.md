# Profile SVG style contract

Every SVG in this repo follows this file. It is the shared contract between the
agents that build them in parallel, so they read as one system on the page.

## Where it renders

GitHub shows each file through `<img>` in the profile README, on `#0d1117` (dark)
or `#ffffff` (light) page backgrounds, scaled to the README column (~830–1012 px
wide on desktop, ~360 px on phones). Inside `<img>`:

- **no JavaScript, no network.** Nothing external loads: fonts, images and icons
  are all inline (base64 data URIs or inline paths). No `<script>`, no `on*=`,
  no `@import`, no `http(s)://` hrefs (the xmlns URLs are fine), no WebP.
- **links inside the SVG are not clickable.** Clickable things are separate
  images wrapped in `<a>` in the README.
- CSS animation (`@keyframes`) and SMIL (`<animate>`, `<animateTransform>`,
  `<animateMotion>`, `<set>`) both run. Media queries run, including
  `prefers-reduced-motion`.

## Canvas

- `viewBox` width is **1200** for full-width files so they stack flush in the
  README. Use `width="1200" height="H"` plus the viewBox; the README sets the
  width to 100%.
- The background is transparent outside the cards. Cards have their own
  fill, so a file looks right on both GitHub dark and light pages.
- Readability floor: the image renders at ~0.7× on desktop, so **no text under
  15 viewBox px**. Body text is 17–20, labels 15–16, headlines 40+.

## Tokens

| token | value | use |
|---|---|---|
| bg | `#0d0e16` | card fill base |
| surface | `#141626` | inner panels, chips |
| line | `#262a40` | inner hairlines, separators |
| text | `#e8e9f3` | primary text |
| muted | `#9a9db5` | secondary text |
| dim | `#5d6180` | tertiary text, ticks |
| cyan | `#22d3ee` | aurora 1 |
| violet | `#a78bfa` | aurora 2 |
| pink | `#f472b6` | aurora 3 |
| gold | `#f5c84c` | ID-badge chip and metal accents only |
| rec | `#ff4d5e` | REC dot only |

**Aurora ramp:** a linearGradient cyan → violet → pink. It is used for the gradient
hairline borders, the hero name, and the occasional highlight. It is **not** a
wash behind everything: most of each card is calm `bg` and `surface`.

## Card recipe ("midnight glass")

1. A rounded rect, `rx="22"`, filled `bg`. Optionally overlay a very faint radial
   glow in one corner (cyan or violet, opacity ≤ 0.10).
2. **Dot texture.** A `<pattern>` with an 18×18 cell and one circle of r=0.9
   filled `#ffffff` at opacity 0.045, clipped to the card.
3. **Gradient hairline border.** The same rect again, `fill="none"`,
   `stroke="url(#<prefix>-aurora)"`, `stroke-width="1.25"`, stroke-opacity ~0.6.
4. Padding is 40 px inside cards. Small labels sit above headings.

## Typography

Fonts are embedded. Paste **only the faces you use** from `shared/fonts.css`
into your `<style>`. Each face is about 16–22 KB.

| family | weight | use |
|---|---|---|
| `'Brico Display'` | 800 | headlines and the name |
| `'Brico'` | 500 | body text and captions |
| `'JBM'` | 500 / 700 | small labels, code, numbers, the URL bar, filenames |

The subset is printable ASCII plus `— – · • … ’ ‘ “ ” → ← ↗ ↑ ↓ ★ ✦ ✓ × ° © ® ™`.
Any other character will fall back to a system font, so don't use it.

Mono labels are lowercase or sentence case, letter-spacing ≤ 0.06em. **Not** shouty
all-caps chrome everywhere: at most one all-caps eyebrow per card.

## Brand icons

`shared/icons.json` maps a slug to `{title, hex, path}`. Each path is in a 24×24
viewBox (Simple Icons, CC0). Use them as
`<path transform="translate(x y) scale(s)" d="…" fill="…"/>`, or put each one
once in `<defs>` as a `<symbol viewBox="0 0 24 24">` and `<use>` it.
Brand colours that disappear on the dark card (`#000000 #181717 #191919 #242424 #143055 #005571 #003B57`)
render as `text` (`#e8e9f3`) instead. LinkedIn is not in Simple Icons, so draw
it yourself: a rounded square with "in".

## Animation rules (these keep it working on GitHub)

1. **The static state is the finished card.** Element base attributes and styles
   show the end state. Entrance animations animate **from** hidden **to** that
   base: CSS `animation: x .8s <delay> both` with a `from{}` keyframe only. With
   animation stripped, the card still looks complete.
2. **SMIL timelines start at `begin="0s"`.** Express delays through `keyTimes`
   inside one `dur` (e.g. `dur="4s" keyTimes="0;0.35;0.5;1"`), not through
   `begin="2s"` offsets or event or `indefinite` begins. Loops use
   `repeatCount="indefinite"`. Discrete frame switching uses `calcMode="discrete"`.
3. **Loops are seamless.** The first and last keyframe values are equal unless
   a fade hides the seam.
4. **Namespace every id and class** with the file prefix: `hero-`, `al-`
   (about-life), `st-` (stack), `id-` (id-dashboard), `cn-` (connect). Gradients,
   patterns, clipPaths, filters and symbols included.
5. **Reduced motion.** Add `@media (prefers-reduced-motion: reduce)` that sets
   `animation: none` on everything. CSS cannot stop SMIL, so for large SMIL motion
   (orbits, carousels, frame swaps) give the animated group a class you hide
   under reduced motion and show a static twin instead.
6. Motion is purposeful and calm. Easing is `cubic-bezier(.2,.7,.2,1)` for
   entrances. Nothing strobes, and blinking is limited to the REC dot and the
   cursor.
7. Filters (blur and glow) are expensive in `<img>`. Use a few small ones, and
   never animate a blurred element's geometry every frame across the whole card.

## Accessibility

Open each file with
`<svg … role="img" aria-labelledby="<prefix>-title <prefix>-desc">`
followed by `<title id="<prefix>-title">` and `<desc id="<prefix>-desc">`
(one plain sentence each).

## Size budgets

hero ≤ 900 KB · other files ≤ 450 KB · link cards ≤ 120 KB each (fonts dominate;
subset to the faces you use).

## Verify before you hand over

```bash
node tools/render-check.mjs <file>.svg --times 0,0.5,1,2,3,4,6 --width 1000
```

Then **Read** `_check/<name>/sheet.png`. Fix anything that is clipped,
overlapping, illegible, blank at t=0 for too long, or broken in the
"no animation" frame. Also check `--width 420` (phone). The run must print
`lint ok`.
