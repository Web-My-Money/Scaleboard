import type { ZodSchema } from "zod";
import type {
  Client,
  ClientSummary,
  CreateClientInput,
  Brief,
  BriefDraft,
} from "@/lib/schemas";
import type { ArtifactDir, ArtifactPath } from "./paths";

export type { ArtifactDir, ArtifactPath };

export interface ArtifactRef {
  filename: string;
  fullPath: string;
  updatedAt: string;
}

/**
 * What gets prepended to every AI call for the client — small summary, ~500 tokens.
 */
export interface CoreContext {
  clientId: string;
  text: string;
  estimatedTokens: number;
}

/**
 * Per-module context request. Modules declare what they need by name; the repo
 * assembles only those slices. Future module specs extend this union.
 */
export type ContextScope =
  | { kind: "none" }
  | { kind: "brief-only" }
  | { kind: "brief-and-competitors" };

export interface ClientRepo {
  // Lifecycle
  listClients(): Promise<ClientSummary[]>;
  getClient(id: string): Promise<Client>;
  createClient(input: CreateClientInput): Promise<Client>;
  updateClient(id: string, patch: Partial<Client>): Promise<Client>;
  archiveClient(id: string): Promise<void>;

  // Brief
  getBriefDraft(id: string): Promise<BriefDraft | null>;
  saveBriefDraft(id: string, draft: BriefDraft): Promise<void>;
  commitBrief(id: string, approved: Brief): Promise<void>;
  getBrief(id: string): Promise<Brief | null>;

  // Generic artifact I/O (used by all future module specs)
  readArtifact<T>(id: string, p: ArtifactPath, schema: ZodSchema<T>): Promise<T | null>;
  writeArtifact<T>(id: string, p: ArtifactPath, data: T, schema: ZodSchema<T>): Promise<void>;
  listArtifacts(id: string, dir: ArtifactDir): Promise<ArtifactRef[]>;

  // Context bundle (used by AiClient)
  getCoreContext(id: string): Promise<CoreContext>;
  getModuleContext(id: string, scope: ContextScope): Promise<string>;
}
