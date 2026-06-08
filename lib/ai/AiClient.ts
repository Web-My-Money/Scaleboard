import type { ContextScope } from "@/lib/repo";
import type { ModuleId, ModelId } from "./defaults";

export type { ModuleId, ModelId } from "./defaults";

export interface GenerateInput {
  clientId: string;
  module: ModuleId;
  prompt: string;
  contextScope?: ContextScope;
  model?: ModelId;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "text" | "json";
  /** Pre-assembled guidelines text (app-level + client-level). Injected before core context. */
  guidelinesContext?: string;
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateResult {
  text: string;
  model: ModelId;
  durationMs: number;
  usage: UsageInfo;
}

export interface StreamChunk {
  type: "delta" | "done" | "error";
  text?: string;
  error?: string;
  result?: GenerateResult;
}

export interface AiClient {
  generate(input: GenerateInput): Promise<GenerateResult>;
  generateStream(input: GenerateInput): AsyncIterable<StreamChunk>;
}
