import type { ModuleId } from "@/lib/ai/defaults";

export type GuidelinesLevel = "app" | "client";

export interface GuidelineDoc {
  id: string;           // filename slug, stable
  filename: string;     // display name
  module: ModuleId | "general";
  level: GuidelinesLevel;
  clientSlug?: string;  // only when level = "client"
  sizeBytes: number;
  updatedAt: string;
}

export interface GuidelinesRepo {
  // Listing
  listAppGuidelines(module: ModuleId | "general"): Promise<GuidelineDoc[]>;
  listClientGuidelines(clientSlug: string, module: ModuleId | "general"): Promise<GuidelineDoc[]>;

  // Reading (returns markdown text — used for context injection)
  readAppGuideline(module: ModuleId | "general", id: string): Promise<string | null>;
  readClientGuideline(clientSlug: string, module: ModuleId | "general", id: string): Promise<string | null>;

  // Writing (already-extracted markdown text)
  saveAppGuideline(module: ModuleId | "general", filename: string, content: string): Promise<GuidelineDoc>;
  saveClientGuideline(clientSlug: string, module: ModuleId | "general", filename: string, content: string): Promise<GuidelineDoc>;

  // Deletion
  deleteAppGuideline(module: ModuleId | "general", id: string): Promise<void>;
  deleteClientGuideline(clientSlug: string, module: ModuleId | "general", id: string): Promise<void>;

  // Context assembly — returns all relevant text for a module call, app-level first
  assembleGuidelinesContext(
    clientSlug: string,
    module: ModuleId | "general",
  ): Promise<{ text: string; sources: string[] }>;
}
