import type { AiClient } from "./AiClient";
import { AnthropicAiClient } from "./AnthropicAiClient";
import { getClientRepo } from "@/lib/repo";

export * from "./AiClient";
export * from "./defaults";
export { AnthropicAiClient } from "./AnthropicAiClient";

let cached: AiClient | null = null;

export function getAiClient(): AiClient {
  if (cached) return cached;
  const provider = process.env.AI_PROVIDER ?? "anthropic";
  if (provider === "openrouter") {
    throw new Error("AI_PROVIDER=openrouter: OpenRouterAiClient is a future spec.");
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required. Add it to .env.local.");
  }
  const clientsRoot = process.env.WMM_DATA_DIR ?? "./data/clients";
  cached = new AnthropicAiClient({
    repo: getClientRepo(),
    apiKey,
    clientsRoot,
  });
  return cached;
}

/** For tests only. */
export function __resetAiForTests(): void {
  cached = null;
}
