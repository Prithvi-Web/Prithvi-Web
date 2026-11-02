#!/usr/bin/env python3
"""
Draws Mount Everest out of 0s and 1s, as an animated SVG (no JavaScript).

  python make_everest.py

Skyline is built from real summit elevations and their left-to-right order as seen
from the south (Nuptse, Everest, South Col, Lhotse). It is a hand-built profile
with procedural ruggedness, not a photograph and not survey-grade terrain data.

Output: assets/everest.svg
"""
import math
import os
import random

random.seed(8848)
OUT = "assets"
os.makedirs(OUT, exist_ok=True)

MONO = '"SF Mono", "JetBrains Mono", Menlo, Consolas, "Courier New", monospace'
GREEN, DIM, HOT = "#30d158", "#0b7a32", "#eafff0"

COLS, ROWS, CELL = 100, 56, 8
W, H = COLS * CELL, ROWS * CELL
E_LO, E_HI, R_LO, R_HI = 5300, 9000, 54, 9    # metres mapped onto grid rows


def row_of(e):
    return R_LO - (e - E_LO) / (E_HI - E_LO) * (R_LO - R_HI)


def elev_of(r):
    return E_LO + (R_LO - r) / (R_LO - R_HI) * (E_HI - E_LO)


# (fraction across, elevation in m). Summits: Everest 8849, South Summit 8749,
# South Col 7906, Lhotse 8516, Lhotse Shar 8383, Nuptse 7861.
BACK = [(0, 6300), (.05, 6150), (.12, 6050), (.18, 6600), (.26, 7350), (.32, 7900), (.37, 8250),
        (.41, 8620), (.435, 8849), (.458, 8700), (.48, 8749), (.51, 8300), (.545, 7980), (.565, 7906),
        (.60, 8200), (.64, 8516), (.675, 8410), (.74, 8383), (.80, 7650), (.88, 6900), (.94, 6400), (1, 6100)]
FRONT = [(0, 6050), (.05, 6800), (.10, 7400), (.16, 7720), (.22, 7861), (.27, 7790), (.33, 7500),
         (.40, 7150), (.47, 6850), (.53, 6500), (.58, 6050), (.62, 5600), (1, 5450)]


def profile(points, amp):
    ph = [random.uniform(0, 6.28) for _ in range(3)]
    out = []
    for c in range(COLS):
        x = c / (COLS - 1)
        for i in range(len(points) - 1):
            (x0, y0), (x1, y1) = points[i], points[i + 1]
            if x0 <= x <= x1:
                e = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
                break
        n = .5 * math.sin(c * .9 + ph[0]) + .3 * math.sin(c * 2.3 + ph[1]) + .2 * math.sin(c * 5.1 + ph[2])
        out.append(min(8990, e + amp * n))
    return out


EB = profile(BACK, 70)
EF = profile(FRONT, 90)
SC = max(range(COLS), key=lambda c: EB[c])                      # Everest
LC = max(range(int(COLS * .58), int(COLS * .72)), key=lambda c: EB[c])  # Lhotse
NC = max(range(int(COLS * .08), int(COLS * .36)), key=lambda c: EF[c])  # Nuptse


def cx(c):
    return (c + .5) * CELL


def cy(e):
    return row_of(e) * CELL + CELL / 2


def build_cells():
    cells = []
    for c in range(COLS):
        slope = EB[min(c + 1, COLS - 1)] - EB[max(c - 1, 0)]
        lit = max(-1.0, min(1.0, slope / 260))
        fslope = EF[min(c + 1, COLS - 1)] - EF[max(c - 1, 0)]
        flit = max(-1.0, min(1.0, fslope / 260))
        for r in range(ROWS):
            e = elev_of(r)
            in_b, in_f = e <= EB[c], e <= EF[c]
            if not in_b and not in_f:
                continue
            if in_f:
                above_free = elev_of(r - 1) > EF[c]
                if EF[c] < 5800:                           # glacier floor in the valley
                    if random.random() > .6:
                        continue
                    b = 0.8 if random.random() < .06 else 0.3
                else:
                    b = 0.12 + 0.26 * random.random() + 0.12 * flit
                    if above_free:
                        b = 0.78                           # rim light on the Nuptse ridge
            else:
                depth = (EB[c] - e) / 1000
                gully = .5 + .5 * math.sin(c * .85 + depth * 5 + random.random() * 1.4)
                b = .62 + .30 * lit - .28 * min(depth / 1.1, 1) + .22 * (gully - .5) + (e - 6500) / 2500 * .12
                if depth < .045:
                    b = max(b, .92)                        # sunlit ridge line
                if e > 8400 and .36 <= c / COLS <= .50 and random.random() < .7:
                    b = .3                                 # dark rock of the summit pyramid
            b = max(.05, min(1, b))
            cells.append((c, r, b))
    return cells


