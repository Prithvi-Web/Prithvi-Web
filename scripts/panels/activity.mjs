// Daily commit activity for the last 13 weeks: bars grow from the baseline and
// a 7-day average draws itself across them.
//
// The heatmap panel already carries the full year, so this one zooms in rather
// than repeating it — a 52-week view of a recent starter is mostly empty space.

import {
  W, C, esc, commas, round, doc, commonDefs, baseStyle,
  starfield, kicker, odometer, sheen,
} from '../lib/theme.mjs';

const NS = 'ac';
const H = 300;
const PAD = 56;

const X0 = 104;
const X1 = 916;
const TOP = 92;
const BASE = 232;
const WINDOW = 91; // 13 weeks
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function activity({ days }) {
  const win = days.slice(-WINDOW);
  const n = win.length;
  const span = X1 - X0;
  const pitch = span / n;
  const barW = Math.max(pitch - 2.2, 2);
  const max = Math.max(...win.map((d) => d.count), 1);
  const plotH = BASE - TOP;
  const yOf = (v) => BASE - (v / max) * plotH;

  const style = [];
  const bars = win
    .map((d, i) => {
      const h = d.count > 0 ? Math.max((d.count / max) * plotH, 2) : 0;
      if (h <= 0) return '';
      return `<rect class="bar-${NS}" x="${round(X0 + i * pitch, 2)}" y="${round(BASE - h, 2)}" width="${round(
        barW,
        2
      )}" height="${round(h, 2)}" rx="${round(Math.min(barW / 2, 2.5), 2)}" fill="url(#barg-${NS})" style="animation-delay:${round(
        0.25 + i * 0.008,
        3
      )}s"><title>${esc(`${d.count} on ${d.date}`)}</title></rect>`;
    })
    .join('');

  // 7-day moving average, as an exact-length polyline so the draw can be timed.
  const avg = win.map((_, i) => {
    const from = Math.max(0, i - 6);
    const slice = win.slice(from, i + 1);
    return slice.reduce((a, d) => a + d.count, 0) / slice.length;
  });
  const pts = avg.map((v, i) => [X0 + i * pitch + barW / 2, yOf(v)]);
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const lineD = pts.map((p, i) => `${i ? 'L' : 'M'}${round(p[0], 2)} ${round(p[1], 2)}`).join(' ');
  const areaD = `${lineD} L${round(pts[n - 1][0], 2)} ${BASE} L${round(pts[0][0], 2)} ${BASE} Z`;
  const last = pts[n - 1];

  style.push(
    `@keyframes draw-${NS}{0%{stroke-dashoffset:${round(len, 1)}}100%{stroke-dashoffset:0}}` +
      // No base dashoffset: undrawn, the line is simply fully visible.
      `.line-${NS}{stroke-dasharray:${round(
        len,
        1
      )};animation:draw-${NS} 1.9s cubic-bezier(.35,.1,.3,1) both;animation-delay:.45s}`
  );

  // Guides, labelled so the scale is actually readable.
  const guides = [0.5, 1]
    .map((f) => {
      const y = BASE - f * plotH;
      return `<g class="fi-${NS}" style="animation-delay:.3s">
      <line x1="${X0}" y1="${round(y, 2)}" x2="${X1}" y2="${round(y, 2)}" stroke="#ffffff" stroke-opacity="0.06" stroke-dasharray="3 7"/>
      <text x="${X0 - 10}" y="${round(y + 4, 2)}" text-anchor="end" font-size="10.5" fill="${C.muted}">${Math.round(
        f * max
      )}</text>
    </g>`;
    })
    .join('');

  // Month ticks along the bottom. The window opens mid-month, so that leading
  // stub is dropped when the next month would collide with it.
  const candidates = [];
  let lastM = -1;
  win.forEach((d, i) => {
    const m = Number(d.date.slice(5, 7)) - 1;
    if (m === lastM) return;
    lastM = m;
    candidates.push({ m, i, x: X0 + i * pitch });
  });
  if (candidates.length > 1 && candidates[1].x - candidates[0].x < 46) candidates.shift();

  let keptX = -Infinity;
  const ticks = candidates
    .filter((c) => {
      if (c.x - keptX < 46) return false;
      keptX = c.x;
      return true;
    })
    .map(
      (c) =>
        `<text class="fi-${NS}" x="${round(c.x, 2)}" y="${BASE + 24}" font-size="11" fill="${C.muted}" style="animation-delay:${round(
          0.9 + c.i * 0.004,
          2
        )}s">${MONTHS[c.m]}</text>`
    );

  const last30 = days.slice(-30).reduce((a, d) => a + d.count, 0);
  const windowTotal = win.reduce((a, d) => a + d.count, 0);
  const activeDays = win.filter((d) => d.count > 0).length;

  const chips = [
    { value: commas(windowTotal), label: 'last 13 weeks' },
    { value: commas(last30), label: 'last 30 days' },
    { value: commas(max), label: 'best day' },
  ];
  const chipW = 126;
  const chipGap = 10;
  const chipX0 = X1 - (chips.length * chipW + (chips.length - 1) * chipGap);
  const odoDefs = [];
  const chipBody = chips
    .map((c, i) => {
      const x = chipX0 + i * (chipW + chipGap);
      const odo = odometer(NS, `c${i}`, {
        cx: x + chipW / 2,
        y: 50,
        value: c.value,
        size: 23,
        fill: C.text,
        delay: 0.35 + i * 0.11,
      });
      odoDefs.push(odo.defs);
      style.push(odo.style);
      return `<g class="fu-${NS}" style="animation-delay:${round(0.2 + i * 0.11, 2)}s">
      <rect x="${round(x, 2)}" y="24" width="${chipW}" height="52" rx="15" fill="${C.glass}" fill-opacity="${C.glassFill}" stroke="${C.glass}" stroke-opacity="${C.glassStroke}"/>
      ${odo.body}
      <text x="${round(x + chipW / 2, 2)}" y="67" text-anchor="middle" font-size="10.5" fill="${C.muted}">${esc(
        c.label
      )}</text>
    </g>`;
    })
    .join('');

  const body = `
  <g clip-path="url(#frame-${NS})">
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${starfield(NS, H, 12, 71)}
    <ellipse class="gl-${NS}" cx="500" cy="${H + 50}" rx="430" ry="140" fill="url(#glow-${NS})" opacity="0.4"/>
    ${kicker(PAD, 46, 'DAILY ACTIVITY · 13 WEEKS', { anchor: 'start' })}
    ${chipBody}
    ${guides}
    <g>${bars}</g>
    <g mask="url(#wipe-${NS})"><path d="${areaD}" fill="url(#areag-${NS})"/></g>
    <path class="line-${NS}" d="${lineD}" fill="none" stroke="${C.accent}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="ring-${NS}" cx="${round(last[0], 2)}" cy="${round(last[1], 2)}" r="4" fill="none" stroke="${C.accent}" stroke-width="1.5"/>
    <circle class="dot-${NS}" cx="${round(last[0], 2)}" cy="${round(last[1], 2)}" r="4" fill="${C.accent}"/>
    <line x1="${X0}" y1="${BASE}" x2="${X1}" y2="${BASE}" stroke="#ffffff" stroke-opacity="0.14"/>
    ${ticks.join('')}
    <text class="fi-${NS}" x="${X0}" y="${BASE + 46}" font-size="11.5" fill="${C.muted}" style="animation-delay:1.4s">${esc(
      `${activeDays} active days in the window · peak ${max} in a day · 7-day average`
    )}</text>
    ${sheen(NS, H, { dur: 10, delay: 3 })}
  </g>`;

  return doc(
    H,
    `Daily commit activity over the last 13 weeks: ${windowTotal} contributions, ${last30} in the last 30 days, peak of ${max} in a single day, ${activeDays} active days.`,
    {
      defs: `${commonDefs(NS, H)}${odoDefs.join('')}
      <linearGradient id="barg-${NS}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5fb2ff" stop-opacity="0.9"/>
        <stop offset="1" stop-color="#1857b0" stop-opacity="0.4"/>
      </linearGradient>
      <linearGradient id="areag-${NS}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.accent}" stop-opacity="0.28"/>
        <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
      </linearGradient>
      <mask id="wipe-${NS}"><rect x="${X0}" y="0" width="${span}" height="${H}" fill="#ffffff">
        <animate attributeName="width" values="0;${span}" begin="0.45s" dur="1.9s" fill="freeze" calcMode="spline" keySplines="0.35 0.1 0.3 1" keyTimes="0;1"/>
      </rect></mask>`,
      style: `${baseStyle(NS)}
      @keyframes gb-${NS}{0%{transform:scaleY(0)}100%{transform:scaleY(1)}}
      .bar-${NS}{transform-box:fill-box;transform-origin:bottom;animation:gb-${NS} .6s cubic-bezier(.25,.1,.25,1) both}
      @keyframes pd-${NS}{0%,100%{opacity:.75}50%{opacity:1}}
      .dot-${NS}{animation:fi-${NS} .4s ease-out 2.3s both,pd-${NS} 2.2s ease-in-out 2.7s infinite}
      @keyframes rp-${NS}{0%{r:4;opacity:.7}100%{r:16;opacity:0}}
      .ring-${NS}{opacity:0;animation:rp-${NS} 2.4s ease-out 2.5s infinite}
      ${style.join('')}`,
      body,
    }
  );
}
