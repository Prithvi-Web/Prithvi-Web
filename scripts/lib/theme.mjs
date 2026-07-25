// Design tokens + shared SVG primitives for the space-black / blue profile panels.
// Every panel is a standalone SVG, so ids only need to be unique within one file.

export const W = 1000;

export const C = {
  bg: '#000000',
  glass: '#ffffff',
  glassFill: 0.05,
  glassStroke: 0.14,
  text: '#e8e8ed',
  textSoft: '#d5d5da',
  muted: '#86868b',
  accent: '#2997ff',
  accentDim: '#1f6feb',
  blueGlow: '#2b46b8',
  violet: '#5f3dc4',
};

// Contribution heat ramp: black -> blue. Level 0 is a whisper, level 4 is the accent.
export const HEAT = ['#141821', '#123a6e', '#1857b0', '#2179e8', '#5fb2ff'];

// Language / series ramp stays inside the blue->violet family so the palette
// never breaks, while still giving six distinguishable steps.
export const SERIES = ['#7cc4ff', '#2997ff', '#2b6fe0', '#3b4fc8', '#5f3dc4', '#7b3fb0'];

export const FONT =
  "-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif";

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function commas(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Round to at most `p` decimals without trailing zeros. */
export function round(n, p = 1) {
  return String(Number(n.toFixed(p)));
}

/* ------------------------------------------------------------------ *
 * Base styles every panel shares.
 *
 * Entrance animations deliberately never set the hidden state on the element
 * itself — it lives in the 0% keyframe, and `both` applies it during the
 * delay. A renderer that ignores CSS animations (or only ever paints the
 * first frame) therefore shows the finished panel with the real numbers,
 * rather than a blank card full of zeroes.
 * ------------------------------------------------------------------ */
export function baseStyle(ns) {
  return `
    text{font-family:${FONT};font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
    @keyframes tw-${ns}{0%,100%{opacity:.12}50%{opacity:.85}}
    .st-${ns}{animation:tw-${ns} 4.2s ease-in-out infinite}
    @keyframes pl-${ns}{0%,100%{opacity:.45}50%{opacity:.75}}
    .gl-${ns}{animation:pl-${ns} 8s ease-in-out infinite}
    @keyframes fu-${ns}{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
    .fu-${ns}{animation:fu-${ns} .8s cubic-bezier(.25,.1,.25,1) both}
    @keyframes fi-${ns}{0%{opacity:0}100%{opacity:1}}
    .fi-${ns}{animation:fi-${ns} .7s ease-out both}
    @keyframes fl-${ns}{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    .fl-${ns}{animation:fl-${ns} 6.5s ease-in-out infinite}
  `;
}

/** Diagonal light sweep across a panel. Caller must clip it. */
export function sheen(ns, h, { dur = 7, delay = 1.2, width = 110, travel = W + 320 } = {}) {
  return `
  <g class="sh-${ns}"><rect x="-200" y="${-h * 0.2}" width="${width}" height="${h * 1.4}" fill="url(#sheen-${ns})" transform="skewX(-14)"/></g>
  <style>@keyframes sw-${ns}{0%{transform:translateX(0)}55%,100%{transform:translateX(${travel}px)}}
  .sh-${ns}{animation:sw-${ns} ${dur}s ease-in-out infinite;animation-delay:${delay}s}</style>`;
}

export function sheenGrad(ns, peak = 0.1) {
  return `<linearGradient id="sheen-${ns}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="${peak}"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>`;
}

/** Shared gradient defs used by nearly every panel. */
export function commonDefs(ns, h, { sheenPeak = 0.1 } = {}) {
  return `
    <linearGradient id="metal-${ns}" x1="0" y1="0" x2="1" y2="0.25">
      <stop offset="0" stop-color="#f5f5f7"/>
      <stop offset="0.55" stop-color="#c8ccd8"/>
      <stop offset="1" stop-color="#8e93a6"/>
    </linearGradient>
    <radialGradient id="glow-${ns}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${C.blueGlow}"/>
      <stop offset="1" stop-color="${C.blueGlow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="topline-${ns}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    ${sheenGrad(ns, sheenPeak)}
    <clipPath id="frame-${ns}"><rect width="${W}" height="${h}" rx="28"/></clipPath>`;
}

/* ------------------------------------------------------------------ *
 * Starfield — deterministic, so a rebuild with identical data produces
 * a byte-identical file and the workflow makes no pointless commit.
 * ------------------------------------------------------------------ */
export function starfield(ns, h, count = 18, seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = round(rnd() * W, 0);
    const y = round(rnd() * h, 0);
    const r = round(0.9 + rnd() * 0.6, 1);
    const d = round(-rnd() * 4.2, 1);
    out.push(`<circle class="st-${ns}" cx="${x}" cy="${y}" r="${r}" style="animation-delay:${d}s"/>`);
  }
  return `<g fill="#ffffff">${out.join('')}</g>`;
}

