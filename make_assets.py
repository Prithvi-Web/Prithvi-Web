#!/usr/bin/env python3
"""
Generates the glitching hacker hero banner.

  python make_assets.py

Output: assets/hero.svg
"""
import os
import random
import sys

random.seed(11)
OUT = "assets"
os.makedirs(OUT, exist_ok=True)

MONO = '"SF Mono", "JetBrains Mono", Menlo, Consolas, "Courier New", monospace'
GREEN, DIM, HOT = "#30d158", "#0b7a32", "#eafff0"


# ---------------------------------------------------------------- hero ----
def make_hero():
    W, H = 1200, 380
    cols = 72
    step = W / cols
    rain = []
    for i in range(cols):
        x = i * step + step / 2
        dur = random.uniform(4.5, 10)
        delay = random.uniform(0, 9)
        bits = [random.choice("01") for _ in range(random.randint(9, 18))]
        spans = []
        for j, b in enumerate(bits):
            fill = f' fill="{HOT}"' if j == len(bits) - 1 else ""  # bright head of each stream
            spans.append(f'<tspan x="{x:.1f}" dy="{14 if j else 0}"{fill}>{b}</tspan>')
        rain.append(
            f'<text class="rain" style="animation-duration:{dur:.1f}s;animation-delay:-{delay:.1f}s" '
            f'y="-240" font-size="13">{"".join(spans)}</text>'
        )
    title = "PRITHVI VINAY"
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.2" fill="#000" opacity=".4"/></pattern>
  <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".9"/></radialGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient>
  <filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="type"><rect class="typer" x="316" y="226" height="40" width="590"/></clipPath>
  <style>
    text {{ font-family: {MONO}; }}
    .rain {{ fill: {GREEN}; opacity: .5; animation: fall linear infinite; }}
    @keyframes fall {{ from {{ transform: translateY(0); }} to {{ transform: translateY({H + 460}px); }} }}
    .gt {{ font-size: 84px; font-weight: 800; letter-spacing: 6px; text-anchor: middle; transform-box: fill-box; transform-origin: center; }}
    .gr {{ fill: #ff2d55; animation: g1 4.2s steps(1) infinite; }}
    .gc {{ fill: #00e5ff; animation: g2 4.2s steps(1) infinite; }}
    .gm {{ fill: {HOT}; animation: g3 4.2s steps(1) infinite; }}
    @keyframes g1 {{ 0%,88%,100% {{ transform: translate(0,0); }} 89% {{ transform: translate(-9px,2px); }} 91% {{ transform: translate(7px,-3px); }} 94% {{ transform: translate(-4px,0); }} }}
    @keyframes g2 {{ 0%,88%,100% {{ transform: translate(0,0); }} 89% {{ transform: translate(9px,-2px); }} 91% {{ transform: translate(-7px,3px); }} 94% {{ transform: translate(4px,0); }} }}
    @keyframes g3 {{ 0%,88%,100% {{ transform: none; }} 90% {{ transform: skewX(-12deg) translateX(8px); }} 92% {{ transform: skewX(8deg); }} 93% {{ transform: none; }} }}
    .cmd {{ font-size: 24px; fill: {GREEN}; letter-spacing: 1px; }}
    .typer {{ animation: typing 7s steps(44) infinite; }}
    @keyframes typing {{ 0% {{ width: 0; }} 40%,88% {{ width: 590px; }} 100% {{ width: 0; }} }}
    .hud {{ font-size: 12px; fill: {GREEN}; letter-spacing: 2px; }}
    .blink {{ animation: bl 1s steps(1) infinite; }}
    @keyframes bl {{ 50% {{ opacity: 0; }} }}
    .flick {{ animation: fl 5s steps(1) infinite; }}
    @keyframes fl {{ 0%,41%,43%,100% {{ opacity: 0; }} 42% {{ opacity: .06; }} 70% {{ opacity: .03; }} }}
    .bar {{ animation: sweep 6s linear infinite; }}
    @keyframes sweep {{ from {{ transform: translateY(-40px); }} to {{ transform: translateY({H + 40}px); }} }}
  </style>
</defs>
<rect width="{W}" height="{H}" fill="#000"/>
<g>{"".join(rain)}</g>
<rect width="{W}" height="{H}" fill="url(#fade)"/>
<g filter="url(#glow)">
  <text class="gt gr" x="600" y="190">{title}</text>
  <text class="gt gc" x="600" y="190">{title}</text>
  <text class="gt gm" x="600" y="190">{title}</text>
</g>
<g clip-path="url(#type)"><text class="cmd" x="320" y="252">root@vinay:~# whoami // builder, engineer</text></g>
<text class="hud" x="28" y="34"><tspan class="blink">&#9679;</tspan> SYSTEM ONLINE</text>
<text class="hud" x="{W - 28}" y="34" text-anchor="end">CONNECTION: ENCRYPTED // AES-256</text>
<text class="hud" x="28" y="{H - 22}">NODE 0x7F // UPLINK STABLE</text>
<text class="hud" x="{W - 28}" y="{H - 22}" text-anchor="end">TRACE: <tspan fill="#ff453a">NOT FOUND</tspan></text>
<rect class="bar" width="{W}" height="36" fill="{GREEN}" opacity=".07"/>
<rect width="{W}" height="{H}" fill="url(#sl)"/>
<rect class="flick" width="{W}" height="{H}" fill="{GREEN}"/>
<rect width="{W}" height="{H}" fill="url(#vig)"/>
<rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" fill="none" stroke="#0f3d1c"/>
</svg>'''
    open(os.path.join(OUT, "hero.svg"), "w").write(svg)


if __name__ == "__main__":
    make_hero()
    print("wrote assets/hero.svg")
