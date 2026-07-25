// Hairline rule with a light packet travelling along it.

import { W, C, doc } from '../lib/theme.mjs';

const NS = 'dv';
const H = 40;

export default function divider() {
  const body = `
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect x="60" y="${H / 2}" width="${W - 120}" height="1" fill="url(#rule-${NS})"/>
  <g class="pk-${NS}">
    <circle cx="0" cy="${H / 2}" r="2.5" fill="${C.accent}"/>
    <circle cx="0" cy="${H / 2}" r="7" fill="${C.accent}" opacity="0.18"/>
  </g>`;

  return doc(H, '', {
    defs: `<linearGradient id="rule-${NS}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>`,
    style: `@keyframes tr-${NS}{0%{transform:translateX(120px);opacity:0}
      12%{opacity:1}88%{opacity:1}100%{transform:translateX(${W - 120}px);opacity:0}}
    .pk-${NS}{animation:tr-${NS} 6s cubic-bezier(.45,0,.55,1) infinite}`,
    body,
  });
}
