import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FsTeamRepo } from "../FsTeamRepo";

async function mkTmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "wmm-team-"));
}

describe("FsTeamRepo", () => {
  let tmp: string;
  let repo: FsTeamRepo;

  beforeEach(async () => {
    tmp = await mkTmp();
    repo = new FsTeamRepo(tmp);
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it("returns empty list before any member is added", async () => {
    expect(await repo.listMembers()).toEqual([]);
    expect(await repo.getActiveUserId()).toBeNull();
  });

  it("invites first member and sets them as active user", async () => {
    const m = await repo.inviteMember({
      name: "Owner",
      email: "owner@wmm.test",
      role: "admin",
    });
    expect(m.role).toBe("admin");
    expect(await repo.getActiveUserId()).toBe(m.id);
  });

  it("rejects duplicate email", async () => {
    await repo.inviteMember({ name: "A", email: "a@wmm.test", role: "admin" });
    await expect(
      repo.inviteMember({ name: "Another A", email: "A@WMM.TEST", role: "viewer" }),
    ).rejects.toThrow(/already exists/);
  });

  it("updates member role", async () => {
    const m = await repo.inviteMember({ name: "X", email: "x@wmm.test", role: "viewer" });
    const updated = await repo.updateMember(m.id, { role: "designer" });
    expect(updated.role).toBe("designer");
  });

  it("removeMember re-assigns active user", async () => {
    const a = await repo.inviteMember({ name: "A", email: "a@wmm.test", role: "admin" });
    const b = await repo.inviteMember({ name: "B", email: "b@wmm.test", role: "viewer" });
    await repo.removeMember(a.id);
    expect(await repo.getActiveUserId()).toBe(b.id);
  });

  it("rejects setting active user to unknown id", async () => {
    await repo.inviteMember({ name: "A", email: "a@wmm.test", role: "admin" });
    await expect(
      repo.setActiveUserId("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow(/unknown id/);
  });
});
