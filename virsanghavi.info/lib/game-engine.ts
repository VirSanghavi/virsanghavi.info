/**
 * The ASCII asteroid game behind the "Play" button, extracted from the DOM so
 * the rules can be unit-tested. Values and pacing are carried over unchanged
 * from the original hand-written `components/game.js`.
 */

export const GAME_WIDTH = 50;
export const GAME_HEIGHT = 22;
export const SHIP = [" /^\\ ", "/ | \\", "|___|"] as const;
export const SHIP_WIDTH = 5;
export const ASTEROID_SHAPES = ["@", "*", "#", "o", "0"] as const;

export const SPEEDS: ReadonlyArray<{ label: string; value: number }> = [
  { label: "Easy", value: 10 },
  { label: "Medium", value: 7 },
  { label: "Hard", value: 4 },
];

export const HIGH_SCORE_KEY = "game_high_score";

export type Asteroid = { x: number; y: number; ch: string };
export type Bullet = { x: number; y: number };

export type GameState = {
  playerX: number;
  asteroids: Asteroid[];
  bullets: Bullet[];
  score: number;
  alive: boolean;
  tick: number;
  speed: number;
  highScore: number;
};

export function createState(highScore = 0, speed = SPEEDS[0].value): GameState {
  return {
    playerX: Math.floor(GAME_WIDTH / 2) - 2,
    asteroids: [],
    bullets: [],
    score: 0,
    alive: true,
    tick: 0,
    speed,
    highScore,
  };
}

/** Faster difficulty pays out more per asteroid. */
export function scoreMultiplier(speed: number): number {
  if (speed <= 4) return 2;
  if (speed <= 7) return 1.5;
  return 1;
}

export function spawnRate(score: number): number {
  return Math.max(4, 12 - Math.floor(score / 20));
}

export function clampPlayer(x: number): number {
  return Math.max(0, Math.min(GAME_WIDTH - SHIP_WIDTH, x));
}

export function shoot(state: GameState): void {
  if (!state.alive) return;
  state.bullets.push({ x: state.playerX + 2, y: GAME_HEIGHT - 4 });
}

/**
 * Advance one frame. `random` is injectable so tests are deterministic.
 * Mutates `state` in place, matching the original loop's allocation profile.
 */
export function update(state: GameState, random: () => number = Math.random): void {
  if (!state.alive) return;
  state.tick++;

  const multiplier = scoreMultiplier(state.speed);

  if (state.tick % state.speed === 0) {
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      state.asteroids[i].y++;
      if (state.asteroids[i].y >= GAME_HEIGHT) {
        state.asteroids.splice(i, 1);
        state.score += Math.round(1 * multiplier);
      }
    }
  }

  for (let b = state.bullets.length - 1; b >= 0; b--) {
    state.bullets[b].y -= 2;
    if (state.bullets[b].y < 0) {
      state.bullets.splice(b, 1);
      continue;
    }
    for (let a = state.asteroids.length - 1; a >= 0; a--) {
      const asteroid = state.asteroids[a];
      if (
        asteroid &&
        Math.abs(state.bullets[b].x - asteroid.x) <= 1 &&
        Math.abs(state.bullets[b].y - asteroid.y) <= 1
      ) {
        state.asteroids.splice(a, 1);
        state.bullets.splice(b, 1);
        state.score += Math.round(10 * multiplier);
        break;
      }
    }
  }

  if (state.tick % spawnRate(state.score) === 0) {
    state.asteroids.push({
      x: Math.floor(random() * (GAME_WIDTH - 2)) + 1,
      y: 0,
      ch: ASTEROID_SHAPES[Math.floor(random() * ASTEROID_SHAPES.length)],
    });
  }

  const shipY = GAME_HEIGHT - 3;
  for (const asteroid of state.asteroids) {
    if (asteroid.y >= shipY && asteroid.y < shipY + 3) {
      if (asteroid.x >= state.playerX && asteroid.x < state.playerX + SHIP_WIDTH) {
        state.alive = false;
        if (state.score > state.highScore) state.highScore = state.score;
      }
    }
  }
}

/** Render the play field to the exact character grid the `<pre>` displays. */
export function renderScreen(state: GameState): string {
  const grid: string[][] = [];
  for (let r = 0; r < GAME_HEIGHT; r++) {
    grid.push(new Array<string>(GAME_WIDTH).fill(" "));
  }

  for (const asteroid of state.asteroids) {
    if (asteroid.y >= 0 && asteroid.y < GAME_HEIGHT && asteroid.x >= 0 && asteroid.x < GAME_WIDTH) {
      grid[asteroid.y][asteroid.x] = asteroid.ch;
    }
  }

  for (const bullet of state.bullets) {
    if (bullet.y >= 0 && bullet.y < GAME_HEIGHT && bullet.x >= 0 && bullet.x < GAME_WIDTH) {
      grid[bullet.y][bullet.x] = "|";
    }
  }

  const shipY = GAME_HEIGHT - 3;
  for (let s = 0; s < SHIP.length; s++) {
    const line = SHIP[s];
    for (let c = 0; c < line.length; c++) {
      const gx = state.playerX + c;
      if (gx >= 0 && gx < GAME_WIDTH) grid[shipY + s][gx] = line[c];
    }
  }

  const border = `+${"-".repeat(GAME_WIDTH)}+`;
  return [border, ...grid.map((row) => `|${row.join("")}|`), border].join("\n");
}
