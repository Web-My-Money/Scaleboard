/**
 * Cheap token estimate: 1 token ≈ 4 chars. Good enough for budget enforcement;
 * not a substitute for the real tokenizer at call time.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface TruncateResult {
  text: string;
  truncated: boolean;
}

/**
 * Truncate from the tail with a marker if the estimate exceeds the ceiling.
 * Keeps the leading content (profile + brief summary) intact and drops the
 * less-important trailing detail.
 */
export function truncateToBudget(text: string, maxTokens: number): TruncateResult {
  if (estimateTokens(text) <= maxTokens) return { text, truncated: false };
  const maxChars = maxTokens * 4;
  const marker = "\n\n…[truncated to fit context budget]";
  const headroom = Math.max(0, maxChars - marker.length);
  return { text: text.slice(0, headroom) + marker, truncated: true };
}

export const CORE_CONTEXT_BUDGET = 500;
