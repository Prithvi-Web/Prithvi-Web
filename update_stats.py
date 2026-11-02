#!/usr/bin/env python3
"""
Pulls live data from the GitHub GraphQL API and renders animated SVG cards.

  GH_TOKEN=xxx GH_LOGIN=Prithvi-Web python update_stats.py
  python update_stats.py --demo          (fake data, for previewing offline)

Outputs into ./assets: stats.svg, repos.svg, langs.svg, activity.svg
Only the standard library is used, so the Action needs no pip install.
"""
import datetime as dt
import json
import os
import random
import sys
import urllib.request
from html import escape

OUT = "assets"
os.makedirs(OUT, exist_ok=True)
LOGIN = os.environ.get("GH_LOGIN", "Prithvi-Web")
TOKEN = os.environ.get("GH_TOKEN", "")

FONT = '-apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif'
MONO = '"SF Mono", Menlo, Consolas, monospace'

QUERY = """
query($login: String!) {
  user(login: $login) {
    name
    followers { totalCount }
    pullRequests { totalCount }
    issues { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 50,
                 orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      nodes {
        name description url stargazerCount forkCount isArchived
        primaryLanguage { name color }
        languages(first: 6, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}
"""


def fetch():
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=json.dumps({"query": QUERY, "variables": {"login": LOGIN}}).encode(),
        headers={"Authorization": f"bearer {TOKEN}", "Content-Type": "application/json",
                 "User-Agent": "profile-readme-stats"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.load(r)
    if "errors" in body or not body.get("data", {}).get("user"):
        raise SystemExit(f"GitHub API error: {body.get('errors')}")
    return body["data"]["user"]


def demo():
    today = dt.date.today()
    weeks, d = [], today - dt.timedelta(days=today.weekday() + 1 + 52 * 7)
    for _ in range(53):
        days = []
        for _ in range(7):
            n = 0 if random.random() < 0.35 else random.choice([1, 2, 3, 5, 8, 12])
            days.append({"date": d.isoformat(), "contributionCount": 0 if d > today else n})
            d += dt.timedelta(days=1)
        weeks.append({"contributionDays": days})
    langs = [("Python", "#3572A5"), ("TypeScript", "#3178c6"), ("Swift", "#F05138"), ("Go", "#00ADD8")]
    nodes = []
    for i, nm in enumerate(["TreeMap-Disk-Visualizer", "EnvVault", "super-intelligen", "dotfiles"]):
        l = langs[i % 4]
        nodes.append({"name": nm, "description": "A demo description used only for the offline preview of this card.",
                      "url": "", "stargazerCount": 40 - i * 9, "forkCount": 6 - i, "isArchived": False,
                      "primaryLanguage": {"name": l[0], "color": l[1]},
                      "languages": {"edges": [{"size": 9000 - i * 1500, "node": {"name": l[0], "color": l[1]}},
                                              {"size": 2500, "node": {"name": "Shell", "color": "#89e051"}}]}})
    return {"name": "Demo", "followers": {"totalCount": 128}, "pullRequests": {"totalCount": 61},
            "issues": {"totalCount": 23}, "repositories": {"totalCount": 19, "nodes": nodes},
            "contributionsCollection": {"totalCommitContributions": 842,
                                        "contributionCalendar": {"totalContributions": 1190, "weeks": weeks}}}


# ----------------------------------------------------------- metrics ----
def compute(u):
    repos = [r for r in u["repositories"]["nodes"] if not r["isArchived"]]
    stars = sum(r["stargazerCount"] for r in u["repositories"]["nodes"])
    forks = sum(r["forkCount"] for r in u["repositories"]["nodes"])
    cal = u["contributionsCollection"]["contributionCalendar"]
    days = [d for w in cal["weeks"] for d in w["contributionDays"]]
    days.sort(key=lambda d: d["date"])
    today = dt.date.today().isoformat()
    days = [d for d in days if d["date"] <= today]
    active = sum(1 for d in days if d["contributionCount"] > 0)

    longest = run = 0
    for d in days:
        run = run + 1 if d["contributionCount"] > 0 else 0
        longest = max(longest, run)
    cur, i = 0, len(days) - 1
    if i >= 0 and days[i]["contributionCount"] == 0:
        i -= 1  # today may not have a commit yet, so do not break the streak
    while i >= 0 and days[i]["contributionCount"] > 0:
        cur += 1
        i -= 1
    best = max(days, key=lambda d: d["contributionCount"]) if days else {"contributionCount": 0, "date": ""}

    lang = {}
    for r in u["repositories"]["nodes"]:
        for e in r["languages"]["edges"]:
            n = e["node"]
            cur_l = lang.setdefault(n["name"], {"size": 0, "color": n["color"] or "#8e8e93"})
            cur_l["size"] += e["size"]
    total = sum(v["size"] for v in lang.values()) or 1
    langs = sorted(((k, v["size"] / total, v["color"]) for k, v in lang.items()), key=lambda t: -t[1])[:6]

    return dict(stars=stars, forks=forks, repos=u["repositories"]["totalCount"],
                followers=u["followers"]["totalCount"], prs=u["pullRequests"]["totalCount"],
                issues=u["issues"]["totalCount"],
                commits=u["contributionsCollection"]["totalCommitContributions"],
                contribs=cal["totalContributions"], active=active, cur=cur, longest=longest,
                best=best, days=days, top=repos[:4], langs=langs)


# ------------------------------------------------------------- render ----
def head(w, h, extra_css=""):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5ac8fa"/><stop offset="1" stop-color="#bf5af2"/></linearGradient>
<style>
 text{{font-family:{FONT}}} .t{{fill:#f5f5f7;font-weight:700;font-size:20px;letter-spacing:-.4px}}
 .l{{fill:#86868b;font-size:12px;letter-spacing:.3px}} .v{{fill:url(#g);font-weight:700;font-size:30px;letter-spacing:-1px}}
 .m{{font-family:{MONO}}} .card{{fill:#0b0b0d;stroke:#2c2c2e;stroke-width:1}}
 .pop{{animation:pop .7s cubic-bezier(.2,.8,.2,1) both}}
 @keyframes pop{{from{{opacity:0;transform:translateY(14px)}}to{{opacity:1;transform:none}}}}
 {extra_css}
</style></defs>
<rect width="{w}" height="{h}" rx="22" fill="#000"/>
<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="21.5" fill="none" stroke="#1c1c1e"/>'''


def stamp(w, h):
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return (f'<circle cx="24" cy="{h - 17}" r="3" fill="#30d158"><animate attributeName="opacity" '
            f'values="1;.2;1" dur="2s" repeatCount="indefinite"/></circle>'
            f'<text class="l m" x="34" y="{h - 13}" font-size="10">live data, updated {now}</text></svg>')


def fmt(n):
    return f"{n:,}"


def write(name, svg):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(svg)


def stats_svg(m):
    W, H = 840, 292
    tiles = [("Stars earned", m["stars"]), ("Forks", m["forks"]), ("Public repos", m["repos"]),
             ("Followers", m["followers"]), ("Contributions, 1y", m["contribs"]),
             ("Commits, 1y", m["commits"]), ("Pull requests", m["prs"]), ("Days with commits", m["active"]),
             ("Current streak", m["cur"]), ("Longest streak", m["longest"])]
    o = [head(W, H), f'<text class="t" x="24" y="40">GitHub by the numbers</text>']
    tw, gap = 152, 10
    for i, (label, val) in enumerate(tiles):
        r, c = divmod(i, 5)
        x, y = 20 + c * (tw + gap), 62 + r * 98
        unit = " days" if "streak" in label else ""
        o.append(f'<g class="pop" style="animation-delay:{i * .07:.2f}s"><rect class="card" x="{x}" y="{y}" '
                 f'width="{tw}" height="88" rx="16"/><text class="v" x="{x + 16}" y="{y + 44}">{fmt(val)}'
                 f'<tspan font-size="13" fill="#86868b" font-weight="500">{unit}</tspan></text>'
                 f'<text class="l" x="{x + 16}" y="{y + 68}">{escape(label)}</text></g>')
    o.append(stamp(W, H))
    write("stats.svg", "\n".join(o))


def trunc(s, n):
    s = (s or "No description yet.").strip()
    return s if len(s) <= n else s[: n - 1].rstrip() + "..."


def repos_svg(m):
    top = m["top"]
    rows = (len(top) + 1) // 2 or 1
    W, H = 840, 70 + rows * 116 + 30
    o = [head(W, H), '<text class="t" x="24" y="40">Top repositories</text>']
    for i, r in enumerate(top):
        rr, c = divmod(i, 2)
        x, y = 20 + c * 410, 62 + rr * 116
        lang = r["primaryLanguage"] or {"name": "n/a", "color": "#8e8e93"}
        o.append(
            f'<g class="pop" style="animation-delay:{i * .12:.2f}s"><rect class="card" x="{x}" y="{y}" width="400" height="104" rx="16"/>'
            f'<text x="{x + 18}" y="{y + 30}" fill="#f5f5f7" font-size="16" font-weight="600">{escape(r["name"])}</text>'
            f'<text x="{x + 18}" y="{y + 54}" fill="#86868b" font-size="12">{escape(trunc(r["description"], 58))}</text>'
            f'<circle cx="{x + 24}" cy="{y + 83}" r="5" fill="{lang["color"] or "#8e8e93"}"/>'
            f'<text x="{x + 36}" y="{y + 87}" fill="#aeaeb2" font-size="12">{escape(lang["name"])}</text>'
            f'<text x="{x + 160}" y="{y + 87}" fill="#ffd60a" font-size="12">&#9733; {fmt(r["stargazerCount"])}</text>'
            f'<text x="{x + 240}" y="{y + 87}" fill="#aeaeb2" font-size="12">forks {fmt(r["forkCount"])}</text></g>')
    o.append(stamp(W, H))
    write("repos.svg", "\n".join(o))


def langs_svg(m):
    W, H = 840, 200
    o = [head(W, H), '<text class="t" x="24" y="40">Languages</text>']
    bx, by, bw, bh = 24, 62, 792, 16
    o.append(f'<clipPath id="c"><rect x="{bx}" y="{by}" height="{bh}" rx="8"><animate attributeName="width" '
             f'from="0" to="{bw}" dur="1.6s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1" keyTimes="0;1"/></rect></clipPath>')
    o.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="8" fill="#1c1c1e"/><g clip-path="url(#c)">')
    x = bx
    for name, frac, color in m["langs"]:
        w = bw * frac
        o.append(f'<rect x="{x:.1f}" y="{by}" width="{w + .5:.1f}" height="{bh}" fill="{color}"/>')
        x += w
    o.append("</g>")
    for i, (name, frac, color) in enumerate(m["langs"]):
        r, c = divmod(i, 3)
        lx, ly = 24 + c * 266, 112 + r * 30
        o.append(f'<g class="pop" style="animation-delay:{.8 + i * .1:.2f}s"><circle cx="{lx + 5}" cy="{ly - 4}" r="5" fill="{color}"/>'
                 f'<text x="{lx + 18}" y="{ly}" fill="#f5f5f7" font-size="13" font-weight="500">{escape(name)}</text>'
                 f'<text x="{lx + 130}" y="{ly}" fill="#86868b" font-size="13" class="m">{frac * 100:.1f}%</text></g>')
    o.append(stamp(W, H))
    write("langs.svg", "\n".join(o))


def activity_svg(m):
    days = m["days"][-371:]
    first = dt.date.fromisoformat(days[0]["date"])
    lead = (first.weekday() + 1) % 7  # Sunday-first columns
    cell, gap, x0, y0 = 12, 3, 30, 66
    W, H = x0 + 53 * (cell + gap) + 20, y0 + 7 * (cell + gap) + 70
    mx = max([d["contributionCount"] for d in days] + [1])
    pal = ["#1c1c1e", "#0e4429", "#006d32", "#26a641", "#39d353"]

    def lvl(n):
        if n == 0:
            return 0
        return min(4, 1 + int(3 * (n - 1) / max(1, mx - 1)) if mx > 1 else 4)

    o = [head(W, H, ".c{transform-box:fill-box;transform-origin:center;animation:cp .5s ease-out both}"
                    "@keyframes cp{0%{opacity:0;transform:scale(.2)}70%{transform:scale(1.25)}100%{opacity:1;transform:scale(1)}}"),
         f'<text class="t" x="24" y="40">Commit activity, last year</text>',
         f'<text class="l" x="{W - 24}" y="40" text-anchor="end">best day: {m["best"]["contributionCount"]} on {m["best"]["date"]}</text>']
    for i, d in enumerate(days):
        idx = i + lead
        col, row = divmod(idx, 7)
        n = d["contributionCount"]
        o.append(f'<rect class="c" style="animation-delay:{col * .035:.2f}s" x="{x0 + col * (cell + gap) - 10}" '
                 f'y="{y0 + row * (cell + gap)}" width="{cell}" height="{cell}" rx="3" fill="{pal[lvl(n)]}">'
                 f'<title>{d["date"]}: {n} contributions</title></rect>')
    o.append(stamp(W, H))
    write("activity.svg", "\n".join(o))


if __name__ == "__main__":
    user = demo() if "--demo" in sys.argv else fetch()
    m = compute(user)
    stats_svg(m)
    repos_svg(m)
    langs_svg(m)
    activity_svg(m)
    print(f"ok: {m['stars']} stars, {m['active']} active days, streak {m['cur']}/{m['longest']}")
