# Torchlit Dungeon: the design contract

This is the chosen direction for the profile. Every SVG follows this file plus the
**GitHub/`<img>` rules, animation rules, namespacing, reduced motion, a11y and verify
steps in `shared/STYLE.md`**. STYLE.md's "midnight glass" tokens, card recipe and
fonts are retired; this file replaces them.

## The idea (MainQuest's landing-page seam)

The world is **medieval**: a torchlit stone keep, brass, candle-gold, parchment,
wax seals and carved Cinzel inscriptions. The interface is **the System**: cyan
hairlines, corner brackets, wireframe tracing and Rajdhani telemetry. Both are
present in every file, and the seam between them stays visible. Cyan is light,
not ground; the ground is always dark stone or ink.

Every section should feel like a place in the same keep: the hall (hero), the
quest board, the workshop or armory, the guild hall, the tavern door. Data
(stats, skills) appears as **System windows** that float over that world.

## Tokens (import `T` from `build/dungeon/lib.mjs`)

| token | hex | use |
|---|---|---|
| ink | `#0A0E1D` | System window fill, seam gaps |
| stone | `#1A1714` | wall and panel ground |
| stone2 | `#2A241E` | raised stone, inner panels |
| brass | `#D9A441` | carved headings, frames, rules |
| candle | `#F5C542` | light source and highlights (not body text) |
| bronze | `#7E611F` | frame strokes, seam strokes. **Never text on stone** (3.1:1) |
| parch | `#E9DCC0` | parchment surface, and primary text on stone (13:1) |
| ember | `#FF8A3D` | fire and embers only |
| cyan | `#00E0FF` | System chrome and System text only |
| (text-2) | `#B8A98C` | secondary text on stone (7.7:1) |
| (text-3) | `#9C8E73` | tertiary text on stone, 15–16px max weight (5.5:1) |
| (ink-on-parch) | `#1A1714` / `#5A4632` | text on parchment (13:1 / 6.6:1) |

**Seam rule.** Cyan and gold or brass never touch. Separate them with at least 2px
of ink, or stroke the joint with bronze. The standard System plate is a bronze
outer stroke, then an ink gap, then a cyan hairline inside. See
`build/dungeon/quests.mjs` (the `ACTIVE QUEST` pill) and `build/dungeon/hero.mjs`
(the `CLASS` box).

## Type (via `fonts([[family, weight], …])` from lib.mjs, embedding only what you use)

- `'Cinzel'` 900: section titles carved in brass, letter-spacing 4–6px. 700 is for
  card titles. Cinzel renders lowercase as small caps.
- `'Garamond'` 500/700 (EB Garamond): every sentence of body copy.
- `'Rajdhani'` 600/700: System labels, uppercase, letter-spacing ~2px, set in
  cyan or parch inside System windows.
- `'JBM'` 500/700 (from `shared/fonts.css`): numbers in System windows only, with
  tabular figures. Load it with your own small reader, the way lib.mjs reads
  fonts-mq.css.
- **No text under 18 viewBox px** (renders ~12.7px in the 846px README column). Body text is 20–22, uppercase Rajdhani labels are 18–20, and section-title Cinzel is 36–42. This floor came from the impeccable critique on 2026-11-10: phone readability was P1.

## Recipes (copy them from the existing code, don't reinvent them)

- **Stone ground:** `assets/candlelit-keep.jpg` or `assets/dungeon-gate.jpg`
  (base64 JPEG), darkened with an ink gradient or vignette so text never sits on
  busy stone. hero.mjs shows the treatment.
- **Brass frame:** the outer card has a rounded rect of rx ~14, a bronze 1.5px
  stroke, an inner 1px candle/brass hairline at about 0.35 opacity, and small
  brass diamonds at the corners or on dividers. The divider is a brass line with
  a centred diamond (quests.mjs, under each title).
- **Parchment notice:** a deckle path, a burn gradient, a static grain filter, a
  drop shadow and a wax seal. All of it is in quests.mjs.
- **System window:** an ink fill at about 0.92 opacity, the bronze → ink → cyan
  plate, cyan L-shaped corner brackets, and a Rajdhani header like
  `[ STATUS ]` in cyan with a thin cyan rule under it. A scanline sweep is
  optional.
- **Light:** torch and candle pools are radial gradients (candle to transparent)
  whose opacity flickers on irregular keyTimes, plus a few embers drifting up.
  Use at most 2–3 light sources per file and keep them subtle.
- **Wireframe tracing:** thin cyan lines draw in once (stroke-dashoffset) over a
  stone feature. This is the System rendering the world, so use it once per file
  at most.

## Assets (`assets/`)

`dungeon.png` (lantern adventurer, waist up), `dungeon-pointing.png` (adventurer
winking and pointing right, with white sticker outline), `dungeon-bust.png`
(head and shoulders for cards), `emblem-tinkerer.png` (**the user's class**),
`emblem-{sage,scholar,mage,warlord}.png`, `icon-*.png` (MainQuest wax seals),
`mq-logo.png`, and `candlelit-keep.jpg` / `dungeon-gate.jpg` (backgrounds).
All are PNG or JPEG, never WebP.

## Copy voice

Short, confident and a little playful. Game framing is welcome (quest, class,
guild, inventory, XP), but **every number and claim is real**, taken from
`data/profile.json` and `data/stats.json`. No faux-Shakespeare ("thee",
"hath"), no invented achievements, no invented rewards.

## Ids and prefixes

`td-` hero, `tq-` quests, `ta-` about-life, `ts-` stack, `tg-` id-dashboard
(guild), `tc-` connect, and `tcl-` `tce-` `tcx-` `tcg-` for the four link cards.
