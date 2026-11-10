#!/usr/bin/env python3
"""Key out a flat #00FF00 backdrop from generated character art.

usage: chroma_key.py OUT_W OUT.png IN.png [IN2.png ...] [--crop x0,y0,x1,y1]

Several inputs share one crop box (the union of their opaque areas, or --crop),
so animation frames stay pixel-aligned. Each output is resized to OUT_W wide
and quantized to a 256-colour palette PNG with alpha to keep base64 small.
With several inputs, OUT.png is a pattern containing {i} (frame index).
"""
import sys
import numpy as np
from PIL import Image


def key(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = g - np.maximum(r, b)              # how much greener than the other channels
    # fully transparent above 90, fully opaque below 30, soft ramp between
    alpha = np.clip(1.0 - (green - 30.0) / 60.0, 0.0, 1.0)
    # despill: clamp green on semi-transparent / edge pixels
    spill = green > 0
    g2 = np.where(spill, np.maximum(r, b) + np.minimum(green, 0) , g)
    out = np.stack([r, g2, b, alpha * 255.0], axis=-1)
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), "RGBA")


def bbox(imgs, pad=8):
    boxes = [im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox() for im in imgs]
    x0 = min(b[0] for b in boxes) - pad
    y0 = min(b[1] for b in boxes) - pad
    x1 = max(b[2] for b in boxes) + pad
    y1 = max(b[3] for b in boxes) + pad
    w, h = imgs[0].size
    return max(0, x0), max(0, y0), min(w, x1), min(h, y1)


def main():
    args = sys.argv[1:]
    crop = None
    if "--crop" in args:
        i = args.index("--crop")
        crop = tuple(int(v) for v in args[i + 1].split(","))
        del args[i:i + 2]
    out_w, out_pat, inputs = int(args[0]), args[1], args[2:]
    keyed = [key(Image.open(p)) for p in inputs]
    box = crop or bbox(keyed)
    print("crop", box)
    for i, im in enumerate(keyed):
        im = im.crop(box)
        h = round(im.height * out_w / im.width)
        im = im.resize((out_w, h), Image.LANCZOS)
        q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        path = out_pat.format(i=i) if len(inputs) > 1 else out_pat
        q.save(path, optimize=True)
        print(path, im.size)


if __name__ == "__main__":
    main()
