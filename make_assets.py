#!/usr/bin/env python3
"""
Generates the animated SVGs for the GitHub profile README.

  python make_assets.py                 -> stylized placeholder face
  python make_assets.py my_photo.jpg    -> YOUR face drawn by bits

Outputs (into ./assets):
  hero.svg        binary rain banner with animated gradient title
  bits-face.svg   a face drawn by 0s and 1s, looping
Requires: pip install pillow  (only needed when you pass a photo)
"""
import math
import os
import random
import sys

random.seed(7)
OUT = "assets"
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- hero ----
def make_hero():
    W, H = 1200, 360
    cols = 60
    step = W / cols
    rain = []
    for i in range(cols):
        x = i * step + step / 2
        dur = random.uniform(5, 11)
        delay = random.uniform(0, 8)
        bits = "".join(random.choice("01") for _ in range(random.randint(8, 16)))
        spans = []
        for j, b in enumerate(bits):
            spans.append(f'<tspan x="{x:.1f}" dy="{14 if j else 0}">{b}</tspan>')
        rain.append(
            f'<text class="rain" style="animation-duration:{dur:.1f}s;'
            f'animation-delay:-{delay:.1f}s" y="-200" font-size="13">{"".join(spans)}</text>'
        )
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0b0b10"/>
  </linearGradient>
  <linearGradient id="title" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ff375f"><animate attributeName="stop-color" values="#ff375f;#bf5af2;#0a84ff;#30d158;#ff375f" dur="8s" repeatCount="indefinite"/></stop>
    <stop offset="0.5" stop-color="#bf5af2"><animate attributeName="stop-color" values="#bf5af2;#0a84ff;#30d158;#ff375f;#bf5af2" dur="8s" repeatCount="indefinite"/></stop>
    <stop offset="1" stop-color="#0a84ff"><animate attributeName="stop-color" values="#0a84ff;#30d158;#ff375f;#bf5af2;#0a84ff" dur="8s" repeatCount="indefinite"/></stop>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#0a84ff" stop-opacity="0.28"/><stop offset="1" stop-color="#0a84ff" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.5" stop-color="#000" stop-opacity="0.0"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/>
  </linearGradient>
  <style>
    .rain {{ font-family: "SF Mono", Menlo, Consolas, monospace; fill: #30d158; opacity: .55;
             animation: fall linear infinite; }}
    @keyframes fall {{ from {{ transform: translateY(0); }} to {{ transform: translateY({H + 420}px); }} }}
    .name {{ font-family: -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
             font-weight: 700; letter-spacing: -2px; }}
    .sub  {{ font-family: -apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
             font-weight: 400; letter-spacing: 6px; fill: #86868b; }}
    .pulse {{ animation: pulse 4s ease-in-out infinite; transform-origin: 600px 170px; }}
    @keyframes pulse {{ 0%,100% {{ transform: scale(1); opacity: .8; }} 50% {{ transform: scale(1.12); opacity: 1; }} }}
    .rise {{ animation: rise 1.4s cubic-bezier(.2,.8,.2,1) both; }}
    @keyframes rise {{ from {{ opacity: 0; transform: translateY(24px); filter: blur(8px); }} to {{ opacity: 1; transform: none; filter: none; }} }}
  </style>
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
<g>{"".join(rain)}</g>
<rect width="{W}" height="{H}" fill="url(#fade)"/>
<ellipse class="pulse" cx="600" cy="170" rx="420" ry="150" fill="url(#glow)"/>
<text class="name rise" x="600" y="185" text-anchor="middle" font-size="96" fill="url(#title)">Prithvi Vinay</text>
<text class="sub rise" style="animation-delay:.35s" x="600" y="240" text-anchor="middle" font-size="18">BUILDER  /  ENGINEER  /  PRODUCT THINKER</text>
</svg>'''
    open(os.path.join(OUT, "hero.svg"), "w").write(svg)


# ----------------------------------------------------------- bit face ----
N = 56  # grid size


def procedural_face():
    """Return N x N brightness grid (0..1) of a stylized face."""
    g = [[0.0] * N for _ in range(N)]
    cx, cy = N / 2, N / 2 + 1

    def put(x, y, v):
        if 0 <= x < N and 0 <= y < N:
            g[y][x] = max(g[y][x], v)

    for y in range(N):
        for x in range(N):
            # head ellipse with soft edge
            d = ((x - cx) / 17.5) ** 2 + ((y - cy) / 22) ** 2
            if d < 1:
                shade = 0.55 + 0.25 * (1 - d) + 0.12 * math.sin(x / 3.0)
                # light from the upper left
                shade += 0.12 * ((cx - x) / 20) - 0.05 * ((y - cy) / 22)
                put(x, y, max(0.3, min(0.95, shade)))
            # neck and shoulders
            if cy + 17 < y < N and abs(x - cx) < 7 + max(0, (y - (cy + 24)) * 1.6):
                put(x, y, 0.42)
    # hair cap
    for y in range(int(cy - 24), int(cy - 8)):
        for x in range(N):
            d = ((x - cx) / 19.5) ** 2 + ((y - (cy - 6)) / 19) ** 2
            if d < 1 and y < cy - 10 + 3 * math.sin(x / 2.5):
                put(x, y, 1.0)
    # eyes, brows, nose, mouth carved out as dark (0) pixels
    def carve(x0, y0, w, h, v=0.0):
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                if 0 <= x < N and 0 <= y < N:
                    g[y][x] = v
    ex = 9
    for s in (-1, 1):
        carve(int(cx + s * ex - 3), int(cy - 6), 6, 3)           # eyes
        carve(int(cx + s * ex - 4), int(cy - 11), 8, 1, 0.05)    # brows
    carve(int(cx - 1), int(cy - 2), 2, 7, 0.2)                    # nose
    for x in range(-7, 8):                                        # smile
        y = int(cy + 11 + 0.04 * x * x)
        carve(int(cx + x), y, 1, 2, 0.0)
    return g


def photo_face(path):
    from PIL import Image, ImageOps, ImageFilter
    im = Image.open(path).convert("L")
    im = ImageOps.fit(im, (N, N), Image.LANCZOS, centering=(0.5, 0.4))
    im = ImageOps.autocontrast(im.filter(ImageFilter.SMOOTH), cutoff=2)
    px = im.load()
    return [[px[x, y] / 255 for x in range(N)] for y in range(N)]


def make_face(photo=None):
    grid = photo_face(photo) if photo else procedural_face()
    cell = 9
    W = H = N * cell
    dur = 12.0
    out = []
    for y in range(N):
        for x in range(N):
            v = grid[y][x]
            if v < 0.12:
                continue
            ch = "1" if v > 0.5 else "0"
            op = 0.25 + 0.75 * v
            # sweep from the top down with a little randomness, like a printer head
            delay = y * 0.075 + random.uniform(0, 0.5)
            # brightest pixels get a hot accent colour
            color = "#f5f5f7" if v > 0.78 else ("#0a84ff" if v > 0.5 else "#30d158")
            out.append(
                f'<text x="{x * cell + cell / 2:.1f}" y="{y * cell + cell:.1f}" fill="{color}" '
                f'style="--o:{op:.2f};animation-delay:{delay:.2f}s">{ch}</text>'
            )
    scan_dur = N * 0.075
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <radialGradient id="vig" cx="0.5" cy="0.5" r="0.7">
    <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="1"/>
  </radialGradient>
  <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0a84ff" stop-opacity="0"/>
    <stop offset="0.9" stop-color="#0a84ff" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#5ac8fa" stop-opacity="0.9"/>
  </linearGradient>
  <style>
    text {{ font-family: "SF Mono", Menlo, Consolas, monospace; font-size: {cell + 1}px; text-anchor: middle;
            opacity: var(--o); animation: draw {dur}s ease-in-out infinite both; }}
    @keyframes draw {{
      0%   {{ opacity: 0; transform: scale(2.2); }}
      3%   {{ opacity: 1; transform: scale(1); }}
      6%   {{ opacity: var(--o); }}
      80%  {{ opacity: var(--o); }}
      92%  {{ opacity: 0; }}
      100% {{ opacity: 0; }}
    }}
    .bar {{ animation: sweep {dur}s linear infinite; }}
    @keyframes sweep {{
      0% {{ transform: translateY(-40px); opacity: 1; }}
      {round(scan_dur / dur * 100 + 2, 1)}% {{ transform: translateY({H}px); opacity: 1; }}
      {round(scan_dur / dur * 100 + 3, 1)}%, 100% {{ transform: translateY({H}px); opacity: 0; }}
    }}
  </style>
</defs>
<rect width="{W}" height="{H}" rx="40" fill="#000"/>
<g>{"".join(out)}</g>
<rect class="bar" width="{W}" height="40" fill="url(#scan)"/>
<rect width="{W}" height="{H}" rx="40" fill="url(#vig)"/>
<rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="39" fill="none" stroke="#2c2c2e" stroke-width="2"/>
</svg>'''
    open(os.path.join(OUT, "bits-face.svg"), "w").write(svg)


if __name__ == "__main__":
    make_hero()
    make_face(sys.argv[1] if len(sys.argv) > 1 else None)
    print("wrote assets/hero.svg and assets/bits-face.svg")
