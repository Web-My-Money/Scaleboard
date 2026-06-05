import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FsClientRepo } from "../FsClientRepo";
import { ClientNotFoundError, CorruptArtifactError } from "../errors";
import type { Brief, BriefDraft } from "@/lib/schemas";

async function mkTmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "wmm-repo-"));
}

describe("FsClientRepo", () => {
  let tmp: string;
  let repo: FsClientRepo;

  beforeEach(async () => {
    tmp = await mkTmp();
    repo = new FsClientRepo(path.join(tmp, "clients"));
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it("creates a client with onboarding status and folder skeleton", async () => {
    const c = await repo.createClient({
      name: "Acme Corp",
      vertical: "SaaS",
      language: "es",
    });
    expect(c.slug).toBe("acme-corp");
    expect(c.status).toBe("onboarding");
    expect(c.id).toMatch(/^[0-9a-f-]{36}$/);

    const folder = path.join(tmp, "clients", "acme-corp");
    await expect(fs.access(path.join(folder, "client.json"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(folder, "context", "uploads"))).resolves.toBeUndefined();
  });

  it("disambiguates slugs on collision", async () => {
    const a = await repo.createClient({ name: "Acme", vertical: "v", language: "es" });
    const b = await repo.createClient({ name: "Acme", vertical: "v", language: "es" });
    expect(a.slug).toBe("acme");
    expect(b.slug).toBe("acme-2");
  });

  it("lists clients sorted by updatedAt desc", async () => {
    const a = await repo.createClient({ name: "A", vertical: "v", language: "es" });
    await new Promise((r) => setTimeout(r, 5));
    const b = await repo.createClient({ name: "B", vertical: "v", language: "es" });
    const list = await repo.listClients();
    expect(list.map((c) => c.id)).toEqual([b.id, a.id]);
  });

  it("getClient throws ClientNotFoundError for unknown id", async () => {
    await expect(repo.getClient("00000000-0000-0000-0000-000000000000")).rejects.toBeInstanceOf(
      ClientNotFoundError,
    );
  });

  it("updateClient bumps updatedAt and merges patch", async () => {
    const c = await repo.createClient({ name: "Acme", vertical: "v", language: "es" });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await repo.updateClient(c.id, { vertical: "ecommerce" });
    expect(updated.vertical).toBe("ecommerce");
    expect(updated.updatedAt > c.updatedAt).toBe(true);
  });

  it("saves and reads brief draft", async () => {
    const c = await repo.createClient({ name: "Acme", vertical: "v", language: "es" });
    const now = new Date().toISOString();
    const draft: BriefDraft = {
      rawPaste: "We sell widgets to product managers...",
      createdAt: now,
      updatedAt: now,
    };
    await repo.saveBriefDraft(c.id, draft);
    const read = await repo.getBriefDraft(c.id);
    expect(read?.rawPaste).toContain("widgets");
  });

  it("commitBrief writes brief.md, removes draft, flips status to active", async () => {
    const c = await repo.createClient({ name: "Acme", vertical: "v", language: "es" });
    const now = new Date().toISOString();
    await repo.saveBriefDraft(c.id, {
      rawPaste: "raw",
      createdAt: now,
      updatedAt: now,
    });

    const brief: Brief = {
      frontmatter: {
        offer: "AI-powered widgets",
        icp: "Product managers at SaaS scaleups",
        usp: "10x faster than manual",
        competitors: [{ name: "WidgetCo", slug: "widgetco" }],
        kpi: "MRR",
        budget: "$25k/mo",
        language: "es",
        approvedAt: now,
      },
      body: "## Approved prose\nLong-form brief body.",
    };
    await repo.commitBrief(c.id, brief);

    const slug = c.slug;
    const folder = path.join(tmp, "clients", slug);
    await expect(fs.access(path.join(folder, "brief.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(folder, "brief.draft.md"))).rejects.toThrow();
    await expect(fs.access(path.join(folder, "context", "ai-context.md"))).resolves.toBeUndefined();

    const refetched = await repo.getClient(c.id);
    expect(refetched.status).toBe("active");

    const readBack = await repo.getBrief(c.id);
    expect(readBack?.frontmatter.offer).toBe("AI-powered widgets");
  });

  it("surfaces CorruptArtifactError on invalid client.json", async () => {
    const c = await repo.createClient({ name: "Acme", vertical: "v", language: "es" });
    const file = path.join(tmp, "clients", c.slug, "client.json");
    await fs.writeFile(file, "{ not valid json", "utf8");
    await expect(repo.getClient(c.id)).rejects.toBeInstanceOf(CorruptArtifactError);
  });

  it("readArtifact returns null for missing artifact", async () => {
    const c = await repo.createClient({ name: "Acme", vertical: "v", language: "es" });
    const { z } = await import("zod");
    const r = await repo.readArtifact(c.id, ["densification-pack", "angles.json"], z.any());
    expect(r).toBeNull();
  });

  it("getCoreContext composes profile + brief summary", async () => {
    const c = await repo.createClient({ name: "Acme", vertical: "v", language: "es" });
    const now = new Date().toISOString();
    await repo.commitBrief(c.id, {
      frontmatter: {
        offer: "X",
        icp: "Y",
        usp: "Z",
        competitors: [],
        kpi: "MRR",
        budget: "$10k",
        language: "es",
        approvedAt: now,
      },
      body: "body",
    });
    const ctx = await repo.getCoreContext(c.id);
    expect(ctx.text).toContain("Acme");
    expect(ctx.text).toContain("Offer: X");
    expect(ctx.estimatedTokens).toBeGreaterThan(0);
  });

  it("atomic write leaves no .tmp file after success", async () => {
    const c = await repo.createClient({ name: "Acme", vertical: "v", language: "es" });
    const files = await fs.readdir(path.join(tmp, "clients", c.slug));
    expect(files.filter((f) => f.includes(".tmp"))).toEqual([]);
  });
});
