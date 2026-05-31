#!/usr/bin/env python3
"""Generate an accurate inline GitHub contribution heatmap SVG.

Pulls real per-day contribution counts from the jogruber API (which reads
GitHub's official GraphQL contribution data) and renders a GitHub-style
calendar as an inline SVG with 5 intensity levels. Colors are applied via
CSS classes (.l0-.l4) so the theme can switch blue (light) / green (dark).

Run from the site root:  python3 gen-github-cal.py
It rewrites the <!-- gh-cal-start --> ... <!-- gh-cal-end --> block in about.html.
"""
import json
import datetime
import urllib.request
import re
import sys

USER = "VirSanghavi"
API = f"https://github-contributions-api.jogruber.de/v4/{USER}?y=last"
ABOUT = "about.html"
CELL, GAP = 11, 2


def fetch():
    with urllib.request.urlopen(API, timeout=20) as r:
        return json.load(r)


def build_svg(data, today):
    days = [x for x in data["contributions"]
            if datetime.date.fromisoformat(x["date"]) <= today]
    bydate = {x["date"]: x["count"] for x in days}
    total = sum(bydate.values())

    counts = sorted(c for c in bydate.values() if c > 0)

    def pct(p):
        if not counts:
            return 0
        return counts[min(len(counts) - 1, int(len(counts) * p))]

    q1, q2, q3 = pct(0.25), pct(0.5), pct(0.75)

    def level(c):
        if c <= 0:
            return 0
        if c <= q1:
            return 1
        if c <= q2:
            return 2
        if c <= q3:
            return 3
        return 4

    first = datetime.date.fromisoformat(days[0]["date"])
    # pad back to the Sunday on/before the first day
    start = first - datetime.timedelta(days=(first.weekday() + 1) % 7)

    rects = []
    ncols = 0
    day = start
    col = 0
    while day <= today:
        for row in range(7):
            cur = start + datetime.timedelta(days=col * 7 + row)
            if cur < first or cur > today:
                continue
            ds = cur.isoformat()
            cnt = bydate.get(ds, 0)
            lv = level(cnt)
            x = col * (CELL + GAP) + 1
            y = row * (CELL + GAP) + 1
            label = f"{cnt} contribution{'s' if cnt != 1 else ''} on {ds}"
            rects.append(
                f'<rect class="d l{lv}" x="{x}" y="{y}" width="{CELL}" '
                f'height="{CELL}" rx="2"><title>{label}</title></rect>'
            )
        col += 1
        day = start + datetime.timedelta(days=col * 7)
    ncols = col

    w = ncols * (CELL + GAP) + 1
    h = 7 * (CELL + GAP) + 1
    svg = (
        f'<svg class="gh-cal" viewBox="0 0 {w} {h}" width="100%" '
        f'role="img" aria-label="{total} GitHub contributions in the last year" '
        f'preserveAspectRatio="xMinYMid meet">'
        + "".join(rects)
        + "</svg>"
    )
    return svg, total


def main():
    today = datetime.date.today()
    data = fetch()
    svg, total = build_svg(data, today)

    html = open(ABOUT).read()
    block = (
        "<!-- gh-cal-start -->\n"
        f"            {svg}\n"
        "            <!-- gh-cal-end -->"
    )
    pat = re.compile(r"<!-- gh-cal-start -->.*?<!-- gh-cal-end -->", re.DOTALL)
    if pat.search(html):
        html = pat.sub(block, html)
    else:
        print("ERROR: gh-cal markers not found in about.html", file=sys.stderr)
        sys.exit(1)
    open(ABOUT, "w").write(html)
    print(f"OK: rendered {total} contributions, {svg.count('<rect')} cells")


if __name__ == "__main__":
    main()
