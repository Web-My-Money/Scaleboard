import { describe, it, expect } from "vitest";
import type { ZodSchema } from "zod";
import type { ClientRepo, ArtifactDir, ArtifactPath, ArtifactRef, CoreContext, ContextScope } from "../ClientRepo";
import type { Client, ClientSummary, CreateClientInput, Brief, BriefDraft } from "@/lib/schemas";

/**
 * Proves the interface is implementable from scratch — a stub adapter that
 * returns canned data and conforms to ClientRepo without any fs/SDK imports.
 * If this ever fails to compile, the abstraction has leaked an
 * implementation-specific concern into the interface.
 */
class StubClientRepo implements ClientRepo {
  constructor(private readonly canned: { client: Client; brief: Brief | null }) {}

  async listClients(): Promise<ClientSummary[]> {
    return [this.canned.client];
  }
  async getClient(_id: string): Promise<Client> {
    return this.canned.client;
  }
  async createClient(_input: CreateClientInput): Promise<Client> {
    return this.canned.client;
  }
  async updateClient(_id: string, patch: Partial<Client>): Promise<Client> {
    return { ...this.canned.client, ...patch };
  }
  async archiveClient(_id: string): Promise<void> {}
  async getBriefDraft(_id: string): Promise<BriefDraft | null> {
    return null;
  }
  async saveBriefDraft(_id: string, _draft: BriefDraft): Promise<void> {}
  async commitBrief(_id: string, _approved: Brief): Promise<void> {}
  async getBrief(_id: string): Promise<Brief | null> {
    return this.canned.brief;
  }
  async readArtifact<T>(_id: string, _p: ArtifactPath, _schema: ZodSchema<T>): Promise<T | null> {
    return null;
  }
  async writeArtifact<T>(
    _id: string,
    _p: ArtifactPath,
    _data: T,
    _schema: ZodSchema<T>,
  ): Promise<void> {}
  async listArtifacts(_id: string, _dir: ArtifactDir): Promise<ArtifactRef[]> {
    return [];
  }
  async getCoreContext(_id: string): Promise<CoreContext> {
    return { clientId: this.canned.client.id, text: "stub", estimatedTokens: 1 };
  }
  async getModuleContext(_id: string, _scope: ContextScope): Promise<string> {
    return "";
  }
}

describe("ClientRepo abstraction", () => {
  it("can be implemented without filesystem or SDK dependencies", async () => {
    const now = new Date().toISOString();
    const stub = new StubClientRepo({
      client: {
        id: "00000000-0000-0000-0000-000000000001",
        slug: "stub-co",
        name: "Stub Co",
        vertical: "test",
        status: "active",
        language: "en",
        platforms: {},
        owners: [],
        assignments: {},
        createdAt: now,
        updatedAt: now,
      },
      brief: null,
    });
    const list = await stub.listClients();
    expect(list).toHaveLength(1);
    expect(list[0]?.slug).toBe("stub-co");
  });
});
