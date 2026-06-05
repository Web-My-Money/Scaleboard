import { describe, it, expect } from "vitest";
import { isAllowed, RoleActionMap } from "../map";
import { canPerform, requirePermission, PermissionDeniedError } from "../requirePermission";
import type { Member } from "@/lib/schemas";

function member(role: Member["role"]): Member {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Test",
    email: "t@wmm.test",
    role,
    createdAt: new Date().toISOString(),
  };
}

describe("RoleActionMap", () => {
  it("admin can do everything", () => {
    for (const action of RoleActionMap.admin) {
      expect(isAllowed("admin", action)).toBe(true);
    }
    expect(isAllowed("admin", "team.manage")).toBe(true);
  });

  it("viewer can only view", () => {
    expect(isAllowed("viewer", "client.view")).toBe(true);
    expect(isAllowed("viewer", "team.view")).toBe(true);
    expect(isAllowed("viewer", "brief.commit")).toBe(false);
    expect(isAllowed("viewer", "team.manage")).toBe(false);
  });

  it("designer can edit creative requests but not strategy", () => {
    expect(isAllowed("designer", "module.creative-request.edit")).toBe(true);
    expect(isAllowed("designer", "module.strategy.run")).toBe(false);
  });

  it("media_buyer can edit test lab", () => {
    expect(isAllowed("media_buyer", "module.test-lab.edit")).toBe(true);
    expect(isAllowed("media_buyer", "module.creative-request.edit")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("throws PermissionDeniedError for unauthenticated user", () => {
    expect(() => requirePermission(null, "client.view")).toThrow(PermissionDeniedError);
  });

  it("throws for role lacking action", () => {
    expect(() => requirePermission(member("viewer"), "team.manage")).toThrow(
      PermissionDeniedError,
    );
  });

  it("passes for role with action", () => {
    expect(() => requirePermission(member("admin"), "team.manage")).not.toThrow();
  });
});

describe("canPerform", () => {
  it("returns false for null user", () => {
    expect(canPerform(null, "client.view")).toBe(false);
  });

  it("matches isAllowed", () => {
    expect(canPerform(member("strategist"), "module.strategy.run")).toBe(true);
    expect(canPerform(member("designer"), "module.strategy.run")).toBe(false);
  });
});
