import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import slugifyLib from "slugify";
import { writeTextAtomic } from "@/lib/repo/atomic-write";
import { exists } from "@/lib/repo/paths";
import type { GuidelinesRepo, GuidelineDoc, GuidelinesLevel } from "./GuidelinesRepo";
import type { ModuleId } from "@/lib/ai/defaults";

const MAX_GUIDELINE_BYTES = 200_000; // ~50k tokens, generous cap

function slugify(name: string): string {
  return slugifyLib(name, { lower: true, strict: true, trim: true });
}

export class FsGuidelinesRepo implements GuidelinesRepo {
  /** data/guidelines/ */
  private readonly appRoot: string;
  /** data/clients/ */
  private readonly clientsRoot: string;

  constructor(dataRoot: string) {
    this.appRoot = path.join(path.resolve(dataRoot), "guidelines");
    this.clientsRoot = path.join(path.resolve(dataRoot), "clients");
  }

  // ── paths ──────────────────────────────────────────────────────────────

  private appDir(module: string) {
    return path.join(this.appRoot, module);
  }

  private clientDir(clientSlug: string, module: string) {
    return path.join(this.clientsRoot, clientSlug, "guidelines", module);
  }

  private filePath(dir: string, id: string) {
    return path.join(dir, `${id}.md`);
  }

  // ── listing ────────────────────────────────────────────────────────────

  async listAppGuidelines(module: ModuleId | "general"): Promise<GuidelineDoc[]> {
    return this.listDir(this.appDir(module), "app", module);
  }

  async listClientGuidelines(clientSlug: string, module: ModuleId | "general"): Promise<GuidelineDoc[]> {
    return this.listDir(this.clientDir(clientSlug, module), "client", module, clientSlug);
  }

  private async listDir(
    dir: string,
    level: GuidelinesLevel,
    module: ModuleId | "general",
    clientSlug?: string,
  ): Promise<GuidelineDoc[]> {
    if (!(await exists(dir))) return [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const docs: GuidelineDoc[] = [];
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith(".md")) continue;
      const id = e.name.replace(/\.md$/, "");
      const fullPath = path.join(dir, e.name);
      const stat = await fs.stat(fullPath);
      docs.push({
        id,
        filename: id.replace(/-/g, " "),
        module,
        level,
        clientSlug,
        sizeBytes: stat.size,
        updatedAt: stat.mtime.toISOString(),
      });
    }
    docs.sort((a, b) => a.filename.localeCompare(b.filename));
    return docs;
  }

  // ── reading ────────────────────────────────────────────────────────────

  async readAppGuideline(module: ModuleId | "general", id: string): Promise<string | null> {
    return this.readFile(this.filePath(this.appDir(module), id));
  }

  async readClientGuideline(clientSlug: string, module: ModuleId | "general", id: string): Promise<string | null> {
    return this.readFile(this.filePath(this.clientDir(clientSlug, module), id));
  }

  private async readFile(p: string): Promise<string | null> {
    if (!(await exists(p))) return null;
    const buf = await fs.readFile(p);
    return buf.slice(0, MAX_GUIDELINE_BYTES).toString("utf8");
  }

  // ── writing ────────────────────────────────────────────────────────────

  async saveAppGuideline(
    module: ModuleId | "general",
    filename: string,
    content: string,
  ): Promise<GuidelineDoc> {
    const dir = this.appDir(module);
    return this.saveFile(dir, module, filename, content, "app");
  }

  async saveClientGuideline(
    clientSlug: string,
    module: ModuleId | "general",
    filename: string,
    content: string,
  ): Promise<GuidelineDoc> {
    const dir = this.clientDir(clientSlug, module);
    return this.saveFile(dir, module, filename, content, "client", clientSlug);
  }

  private async saveFile(
    dir: string,
    module: ModuleId | "general",
    filename: string,
    content: string,
    level: GuidelinesLevel,
    clientSlug?: string,
  ): Promise<GuidelineDoc> {
    await fs.mkdir(dir, { recursive: true });
    const base = slugify(filename.replace(/\.(md|pdf|docx|txt)$/i, "")) || randomUUID().slice(0, 8);
    const id = base;
    const fullPath = this.filePath(dir, id);
    const trimmed = content.slice(0, MAX_GUIDELINE_BYTES);
    await writeTextAtomic(fullPath, trimmed);
    const stat = await fs.stat(fullPath);
    return {
      id,
      filename: filename.replace(/\.(md|pdf|docx|txt)$/i, ""),
      module,
      level,
      clientSlug,
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
    };
  }

  // ── deletion ───────────────────────────────────────────────────────────

  async deleteAppGuideline(module: ModuleId | "general", id: string): Promise<void> {
    const p = this.filePath(this.appDir(module), id);
    if (await exists(p)) await fs.unlink(p);
  }

  async deleteClientGuideline(clientSlug: string, module: ModuleId | "general", id: string): Promise<void> {
    const p = this.filePath(this.clientDir(clientSlug, module), id);
    if (await exists(p)) await fs.unlink(p);
  }

  // ── context assembly ───────────────────────────────────────────────────

  async assembleGuidelinesContext(
    clientSlug: string,
    module: ModuleId | "general",
  ): Promise<{ text: string; sources: string[] }> {
    const sections: string[] = [];
    const sources: string[] = [];

    // 1. App-level: general first, then module-specific
    const layers: Array<{ label: string; docs: GuidelineDoc[]; reader: (id: string) => Promise<string | null> }> = [
      {
        label: "App / General guidelines",
        docs: await this.listAppGuidelines("general"),
        reader: (id) => this.readAppGuideline("general", id),
      },
    ];

    if (module !== "general") {
      layers.push({
        label: `App / ${module} guidelines`,
        docs: await this.listAppGuidelines(module),
        reader: (id) => this.readAppGuideline(module, id),
      });
    }

    // 2. Client-level: general first, then module-specific
    layers.push({
      label: "Client / General guidelines",
      docs: await this.listClientGuidelines(clientSlug, "general"),
      reader: (id) => this.readClientGuideline(clientSlug, "general", id),
    });

    if (module !== "general") {
      layers.push({
        label: `Client / ${module} guidelines`,
        docs: await this.listClientGuidelines(clientSlug, module),
        reader: (id) => this.readClientGuideline(clientSlug, module, id),
      });
    }

    for (const layer of layers) {
      for (const doc of layer.docs) {
        const text = await layer.reader(doc.id);
        if (!text?.trim()) continue;
        sections.push(`## ${layer.label}: ${doc.filename}\n\n${text.trim()}`);
        sources.push(`${layer.label}: ${doc.filename}`);
      }
    }

    return {
      text: sections.length ? `# Guidelines\n\n${sections.join("\n\n---\n\n")}` : "",
      sources,
    };
  }
}
