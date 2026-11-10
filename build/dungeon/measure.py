# Dumps per-glyph advances (em fractions) for the embedded fonts to build/dungeon/.textwidths.json
import re, base64, json, io, sys
from fontTools.ttLib import TTFont
css = open('shared/fonts-mq.css').read()
out = {}
for m in re.finditer(r"font-family:'([^']+)';font-weight:(\d+);font-style:normal;src:url\(data:font/woff2;base64,([A-Za-z0-9+/=]+)\)", css):
    fam, w, b = m.groups()
    f = TTFont(io.BytesIO(base64.b64decode(b)))
    upm = f['head'].unitsPerEm; cmap = f.getBestCmap(); hm = f['hmtx']
    out[f'{fam}-{w}'] = {chr(c): hm[g][0] / upm for c, g in cmap.items() if c < 0x3000}
json.dump(out, open('build/dungeon/.textwidths.json', 'w'))
print({k: len(v) for k, v in out.items()})
