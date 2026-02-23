(function () {
  var W = 50, H = 22;
  var player, asteroids, bullets, score, alive, tick, speed, highScore, moveSlider, speedBtns = [], btnRestart;
  var overlay, screen, hud, raf;

  var SHIP = [" /^\\ ", "/ | \\", "|___|"];
  var SHIP_W = 5;

  function loadHighScore() {
    try { return parseInt(localStorage.getItem("game_high_score")) || 0; } catch (e) { return 0; }
  }

  function saveHighScore(s) {
    try { localStorage.setItem("game_high_score", s); } catch (e) { }
  }

  // Removed getSpeedFromSlider - using explicit speeds now

  function init() {
    player = { x: Math.floor(W / 2) - 2 };
    asteroids = [];
    bullets = [];
    score = 0;
    alive = true;
    tick = 0;
    speed = 10; // Default 1x speed
    highScore = loadHighScore();
  }

  function spawnAsteroid() {
    var shapes = ["@", "*", "#", "o", "0"];
    asteroids.push({
      x: Math.floor(Math.random() * (W - 2)) + 1,
      y: 0,
      ch: shapes[Math.floor(Math.random() * shapes.length)]
    });
  }

  function update() {
    if (!alive) return;
    tick++;

    // Faster play gives higher score
    // Faster play gives higher score
    // 1x(speed 10) -> 1, 2x(speed 7) -> 1.5, 3x(speed 4) -> 2
    var multiplier = speed <= 4 ? 2 : (speed <= 7 ? 1.5 : 1);

    if (tick % speed === 0) {
      for (var i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].y++;
        if (asteroids[i].y >= H) {
          asteroids.splice(i, 1);
          score += Math.round(1 * multiplier);
        }
      }
    }

    for (var b = bullets.length - 1; b >= 0; b--) {
      bullets[b].y -= 2; // Keep bullet speed high for responsiveness
      if (bullets[b].y < 0) { bullets.splice(b, 1); continue; }
      for (var a = asteroids.length - 1; a >= 0; a--) {
        if (asteroids[a] && Math.abs(bullets[b].x - asteroids[a].x) <= 1 && Math.abs(bullets[b].y - asteroids[a].y) <= 1) {
          asteroids.splice(a, 1);
          bullets.splice(b, 1);
          score += Math.round(10 * multiplier); // Increased hit score + multiplier
          break;
        }
      }
    }

    var spawnRate = Math.max(4, 12 - Math.floor(score / 20));
    if (tick % spawnRate === 0) spawnAsteroid();

    // Speed is controlled by buttons now, not repeatedly set from slider

    var shipY = H - 3;
    for (var a2 = 0; a2 < asteroids.length; a2++) {
      var ast = asteroids[a2];
      if (ast.y >= shipY && ast.y < shipY + 3) {
        if (ast.x >= player.x && ast.x < player.x + SHIP_W) {
          alive = false;
          if (score > highScore) {
            highScore = score;
            saveHighScore(highScore);
          }
        }
      }
    }
  }

  function render() {
    var grid = [];
    for (var r = 0; r < H; r++) {
      var row = [];
      for (var c = 0; c < W; c++) row.push(" ");
      grid.push(row);
    }

    for (var i = 0; i < asteroids.length; i++) {
      var a = asteroids[i];
      if (a.y >= 0 && a.y < H && a.x >= 0 && a.x < W) {
        grid[a.y][a.x] = a.ch;
      }
    }

    for (var b = 0; b < bullets.length; b++) {
      var bul = bullets[b];
      if (bul.y >= 0 && bul.y < H) grid[bul.y][bul.x] = "|";
    }

    var shipY = H - 3;
    for (var s = 0; s < 3; s++) {
      var line = SHIP[s];
      for (var c2 = 0; c2 < line.length; c2++) {
        var gx = player.x + c2;
        if (gx >= 0 && gx < W) grid[shipY + s][gx] = line[c2];
      }
    }

    var border = "+" + repeat("-", W) + "+";
    var lines = [border];
    for (var r2 = 0; r2 < H; r2++) {
      lines.push("|" + grid[r2].join("") + "|");
    }
    lines.push(border);

    screen.textContent = lines.join("\n");

    var hs = highScore > 0 ? "  BEST: <span>" + highScore + "</span>" : "";
    if (alive) {
      hud.innerHTML = "SCORE: <span>" + score + "</span>" + hs +
        "  |  \u2190 \u2192 move  SPACE shoot  ESC quit";
    } else {
      var newRecord = score >= highScore && score > 0 ? "  NEW RECORD!" : "";
      hud.innerHTML = "GAME OVER  SCORE: <span>" + score + "</span>" + hs + newRecord +
        "  |  ENTER restart  ESC quit";
    }
    if (moveSlider) moveSlider.value = player.x;
    if (btnRestart) {
      if (!alive) btnRestart.classList.remove("hidden-strict");
      else btnRestart.classList.add("hidden-strict");
    }
  }

  function repeat(ch, n) {
    var s = "";
    for (var i = 0; i < n; i++) s += ch;
    return s;
  }

  function loop() {
    update();
    render();
    raf = requestAnimationFrame(loop);
  }

  function open() {
    if (!overlay) build();
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    init();
    loop();
  }

  function close() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (overlay) overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function build() {
    overlay = document.createElement("div");
    overlay.className = "game-overlay hidden";
    var closeBtn = document.createElement("button");
    closeBtn.className = "game-close";
    closeBtn.setAttribute("type", "button");
    closeBtn.setAttribute("aria-label", "Close game");
    closeBtn.textContent = "\u00D7";
    closeBtn.addEventListener("click", close);
    var wrap = document.createElement("div");
    wrap.className = "game-wrap";
    screen = document.createElement("pre");
    screen.className = "game-screen";
    hud = document.createElement("div");
    hud.className = "game-hud";
    wrap.appendChild(screen);
    wrap.appendChild(hud);

    var speedWrap = document.createElement("div");
    speedWrap.className = "game-speed-wrap";
    var speedLabel = document.createElement("span");
    speedLabel.textContent = "Speed: ";
    speedWrap.appendChild(speedLabel);

    var speeds = [
      { label: "Easy", val: 10 },
      { label: "Medium", val: 7 },
      { label: "Hard", val: 4 }
    ];

    speeds.forEach(function (s) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "game-speed-btn" + (s.val === 10 ? " active" : "");
      btn.textContent = s.label;
      btn.addEventListener("click", function () {
        speed = s.val;
        speedBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
      });
      speedBtns.push(btn);
      speedWrap.appendChild(btn);
    });

    wrap.appendChild(speedWrap);

    var mobileControls = document.createElement("div");
    mobileControls.className = "game-mobile-controls";

    // Movement Slider
    moveSlider = document.createElement("input");
    moveSlider.type = "range";
    moveSlider.className = "game-move-slider";
    moveSlider.min = 0;
    moveSlider.max = W - SHIP_W;
    moveSlider.addEventListener("input", function (e) {
      player.x = parseInt(e.target.value, 10);
    });
    moveSlider.addEventListener("touchstart", function (e) { e.stopPropagation(); }, { passive: true });

    var btnFire = document.createElement("button");
    btnFire.className = "game-ctrl-btn game-btn-fire";
    btnFire.setAttribute("type", "button");
    btnFire.textContent = "FIRE";

    function preventAndShoot(e) { e.preventDefault(); shoot(); }

    btnFire.addEventListener("click", shoot);
    btnFire.addEventListener("touchstart", preventAndShoot, { passive: false });

    btnRestart = document.createElement("button");
    btnRestart.className = "game-ctrl-btn game-btn-restart hidden-strict";
    btnRestart.setAttribute("type", "button");
    btnRestart.textContent = "RESTART";
    btnRestart.addEventListener("click", function () { if (!alive) init(); });
    btnRestart.addEventListener("touchstart", function (e) {
      e.preventDefault();
      if (!alive) init();
    }, { passive: false });

    mobileControls.appendChild(moveSlider);
    mobileControls.appendChild(btnFire);
    mobileControls.appendChild(btnRestart);
    wrap.appendChild(mobileControls);

    overlay.appendChild(closeBtn);
    overlay.appendChild(wrap);
    document.body.appendChild(overlay);
  }

  function shoot() {
    if (!alive) return;
    bullets.push({ x: player.x + 2, y: H - 4 });
  }

  document.addEventListener("keydown", function (e) {
    if (!overlay || overlay.classList.contains("hidden")) return;

    if (e.key === "Escape") { close(); e.preventDefault(); return; }

    if (!alive) {
      if (e.key === "Enter") { init(); e.preventDefault(); }
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "a") {
      player.x = Math.max(0, player.x - 2);
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "d") {
      player.x = Math.min(W - SHIP_W, player.x + 2);
      e.preventDefault();
    } else if (e.key === " ") {
      shoot();
      e.preventDefault();
    }
  });

  var touchStartX = null;
  var touchLastX = null;
  document.addEventListener("touchstart", function (e) {
    if (!overlay || overlay.classList.contains("hidden")) return;
    touchStartX = e.touches[0].clientX;
    touchLastX = touchStartX;
  });
  document.addEventListener("touchmove", function (e) {
    if (!overlay || overlay.classList.contains("hidden") || touchLastX === null) return;
    var currentX = e.touches[0].clientX;
    var dx = currentX - touchLastX;

    // Smooth swipe movement
    if (Math.abs(dx) > 5) {
      var moveDir = dx > 0 ? 1 : -1;
      var moveAmt = Math.min(3, Math.ceil(Math.abs(dx) / 10)); // Responsive scale
      player.x = Math.max(0, Math.min(W - SHIP_W, player.x + (moveDir * moveAmt)));
      touchLastX = currentX;
    }
    e.preventDefault();
  }, { passive: false });
  document.addEventListener("touchend", function () {
    touchStartX = null;
    touchLastX = null;
  });

  var btn = document.getElementById("game-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      if (overlay && !overlay.classList.contains("hidden")) close();
      else open();
    });
  }
})();
