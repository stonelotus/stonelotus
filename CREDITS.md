# Credits

- **Fonts:** Cinzel (Natanael Gama), EB Garamond (Georg Duffner, Octavio Pardo),
  Rajdhani (Indian Type Foundry) and JetBrains Mono (JetBrains). All are under the
  SIL Open Font License 1.1 and are subset and embedded as base64 woff2 inside the
  SVGs.
- **Brand icons** come from [Simple Icons](https://simpleicons.org) (CC0-1.0). The brands
  belong to their owners.
- **Emblems, wax seals and the dungeon backgrounds** are from
  [MainQuest](https://www.mainquest.net), my own product.
- **3D contribution city** is made with
  [yoshi389111/github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib).
- **Character art** was generated from my own photo with Gemini image generation, then keyed
  with `tools/chroma_key.py`.

## Rebuilding

```bash
npm install                                    # playwright-core, for the render checks
for f in hero quests about stack connect; do node build/dungeon/$f.mjs; done
node scripts/build-dashboard.mjs               # id-dashboard.svg from data/*.json
node tools/render-check.mjs hero.svg           # frames at several timestamps -> _check/
node tools/preview-readme.mjs                  # whole README through GitHub's renderer
```

GitHub caches README images. After you change an SVG, bump its `?v=N` in
README.md. Commit the SVG first and the README second.
