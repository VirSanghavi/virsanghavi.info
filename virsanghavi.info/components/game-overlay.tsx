"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createState,
  clampPlayer,
  GAME_WIDTH,
  HIGH_SCORE_KEY,
  renderScreen,
  SHIP_WIDTH,
  shoot,
  SPEEDS,
  update,
  type GameState,
} from "@/lib/game-engine";

/** Dispatched on `window` by the header's Play button. */
export const GAME_TOGGLE_EVENT = "site:toggle-game";

function loadHighScore(): number {
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? "", 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    /* private mode: the score just does not persist */
  }
}

export function GameOverlay() {
  const [open, setOpen] = useState(false);
  const [hud, setHud] = useState({ score: 0, highScore: 0, alive: true });
  const [speed, setSpeed] = useState<number>(SPEEDS[0].value);

  const stateRef = useRef<GameState | null>(null);
  const screenRef = useRef<HTMLPreElement | null>(null);
  const sliderRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const openRef = useRef(false);

  openRef.current = open;

  const restart = useCallback(() => {
    stateRef.current = createState(loadHighScore(), speed);
    setHud({ score: 0, highScore: stateRef.current.highScore, alive: true });
  }, [speed]);

  useEffect(() => {
    const toggle = () => setOpen((value) => !value);
    window.addEventListener(GAME_TOGGLE_EVENT, toggle);
    return () => window.removeEventListener(GAME_TOGGLE_EVENT, toggle);
  }, []);

  // Keep the live game in step with the selected difficulty.
  useEffect(() => {
    if (stateRef.current) stateRef.current.speed = speed;
  }, [speed]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    restart();
    document.body.style.overflow = "hidden";

    let wasAlive = true;
    const loop = () => {
      const state = stateRef.current;
      if (state) {
        update(state);
        if (screenRef.current) screenRef.current.textContent = renderScreen(state);
        if (sliderRef.current) sliderRef.current.value = String(state.playerX);
        if (wasAlive && !state.alive) {
          wasAlive = false;
          saveHighScore(state.highScore);
        }
        setHud((prev) =>
          prev.score === state.score && prev.alive === state.alive && prev.highScore === state.highScore
            ? prev
            : { score: state.score, alive: state.alive, highScore: state.highScore },
        );
        if (state.alive) wasAlive = true;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      document.body.style.overflow = "";
    };
  }, [open, restart]);

  // Keyboard controls, active only while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state) return;

      if (event.key === "Escape") {
        setOpen(false);
        event.preventDefault();
        return;
      }
      if (!state.alive) {
        if (event.key === "Enter") {
          restart();
          event.preventDefault();
        }
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "a") {
        state.playerX = clampPlayer(state.playerX - 2);
        event.preventDefault();
      } else if (event.key === "ArrowRight" || event.key === "d") {
        state.playerX = clampPlayer(state.playerX + 2);
        event.preventDefault();
      } else if (event.key === " ") {
        shoot(state);
        event.preventDefault();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, restart]);

  // Swipe-to-steer on touch devices.
  useEffect(() => {
    if (!open) return;
    let lastX: number | null = null;

    const onTouchStart = (event: TouchEvent) => {
      lastX = event.touches[0].clientX;
    };
    const onTouchMove = (event: TouchEvent) => {
      const state = stateRef.current;
      if (!state || lastX === null) return;
      const currentX = event.touches[0].clientX;
      const dx = currentX - lastX;
      if (Math.abs(dx) > 5) {
        const direction = dx > 0 ? 1 : -1;
        const amount = Math.min(3, Math.ceil(Math.abs(dx) / 10));
        state.playerX = clampPlayer(state.playerX + direction * amount);
        lastX = currentX;
      }
      event.preventDefault();
    };
    const onTouchEnd = () => {
      lastX = null;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [open]);

  if (!open) return null;

  const best = hud.highScore > 0 ? <>{"  BEST: "}<span>{hud.highScore}</span></> : null;
  const newRecord = hud.score >= hud.highScore && hud.score > 0 ? "  NEW RECORD!" : "";

  return (
    <div className="game-overlay">
      <button
        className="game-close"
        type="button"
        aria-label="Close game"
        onClick={() => setOpen(false)}
      >
        ×
      </button>
      <div className="game-wrap">
        <pre className="game-screen" ref={screenRef} aria-label="Asteroid game play field" />
        <div className="game-hud" role="status">
          {hud.alive ? (
            <>
              {"SCORE: "}
              <span>{hud.score}</span>
              {best}
              {"  |  ← → move  SPACE shoot  ESC quit"}
            </>
          ) : (
            <>
              {"GAME OVER  SCORE: "}
              <span>{hud.score}</span>
              {best}
              {newRecord}
              {"  |  ENTER restart  ESC quit"}
            </>
          )}
        </div>
        <div className="game-speed-wrap">
          <span>Speed: </span>
          {SPEEDS.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`game-speed-btn${option.value === speed ? " active" : ""}`}
              onClick={() => setSpeed(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="game-mobile-controls">
          <input
            ref={sliderRef}
            type="range"
            className="game-move-slider"
            min={0}
            max={GAME_WIDTH - SHIP_WIDTH}
            defaultValue={Math.floor(GAME_WIDTH / 2) - 2}
            aria-label="Move ship"
            onChange={(event) => {
              const state = stateRef.current;
              if (state) state.playerX = clampPlayer(parseInt(event.target.value, 10));
            }}
          />
          <button
            className="game-ctrl-btn game-btn-fire"
            type="button"
            onClick={() => {
              if (stateRef.current) shoot(stateRef.current);
            }}
          >
            FIRE
          </button>
          <button
            className={`game-ctrl-btn game-btn-restart${hud.alive ? " hidden-strict" : ""}`}
            type="button"
            onClick={() => {
              if (stateRef.current && !stateRef.current.alive) restart();
            }}
          >
            RESTART
          </button>
        </div>
      </div>
    </div>
  );
}