/** Glass card. */
export function panel(x, y, w, h, ns, { rx = 20, topline = false } = {}) {
  const t = topline
    ? `<rect x="${x + w * 0.1}" y="${y}" width="${w * 0.8}" height="1" fill="url(#topline-${ns})"/>`
    : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${C.glass}" fill-opacity="${C.glassFill}" stroke="${C.glass}" stroke-opacity="${C.glassStroke}"/>${t}`;
}

export function kicker(x, y, label, { anchor = 'middle' } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="12" font-weight="600" letter-spacing="3" fill="${C.muted}">${esc(label)}</text>`;
}

/* ------------------------------------------------------------------ *
 * Odometer — digits physically roll up to their value.
 *
 * Each digit gets its own column with a fixed pitch, so columns stay
 * perfectly even regardless of which font actually resolves. A strip of
 * 0-9 repeated three times slides upward; the number spins through two
 * full revolutions before settling on the real digit.
 * ------------------------------------------------------------------ */
export function odometer(
  ns,
  id,
  { cx, y, value, size, fill, delay = 0, dur = 1.6, weight = 700, anchor = 'middle' }
) {
  const str = String(value);
  const digitPitch = size * 0.6;
  const thinPitch = size * 0.3; // for ',' '.' and similar
  const widths = [...str].map((ch) => (/\d/.test(ch) ? digitPitch : /[.,]/.test(ch) ? thinPitch : size * 0.52));
  const total = widths.reduce((a, b) => a + b, 0);
  const startX = anchor === 'start' ? cx : anchor === 'end' ? cx - total : cx - total / 2;

  const glyphPitch = size * 1.22;
  const CYCLES = 2;

  let x = startX;
  const parts = [];
  const css = [];
  let col = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const w = widths[i];
    const mid = x + w / 2;

    if (/\d/.test(ch)) {
      const target = CYCLES * 10 + Number(ch);
      const cid = `${id}-${col}`;
      // The strip stops at the resting glyph: anything past it never enters
      // the window, so emitting it would only cost DOM nodes.
      //
      // Glyphs are laid out so the *target* digit sits in the window with no
      // transform at all, and the roll runs from an offset back to zero. That
      // way the untransformed state is the true number: a renderer that skips
      // the animation shows 337, not 000. Positions are absolute rather than a
      // transform attribute, which the CSS transform would otherwise override.
      const glyphs = Array.from(
        { length: target + 1 },
        (_, k) =>
          `<text x="${mid}" y="${round(y + (k - target) * glyphPitch, 2)}" text-anchor="middle" font-size="${size}" font-weight="${weight}" fill="${fill}">${k % 10}</text>`
      ).join('');
      parts.push(`<g clip-path="url(#odo-${cid})"><g class="odo-${cid}">${glyphs}</g></g>`);
      css.push(
        `@keyframes or-${cid}{0%{transform:translateY(${round(target * glyphPitch, 2)}px)}100%{transform:translateY(0)}}` +
          `.odo-${cid}{animation:or-${cid} ${dur}s cubic-bezier(.16,.84,.36,1) both;animation-delay:${round(delay + col * 0.09, 2)}s}`
      );
      col++;
    } else {
      parts.push(
        `<text class="fi-${ns}" x="${mid}" y="${round(y, 2)}" text-anchor="middle" font-size="${size}" font-weight="${weight}" fill="${fill}" style="animation-delay:${round(delay + 0.5, 2)}s">${esc(ch)}</text>`
      );
    }
    x += w;
  }

  // One clip window per digit column, tall enough for the full glyph.
  const clips = [];
  let cx2 = startX;
  let c2 = 0;
  for (let i = 0; i < str.length; i++) {
    if (/\d/.test(str[i])) {
      clips.push(
        `<clipPath id="odo-${id}-${c2}"><rect x="${round(cx2 - 1, 2)}" y="${round(y - size * 0.86, 2)}" width="${round(widths[i] + 2, 2)}" height="${round(size * 1.14, 2)}"/></clipPath>`
      );
      c2++;
    }
    cx2 += widths[i];
  }

  return {
    defs: clips.join(''),
    body: parts.join(''),
    style: css.join(''),
    width: total,
    endX: startX + total,
    startX,
  };
}

/** Wrap a finished panel body into a full SVG document. */
export function doc(h, label, { defs = '', style = '', body = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label)}">
  <defs>${defs}</defs>
  <style>${style}</style>
${body}
</svg>
`;
}
