export type ModuleId =
  | "brief-structurer"
  | "strategy"
  | "creative-request"
  | "email-flows"
  | "attraction-matrix"
  | "test-lab";

export type ModelId = string;

export const DEFAULT_MODEL: ModelId = "claude-sonnet-4-6";

export const MODULE_MODEL_DEFAULTS: Record<ModuleId, ModelId> = {
  "brief-structurer": "claude-sonnet-4-6",
  strategy: "claude-sonnet-4-6",
  "creative-request": "claude-sonnet-4-6",
  "email-flows": "claude-sonnet-4-6",
  "attraction-matrix": "claude-opus-4-8",
  "test-lab": "claude-sonnet-4-6",
};

export function resolveModel(input: {
  model?: ModelId;
  module: ModuleId;
  globalDefault?: ModelId;
}): ModelId {
  return input.model ?? MODULE_MODEL_DEFAULTS[input.module] ?? input.globalDefault ?? DEFAULT_MODEL;
}
