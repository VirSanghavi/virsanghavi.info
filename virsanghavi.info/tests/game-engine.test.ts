import { describe, expect, it } from "vitest";
import {
  clampPlayer,
  createState,
  GAME_HEIGHT,
  GAME_WIDTH,
  renderScreen,
  scoreMultiplier,
  shoot,
  SHIP_WIDTH,
  spawnRate,
  SPEEDS,
  update,
} from "@/lib/game-engine";

const never = () => 0.999; // deterministic "random"

describe("difficulty", () => {
  it("pays more per asteroid on harder speeds", () => {
    expect(scoreMultiplier(SPEEDS[0].value)).toBe(1);
    expect(scoreMultiplier(SPEEDS[1].value)).toBe(1.5);
    expect(scoreMultiplier(SPEEDS[2].value)).toBe(2);
  });

  it("spawns faster as the score climbs, down to a floor", () => {
    expect(spawnRate(0)).toBe(12);
    expect(spawnRate(100)).toBe(7);
    expect(spawnRate(10_000)).toBe(4);
  });
});

describe("clampPlayer", () => {
  it("keeps the ship inside the field", () => {
    expect(clampPlayer(-5)).toBe(0);
    expect(clampPlayer(999)).toBe(GAME_WIDTH - SHIP_WIDTH);
    expect(clampPlayer(10)).toBe(10);
  });
});

describe("update", () => {
  it("does nothing once the player is dead", () => {
    const state = createState();
    state.alive = false;
    const before = JSON.stringify(state);
    update(state, never);
    expect(JSON.stringify(state)).toBe(before);
  });

  it("scores an asteroid that falls off the bottom", () => {
    // Easy speed (10) moves asteroids every 10th tick and pays 1x.
    const state = createState(0, SPEEDS[0].value);
    state.tick = SPEEDS[0].value - 1;
    state.asteroids = [{ x: 0, y: GAME_HEIGHT - 1, ch: "@" }];
    update(state, never);
    expect(state.asteroids).toHaveLength(0);
    expect(state.score).toBe(1);
  });

  it("doubles the payout on the hardest speed", () => {
    const state = createState(0, SPEEDS[2].value);
    state.tick = SPEEDS[2].value - 1;
    state.asteroids = [{ x: 0, y: GAME_HEIGHT - 1, ch: "@" }];
    update(state, never);
    expect(state.score).toBe(2);
  });

  it("scores ten for shooting an asteroid down", () => {
    const state = createState(0, 100);
    state.asteroids = [{ x: 10, y: 10, ch: "@" }];
    state.bullets = [{ x: 10, y: 11 }];
    update(state, never);
    expect(state.asteroids).toHaveLength(0);
    expect(state.bullets).toHaveLength(0);
    expect(state.score).toBe(10);
  });

  it("ends the game when an asteroid hits the ship", () => {
    const state = createState(0, 100);
    state.asteroids = [{ x: state.playerX + 1, y: GAME_HEIGHT - 3, ch: "@" }];
    update(state, never);
    expect(state.alive).toBe(false);
  });

  it("records a new high score on death", () => {
    const state = createState(5, 100);
    state.score = 42;
    state.asteroids = [{ x: state.playerX, y: GAME_HEIGHT - 3, ch: "@" }];
    update(state, never);
    expect(state.highScore).toBe(42);
  });

  it("keeps the old high score when the run was worse", () => {
    const state = createState(99, 100);
    state.score = 3;
    state.asteroids = [{ x: state.playerX, y: GAME_HEIGHT - 3, ch: "@" }];
    update(state, never);
    expect(state.highScore).toBe(99);
  });

  it("retires bullets that leave the top of the field", () => {
    const state = createState(0, 100);
    state.bullets = [{ x: 5, y: 1 }];
    update(state, never);
    expect(state.bullets).toHaveLength(0);
  });
});

describe("shoot", () => {
  it("fires from the nose of the ship", () => {
    const state = createState();
    shoot(state);
    expect(state.bullets).toEqual([{ x: state.playerX + 2, y: GAME_HEIGHT - 4 }]);
  });

  it("is inert after game over", () => {
    const state = createState();
    state.alive = false;
    shoot(state);
    expect(state.bullets).toHaveLength(0);
  });
});

describe("renderScreen", () => {
  const state = createState();
  const lines = renderScreen(state).split("\n");

  it("draws a bordered field of the right size", () => {
    expect(lines).toHaveLength(GAME_HEIGHT + 2);
    expect(lines[0]).toBe(`+${"-".repeat(GAME_WIDTH)}+`);
    expect(lines.at(-1)).toBe(lines[0]);
    for (const line of lines) expect(line).toHaveLength(GAME_WIDTH + 2);
  });

  it("draws the ship three rows above the bottom border", () => {
    expect(lines[GAME_HEIGHT - 2]).toContain("/^\\");
    expect(lines[GAME_HEIGHT]).toContain("|___|");
  });

  it("draws asteroids and bullets at their coordinates", () => {
    const withStuff = createState();
    withStuff.asteroids = [{ x: 3, y: 2, ch: "@" }];
    withStuff.bullets = [{ x: 7, y: 4 }];
    const rows = renderScreen(withStuff).split("\n");
    expect(rows[3][4]).toBe("@");
    expect(rows[5][8]).toBe("|");
  });
});
