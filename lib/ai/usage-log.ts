import path from "node:path";
import { appendJsonLine } from "@/lib/repo/atomic-write";
import type { ModelId, ModuleId } from "./defaults";
import type { UsageInfo } from "./AiClient";

export interface UsageRecord {
  ts: string;
  clientId: string;
  module: ModuleId;
  model: ModelId;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

export interface UsageLogTarget {
  clientsRoot: string;
  clientSlug: string;
}

export async function logUsage(
  target: UsageLogTarget,
  clientId: string,
  module: ModuleId,
  model: ModelId,
  usage: UsageInfo,
  durationMs: number,
): Promise<void> {
  const file = path.join(path.resolve(target.clientsRoot), target.clientSlug, ".usage.jsonl");
  const record: UsageRecord = {
    ts: new Date().toISOString(),
    clientId,
    module,
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    durationMs,
  };
  await appendJsonLine(file, record);
}
