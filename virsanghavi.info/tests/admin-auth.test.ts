import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

const { issueToken, verifyToken, passwordMatches, tooManyAttempts, recordAttempt, clearAttempts } = await import("@/lib/admin/auth");

describe("admin session token", () => {
  it("round-trips with the right key and fails with a wrong, expired or tampered one", () => {
    const now = 1_800_000_000;
    const token = issueToken(now, "key")!;
    expect(verifyToken(token, now, "key")).toBe(true);
    expect(verifyToken(token, now + 30 * 24 * 3600 + 1, "key")).toBe(false);
    expect(verifyToken(token, now, "other")).toBe(false);
    expect(verifyToken(`${token}x`, now, "key")).toBe(false);
    expect(verifyToken(token.replace(/^\d+/, String(now + 10_000_000)), now, "key")).toBe(false);
    expect(verifyToken(undefined, now, "key")).toBe(false);
    expect(issueToken(now, null)).toBeNull();
  });
});

describe("password", () => {
  it("matches only the exact configured value", () => {
    expect(passwordMatches("correct-horse-battery", "correct-horse-battery")).toBe(true);
    expect(passwordMatches("Correct-horse-battery", "correct-horse-battery")).toBe(false);
    expect(passwordMatches("correct-horse-batter", "correct-horse-battery")).toBe(false);
    expect(passwordMatches("", "correct-horse-battery")).toBe(false);
    expect(passwordMatches("correct-horse-battery", undefined)).toBe(false);
  });

  it("locks an address out after eight misses within ten minutes", () => {
    const now = 1_000_000;
    clearAttempts("ip");
    for (let i = 0; i < 8; i++) {
      expect(tooManyAttempts("ip", now)).toBe(false);
      recordAttempt("ip", now);
    }
    expect(tooManyAttempts("ip", now)).toBe(true);
    expect(tooManyAttempts("ip", now + 11 * 60_000)).toBe(false);
    clearAttempts("ip");
  });
});
