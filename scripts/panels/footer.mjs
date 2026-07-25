// Sign-off plus the honest provenance line: when this data was last pulled.

import {
  W, C, esc, round, doc, commonDefs, baseStyle, starfield, sheen,
} from '../lib/theme.mjs';

const NS = 'ft';
const H = 150;

export default function footer({ stamp }) {
  const body = `
  <g clip-path="url(#frame-${NS})">
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${starfield(NS, H, 10, 131)}
    <ellipse class="gl-${NS}" cx="500" cy="${H + 30}" rx="380" ry="120" fill="url(#glow-${NS})" opacity="0.5"/>
    <text class="fu-${NS}" x="500" y="62" text-anchor="middle" font-size="24" font-weight="700" fill="url(#metal-${NS})" letter-spacing="-0.3" style="animation-delay:.2s">Real products. No shortcuts.</text>
    <g class="fi-${NS}" style="animation-delay:.7s">
      <circle class="live-${NS}" cx="${500 - 148}" cy="92" r="3.5" fill="${C.accent}"/>
      <text x="${500 - 136}" y="96" font-size="12" fill="${C.muted}">${esc(
        `Rebuilt from the GitHub API · ${stamp}`
      )}</text>
    </g>
    <text class="fi-${NS}" x="500" y="122" text-anchor="middle" font-size="11" letter-spacing="1.4" fill="${C.muted}" style="animation-delay:.9s">REFRESHES AUTOMATICALLY EVERY 6 HOURS</text>
    ${sheen(NS, H, { dur: 8, delay: 2 })}
  </g>`;

  return doc(H, `Real products. No shortcuts. Dashboard rebuilt from the GitHub API at ${stamp}, refreshing automatically every 6 hours.`, {
    defs: commonDefs(NS, H),
    style: `${baseStyle(NS)}
    @keyframes lv-${NS}{0%,100%{opacity:.35}50%{opacity:1}}
    .live-${NS}{animation:lv-${NS} 2.4s ease-in-out infinite}`,
    body,
  });
}
