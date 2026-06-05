import Anthropic from "@anthropic-ai/sdk";
import type { ClientRepo } from "@/lib/repo";
import type { AiClient, GenerateInput, GenerateResult, StreamChunk } from "./AiClient";
import { resolveModel, DEFAULT_MODEL } from "./defaults";
import { systemPromptFor } from "./system-prompts";
import { logUsage } from "./usage-log";

export interface AnthropicAiClientDeps {
  repo: ClientRepo;
  apiKey: string;
  clientsRoot: string;
  globalDefaultModel?: string;
}

export class AnthropicAiClient implements AiClient {
  private readonly anthropic: Anthropic;

  constructor(private readonly deps: AnthropicAiClientDeps) {
    this.anthropic = new Anthropic({ apiKey: deps.apiKey });
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const { messages, model, system, slug, language } = await this.assemble(input);
    const start = performance.now();
    const response = await this.anthropic.messages.create({
      model,
      system,
      messages,
      max_tokens: input.maxTokens ?? 4096,
      temperature: input.temperature ?? 0.5,
    });
    const durationMs = performance.now() - start;
    const text = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("");
    const result: GenerateResult = {
      text,
      model,
      durationMs,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
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
    void language;
    return result;
  }

  async *generateStream(input: GenerateInput): AsyncIterable<StreamChunk> {
    const { messages, model, system, slug } = await this.assemble(input);
    const start = performance.now();
    let inputTokens = 0;
    let outputTokens = 0;
    const accumulated: string[] = [];
    try {
      const stream = await this.anthropic.messages.stream({
        model,
        system,
        messages,
        max_tokens: input.maxTokens ?? 4096,
        temperature: input.temperature ?? 0.5,
      });
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          accumulated.push(event.delta.text);
          yield { type: "delta", text: event.delta.text };
        } else if (event.type === "message_delta") {
          if (event.usage) outputTokens = event.usage.output_tokens;
        } else if (event.type === "message_start" && event.message.usage) {
          inputTokens = event.message.usage.input_tokens;
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

  private async assemble(input: GenerateInput) {
    const client = await this.deps.repo.getClient(input.clientId);
    const language = client.language;
    const core = await this.deps.repo.getCoreContext(input.clientId);
    const moduleContext = input.contextScope
      ? await this.deps.repo.getModuleContext(input.clientId, input.contextScope)
      : "";
    const model = resolveModel({
      model: input.model,
      module: input.module,
      globalDefault: this.deps.globalDefaultModel ?? DEFAULT_MODEL,
    });
    const system = systemPromptFor(input.module, language);
    const contextBlock = [core.text, moduleContext].filter(Boolean).join("\n\n");
    const userContent = contextBlock
      ? `${contextBlock}\n\n---\n\n${input.prompt}`
      : input.prompt;
    const messages = [{ role: "user" as const, content: userContent }];
    return { messages, model, system, slug: client.slug, language };
  }
}
