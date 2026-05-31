// Live GitHub contribution heatmap.
// Fetches real per-day contribution counts on every page load and renders an
// inline SVG, so the graph reflects new commits within a minute of pushing.
// Colors come from CSS classes (.l0-.l4) in styles.css → blue (light) /
// green (dark). If the fetch fails, the server-rendered static SVG that's
// already in the page is left untouched as a fallback.
(function () {
  var USER = "VirSanghavi";
  var API = "https://github-contributions-api.jogruber.de/v4/" + USER + "?y=last";
  var CELL = 11, GAP = 2;

  var mount = document.querySelector(".github-graph .gh-cal-link");
  if (!mount) return;

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function iso(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function render(days) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayStr = iso(today);

    days = days.filter(function (x) { return x.date <= todayStr; });
    if (!days.length) return;

    var nonzero = days
      .map(function (x) { return x.count; })
      .filter(function (c) { return c > 0; })
      .sort(function (a, b) { return a - b; });

    function pct(p) {
      if (!nonzero.length) return 0;
      return nonzero[Math.min(nonzero.length - 1, Math.floor(nonzero.length * p))];
    }
    var q1 = pct(0.25), q2 = pct(0.5), q3 = pct(0.75);
    function level(c) {
      if (c <= 0) return 0;
      if (c <= q1) return 1;
      if (c <= q2) return 2;
      if (c <= q3) return 3;
      return 4;
    }

    var byDate = {};
    var total = 0;
    days.forEach(function (x) { byDate[x.date] = x.count; total += x.count; });

    var first = new Date(days[0].date + "T00:00:00");
    // pad back to the Sunday on/before the first day
    var start = new Date(first);
    start.setDate(start.getDate() - ((first.getDay()) % 7));

    var rects = [];
    var col = 0;
    var cur = new Date(start);
    while (cur <= today) {
      for (var row = 0; row < 7; row++) {
        var cell = new Date(start);
        cell.setDate(start.getDate() + col * 7 + row);
        if (cell < first || cell > today) continue;
        var ds = iso(cell);
        var cnt = byDate[ds] || 0;
        var lv = level(cnt);
        var x = col * (CELL + GAP) + 1;
        var y = row * (CELL + GAP) + 1;
        var label = cnt + " contribution" + (cnt === 1 ? "" : "s") + " on " + ds;
        rects.push(
          '<rect class="d l' + lv + '" x="' + x + '" y="' + y + '" width="' +
          CELL + '" height="' + CELL + '" rx="2"><title>' + label + "</title></rect>"
        );
      }
      col++;
      cur = new Date(start);
      cur.setDate(start.getDate() + col * 7);
    }

    var w = col * (CELL + GAP) + 1;
    var h = 7 * (CELL + GAP) + 1;
    var svg =
      '<svg class="gh-cal" viewBox="0 0 ' + w + " " + h + '" width="100%" ' +
      'role="img" aria-label="' + total + ' GitHub contributions in the last year" ' +
      'preserveAspectRatio="xMinYMid meet">' + rects.join("") + "</svg>";

    mount.innerHTML = svg;
  }

  fetch(API, { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      if (data && data.contributions && data.contributions.length) {
        render(data.contributions);
      }
    })
    .catch(function () { /* keep static fallback SVG already in the page */ });
})();
