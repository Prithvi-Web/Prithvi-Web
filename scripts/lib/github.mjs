// Live GitHub data. No npm packages, no secrets required.
//
// Everything here works unauthenticated (60 req/hr). Inside GitHub Actions the
// built-in GITHUB_TOKEN is picked up automatically and lifts that to 5,000/hr.

const LOGIN = process.env.PROFILE_LOGIN || 'Prithvi-Web';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

const headers = {
  'User-Agent': `${LOGIN}-profile-dashboard`,
  Accept: 'application/vnd.github+json',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { as = 'json', tries = 4, accept, noAuth = false } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const h = { ...headers };
      if (accept) h.Accept = accept;
      // github.com HTML pages are not the API — an API bearer token has no
      // meaning there and only risks an unexpected redirect or rejection.
      if (noAuth) delete h.Authorization;
      const res = await fetch(url, { headers: h });
      if (res.status === 403 || res.status === 429) {
        const reset = Number(res.headers.get('x-ratelimit-reset') || 0) * 1000;
        const wait = Math.min(Math.max(reset - Date.now(), 2000), 60000);
        console.warn(`  rate limited on ${url} — waiting ${Math.round(wait / 1000)}s`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return as === 'text' ? res.text() : res.json();
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await sleep(800 * 2 ** i);
    }
  }
  throw lastErr;
}

/* ------------------------------------------------------------------ */

export async function fetchUser() {
  return get(`https://api.github.com/users/${LOGIN}`);
}

export async function fetchRepos() {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await get(
      `https://api.github.com/users/${LOGIN}/repos?per_page=100&page=${page}&sort=updated`
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out.filter((r) => !r.archived && !r.disabled);
}

export async function fetchLanguages(repos) {
  const totals = new Map();
  const perRepo = new Map();
  for (const r of repos) {
    try {
      const langs = await get(`https://api.github.com/repos/${r.full_name}/languages`);
      perRepo.set(r.name, langs);
      for (const [name, bytes] of Object.entries(langs)) {
        totals.set(name, (totals.get(name) || 0) + bytes);
      }
    } catch (err) {
      // A single repo failing must not sink the whole dashboard.
      console.warn(`  languages unavailable for ${r.full_name}: ${err.message}`);
    }
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  const list = [...totals.entries()]
    .map(([name, bytes]) => ({ name, bytes, pct: (bytes / sum) * 100 }))
    .sort((a, b) => b.bytes - a.bytes);
  return { list, totalBytes: sum, perRepo };
}

/**
 * The public contribution calendar. This HTML fragment needs no auth and
 * carries exact per-day counts in its tool-tip elements.
 */
export async function fetchContributions() {
  const html = await get(`https://github.com/users/${LOGIN}/contributions`, {
    as: 'text',
    accept: 'text/html',
    noAuth: true,
  });

  const counts = new Map(); // cell id -> count
  const tipRe = /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g;
  let m;
  while ((m = tipRe.exec(html))) {
    const text = m[2].replace(/&nbsp;/g, ' ').trim();
    const num = /^([\d,]+)\s+contribution/i.exec(text);
    counts.set(m[1], num ? Number(num[1].replace(/,/g, '')) : 0);
  }

  const days = [];
  const tdRe = /<td\b([^>]*?)>/g;
  while ((m = tdRe.exec(html))) {
    const attrs = m[1];
    const date = /\bdata-date="([^"]+)"/.exec(attrs);
    if (!date) continue;
    const level = /\bdata-level="(\d)"/.exec(attrs);
    const id = /\bid="([^"]+)"/.exec(attrs);
    days.push({
      date: date[1],
      level: level ? Number(level[1]) : 0,
      count: id && counts.has(id[1]) ? counts.get(id[1]) : 0,
    });
  }

  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (days.length === 0) throw new Error('contribution calendar parsed to zero days');
  return days;
}

export async function fetchEvents() {
  try {
    return await get(`https://api.github.com/users/${LOGIN}/events/public?per_page=100`);
  } catch (err) {
    console.warn(`  events unavailable: ${err.message}`);
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Derived metrics
 * ------------------------------------------------------------------ */

export function streaks(days) {
  let longest = 0;
  let run = 0;
  let longestEnd = null;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      if (run > longest) {
        longest = run;
        longestEnd = d.date;
      }
    } else {
      run = 0;
    }
  }

  // Today may simply not be over yet, so an empty final day does not break a streak.
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  for (; i >= 0 && days[i].count > 0; i--) current++;

  return { current, longest, longestEnd };
}

export function monthly(days, months = 12) {
  const buckets = new Map();
  for (const d of days) {
    const key = d.date.slice(0, 7);
    buckets.set(key, (buckets.get(key) || 0) + d.count);
  }
  const keys = [...buckets.keys()].sort();
  const tail = keys.slice(-months);
  return tail.map((key) => {
    const [y, mo] = key.split('-').map(Number);
    return {
      key,
      year: y,
      month: mo,
      label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mo - 1],
      count: buckets.get(key),
    };
  });
}

export function busiest(days) {
  return days.reduce((best, d) => (d.count > (best?.count ?? -1) ? d : best), null);
}

/**
 * Day-granularity age. Panels use this rather than hour-precision on purpose:
 * an hours-ago string would change on every scheduled run and commit noise
 * into the repo even when no real number moved.
 */
export function relativeDay(iso, now = Date.now()) {
  if (!iso) return '';
  const days = Math.floor((now - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function relativeTime(iso, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const mos = Math.floor(days / 30);
  return mos < 12 ? `${mos}mo ago` : `${Math.floor(mos / 12)}y ago`;
}

export { LOGIN };
