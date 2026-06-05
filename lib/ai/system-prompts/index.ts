import type { ModuleId } from "../defaults";
import { briefStructurerSystemPrompt } from "./brief-structurer";

const PLACEHOLDER = "You are a helpful WMM Story Engine assistant.";

export function systemPromptFor(module: ModuleId, language: "es" | "en"): string {
  switch (module) {
    case "brief-structurer":
      return briefStructurerSystemPrompt(language);
    case "strategy":
    case "creative-request":
    case "email-flows":
    case "attraction-matrix":
    case "test-lab":
      // Detailed prompts arrive with each module's own future spec.
      return PLACEHOLDER;
  }
}
