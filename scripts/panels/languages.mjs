// Language split across every public repo: an animated donut that draws itself
// arc by arc, plus a legend of bars that grow from zero.

import {
  W, C, SERIES, esc, round, doc, commonDefs, baseStyle,
  starfield, kicker, odometer, sheen,
} from '../lib/theme.mjs';

const NS = 'lg';
const H = 320;
const PAD = 56;

const CX = 168;
const CY = 184;
const R = 66;
const SW = 22;

export default function languages({ langs }) {
  // A repo list with no detectable languages would otherwise take the whole
  // scheduled build down on `slices[0]`.
  if (langs.list.length === 0) {
    return doc(H, 'Language breakdown unavailable', {
      defs: commonDefs(NS, H),
      style: baseStyle(NS),
      body: `<g clip-path="url(#frame-${NS})">
        <rect width="${W}" height="${H}" fill="${C.bg}"/>
        ${starfield(NS, H, 12, 51)}
        ${kicker(PAD, 46, 'LANGUAGE BREAKDOWN', { anchor: 'start' })}
        <text x="500" y="${H / 2}" text-anchor="middle" font-size="14" fill="${C.muted}">No language data yet</text>
      </g>`,
    });
  }

  // Six slices keeps the palette honest; everything smaller becomes "Other".
  const TOP = 5;
  const head = langs.list.slice(0, TOP);
  const tail = langs.list.slice(TOP);
  const slices = [...head];
  if (tail.length) {
    slices.push({
      name: tail.length === 1 ? tail[0].name : 'Other',
      bytes: tail.reduce((a, l) => a + l.bytes, 0),
      pct: tail.reduce((a, l) => a + l.pct, 0),
      group: tail.length > 1 ? tail.map((l) => l.name) : null,
    });
  }

  const circ = 2 * Math.PI * R;
  let cursor = 0;
  const arcs = [];
  const arcStyle = [];

  slices.forEach((s, i) => {
    const len = (s.pct / 100) * circ;
    const visible = Math.max(len - 2.5, 1.5); // small gap between segments
    const angle = (cursor / 100) * 360 - 90;
    // No dashoffset attribute: at rest the arc is fully drawn, so the split is
    // readable even where the sweep animation never runs.
    arcs.push(
      `<circle class="arc-${NS}-${i}" cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${SERIES[i]}" stroke-width="${SW}" stroke-linecap="butt" stroke-dasharray="${round(
        visible,
        2
      )} ${round(circ - visible, 2)}" transform="rotate(${round(angle, 2)} ${CX} ${CY})"/>`
    );
    arcStyle.push(
      `@keyframes ad-${NS}-${i}{0%{stroke-dashoffset:${round(visible, 2)}}100%{stroke-dashoffset:0}}` +
        `.arc-${NS}-${i}{animation:ad-${NS}-${i} .85s cubic-bezier(.25,.1,.25,1) both;animation-delay:${round(
          0.35 + i * 0.14,
          2
        )}s}`
    );
    cursor += s.pct;
  });

  const top = slices[0];
  const centerOdo = odometer(NS, 'ctr', {
    cx: CX,
    y: CY + 4,
    value: String(Math.round(top.pct)),
    size: 30,
    fill: `url(#metal-${NS})`,
    delay: 0.6,
  });

  // Legend
  const legendX = 300;
  const barX = 452;
  const barW = 400;
  const rowY0 = 86;
  const rowPitch = 36;
  const maxPct = slices[0].pct || 1;

  const legend = slices
    .map((s, i) => {
      const y = rowY0 + i * rowPitch;
      const w = Math.max((s.pct / maxPct) * barW, 3);
      arcStyle.push(
        `@keyframes lb-${NS}-${i}{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}` +
          `.lb-${NS}-${i}{transform-box:fill-box;transform-origin:left center;animation:lb-${NS}-${i} .8s cubic-bezier(.25,.1,.25,1) both;animation-delay:${round(
            0.45 + i * 0.1,
            2
          )}s}`
      );
      const title = s.group ? `${s.name}: ${s.group.join(', ')}` : s.name;
      return `<g class="fu-${NS}" style="animation-delay:${round(0.3 + i * 0.1, 2)}s">
      <title>${esc(`${title} — ${s.pct.toFixed(1)}%`)}</title>
      <circle cx="${legendX}" cy="${y - 4}" r="4.5" fill="${SERIES[i]}"/>
      <text x="${legendX + 14}" y="${y}" font-size="13" fill="${C.textSoft}">${esc(s.name)}</text>
      <rect x="${barX}" y="${y - 9}" width="${barW}" height="7" rx="3.5" fill="${C.glass}" fill-opacity="0.06"/>
      <rect class="lb-${NS}-${i}" x="${barX}" y="${y - 9}" width="${round(w, 2)}" height="7" rx="3.5" fill="${SERIES[i]}"/>
      <text x="${W - PAD}" y="${y}" text-anchor="end" font-size="12.5" fill="${C.muted}">${s.pct.toFixed(1)}%</text>
    </g>`;
    })
    .join('');

  const mb = (langs.totalBytes / 1e6).toFixed(1);

  const body = `
  <g clip-path="url(#frame-${NS})">
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${starfield(NS, H, 12, 51)}
    <ellipse class="gl-${NS}" cx="180" cy="${H + 40}" rx="360" ry="150" fill="url(#glow-${NS})" opacity="0.45"/>
    ${kicker(PAD, 46, 'LANGUAGE BREAKDOWN', { anchor: 'start' })}

    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${C.glass}" stroke-opacity="0.06" stroke-width="${SW}"/>
    <circle cx="${CX}" cy="${CY}" r="${R + 22}" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1" stroke-dasharray="5 11">
      <animateTransform attributeName="transform" type="rotate" values="0 ${CX} ${CY};360 ${CX} ${CY}" dur="38s" repeatCount="indefinite"/>
    </circle>
    ${arcs.join('')}
    ${centerOdo.body}
    <text class="fi-${NS}" x="${CX + centerOdo.width / 2 + 3}" y="${CY + 4}" font-size="15" font-weight="600" fill="${C.muted}" style="animation-delay:1.5s">%</text>
    <text class="fi-${NS}" x="${CX}" y="${CY + 26}" text-anchor="middle" font-size="12" fill="${C.muted}" style="animation-delay:1.5s">${esc(top.name)}</text>
    <text class="fi-${NS}" x="${CX}" y="${CY + R + 44}" text-anchor="middle" font-size="11.5" fill="${C.muted}" style="animation-delay:1.6s">${esc(
      `${mb} MB across ${langs.list.length} languages`
    )}</text>

    ${legend}
    ${sheen(NS, H, { dur: 9, delay: 2.4 })}
  </g>`;

  return doc(
    H,
    `Language breakdown across all public repositories: ${slices
      .map((s) => `${s.name} ${s.pct.toFixed(1)}%`)
      .join(', ')}`,
    {
      defs: `${commonDefs(NS, H)}${centerOdo.defs}`,
      style: `${baseStyle(NS)}${centerOdo.style}${arcStyle.join('')}`,
      body,
    }
  );
}