def make():
    cells = build_cells()
    a = int((ROWS * .055 + .5) / 12 * 100) + 3
    out = []
    for c, r, b in cells:
        ch = "1" if b > .52 else "0"
        cls = "a" if b > .82 else ("b" if b > .52 else "c")
        delay = (ROWS - r) * .055 + random.uniform(0, .35)       # the mountain builds upward
        op = .25 + .75 * b
        if random.random() < .07:
            anim = (f"animation:draw 12s ease-in-out infinite both,glint {random.uniform(2.5, 6):.1f}s ease-in-out infinite;"
                    f"animation-delay:{delay:.2f}s,{random.uniform(0, 5):.1f}s")
        else:
            anim = f"animation-delay:{delay:.2f}s"
        out.append(f'<text class="{cls}" x="{cx(c):.1f}" y="{(r + 1) * CELL - 1}" style="--o:{op:.2f};{anim}">{ch}</text>')

    # stars
    stars = []
    for _ in range(90):
        c, r = random.randrange(COLS), random.randrange(4, 40)
        if elev_of(r) > max(EB[c], EF[c]) + 150:
            stars.append(f'<text class="st" x="{cx(c):.1f}" y="{(r + 1) * CELL}" style="animation-delay:{random.uniform(0, 4):.1f}s;'
                         f'animation-duration:{random.uniform(2, 5):.1f}s">{random.choice("01")}</text>')
    # moon
    moon = []
    for dy in range(-4, 5):
        for dx in range(-4, 5):
            if dx * dx + dy * dy <= 12:
                moon.append(f'<text x="{cx(12 + dx):.1f}" y="{(9 + dy + 1) * CELL}">{random.choice("01")}</text>')
    # snow plume streaming east off the summit
    sx, sy = cx(SC), cy(EB[SC])
    plume = []
    for _ in range(44):
        dx, dy = random.uniform(120, 420), random.uniform(-45, 8)
        plume.append(f'<text class="pl" x="{sx + random.uniform(-6, 10):.1f}" y="{sy + random.uniform(-4, 8):.1f}" '
                     f'style="--dx:{dx:.0f}px;--dy:{dy:.0f}px;animation-delay:{random.uniform(0, 6):.2f}s;'
                     f'animation-duration:{random.uniform(4.5, 7):.1f}s;font-size:{random.choice((8, 9, 10, 11))}px">{random.choice("01")}</text>')

    # South Col route: Base Camp, C1, C2, C3, C4 (South Col), Balcony, South Summit, Summit
    route = [(.585, 5364, "BC"), (.595, 6065, "C1"), (.60, 6400, "C2"), (.585, 7200, "C3"),
             (.565, 7906, "C4"), (.52, 8400, ""), (.48, 8749, ""), (EB.index(max(EB)) / (COLS - 1), 8849, "")]
    pts = [(f * W, cy(e), name) for f, e, name in route]
    path = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y, _ in pts)
    camps = "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.5" fill="{HOT}"/><text class="lab" x="{x + 6:.1f}" y="{y + 3:.1f}">{n}</text>'
                    for x, y, n in pts if n)

    def peak(name, elev, col, e, dy):
        x, y = cx(col), cy(e)
        return (f'<line x1="{x:.1f}" y1="{y - 6:.1f}" x2="{x:.1f}" y2="{y - dy + 14:.1f}" stroke="{GREEN}" stroke-dasharray="2 3" opacity=".8"/>'
                f'<circle class="ping" cx="{x:.1f}" cy="{y - 4:.1f}" r="3" fill="none" stroke="{HOT}"/>'
                f'<text class="pk" x="{x:.1f}" y="{y - dy:.1f}" text-anchor="middle">{name}</text>'
                f'<text class="lab" x="{x:.1f}" y="{y - dy + 13:.1f}" text-anchor="middle">{elev}</text>')

    labels = (peak("EVEREST", "8,849 m", SC, EB[SC], 44) + peak("LHOTSE", "8,516 m", LC, EB[LC], 36)
              + peak("NUPTSE", "7,861 m", NC, EF[NC], 34))
    zone = cy(8000)
    brk = f"M18 58 V18 H58 M{W - 58} 18 H{W - 18} V58 M18 {H - 58} V{H - 18} H58 M{W - 58} {H - 18} H{W - 18} V{H - 58}"

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
<pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.2" fill="#000" opacity=".4"/></pattern>
<radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".9"/></radialGradient>
<linearGradient id="scan" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{GREEN}" stop-opacity="0"/><stop offset=".9" stop-color="{GREEN}" stop-opacity=".28"/><stop offset="1" stop-color="#b6ffcb" stop-opacity=".95"/></linearGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<style>
 text{{font-family:{MONO}}}
 .bits text{{font-size:9px;text-anchor:middle;opacity:var(--o);transform-box:fill-box;transform-origin:center;animation:draw 12s ease-in-out infinite both}}
 .a{{fill:{HOT}}} .b{{fill:{GREEN}}} .c{{fill:{DIM}}}
 @keyframes draw{{0%{{opacity:0;transform:scale(2)}}3%{{opacity:1;transform:scale(1)}}6%{{opacity:var(--o)}}82%{{opacity:var(--o)}}94%{{opacity:0}}100%{{opacity:0}}}}
 @keyframes glint{{0%,86%,100%{{filter:none}}92%{{fill:#fff;filter:drop-shadow(0 0 3px #7dffa1)}}}}
 .st{{font-size:8px;fill:{GREEN};text-anchor:middle;opacity:.2;animation:tw 3s ease-in-out infinite alternate}}
 @keyframes tw{{to{{opacity:.8}}}}
 .moon text{{font-size:9px;fill:{HOT};text-anchor:middle}} .moon{{animation:mo 5s ease-in-out infinite alternate}}
 @keyframes mo{{from{{opacity:.55}}to{{opacity:1}}}}
 .pl{{fill:{HOT};text-anchor:middle;opacity:0;animation:drift 6s ease-out infinite}}
 @keyframes drift{{0%{{opacity:0;transform:translate(0,0)}}15%{{opacity:.9}}100%{{opacity:0;transform:translate(var(--dx),var(--dy))}}}}
 .h,.lab,.pk{{paint-order:stroke;stroke:#000;stroke-width:4px;stroke-linejoin:round}}
 .h{{font-size:13px;fill:{GREEN};letter-spacing:1.5px}} .lab{{font-size:11px;fill:{GREEN}}} .pk{{font-size:12px;font-weight:700;fill:{HOT};letter-spacing:1px}}
 .blink{{animation:bl 1s steps(1) infinite}} @keyframes bl{{50%{{opacity:0}}}}
 .late{{opacity:0;animation:late 12s linear infinite}}
 @keyframes late{{0%,{a}%{{opacity:0}}{a + 4}%,86%{{opacity:1}}92%,100%{{opacity:0}}}}
 .ping{{transform-box:fill-box;transform-origin:center;animation:ping 1.8s ease-out infinite}}
 @keyframes ping{{from{{transform:scale(.6);opacity:1}}to{{transform:scale(3);opacity:0}}}}
 .route{{stroke-dasharray:4 6;animation:march 1s linear infinite}} @keyframes march{{to{{stroke-dashoffset:-10}}}}
 .sw{{animation:sweep 12s linear infinite}}
 @keyframes sweep{{0%{{transform:translateY({H}px);opacity:1}}{a}%{{transform:translateY(-40px);opacity:1}}{a + 1}%,100%{{transform:translateY(-40px);opacity:0}}}}
</style></defs>
<rect width="{W}" height="{H}" rx="28" fill="#000"/>
<g>{"".join(stars)}</g>
<g class="moon" filter="url(#glow)">{"".join(moon)}</g>
<line x1="0" y1="{zone:.1f}" x2="{W}" y2="{zone:.1f}" stroke="{DIM}" stroke-dasharray="3 6"/>
<text class="lab" x="{W - 28}" y="{zone - 6:.1f}" text-anchor="end" style="fill:{DIM}">DEATH ZONE ABOVE 8,000 M</text>
<g class="bits">{"".join(out)}</g>
<g>{"".join(plume)}</g>
<g class="late"><path class="route" d="{path}" fill="none" stroke="{HOT}" stroke-width="1.2" opacity=".75"/>{camps}{labels}
<circle r="4.5" fill="{HOT}" filter="url(#glow)"><animateMotion dur="12s" repeatCount="indefinite" path="{path}" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;.34;.8;1"/></circle></g>
<path d="{brk}" stroke="{GREEN}" stroke-width="3" fill="none"/>
<text class="h" x="36" y="44">&gt; MAPPING TERRAIN<tspan class="blink">_</tspan></text>
<text class="h" x="{W - 36}" y="44" text-anchor="end">27.9881 N  86.9250 E</text>
<text class="h" x="36" y="{H - 30}">MAHALANGUR HIMAL // KHUMBU</text>
<text class="h" x="{W - 36}" y="{H - 30}" text-anchor="end">ALT 8,849 M ASL</text>
<rect class="sw" width="{W}" height="40" fill="url(#scan)"/>
<rect width="{W}" height="{H}" rx="28" fill="url(#sl)"/>
<rect width="{W}" height="{H}" rx="28" fill="url(#vig)"/>
<rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="27" fill="none" stroke="#0f3d1c" stroke-width="2"/>
</svg>'''
    open(os.path.join(OUT, "everest.svg"), "w").write(svg)
    print(f"wrote assets/everest.svg ({len(svg) // 1024} KB, {len(cells)} bits, summit col {SC}, Lhotse col {LC}, Nuptse col {NC})")


if __name__ == "__main__":
    make()
