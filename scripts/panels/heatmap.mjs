// The real 53x7 GitHub contribution grid, rendered on black with a blue heat
// ramp. Cells arrive in a diagonal wave, then the hottest days keep breathing.

import {
  W, C, HEAT, esc, commas, round, doc, commonDefs, baseStyle,
  starfield, kicker, odometer, sheen,
} from '../lib/theme.mjs';

const NS = 'hm';
const H = 330;

const CELL = 12;
const GAP = 3;
const PITCH = CELL + GAP;
const GRID_X = 104;
const GRID_Y = 158;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function heatmap({ days, streak, best }) {
  const total = days.reduce((a, d) => a + d.count, 0);
  const active = days.filter((d) => d.count > 0).length;

  // Lay the days out in calendar columns: a new column starts every Sunday.
  const cols = [];
  let col = null;
  for (const d of days) {
    const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    if (dow === 0 || col === null) {
      col = { days: [], firstDate: d.date };
      cols.push(col);
    }
    col.days.push({ ...d, dow });
  }

  const cells = [];
  const monthLabels = [];
  let lastMonth = -1;

  cols.forEach((c, ci) => {
    const x = GRID_X + ci * PITCH;
    for (const d of c.days) {
      const y = GRID_Y + d.dow * PITCH;
      const delay = round(ci * 0.014 + d.dow * 0.03, 3);
      const hot = d.level === 4 ? ` hot-${NS}` : '';
      const stroke =
        d.level === 0
          ? ` stroke="#ffffff" stroke-opacity="0.04"`
          : ` stroke="${HEAT[d.level]}" stroke-opacity="0.35"`;
      cells.push(
        `<rect class="c-${NS}${hot}" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${HEAT[d.level]}"${stroke} style="animation-delay:${delay}s"><title>${esc(
          `${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}`
        )}</title></rect>`
      );
    }

    const m = Number(c.firstDate.slice(5, 7)) - 1;
    // Only label a month once it owns most of a column, and never twice.
    if (m !== lastMonth && Number(c.firstDate.slice(8, 10)) <= 7 && ci < cols.length - 1) {
      monthLabels.push(
        `<text class="fi-${NS}" x="${x}" y="${GRID_Y - 14}" font-size="11" fill="${C.muted}" style="animation-delay:${round(
          0.5 + ci * 0.01,
          2
        )}s">${MONTHS[m]}</text>`
      );
      lastMonth = m;
    }
  });

  const dayLabels = [
    [1, 'Mon'],
    [3, 'Wed'],
    [5, 'Fri'],
  ]
    .map(
      ([row, label]) =>
        `<text class="fi-${NS}" x="${GRID_X - 12}" y="${GRID_Y + row * PITCH + CELL - 2}" text-anchor="end" font-size="11" fill="${C.muted}" style="animation-delay:.55s">${label}</text>`
    )
    .join('');

  const gridW = cols.length * PITCH - GAP;
  const gridRight = GRID_X + gridW;

  const big = odometer(NS, 'tot', {
    cx: GRID_X,
    y: 100,
    value: commas(total),
    size: 44,
    fill: `url(#metal-${NS})`,
    delay: 0.25,
    anchor: 'start',
  });

  // Three live stat chips on the right, above the grid.
  const chips = [
    { label: 'current streak', value: `${streak.current}`, unit: streak.current === 1 ? 'day' : 'days' },
    { label: 'longest streak', value: `${streak.longest}`, unit: streak.longest === 1 ? 'day' : 'days' },
    { label: 'busiest day', value: `${best?.count ?? 0}`, unit: 'commits' },
  ];
  const chipW = 150;
  const chipGap = 12;
  const chipsTotal = chips.length * chipW + (chips.length - 1) * chipGap;
  const chipX0 = gridRight - chipsTotal;

  const chipDefs = [];
  const chipStyle = [];
  const chipBody = chips
    .map((c, i) => {
      const x = chipX0 + i * (chipW + chipGap);
      const odo = odometer(NS, `chip${i}`, {
        cx: x + chipW / 2,
        y: 88,
        value: c.value,
        size: 26,
        fill: C.text,
        delay: 0.5 + i * 0.12,
      });
      chipDefs.push(odo.defs);
      chipStyle.push(odo.style);
      return `<g class="fu-${NS}" style="animation-delay:${round(0.35 + i * 0.12, 2)}s">
      <rect x="${x}" y="${58}" width="${chipW}" height="60" rx="16" fill="${C.glass}" fill-opacity="${C.glassFill}" stroke="${C.glass}" stroke-opacity="${C.glassStroke}"/>
      ${odo.body}
      <text x="${x + chipW / 2}" y="${108}" text-anchor="middle" font-size="11" fill="${C.muted}">${esc(
        `${c.label} · ${c.unit}`
      )}</text>
    </g>`;
    })
    .join('');

  const legend = HEAT.map(
    (fill, i) =>
      `<rect x="${gridRight - 118 + i * 16}" y="${292}" width="12" height="12" rx="3" fill="${fill}"${
        i === 0 ? ` stroke="#ffffff" stroke-opacity="0.04"` : ''
      }/>`
  ).join('');

  const body = `
  <g clip-path="url(#frame-${NS})">
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${starfield(NS, H, 14, 21)}
    <ellipse class="gl-${NS}" cx="500" cy="${H + 60}" rx="430" ry="150" fill="url(#glow-${NS})" opacity="0.5"/>

    ${kicker(GRID_X, 46, 'CONTRIBUTION GRAPH', { anchor: 'start' })}
    ${big.body}
    <text class="fi-${NS}" x="${GRID_X + big.width + 12}" y="100" font-size="15" fill="${C.muted}" style="animation-delay:1.1s">contributions in the last year</text>
    ${chipBody}

    <g>${monthLabels.join('')}</g>
    ${dayLabels}
    <g>${cells.join('')}</g>

    <text class="fi-${NS}" x="${GRID_X}" y="${302}" font-size="12" fill="${C.muted}" style="animation-delay:1.3s">${esc(
      `${active} active days · ${days.length} tracked`
    )}</text>
    <text class="fi-${NS}" x="${gridRight - 130}" y="${302}" text-anchor="end" font-size="11" fill="${C.muted}" style="animation-delay:1.3s">Less</text>
    <g class="fi-${NS}" style="animation-delay:1.3s">${legend}</g>
    <text class="fi-${NS}" x="${gridRight + 6}" y="${302}" font-size="11" fill="${C.muted}" style="animation-delay:1.3s">More</text>

    <g clip-path="url(#grid-${NS})">${sheen(NS, H, { dur: 9, delay: 2.2, width: 90 })}</g>
  </g>`;

  const style = `
    ${baseStyle(NS)}
    @keyframes pop-${NS}{0%{opacity:0;transform:scale(.35)}70%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
    .c-${NS}{transform-box:fill-box;transform-origin:center;animation:pop-${NS} .5s cubic-bezier(.34,1.4,.64,1) both}
    @keyframes breathe-${NS}{0%,100%{opacity:1}50%{opacity:.72}}
    .hot-${NS}{animation:pop-${NS} .5s cubic-bezier(.34,1.4,.64,1) both,breathe-${NS} 3.4s ease-in-out 1.6s infinite}
    ${big.style}${chipStyle.join('')}
  `;

  const defs = `${commonDefs(NS, H)}${big.defs}${chipDefs.join('')}
    <clipPath id="grid-${NS}"><rect x="${GRID_X}" y="${GRID_Y}" width="${gridW}" height="${7 * PITCH - GAP}" rx="4"/></clipPath>`;

  return doc(
    H,
    `Contribution graph: ${total} contributions in the last year, ${active} active days, current streak ${streak.current} days, longest streak ${streak.longest} days, busiest day ${best?.count ?? 0} contributions`,
    { defs, style, body }
  );
}
