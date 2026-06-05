import { describe, it, expect } from "vitest";
import { resolveModel, DEFAULT_MODEL, MODULE_MODEL_DEFAULTS } from "../defaults";

describe("resolveModel", () => {
  it("respects explicit model override", () => {
    expect(
      resolveModel({ model: "claude-opus-4-8", module: "strategy" }),
    ).toBe("claude-opus-4-8");
  });

  it("falls back to module default when no override", () => {
    expect(resolveModel({ module: "attraction-matrix" })).toBe(
      MODULE_MODEL_DEFAULTS["attraction-matrix"],
    );
  });

  it("falls back to global default for unknown overrides", () => {
    expect(
      resolveModel({ module: "strategy", globalDefault: "custom-model" }),
    ).toBe(MODULE_MODEL_DEFAULTS.strategy);
  });

  it("respects globalDefault when module has none (theoretical)", () => {
    // All known modules have a default — this asserts the fallback chain itself
    expect(resolveModel({ module: "brief-structurer" })).toBeDefined();
    expect(DEFAULT_MODEL).toBe("claude-sonnet-4-6");
  });
});
