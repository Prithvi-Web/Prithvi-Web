#!/usr/bin/env node
// Rebuilds every animated panel in assets/ from live GitHub data.
//
//   node scripts/build.mjs          rebuild, writing only what changed
//   node scripts/build.mjs --force  rewrite every file regardless
//   node scripts/build.mjs --cache  reuse the last API response
//
// Nothing is written unless a real number moved, so the scheduled workflow
// does not commit noise into the repo.
//
// --cache is for working on the visuals: unauthenticated GitHub allows only
// 60 requests an hour, which a few rebuilds in a row will exhaust.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchUser, fetchRepos, fetchLanguages, fetchContributions, fetchEvents,
  streaks, busiest, relativeDay, LOGIN,
} from './lib/github.mjs';
import { SERIES } from './lib/theme.mjs';

import hero from './panels/hero.mjs';
import heatmap from './panels/heatmap.mjs';
import stats from './panels/stats.mjs';
import languages from './panels/languages.mjs';
import repos from './panels/repos.mjs';
import activity from './panels/activity.mjs';
import skills from './panels/skills.mjs';
import footer from './panels/footer.mjs';
import divider from './panels/divider.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');
const FORCE = process.argv.includes('--force');
const CACHE = process.argv.includes('--cache');
const CACHE_FILE = join(ROOT, 'scripts', '.cache', 'github.json');

const log = (...a) => console.log(...a);

function stamp(d = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${p(d.getUTCHours())}:${p(
    d.getUTCMinutes()
  )} UTC`;
}

async function collect() {
  if (CACHE && existsSync(CACHE_FILE)) {
    log('  using cached API response (--cache)\n');
    const c = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    c.langs.perRepo = new Map(c.langs.perRepo);
    return c;
  }

  log('  fetching profile + repositories…');
  const [user, repoList] = await Promise.all([fetchUser(), fetchRepos()]);

  log('  fetching contribution calendar…');
  const days = await fetchContributions();

  log('  fetching language bytes…');
  const langs = await fetchLanguages(repoList);

  log('  fetching public events…');
  const events = await fetchEvents();

  const data = { user, repoList, days, langs, events };
  if (CACHE) {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(
      CACHE_FILE,
      JSON.stringify({ ...data, langs: { ...langs, perRepo: [...langs.perRepo] } })
    );
  }
  return data;
}

async function main() {
  log(`Building profile dashboard for @${LOGIN}\n`);

  const { user, repoList, days, langs, events } = await collect();

  const totals = {
    stars: repoList.reduce((a, r) => a + r.stargazers_count, 0),
    forks: repoList.reduce((a, r) => a + r.forks_count, 0),
    repos: repoList.length,
  };
  const contributions = days.reduce((a, d) => a + d.count, 0);
  const streak = streaks(days);
  const best = busiest(days);
  const lastPush =
    events.find((e) => e.type === 'PushEvent')?.created_at || user.updated_at;

  // Language colours stay consistent across the donut, the leaderboard and the
  // toolkit: rank in the global byte ordering picks the swatch.
  const rank = new Map(langs.list.map((l, i) => [l.name, i]));
  const colorOf = (name) => SERIES[Math.min(rank.get(name) ?? SERIES.length - 1, SERIES.length - 1)];

  log(
    `\n  ${totals.stars} stars · ${totals.forks} forks · ${user.followers} followers · ` +
      `${totals.repos} repos · ${contributions} contributions · streak ${streak.current}/${streak.longest}\n`
  );

  // Footer is generated last because its timestamp depends on whether anything
  // else changed — it must not be what triggers a rebuild.
  const panels = {
    'hero.svg': hero({ user, totals, lastPush: relativeDay(lastPush) }),
    'heatmap.svg': heatmap({ days, streak, best }),
    'stats.svg': stats({ totals, user, contributions, streak }),
    'activity.svg': activity({ days }),
    'languages.svg': languages({ langs }),
    'repos.svg': repos({ repos: repoList, totals, colorOf, rel: relativeDay }),
    'skills.svg': skills({ langs, colorOf }),
    'divider.svg': divider(),
  };

  if (!existsSync(ASSETS)) mkdirSync(ASSETS, { recursive: true });

  const changed = [];
  for (const [name, svg] of Object.entries(panels)) {
    const path = join(ASSETS, name);
    const prev = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (prev !== svg) changed.push(name);
  }

  if (changed.length === 0 && !FORCE) {
    log('No data changed — nothing written.');
    return { changed: [] };
  }

  for (const [name, svg] of Object.entries(panels)) {
    writeFileSync(join(ASSETS, name), svg);
  }

  const version = createHash('sha256')
    .update(Object.values(panels).join(''))
    .digest('hex')
    .slice(0, 8);

  writeFileSync(join(ASSETS, 'footer.svg'), footer({ stamp: stamp() }));

  stampReadme(version);

  log(`Wrote ${Object.keys(panels).length + 1} panels (changed: ${changed.join(', ') || 'forced'})`);
  log(`Cache version: ${version}`);
  return { changed };
}

/**
 * GitHub proxies README images through its own cache. Bumping a version query
 * on each src guarantees a refreshed panel is actually shown rather than a
 * stale copy being served for hours.
 */
function stampReadme(version) {
  const path = join(ROOT, 'README.md');
  if (!existsSync(path)) return;
  const before = readFileSync(path, 'utf8');
  const after = before.replace(
    /(assets\/[A-Za-z0-9_-]+\.svg)(\?v=[A-Za-z0-9]+)?/g,
    (_, file) => `${file}?v=${version}`
  );
  if (after !== before) {
    writeFileSync(path, after);
    log('Stamped README.md image cache version');
  }
}

main().catch((err) => {
  console.error('\nBuild failed:', err.message);
  process.exit(1);
});
