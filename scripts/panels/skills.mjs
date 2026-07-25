// Toolkit. The language row is generated from the actual bytes in the repos,
// so it can never drift from what is really being written.

import {
  W, C, esc, round, doc, commonDefs, baseStyle, starfield, kicker, sheen,
} from '../lib/theme.mjs';

const NS = 'sk';
const H = 260;
const PAD = 56;

const TOOLS = ['Node.js', 'Git & GitHub', 'Docker', 'macOS', 'Windows', 'Linux'];

function chipRow(items, y, startDelay, colorOf) {
  const gap = 10;
  const widths = items.map((it) => Math.round((it.dot ? 34 : 24) + it.label.length * 7.1));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = (W - total) / 2;
  return items
    .map((it, i) => {
      const w = widths[i];
      const el = `<g class="fu-${NS}" style="animation-delay:${round(startDelay + i * 0.09, 2)}s">
      <rect x="${round(x, 2)}" y="${y}" width="${w}" height="38" rx="19" fill="${C.glass}" fill-opacity="0.06" stroke="${C.glass}" stroke-opacity="0.13"/>
      ${it.dot ? `<circle cx="${round(x + 17, 2)}" cy="${y + 19}" r="4" fill="${colorOf(it.label)}"/>` : ''}
      <text x="${round(x + (it.dot ? 28 : 12), 2)}" y="${y + 24}" font-size="13" fill="${C.textSoft}">${esc(it.label)}</text>
    </g>`;
      x += w + gap;
      return el;
    })
    .join('');
}

export default function skills({ langs, colorOf }) {
  const languages = langs.list.slice(0, 6).map((l) => ({ label: l.name, dot: true }));
  const tools = TOOLS.map((t) => ({ label: t, dot: false }));

  const body = `
  <g clip-path="url(#frame-${NS})">
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${starfield(NS, H, 12, 113)}
    <ellipse class="gl-${NS}" cx="500" cy="${H + 50}" rx="400" ry="140" fill="url(#glow-${NS})" opacity="0.42"/>
    ${kicker(500, 48, 'TOOLKIT')}
    <text class="fi-${NS}" x="${PAD}" y="88" font-size="11" letter-spacing="1.6" fill="${C.muted}" style="animation-delay:.2s">LANGUAGES · BY BYTES SHIPPED</text>
    ${chipRow(languages, 100, 0.3, colorOf)}
    <text class="fi-${NS}" x="${PAD}" y="176" font-size="11" letter-spacing="1.6" fill="${C.muted}" style="animation-delay:.7s">TOOLS &amp; PLATFORMS</text>
    ${chipRow(tools, 188, 0.8, colorOf)}
    ${sheen(NS, H, { dur: 8.5, delay: 1.8 })}
  </g>`;

  return doc(H, `Toolkit — languages: ${languages.map((l) => l.label).join(', ')}. Tools and platforms: ${TOOLS.join(', ')}`, {
    defs: commonDefs(NS, H),
    style: baseStyle(NS),
    body,
  });
}
