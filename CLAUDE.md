# stonelotus/stonelotus: GitHub profile README

An animated profile made of self-contained SVGs. GitHub shows them through `<img>`, so
nothing inside them can run JavaScript or load anything from the network.

The direction is **Torchlit Dungeon**, MainQuest's landing-page seam: a medieval
stone keep for the world, and a cyan System HUD for the interface.

## Rules

- `shared/DUNGEON.md` is the design contract: tokens, type, recipes, the seam rule
  and copy voice. `shared/STYLE.md` still governs the GitHub/`<img>` constraints,
  animation rules ("static state = finished card"), id prefixes, reduced motion
  and verification. Its midnight-glass look is retired.
- Never hand-edit a generated SVG. The generators are `build/dungeon/{hero,quests,about,stack,connect}.mjs`
  (shared helpers live in `build/dungeon/lib.mjs`), plus `scripts/build-dashboard.mjs`
  for `id-dashboard.svg`. Edit the generator and re-run it.
- Content lives in `data/profile.json`. Stats live in `data/stats.json`; the daily
  workflow refreshes it. Fields that depend on private repos only update when the
  `PROFILE_TOKEN` secret exists; without it they are kept, never shrunk.
- Links inside an `<img>` SVG are not clickable, so every clickable thing is its own
  image wrapped in `<a>` in README.md (see the connect cards), or a markdown line.
- Fonts: `tools/build_fonts_mq.py` (Cinzel, EB Garamond, Rajdhani, …) and
  `tools/build_fonts.py` (JetBrains Mono), both run with `.venv/bin/python`. The subset
  is ASCII plus a few symbols, so add any new glyphs to `TEXT` in those scripts.
- Character art: generated PNGs are keyed with `tools/chroma_key.py`. Raw generations,
  the source photo and the archived Midnight Glass build live in `_source/`, which is
  gitignored and never committed.
- The emblems, wax seals and backgrounds in `assets/` are MainQuest's own art and are
  converted from WebP to PNG or JPEG. GitHub images must be PNG or JPEG.

## Lessons from the impeccable critique (2026-11-10, 21/32 before fixes)

- The text floor is **18 viewBox px**. Every file is 1200 wide and renders at ~0.7× in the
  846 px README column (~0.3× on phones), so 15 px rendered at 10.6 px.
- Ambient flicker and bob belong in CSS `@keyframes`, because CSS cannot stop SMIL under
  `prefers-reduced-motion`. Never animate an element that has a filter on it.
- The still frame at t=0 must already read. Nothing important should arrive late.
- Use plain-language status next to the game framing ("LIVE · mainquest.net",
  "PRIVATE · IN PROGRESS") so non-gamers aren't lost.
- MainQuest is the flagship. It is a gamified productivity app ("Real life, rendered as
  an RPG"), not a roadmap tool.

## Verify

- `node tools/render-check.mjs <file>.svg --times …`, then read `_check/<name>/sheet.png`.
  It must print `lint ok`.
- `node tools/preview-readme.mjs` renders the README through GitHub's markdown API with
  GitHub's CSS, in dark and light at 846 px and 390 px.
- `node tools/make-preview.mjs <direction>` builds a profile-mock page for an Artifact
  preview.
- After changing an SVG, bump its `?v=N` in README.md (GitHub caches images).
