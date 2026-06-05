import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import matter from "gray-matter";
import type { ZodSchema } from "zod";
import {
  ClientSchema,
  ClientSummarySchema,
  CreateClientInputSchema,
  BriefSchema,
  BriefFrontmatterSchema,
  BriefDraftSchema,
} from "@/lib/schemas";
import type {
  Client,
  ClientSummary,
  CreateClientInput,
  Brief,
  BriefDraft,
} from "@/lib/schemas";
import type {
  ClientRepo,
  ArtifactDir,
  ArtifactPath,
  ArtifactRef,
  ContextScope,
  CoreContext,
} from "./ClientRepo";
import {
  artifactPath,
  clientFolder,
  exists,
  resolveRepoPaths,
  slugFromName,
  uniqueSlug,
  type RepoPaths,
} from "./paths";
import { writeJsonAtomic, writeTextAtomic } from "./atomic-write";
import { ClientNotFoundError, CorruptArtifactError, RepoError } from "./errors";
import { truncateToBudget, CORE_CONTEXT_BUDGET, estimateTokens } from "@/lib/context";

const CLIENT_FILE = "client.json";
const BRIEF_FILE = "brief.md";
const BRIEF_DRAFT_FILE = "brief.draft.md";
const AI_CONTEXT_FILE = path.join("context", "ai-context.md");

export class FsClientRepo implements ClientRepo {
  private readonly paths: RepoPaths;

