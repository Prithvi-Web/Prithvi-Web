// Six live counters. Digits physically roll up to their value on load.

import {
  W, C, SERIES, esc, commas, round, doc, commonDefs, baseStyle,
  starfield, kicker, odometer, sheen,
} from '../lib/theme.mjs';

const NS = 'sx';
const H = 250;
const PAD = 56;
const GAP = 14;

export default function stats({ totals, user, contributions, streak }) {
  const tiles = [
    { value: commas(totals.stars), label: 'stars earned', star: true },
    { value: commas(totals.forks), label: 'forks' },
    { value: commas(user.followers), label: 'followers' },
    { value: commas(totals.repos), label: 'public repos' },
    { value: commas(contributions), label: 'contributions / yr' },
    { value: commas(streak.longest), label: 'longest streak' },
  ];

  const n = tiles.length;
  const tileW = (W - PAD * 2 - GAP * (n - 1)) / n;
  const tileY = 84;
  const tileH = 116;

  const defs = [];
  const style = [];
  const body = tiles
    .map((t, i) => {
      const x = PAD + i * (tileW + GAP);
      const cx = x + tileW / 2;
      const odo = odometer(NS, `t${i}`, {
        cx: t.star ? cx - 9 : cx,
        y: tileY + 52,
        value: t.value,
        size: 32,
        fill: `url(#metal-${NS})`,
        delay: 0.3 + i * 0.1,
      });
      defs.push(odo.defs);
      style.push(odo.style);
      style.push(
        `@keyframes bar-${NS}-${i}{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}` +
          `.bar-${NS}-${i}{transform-box:fill-box;transform-origin:center;animation:bar-${NS}-${i} .9s cubic-bezier(.25,.1,.25,1) both;animation-delay:${round(
            0.55 + i * 0.1,
            2
          )}s}`
      );

      const star = t.star
        ? `<text class="stp-${NS}" x="${odo.endX + 11}" y="${tileY + 50}" font-size="16" fill="${C.accent}">★</text>`
        : '';

      return `<g class="fu-${NS}" style="animation-delay:${round(0.15 + i * 0.1, 2)}s"><g class="fl-${NS}" style="animation-delay:${round(
        -i * 1.1,
        2
      )}s">
      <rect x="${round(x, 2)}" y="${tileY}" width="${round(tileW, 2)}" height="${tileH}" rx="20" fill="${C.glass}" fill-opacity="${C.glassFill}" stroke="${C.glass}" stroke-opacity="${C.glassStroke}"/>
      ${odo.body}${star}
      <rect class="bar-${NS}-${i}" x="${round(cx - 22, 2)}" y="${tileY + 68}" width="44" height="2" rx="1" fill="${SERIES[i % SERIES.length]}" opacity="0.9"/>
      <text x="${round(cx, 2)}" y="${tileY + 92}" text-anchor="middle" font-size="11" fill="${C.muted}">${esc(t.label)}</text>
    </g></g>`;
    })
    .join('');

  const svgBody = `
  <g clip-path="url(#frame-${NS})">
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${starfield(NS, H, 12, 33)}
    <ellipse class="gl-${NS}" cx="500" cy="${H + 50}" rx="420" ry="140" fill="url(#glow-${NS})" opacity="0.45"/>
    ${kicker(PAD, 50, 'BY THE NUMBERS', { anchor: 'start' })}
    <g class="fi-${NS}" style="animation-delay:1.4s">
      <circle class="live-${NS}" cx="${W - PAD - 92}" cy="46" r="3.5" fill="${C.accent}"/>
      <text x="${W - PAD}" y="50" text-anchor="end" font-size="11" letter-spacing="1.5" fill="${C.muted}">LIVE FROM THE GITHUB API</text>
    </g>
    ${body}
    ${sheen(NS, H, { dur: 8, delay: 2 })}
  </g>`;

  return doc(
    H,
    `By the numbers, live from the GitHub API: ${totals.stars} stars earned, ${totals.forks} forks, ${user.followers} followers, ${totals.repos} public repositories, ${contributions} contributions in the last year, longest streak ${streak.longest} days`,
    {
      defs: `${commonDefs(NS, H)}${defs.join('')}`,
      style: `${baseStyle(NS)}
      @keyframes lv-${NS}{0%,100%{opacity:.35;r:3}50%{opacity:1;r:4}}
      .live-${NS}{animation:lv-${NS} 2.4s ease-in-out infinite}
      @keyframes sp-${NS}{0%,100%{opacity:.6}50%{opacity:1}}
      .stp-${NS}{animation:sp-${NS} 2.2s ease-in-out infinite}
      ${style.join('')}`,
      body: svgBody,
    }
  );
}
