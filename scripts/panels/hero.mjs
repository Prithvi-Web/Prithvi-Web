// Masthead. The chips underneath the name carry live numbers, so the hero is
// never out of date with the rest of the dashboard.

import {
  W, C, esc, commas, round, doc, baseStyle, starfield, sheenGrad,
} from '../lib/theme.mjs';

const NS = 'hr';
const H = 360;
const CARD_X = 170;
const CARD_Y = 92;
const CARD_W = 660;
const CARD_H = 196;

export default function hero({ user, totals, lastPush }) {
  const initials = (user.name || user.login)
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

  const tagline = 'Student builder · shipping real products';

  const chips = [
    `★ ${commas(totals.stars)} stars`,
    `${commas(user.followers)} followers`,
    `${commas(totals.repos)} repos`,
    lastPush ? `pushed ${lastPush}` : null,
  ].filter(Boolean);

  let cx = 282;
  const chipY = 214;
  const chipEls = chips
    .map((label, i) => {
      const w = Math.round(26 + label.length * 6.7);
      const el = `<g class="fu-${NS}" style="animation-delay:${round(1.45 + i * 0.16, 2)}s">
      <rect x="${cx}" y="${chipY}" width="${w}" height="32" rx="16" fill="${C.glass}" fill-opacity="0.06" stroke="${C.glass}" stroke-opacity="0.13"/>
      <text x="${cx + w / 2}" y="${chipY + 20}" text-anchor="middle" font-size="12.5" fill="${C.textSoft}">${esc(label)}</text>
    </g>`;
      cx += w + 10;
      return el;
    })
    .join('');

  const body = `
  <g clip-path="url(#frame-${NS})">
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${starfield(NS, H, 22, 3)}
    <ellipse class="gl-${NS}" cx="500" cy="${H + 40}" rx="350" ry="150" fill="url(#glow-${NS})" opacity="0.7"/>
    <ellipse class="vi-${NS}" cx="150" cy="-20" rx="220" ry="130" fill="url(#violet-${NS})" opacity="0.28"/>

    <circle cx="866" cy="80" r="58" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1" stroke-dasharray="6 10">
      <animateTransform attributeName="transform" type="rotate" values="0 866 80;360 866 80" dur="32s" repeatCount="indefinite"/>
    </circle>
    <circle cx="866" cy="80" r="40" fill="none" stroke="${C.accent}" stroke-opacity="0.16" stroke-width="1" stroke-dasharray="3 14">
      <animateTransform attributeName="transform" type="rotate" values="360 866 80;0 866 80" dur="24s" repeatCount="indefinite"/>
    </circle>

    <g class="card-${NS}">
      <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="26" fill="${C.glass}" fill-opacity="${C.glassFill}" stroke="${C.glass}" stroke-opacity="${C.glassStroke}"/>
      <rect x="${CARD_X + 40}" y="${CARD_Y}" width="${CARD_W - 80}" height="1" fill="url(#topline-${NS})"/>

      <circle cx="232" cy="152" r="30" fill="url(#av-${NS})" stroke="#ffffff" stroke-opacity="0.22"/>
      <text x="232" y="158" text-anchor="middle" font-size="17" font-weight="600" fill="${C.text}">${esc(initials)}</text>

      <text x="282" y="146" font-size="34" font-weight="700" fill="url(#metal-${NS})" letter-spacing="-0.5">${esc(
        user.name || user.login
      )}</text>
      <mask id="rv-${NS}">
        <rect x="282" y="158" width="340" height="26" fill="#ffffff">
          <animate attributeName="width" values="0;340" begin="0.6s" dur="1.4s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1"/>
        </rect>
      </mask>
      <text x="282" y="177" font-size="16" fill="${C.muted}" mask="url(#rv-${NS})">${esc(tagline)}</text>

      ${chipEls}

      <g clip-path="url(#card-${NS})">
        <g class="sh-${NS}"><rect x="40" y="70" width="90" height="240" fill="url(#sheen-${NS})" transform="skewX(-14)"/></g>
      </g>
    </g>
  </g>`;

  return doc(
    H,
    `${user.name || user.login} — student builder shipping real products. ${totals.stars} stars, ${user.followers} followers, ${totals.repos} public repositories${
      lastPush ? `, last pushed ${lastPush}` : ''
    }`,
    {
      defs: `
      <linearGradient id="metal-${NS}" x1="0" y1="0" x2="1" y2="0.25">
        <stop offset="0" stop-color="#f5f5f7"/><stop offset="0.55" stop-color="#c8ccd8"/><stop offset="1" stop-color="#8e93a6"/>
      </linearGradient>
      <radialGradient id="glow-${NS}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${C.blueGlow}"/><stop offset="1" stop-color="${C.blueGlow}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="violet-${NS}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="topline-${NS}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="av-${NS}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3c3c42"/><stop offset="1" stop-color="#101013"/>
      </linearGradient>
      ${sheenGrad(NS, 0.14)}
      <clipPath id="frame-${NS}"><rect width="${W}" height="${H}" rx="28"/></clipPath>
      <clipPath id="card-${NS}"><rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="26"/></clipPath>`,
      style: `${baseStyle(NS)}
      @keyframes dv-${NS}{0%,100%{transform:translate(0,0)}50%{transform:translate(36px,14px)}}
      .vi-${NS}{animation:dv-${NS} 12s ease-in-out infinite}
      @keyframes fc-${NS}{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      .card-${NS}{animation:fc-${NS} 7s ease-in-out infinite}
      @keyframes sw-${NS}{0%{transform:translateX(0)}60%,100%{transform:translateX(950px)}}
      .sh-${NS}{animation:sw-${NS} 5.5s ease-in-out infinite}`,
      body,
    }
  );
}
