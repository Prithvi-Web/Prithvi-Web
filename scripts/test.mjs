#!/usr/bin/env node
// Tests for the pure parts of the dashboard: derived metrics and SVG assembly.
// No network, so this runs anywhere — including before the scheduled build.
//
//   node scripts/test.mjs

import { streaks, monthly, busiest, relativeDay } from './lib/github.mjs';
import { odometer, esc, commas } from './lib/theme.mjs';
import languages from './panels/languages.mjs';

let pass = 0;
const failures = [];

function eq(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    pass++;
  } else {
    failures.push(`${name}\n    got:  ${JSON.stringify(actual)}\n    want: ${JSON.stringify(expected)}`);
  }
}

function ok(name, cond) {
  eq(name, !!cond, true);
}

/** Days starting 2026-01-01, one per given count. */
const D = (...counts) =>
  counts.map((count, i) => ({
    date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
    count,
    level: count ? 1 : 0,
  }));

/* streaks ---------------------------------------------------------- */
eq('streaks: all zero', streaks(D(0, 0, 0)), { current: 0, longest: 0, longestEnd: null });
eq('streaks: trailing run counts', streaks(D(0, 1, 1, 1)).current, 3);
eq('streaks: an empty final day does not break the streak', streaks(D(1, 1, 1, 0)).current, 3);
eq('streaks: two empty days do break it', streaks(D(1, 1, 1, 0, 0)).current, 0);
eq('streaks: longest is the max run', streaks(D(1, 1, 0, 1, 1, 1, 0, 1)).longest, 3);
eq('streaks: single active day', streaks(D(1)).current, 1);
eq('streaks: gap then run', streaks(D(1, 0, 1, 1)).current, 2);

/* busiest / monthly ------------------------------------------------ */
eq('busiest: picks the max', busiest(D(2, 9, 4)).count, 9);
eq('busiest: keeps the first on ties', busiest(D(5, 5)).date, '2026-01-01');
eq('monthly: buckets by month', monthly(D(...Array(70).fill(1)), 12).map((m) => m.count), [31, 28, 11]);
eq('monthly: labels months', monthly(D(...Array(70).fill(1)), 12).map((m) => m.label), ['Jan', 'Feb', 'Mar']);

/* relativeDay ------------------------------------------------------ */
const NOW = Date.UTC(2026, 6, 24, 12, 0, 0);
const ago = (d) => new Date(NOW - d * 86400000).toISOString();
eq('relativeDay: today', relativeDay(ago(0), NOW), 'today');
eq('relativeDay: yesterday', relativeDay(ago(1), NOW), 'yesterday');
eq('relativeDay: days', relativeDay(ago(9), NOW), '9d ago');
eq('relativeDay: months', relativeDay(ago(65), NOW), '2mo ago');
eq('relativeDay: years', relativeDay(ago(400), NOW), '1y ago');
eq('relativeDay: missing input', relativeDay(null, NOW), '');

/* odometer --------------------------------------------------------- */
// The glyph sitting at the baseline is what an animation-less renderer shows,
// so it must always be the true digit rather than a zero.
for (const v of ['337', '239', '8', '0', '26', '1,204']) {
  const o = odometer('t', 'x', { cx: 100, y: 100, value: v, size: 20, fill: '#fff' });
  const resting = [...o.body.matchAll(/<text x="[\d.]+" y="100"[^>]*>(\d)<\/text>/g)].map((m) => m[1]).join('');
  eq(`odometer: rests on ${v}`, resting, v.replace(/\D/g, ''));
}

/* escaping --------------------------------------------------------- */
eq('esc: escapes markup', esc('<a & "b">'), '&lt;a &amp; &quot;b&quot;&gt;');
eq('commas: groups thousands', commas(1234567), '1,234,567');
eq('commas: leaves small numbers', commas(337), '337');

/* degenerate input ------------------------------------------------- */
const emptyLang = languages({ langs: { list: [], totalBytes: 0, perRepo: new Map() } });
ok('languages: survives an empty language list', emptyLang.includes('</svg>'));

/* ------------------------------------------------------------------ */
if (failures.length) {
  console.error(`\n${failures.length} failed:\n`);
  for (const f of failures) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`${pass} tests passed`);
