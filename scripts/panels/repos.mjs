// Live leaderboard of the top repositories, ranked by stars. Bars show each
// repo's share of total stars; the star counts roll up like a scoreboard.

import {
  W, C, SERIES, esc, commas, round, doc, commonDefs, baseStyle,
  starfield, kicker, odometer, sheen,
} from '../lib/theme.mjs';

const NS = 'rp';
const PAD = 56;
const ROW_H = 50;
const PITCH = 58;
const ROW_Y0 = 74;
const COUNT = 5;
const H = ROW_Y0 + COUNT * PITCH + 46;

/** Two branch nodes merging into one — the ⑂ glyph is unreadable this small. */
function forkIcon(x, y) {
  return `<g transform="translate(${x} ${y})" stroke="${C.muted}" stroke-width="1.25" fill="none" stroke-linecap="round">
    <circle cx="0" cy="0" r="1.9"/><circle cx="9" cy="0" r="1.9"/><circle cx="4.5" cy="11" r="1.9"/>
    <path d="M0 1.9 V4.5 H9 V1.9 M4.5 4.5 V9.1"/>
  </g>`;
}

export default function repos({ repos, totals, colorOf, rel }) {
  const top = repos
    .slice()
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count)
    .slice(0, COUNT);

  const maxStars = Math.max(top[0]?.stargazers_count ?? 1, 1);
  const barX = 470;
  const barW = 220;
  const SHARE_X = 744; // right edge of the share-of-total column
  const STAR_X = 826; // right edge of the star count
  const FORK_X = 916; // right edge of the fork count

  const defs = [];
  const style = [];

  const rows = top
    .map((r, i) => {
      const y = ROW_Y0 + i * PITCH;
      const share = totals.stars > 0 ? (r.stargazers_count / totals.stars) * 100 : 0;
      const w = r.stargazers_count > 0 ? Math.max((r.stargazers_count / maxStars) * barW, 6) : 0;
      const accent = colorOf(r.language);

      const odo = odometer(NS, `s${i}`, {
        cx: STAR_X,
        y: y + 32,
        value: commas(r.stargazers_count),
        size: 20,
        fill: C.text,
        delay: 0.45 + i * 0.1,
        anchor: 'end',
      });
      defs.push(odo.defs);
      style.push(odo.style);
      style.push(
        `@keyframes rb-${NS}-${i}{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}` +
          `.rb-${NS}-${i}{transform-box:fill-box;transform-origin:left center;animation:rb-${NS}-${i} .85s cubic-bezier(.25,.1,.25,1) both;animation-delay:${round(
            0.5 + i * 0.1,
            2
          )}s}`
      );

      const meta = [r.language, r.fork ? 'fork' : null, `updated ${rel(r.pushed_at)}`]
        .filter(Boolean)
        .join('  ·  ');

      const bar =
        w > 0
          ? `<rect class="rb-${NS}-${i}" x="${barX}" y="${y + 22}" width="${round(w, 2)}" height="7" rx="3.5" fill="${accent}"/>`
          : '';

      return `<g class="fu-${NS}" style="animation-delay:${round(0.2 + i * 0.1, 2)}s">
      <rect x="${PAD}" y="${y}" width="${W - PAD * 2}" height="${ROW_H}" rx="16" fill="${C.glass}" fill-opacity="${C.glassFill}" stroke="${C.glass}" stroke-opacity="${C.glassStroke}"/>
      <text x="${PAD + 26}" y="${y + 31}" text-anchor="middle" font-size="13" font-weight="700" fill="${
        i === 0 ? C.accent : C.muted
      }">${String(i + 1).padStart(2, '0')}</text>
      <circle cx="${PAD + 52}" cy="${y + 26}" r="4" fill="${accent}"/>
      <text x="${PAD + 66}" y="${y + 22}" font-size="14.5" font-weight="600" fill="${C.text}">${esc(r.name)}</text>
      <text x="${PAD + 66}" y="${y + 39}" font-size="10.5" fill="${C.muted}">${esc(meta)}</text>
      <rect x="${barX}" y="${y + 22}" width="${barW}" height="7" rx="3.5" fill="${C.glass}" fill-opacity="0.06"/>
      ${bar}
      <text x="${SHARE_X}" y="${y + 32}" text-anchor="end" font-size="11" fill="${C.muted}">${
        share >= 0.1 ? `${share.toFixed(1)}%` : '—'
      }</text>
      ${odo.body}
      <text x="${STAR_X + 7}" y="${y + 32}" font-size="13" fill="${C.accent}">★</text>
      <text x="${FORK_X}" y="${y + 32}" text-anchor="end" font-size="13" fill="${C.textSoft}">${commas(
        r.forks_count
      )}</text>
      ${forkIcon(FORK_X + 8, y + 19)}
    </g>`;
    })
    .join('');

  const body = `
  <g clip-path="url(#frame-${NS})">
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${starfield(NS, H, 14, 91)}
    <ellipse class="gl-${NS}" cx="500" cy="${H + 50}" rx="430" ry="150" fill="url(#glow-${NS})" opacity="0.42"/>
    ${kicker(PAD, 46, 'TOP REPOSITORIES', { anchor: 'start' })}
    <text class="fi-${NS}" x="${W - PAD}" y="46" text-anchor="end" font-size="11" letter-spacing="1.5" fill="${C.muted}" style="animation-delay:1.2s">RANKED BY STARS · SHARE OF TOTAL</text>
    ${rows}
    <text class="fi-${NS}" x="${PAD}" y="${H - 20}" font-size="11.5" fill="${C.muted}" style="animation-delay:1.4s">${esc(
      `${commas(totals.stars)} stars and ${commas(totals.forks)} forks across ${totals.repos} public repositories`
    )}</text>
    ${sheen(NS, H, { dur: 9.5, delay: 2.6 })}
  </g>`;

  return doc(
    H,
    `Top repositories ranked by stars: ${top
      .map((r) => `${r.name} ${r.stargazers_count} stars`)
      .join(', ')}. ${totals.stars} stars total across ${totals.repos} repositories.`,
    {
      defs: `${commonDefs(NS, H)}${defs.join('')}`,
      style: `${baseStyle(NS)}${style.join('')}`,
      body,
    }
  );
}
