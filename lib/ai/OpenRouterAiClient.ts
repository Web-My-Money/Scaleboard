import type { ClientRepo } from "@/lib/repo";
import type { AiClient, GenerateInput, GenerateResult, StreamChunk } from "./AiClient";
import { resolveModel, DEFAULT_MODEL, type ModelId } from "./defaults";
import { systemPromptFor } from "./system-prompts";
import { logUsage } from "./usage-log";

/**
 * Internal Claude model IDs → OpenRouter model slugs.
 * OpenRouter exposes Anthropic models under the `anthropic/` namespace.
 * Keep this small and explicit; users can override via the `model` input or
 * by typing an OpenRouter slug directly in app settings.
 */
const OPENROUTER_MODEL_MAP: Record<string, string> = {
  "claude-sonnet-4-6": "anthropic/claude-sonnet-4.5",
  "claude-sonnet-4-7": "anthropic/claude-sonnet-4.5",
  "claude-opus-4-8": "anthropic/claude-opus-4.1",
  "claude-opus-4-7": "anthropic/claude-opus-4.1",
  "claude-haiku-4-5-20251001": "anthropic/claude-haiku-4.5",
};

/** Translate an internal model id to an OpenRouter slug. Passes through if already slugged. */
export function toOpenRouterModel(id: ModelId): string {
  if (id.includes("/")) return id; // already an OpenRouter slug
  return OPENROUTER_MODEL_MAP[id] ?? id;
}

export interface OpenRouterDeps {
  repo: ClientRepo;
  apiKey: string;
  clientsRoot: string;
  globalDefaultModel?: string;
  baseUrl?: string;
  /** Optional OpenRouter analytics headers — your app URL + name. */
  referer?: string;
  title?: string;
}

interface OpenAIChoiceDelta {
  choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class OpenRouterAiClient implements AiClient {
  private readonly baseUrl: string;

  constructor(private readonly deps: OpenRouterDeps) {
    this.baseUrl = (deps.baseUrl ?? "https://openrouter.ai/api/v1").replace(/\/+$/, "");
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const { messages, model, system, slug } = await this.assemble(input);
    const start = performance.now();
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: input.maxTokens ?? 4096,
        temperature: input.temperature ?? 0.5,
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}: ${await res.text().catch(() => "")}`);
    }
    const json = await res.json();
    const durationMs = performance.now() - start;
    const text: string = json.choices?.[0]?.message?.content ?? "";
    const result: GenerateResult = {
      text,
      model,
      durationMs,
      usage: {
        inputTokens: json.usage?.prompt_tokens ?? 0,
        outputTokens: json.usage?.completion_tokens ?? 0,
      },
    };
    void logUsage(
      { clientsRoot: this.deps.clientsRoot, clientSlug: slug },
      input.clientId,
      input.module,
      model,
      result.usage,
      durationMs,
    );
    return result;
  }

  async *generateStream(input: GenerateInput): AsyncIterable<StreamChunk> {
    const { messages, model, system, slug } = await this.assemble(input);
    const start = performance.now();
    const accumulated: string[] = [];
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, ...messages],
          max_tokens: input.maxTokens ?? 4096,
          temperature: input.temperature ?? 0.5,
          stream: true,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(
          `OpenRouter ${res.status}: ${await res.text().catch(() => "")}`,
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl = buffer.indexOf("\n");
        while (nl >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          nl = buffer.indexOf("\n");
          if (!line || !line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const chunk = JSON.parse(payload) as OpenAIChoiceDelta;
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated.push(delta);
              yield { type: "delta", text: delta };
            }
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens ?? inputTokens;
              outputTokens = chunk.usage.completion_tokens ?? outputTokens;
            }
          } catch {
            // skip malformed SSE chunk
          }
        }
      }
      const durationMs = performance.now() - start;
      const text = accumulated.join("");
      const result: GenerateResult = {
        text,
        model,
        durationMs,
        usage: { inputTokens, outputTokens },
      };
      void logUsage(
        { clientsRoot: this.deps.clientsRoot, clientSlug: slug },
        input.clientId,
        input.module,
        model,
        result.usage,
        durationMs,
      );
      yield { type: "done", result };
    } catch (err) {
      yield { type: "error", error: err instanceof Error ? err.message : String(err) };
    }
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.deps.apiKey}`,
      "Content-Type": "application/json",
    };
    if (this.deps.referer) h["HTTP-Referer"] = this.deps.referer;
    if (this.deps.title) h["X-Title"] = this.deps.title;
    return h;
  }

  private async assemble(input: GenerateInput) {
    const client = await this.deps.repo.getClient(input.clientId);
    const language = client.language;
    const core = await this.deps.repo.getCoreContext(input.clientId);
    const moduleContext = input.contextScope
      ? await this.deps.repo.getModuleContext(input.clientId, input.contextScope)
      : "";
    const internalModel = resolveModel({
      model: input.model,
      module: input.module,
      globalDefault: this.deps.globalDefaultModel ?? DEFAULT_MODEL,
    });
    const model = toOpenRouterModel(internalModel);
    const system = systemPromptFor(input.module, language);
    // Injection order: guidelines → core client context → module extras → user prompt
    const contextBlock = [
      input.guidelinesContext,
      core.text,
      moduleContext,
    ].filter(Boolean).join("\n\n---\n\n");
    const userContent = contextBlock
      ? `${contextBlock}\n\n---\n\n${input.prompt}`
      : input.prompt;
    const messages = [{ role: "user" as const, content: userContent }];
    return { messages, model, system, slug: client.slug };
  }
}
