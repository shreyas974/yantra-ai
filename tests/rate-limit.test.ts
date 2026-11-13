import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  it("allows requests under the limit and tracks remaining quota", () => {
    const key = `test-ip-${Date.now()}`;
    const first = checkRateLimit(key, 3, 1000);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = checkRateLimit(key, 3, 1000);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);

    const third = checkRateLimit(key, 3, 1000);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = checkRateLimit(key, 3, 1000);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
  });
});
