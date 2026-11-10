# Duotone-tints the MainQuest wax seals so the flagship is gold and every side quest shares one muted wax.
from PIL import Image
import os
def lut(stops):
    out = []
    for i in range(256):
        t = i / 255
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            if t <= b:
                u = (t - a) / (b - a); out.append(tuple(round(ca[k] + (cb[k] - ca[k]) * u) for k in range(3))); break
        else: out.append(stops[-1][1])
    return out
gold = lut([(0, (30, 20, 6)), (.55, (160, 110, 36)), (1, (255, 226, 140))])
wax = lut([(0, (26, 21, 16)), (.6, (96, 72, 40)), (1, (170, 140, 96))])
def tint(src, dst, L, boost=1.0):
    im = Image.open(src).convert("RGBA"); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            l = min(255, int((0.3 * r + 0.59 * g + 0.11 * b) * boost))
            c = L[l]; px[x, y] = (c[0], c[1], c[2], a)
    im.save(dst)
for n in ["icon-roadmap", "icon-boss-battles", "icon-inventory", "icon-class-system", "icon-achievements"]:
    tint(f"assets/{n}.png", f"build/dungeon/.seals/{n}.png", wax, 1.5)
tint("assets/icon-quest-system.png", "build/dungeon/.seals/icon-quest-system.png", gold, 2.2)
