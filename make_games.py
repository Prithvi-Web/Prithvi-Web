#!/usr/bin/env python3
"""
Movie-hacker animations and autoplay bit arcade, all pure SVG (no JavaScript).

  python make_games.py

Outputs (into ./assets): decode.svg, pong.svg, invaders.svg
"""
import os
import random

random.seed(5)
OUT = "assets"
os.makedirs(OUT, exist_ok=True)

MONO = '"SF Mono", "JetBrains Mono", Menlo, Consolas, "Courier New", monospace'
GREEN, DIM, HOT, RED = "#30d158", "#0b7a32", "#eafff0", "#ff453a"


def frame(w, h, css, body, rx=20):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs>
<pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.2" fill="#000" opacity=".4"/></pattern>
<radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<style>
 text{{font-family:{MONO}}} .h{{font-size:12px;fill:{GREEN};letter-spacing:1.5px}}
 .blink{{animation:bl 1s steps(1) infinite}} @keyframes bl{{50%{{opacity:0}}}}
 {css}
</style></defs>
<rect width="{w}" height="{h}" rx="{rx}" fill="#000"/>
{body}
<rect width="{w}" height="{h}" rx="{rx}" fill="url(#sl)"/>
<rect width="{w}" height="{h}" rx="{rx}" fill="url(#vig)"/>
<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="{rx - .5}" fill="none" stroke="#0f3d1c"/>
</svg>'''


# --------------------------------------------------------------- decode ----
def decode():
    msg = "WELCOME TO MY SYSTEM // I BUILD THINGS"
    W, H, fs = 1200, 150, 32
    cw = fs * 0.6
    x0 = (W - cw * len(msg)) / 2
    P = 9.0
    parts = []
    for i, ch in enumerate(msg):
        if ch == " ":
            continue
        x = x0 + i * cw + cw / 2
        d = i * 0.075
        parts.append(
            f'<g class="bits" style="animation-delay:{d:.2f}s"><text class="b1" x="{x:.1f}" y="86">0</text>'
            f'<text class="b2" x="{x:.1f}" y="86">1</text></g>'
            f'<text class="L" x="{x:.1f}" y="86" style="animation-delay:{d:.2f}s">{ch}</text>'
        )
    css = f'''
 .b1,.b2{{font-size:{fs}px;fill:{GREEN};text-anchor:middle;animation:f .16s steps(1) infinite}}
 .b2{{animation-delay:.08s}} @keyframes f{{50%{{opacity:0}}}}
 .bits{{animation:hide {P}s linear infinite both}}
 @keyframes hide{{0%,40%{{opacity:1}}41%,100%{{opacity:0}}}}
 .L{{font-size:{fs}px;font-weight:700;fill:{HOT};text-anchor:middle;opacity:0;filter:url(#glow);animation:show {P}s linear infinite both}}
 @keyframes show{{0%,40%{{opacity:0}}41%,92%{{opacity:1}}100%{{opacity:0}}}}
 .scan{{animation:sc {P}s linear infinite}} @keyframes sc{{0%{{transform:translateX(-120px);opacity:0}}5%{{opacity:.9}}50%{{transform:translateX({W}px);opacity:.9}}51%,100%{{opacity:0}}}}'''
    body = (f'<text class="h" x="24" y="30"><tspan class="blink">&#9679;</tspan> DECRYPTING PAYLOAD...</text>'
            f'<text class="h" x="{W - 24}" y="30" text-anchor="end">KEY: 0xDEADBEEF</text>'
            f'<text class="h" x="24" y="{H - 18}">[##########--------] 52%</text>'
            f'<text class="h" x="{W - 24}" y="{H - 18}" text-anchor="end">STATUS: <tspan fill="{HOT}">DECODED</tspan></text>'
            + "".join(parts) +
            f'<rect class="scan" x="0" y="52" width="4" height="52" fill="{GREEN}" filter="url(#glow)"/>')
    open(os.path.join(OUT, "decode.svg"), "w").write(frame(W, H, css, body))


# ---------------------------------------------------------------- pong ----
def pong():
    W, H = 600, 300
    tx, ty = 504, 190          # ball travel
    px, py = 48, 60            # ball start (center)
    ph = 46                    # paddle height
    css = f'''
 .bx{{animation:bx 2.3s linear infinite alternate}} .by{{animation:by 1.55s linear infinite alternate}}
 @keyframes bx{{from{{transform:translateX(0)}}to{{transform:translateX({tx}px)}}}}
 @keyframes by{{from{{transform:translateY(0)}}to{{transform:translateY({ty}px)}}}}
 .ball{{font-size:24px;font-weight:700;fill:{HOT};text-anchor:middle;filter:url(#glow)}}
 .pad{{fill:{GREEN};filter:url(#glow)}}'''
    trails = ""
    for k, op in ((3, .12), (2, .22), (1, .4)):
        d = f"{k * 0.045:.3f}s"
        trails += (f'<g class="bx" style="animation-delay:{d}"><g class="by" style="animation-delay:{d}">'
                   f'<text class="ball" x="{px}" y="{py + 8}" style="opacity:{op}">{random.choice("01")}</text></g></g>')
    body = (
        f'<text class="h" x="22" y="28">&gt; pong.exe // AUTOPLAY</text>'
        f'<text class="h" x="{W - 22}" y="28" text-anchor="end">0x7F : 0x3B</text>'
        f'<rect x="14" y="40" width="{W - 28}" height="{H - 54}" fill="none" stroke="#0f3d1c"/>'
        f'<line x1="{W / 2}" y1="44" x2="{W / 2}" y2="{H - 18}" stroke="#0f3d1c" stroke-dasharray="6 8"/>'
        # paddles track the same vertical motion as the ball, the right one a hair behind
        f'<g class="by"><rect class="pad" x="22" y="{py - ph / 2}" width="8" height="{ph}" rx="3"/></g>'
        f'<g class="by" style="animation-delay:.09s"><rect class="pad" x="{W - 30}" y="{py - ph / 2}" width="8" height="{ph}" rx="3"/></g>'
        + trails +
        f'<g class="bx"><g class="by"><text class="ball" x="{px}" y="{py + 8}">1</text></g></g>')
    open(os.path.join(OUT, "pong.svg"), "w").write(frame(W, H, css, body))


# ------------------------------------------------------------ invaders ----
def invaders():
    W, H = 600, 300
    rows, cols, sx, sy = 5, 11, 40, 28
    x0, y0 = 90, 62
    colors = [HOT, GREEN, GREEN, DIM, DIM]
    inv = []
    for r in range(rows):
        for c in range(cols):
            x, y = x0 + c * sx, y0 + r * sy
            ch = "1" if (r + c) % 2 == 0 else "0"
            boom = ""
            if random.random() < 0.22:
                boom = f' class="boom" style="animation-delay:{random.uniform(0, 8):.2f}s"'
            inv.append(f'<text{boom} x="{x}" y="{y}" fill="{colors[r]}">{ch}</text>')
    shots = "".join(
        f'<rect class="shot" style="animation-delay:{d}s" x="-1.5" y="238" width="3" height="12" fill="{HOT}" filter="url(#glow)"/>'
        for d in (0, .5, 1.0))
    css = f'''
 .fleet text{{font-size:22px;font-weight:700;text-anchor:middle}}
 .drop{{animation:drop 12s steps(4,end) infinite}} @keyframes drop{{to{{transform:translateY(40px)}}}}
 .sway{{animation:sway 3s steps(8,end) infinite alternate}} @keyframes sway{{from{{transform:translateX(-50px)}}to{{transform:translateX(50px)}}}}
 .boom{{transform-box:fill-box;transform-origin:center;animation:boom 8s linear infinite both}}
 @keyframes boom{{0%,68%{{opacity:1;transform:scale(1)}}70%{{fill:{RED};transform:scale(2)}}74%{{fill:{RED};opacity:0;transform:scale(2.8)}}90%{{opacity:0}}92%,100%{{opacity:1;transform:scale(1)}}}}
 .ship{{animation:ship 5.5s ease-in-out infinite alternate}} @keyframes ship{{from{{transform:translateX(-230px)}}to{{transform:translateX(230px)}}}}
 .shot{{animation:shot 1.5s linear infinite}} @keyframes shot{{0%{{transform:translateY(0);opacity:1}}85%{{opacity:1}}100%{{transform:translateY(-190px);opacity:0}}}}'''
    body = (
        f'<text class="h" x="22" y="28">&gt; bit_invaders.exe // AUTOPLAY</text>'
        f'<text class="h" x="{W - 22}" y="28" text-anchor="end">SCORE 004815</text>'
        f'<g class="drop"><g class="sway"><g class="fleet">{"".join(inv)}</g></g></g>'
        f'<g class="ship"><g transform="translate({W / 2},0)">{shots}'
        f'<path d="M0 252 L12 276 L-12 276 Z" fill="{GREEN}" filter="url(#glow)"/>'
        f'<rect x="-16" y="276" width="32" height="5" rx="2" fill="{GREEN}"/></g></g>'
        f'<line x1="14" y1="288" x2="{W - 14}" y2="288" stroke="#0f3d1c"/>')
    open(os.path.join(OUT, "invaders.svg"), "w").write(frame(W, H, css, body))


if __name__ == "__main__":
    decode()
    pong()
    invaders()
    print("wrote assets/decode.svg, pong.svg, invaders.svg")
