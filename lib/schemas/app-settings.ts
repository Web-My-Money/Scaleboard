import { z } from "zod";
import { ClientLanguageSchema } from "./client";

export const AiProviderSchema = z.enum(["anthropic", "openrouter"]);
export type AiProvider = z.infer<typeof AiProviderSchema>;

export const ModelIdSchema = z.string().min(1);
export type ModelId = z.infer<typeof ModelIdSchema>;

export const AppSettingsSchema = z.object({
  uiLanguage: ClientLanguageSchema,
  aiProvider: AiProviderSchema,
  defaultModel: ModelIdSchema,
  updatedAt: z.string().datetime(),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_APP_SETTINGS: Omit<AppSettings, "updatedAt"> = {
  uiLanguage: "es",
  aiProvider: "anthropic",
  defaultModel: "claude-sonnet-4-6",
};
