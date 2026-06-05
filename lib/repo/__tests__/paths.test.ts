import { describe, it, expect } from "vitest";
import { slugFromName, uniqueSlug } from "../paths";

describe("slugFromName", () => {
  it("lowercases and hyphenates", () => {
    expect(slugFromName("Acme Corp")).toBe("acme-corp");
  });

  it("strips diacritics and special chars", () => {
    expect(slugFromName("Café Niño!")).toMatch(/^cafe-nino$/);
  });

  it("trims surrounding whitespace", () => {
    expect(slugFromName("   Hello World   ")).toBe("hello-world");
  });
});

describe("uniqueSlug", () => {
  it("returns base when no collision", async () => {
    const taken = new Set<string>();
    const r = await uniqueSlug("acme", async (s) => taken.has(s));
    expect(r).toBe("acme");
  });

  it("appends -2, -3 on collision", async () => {
    const taken = new Set(["acme", "acme-2"]);
    const r = await uniqueSlug("acme", async (s) => taken.has(s));
    expect(r).toBe("acme-3");
  });
});