  constructor(clientsRoot: string) {
    this.paths = resolveRepoPaths(clientsRoot);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────

  async listClients(): Promise<ClientSummary[]> {
    await fs.mkdir(this.paths.clientsRoot, { recursive: true });
    const entries = await fs.readdir(this.paths.clientsRoot, { withFileTypes: true });
    const summaries: ClientSummary[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const client = await this.readClientFile(entry.name);
        summaries.push(ClientSummarySchema.parse(client));
      } catch (err) {
        if (err instanceof CorruptArtifactError) throw err;
        // If client.json is missing, skip (incomplete folder).
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
    }
    summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return summaries;
  }

  async getClient(id: string): Promise<Client> {
    const slug = await this.requireSlugForId(id);
    return this.readClientFile(slug);
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const parsed = CreateClientInputSchema.parse(input);
    await fs.mkdir(this.paths.clientsRoot, { recursive: true });
    const baseSlug = parsed.slug ?? slugFromName(parsed.name);
    if (!baseSlug) throw new RepoError("Could not derive slug from name");
    const slug = await uniqueSlug(baseSlug, (s) =>
      exists(path.join(this.paths.clientsRoot, s)),
    );
    const now = new Date().toISOString();
    const client: Client = {
      id: randomUUID(),
      slug,
      name: parsed.name,
      vertical: parsed.vertical,
      status: "onboarding",
      language: parsed.language,
      platforms: parsed.platforms ?? {},
      owners: [],
      assignments: {},
      createdAt: now,
      updatedAt: now,
    };
    ClientSchema.parse(client);

    const folder = clientFolder(this.paths, slug);
    await fs.mkdir(folder, { recursive: true });
    await fs.mkdir(path.join(folder, "context"), { recursive: true });
    await fs.mkdir(path.join(folder, "context", "uploads"), { recursive: true });
    await writeJsonAtomic(path.join(folder, CLIENT_FILE), client);
    return client;
  }

  async updateClient(id: string, patch: Partial<Client>): Promise<Client> {
    const slug = await this.requireSlugForId(id);
    const current = await this.readClientFile(slug);
    const merged: Client = {
      ...current,
      ...patch,
      id: current.id,
      slug: current.slug,
      updatedAt: new Date().toISOString(),
    };
    ClientSchema.parse(merged);
    await writeJsonAtomic(path.join(clientFolder(this.paths, slug), CLIENT_FILE), merged);
    return merged;
  }

  async archiveClient(id: string): Promise<void> {
    await this.updateClient(id, { status: "archived" });
  }

  // ─── Brief ─────────────────────────────────────────────────────────────

  async getBriefDraft(id: string): Promise<BriefDraft | null> {
    const slug = await this.requireSlugForId(id);
    const file = path.join(clientFolder(this.paths, slug), BRIEF_DRAFT_FILE);
    if (!(await exists(file))) return null;
    const raw = await fs.readFile(file, "utf8");
    const parsed = matter(raw);
    try {
      return BriefDraftSchema.parse({
        rawPaste: parsed.content,
        extracted: parsed.data?.extracted,
        createdAt: parsed.data?.createdAt,
        updatedAt: parsed.data?.updatedAt,
      });
    } catch (err) {
      throw new CorruptArtifactError(id, BRIEF_DRAFT_FILE, err);
    }
  }

  async saveBriefDraft(id: string, draft: BriefDraft): Promise<void> {
    const slug = await this.requireSlugForId(id);
    const parsed = BriefDraftSchema.parse(draft);
    const file = path.join(clientFolder(this.paths, slug), BRIEF_DRAFT_FILE);
    const fm: Record<string, unknown> = {
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    };
    if (parsed.extracted) fm.extracted = parsed.extracted;
    const body = matter.stringify(parsed.rawPaste, fm);
    await writeTextAtomic(file, body);
  }

  async commitBrief(id: string, approved: Brief): Promise<void> {
    const slug = await this.requireSlugForId(id);
    BriefSchema.parse(approved);
    const file = path.join(clientFolder(this.paths, slug), BRIEF_FILE);
    const body = matter.stringify(approved.body, approved.frontmatter);
    await writeTextAtomic(file, body);

    const draftFile = path.join(clientFolder(this.paths, slug), BRIEF_DRAFT_FILE);
    if (await exists(draftFile)) await fs.unlink(draftFile);

    await this.updateClient(id, {
      status: "active",
      language: approved.frontmatter.language,
    });

    await this.regenerateAiContext(slug);
  }

  async getBrief(id: string): Promise<Brief | null> {
    const slug = await this.requireSlugForId(id);
    const file = path.join(clientFolder(this.paths, slug), BRIEF_FILE);
    if (!(await exists(file))) return null;
    const raw = await fs.readFile(file, "utf8");
    const parsed = matter(raw);
    try {
      return {
        frontmatter: BriefFrontmatterSchema.parse(parsed.data),
        body: parsed.content,
      };
    } catch (err) {
      throw new CorruptArtifactError(id, BRIEF_FILE, err);
    }
  }

  // ─── Generic artifact I/O ──────────────────────────────────────────────

  async readArtifact<T>(id: string, p: ArtifactPath, schema: ZodSchema<T>): Promise<T | null> {
    const slug = await this.requireSlugForId(id);
    const file = artifactPath(this.paths, slug, p);
    if (!(await exists(file))) return null;
    const raw = await fs.readFile(file, "utf8");
    const data = file.endsWith(".json") ? JSON.parse(raw) : raw;
    try {
      return schema.parse(data);
    } catch (err) {
      throw new CorruptArtifactError(id, file, err);
    }
  }

  async writeArtifact<T>(
    id: string,
    p: ArtifactPath,
    data: T,
    schema: ZodSchema<T>,
  ): Promise<void> {
    const slug = await this.requireSlugForId(id);
    const validated = schema.parse(data);
    const file = artifactPath(this.paths, slug, p);
    if (file.endsWith(".json")) {
      await writeJsonAtomic(file, validated);
    } else if (typeof validated === "string") {
      await writeTextAtomic(file, validated);
    } else {
      throw new RepoError(`Cannot write non-string non-JSON artifact at ${file}`);
    }
  }

  async listArtifacts(id: string, dir: ArtifactDir): Promise<ArtifactRef[]> {
    const slug = await this.requireSlugForId(id);
    const folder = path.join(clientFolder(this.paths, slug), dir);
    if (!(await exists(folder))) return [];
    const entries = await fs.readdir(folder, { withFileTypes: true });
    const refs: ArtifactRef[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(folder, entry.name);
      const stat = await fs.stat(fullPath);
      refs.push({
        filename: entry.name,
        fullPath,
        updatedAt: stat.mtime.toISOString(),
      });
    }
    refs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return refs;
  }

  // ─── Context bundle ────────────────────────────────────────────────────

  async getCoreContext(id: string): Promise<CoreContext> {
    const client = await this.getClient(id);
    const brief = await this.getBrief(id);
    const lines: string[] = [];
    lines.push(`# Client: ${client.name}`);
    lines.push(`Vertical: ${client.vertical}`);
    lines.push(`Status: ${client.status}`);
    lines.push(`Language: ${client.language}`);
    if (brief) {
      lines.push("");
      lines.push("## Brief summary");
      lines.push(`Offer: ${brief.frontmatter.offer}`);
      lines.push(`ICP: ${brief.frontmatter.icp}`);
      lines.push(`USP: ${brief.frontmatter.usp}`);
      lines.push(`KPI: ${brief.frontmatter.kpi}`);
      lines.push(`Budget: ${brief.frontmatter.budget}`);
      if (brief.frontmatter.competitors.length) {
        lines.push(
          `Competitors: ${brief.frontmatter.competitors.map((c) => c.name).join(", ")}`,
        );
      }
    }
    const raw = lines.join("\n");
    const { text } = truncateToBudget(raw, CORE_CONTEXT_BUDGET);
    return {
      clientId: id,
      text,
      estimatedTokens: estimateTokens(text),
    };
  }

  async getModuleContext(id: string, scope: ContextScope): Promise<string> {
    if (scope.kind === "none") return "";
    const brief = await this.getBrief(id);
    if (!brief) return "";
    if (scope.kind === "brief-only") {
      return `## Brief\n\n${matter.stringify(brief.body, brief.frontmatter)}`;
    }
    if (scope.kind === "brief-and-competitors") {
      const slug = await this.requireSlugForId(id);
      const competitorsDir = path.join(clientFolder(this.paths, slug), "competitors");
      let competitorsBlock = "";
      if (await exists(competitorsDir)) {
        const files = await fs.readdir(competitorsDir);
        for (const f of files) {
          const content = await fs.readFile(path.join(competitorsDir, f), "utf8");
          competitorsBlock += `\n### Competitor: ${f.replace(/\.md$/, "")}\n${content}\n`;
        }
      }
      return `## Brief\n\n${matter.stringify(brief.body, brief.frontmatter)}\n\n## Competitors${competitorsBlock}`;
    }
    return "";
  }

  // ─── Internals ─────────────────────────────────────────────────────────

  private async readClientFile(slug: string): Promise<Client> {
    const file = path.join(clientFolder(this.paths, slug), CLIENT_FILE);
    const raw = await fs.readFile(file, "utf8");
    try {
      return ClientSchema.parse(JSON.parse(raw));
    } catch (err) {
      throw new CorruptArtifactError(slug, CLIENT_FILE, err);
    }
  }

  private async requireSlugForId(id: string): Promise<string> {
    // ID lookup: scan client.json files for a match. Cheap at our scale (<200 clients).
    await fs.mkdir(this.paths.clientsRoot, { recursive: true });
    const entries = await fs.readdir(this.paths.clientsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const client = await this.readClientFile(entry.name);
        if (client.id === id || client.slug === id) {
          return client.slug;
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
    }
    throw new ClientNotFoundError(id);
  }

  private async regenerateAiContext(slug: string): Promise<void> {
    const client = await this.readClientFile(slug);
    const ctx = await this.getCoreContext(client.id);
    const file = path.join(clientFolder(this.paths, slug), AI_CONTEXT_FILE);
    await writeTextAtomic(file, ctx.text);
  }
}
