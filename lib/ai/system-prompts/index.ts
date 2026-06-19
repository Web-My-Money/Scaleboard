import type { ModuleId } from "../defaults";
import { briefStructurerSystemPrompt } from "./brief-structurer";
import { STRATEGY_SYSTEM_PROMPT } from "./strategy";
import { CREATIVE_REQUEST_SYSTEM_PROMPT } from "./creative-request";
import { FINANCIALS_SYSTEM_PROMPT } from "./financials";
import { EMAIL_FLOWS_SYSTEM_PROMPT } from "./email-flows";
import { TEST_LAB_SYSTEM_PROMPT } from "./test-lab";
import { ATTRACTION_MATRIX_SYSTEM_PROMPT } from "./attraction-matrix";

const PLACEHOLDER = "You are a helpful WMM Scaleboard assistant.";

export function systemPromptFor(module: ModuleId, language: "es" | "en"): string {
  void language; // all prompts currently in English; future: localize
  switch (module) {
    case "brief-structurer":
      return briefStructurerSystemPrompt(language);
    case "strategy":
      return STRATEGY_SYSTEM_PROMPT;
    case "creative-request":
      return CREATIVE_REQUEST_SYSTEM_PROMPT;
    case "financials":
      return FINANCIALS_SYSTEM_PROMPT;
    case "email-flows":
      return EMAIL_FLOWS_SYSTEM_PROMPT;
    case "test-lab":
      return TEST_LAB_SYSTEM_PROMPT;
    case "attraction-matrix":
      return ATTRACTION_MATRIX_SYSTEM_PROMPT;
  }
}
