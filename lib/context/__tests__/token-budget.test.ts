import { describe, it, expect } from "vitest";
import { estimateTokens, truncateToBudget, CORE_CONTEXT_BUDGET } from "../token-budget";

describe("estimateTokens", () => {
  it("approximates 4 chars per token", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });
});

describe("truncateToBudget", () => {
  it("passes through when under budget", () => {
    const r = truncateToBudget("hello", 100);
    expect(r.truncated).toBe(false);
    expect(r.text).toBe("hello");
  });

  it("truncates with marker when over budget", () => {
    const long = "a".repeat(10_000);
    const r = truncateToBudget(long, 100);
    expect(r.truncated).toBe(true);
    expect(r.text).toContain("[truncated");
    expect(estimateTokens(r.text)).toBeLessThanOrEqual(100);
  });

  it("default budget is 500", () => {
    expect(CORE_CONTEXT_BUDGET).toBe(500);
  });
});
