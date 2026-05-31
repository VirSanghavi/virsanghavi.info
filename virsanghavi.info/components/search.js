(function () {
  var posts = [
  {
    "title": "What I've been up to: a few months of building Ravioli in the open",
    "url": "/posts/building-ravioli-in-the-open.html",
    "desc": "Anti-cheat forensics, cold-emailing billionaires, surviving a YC rejection, and running my startup between AP exams. Some lessons from a chaotic stretch.",
    "date": "30 May, 2026"
  },
  {
    "title": "My experience attending two YC hackathons back-to-back",
    "url": "/posts/2-yc-hackathons-in-a-row.html",
    "desc": "Feeling super blessed. Attended Browser-Use and Manufact hackathons in the span of two weeks and learned a lot.",
    "date": "01 Mar, 2026"
  },
  {
    "title": "What I learned from WAC's Academic WorldQuest 2026",
    "url": "/posts/academic-worldquest-2026.html",
    "desc": "Today was a rough day. High expectations met a lack of sufficient preparation.",
    "date": "16 Feb, 2026"
  },
  {
    "title": "Being Fifteen and Building Anyway",
    "url": "/posts/being-fifteen-and-building-anyway.html",
    "desc": "Starting early changes the slope.",
    "date": "15 Feb, 2026"
  },
  {
    "title": "What Getting Rejected from YC Twice Actually Feels Like",
    "url": "/posts/yc-rejection-and-building-stronger.html",
    "desc": "Nobody talks about how it actually feels. So I will.",
    "date": "15 Feb, 2026"
  },
  {
    "title": "Axis and Coordinated Intelligence",
    "url": "/posts/axis-and-coordinated-intelligence.html",
    "desc": "Intelligence scales when coordination scales.",
    "date": "11 Feb, 2026"
  },
  {
    "title": "Just Talk To It",
    "url": "/posts/just-talk-to-it.html",
    "desc": "The best interface is often no interface.",
    "date": "07 Feb, 2026"
  },
  {
    "title": "Ravioli and the Discipline of Incentives",
    "url": "/posts/tilt-and-the-discipline-of-incentives.html",
    "desc": "If you design incentives wrong, you don't have a platform. You have chaos.",
    "date": "27 Jan, 2026"
  },
  {
    "title": "Ravioli and the Cost of Fairness",
    "url": "/posts/ravioli-and-the-cost-of-fairness.html",
    "desc": "Fairness is not a feature. It's infrastructure.",
    "date": "13 Jan, 2026"
  },
  {
    "title": "Building in Public",
    "url": "/posts/building-in-public.html",
    "desc": "What I'm working on and why I write about it.",
    "date": "01 Jan, 2026"
  },
  {
    "title": "Finding My Spark",
    "url": "/posts/finding-my-spark.html",
    "desc": "How I went from messing around with code to Antler, YC, and building real products.",
    "date": "04 Nov, 2025"
  },
  {
    "title": "YC Agent Jam and Building with AI",
    "url": "/posts/yc-agent-jam-and-ai.html",
    "desc": "What I learned applying to YC three times and finally making it to Agent Jam.",
    "date": "02 Nov, 2025"
  },
  {
    "title": "Why Real-Time Debate Matters",
    "url": "/posts/why-realtime-debate-matters.html",
    "desc": "Moving from static polls to live, structured debate changes how groups decide.",
    "date": "17 Oct, 2025"
  },
  {
    "title": "Antler and Texas Truancy Law",
    "url": "/posts/antler-zero-to-one.html",
    "desc": "I got into Antler. Then I found out I couldn't go.",
    "date": "13 Aug, 2025"
  },
  {
    "title": "What We're Building at Ravioli (Tilt)",
    "url": "/posts/what-were-building-at-ravioli.html",
    "desc": "A product overview of Ravioli—a real-time logic market and prediction economy.",
    "date": "19 Jun, 2025"
  },
  {
    "title": "Shipping Fast and Staying Focused",
    "url": "/posts/shipping-fast.html",
    "desc": "Speed is about cutting scope, not moving faster.",
    "date": "28 Feb, 2025"
  },
  {
    "title": "Access and Leverage",
    "url": "/posts/up-the-ratios-and-leverage.html",
    "desc": "Talent is evenly distributed. Infrastructure isn't.",
    "date": "14 Dec, 2024"
  }
];

  var input = document.getElementById("search-input");
  var results = document.getElementById("search-results");
  if (!input || !results) return;

  function render(list) {
    if (list.length === 0) {
      results.innerHTML = '<li class="sr-empty">No posts found.</li>';
      return;
    }
    results.innerHTML = list.map(function (p) {
      return '<li><a href="' + p.url + '">' +
        '<div class="sr-title">' + highlight(p.title) + '</div>' +
        '<div class="sr-meta">' + p.date + '</div>' +
        '<div class="sr-desc">' + highlight(p.desc) + '</div>' +
        '</a></li>';
    }).join("");
  }

  var currentQuery = "";
  function highlight(text) {
    if (!currentQuery) return text;
    var idx = text.toLowerCase().indexOf(currentQuery);
    if (idx === -1) return text;
    return text.substring(0, idx) +
      '<mark style="background:color-mix(in srgb, var(--accent) 30%, transparent);color:inherit;border-radius:2px;padding:0 2px;">' +
      text.substring(idx, idx + currentQuery.length) + '</mark>' +
      text.substring(idx + currentQuery.length);
  }

  input.addEventListener("input", function () {
    currentQuery = input.value.toLowerCase().trim();
    if (!currentQuery) { results.innerHTML = ""; return; }
    var filtered = posts.filter(function (p) {
      return p.title.toLowerCase().indexOf(currentQuery) !== -1 ||
        p.desc.toLowerCase().indexOf(currentQuery) !== -1;
    });
    render(filtered);
  });
})();
