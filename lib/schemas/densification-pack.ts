import { z } from "zod";

/**
 * Schemas for outputs of the Strategy module. The module itself is deferred
 * to a future spec; schemas live here so the package is complete and
 * `ClientRepo.readArtifact` calls from future modules type-check today.
 */

export const AngleStatusSchema = z.enum(["draft", "active", "testing", "paused", "retired"]);
export type AngleStatus = z.infer<typeof AngleStatusSchema>;

export const AngleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  beliefAttacked: z.string(),
  counterBelief: z.string(),
  emotionalDriver: z.string(),
  proposition: z.string(),
  status: AngleStatusSchema,
  campaignIds: z
    .object({
      meta: z.string().optional(),
      google: z.string().optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Angle = z.infer<typeof AngleSchema>;

export const HookPatternSchema = z.enum([
  "contrarian",
  "diagnosis",
  "mechanism",
  "story",
  "stat",
  "question",
  "metaphor",
  "comparison",
  "other",
]);
export type HookPattern = z.infer<typeof HookPatternSchema>;

export const HookSchema = z.object({
  id: z.string().uuid(),
  angleId: z.string().uuid(),
  text: z.string().min(1),
  pattern: HookPatternSchema,
  notes: z.string().optional(),
});
export type Hook = z.infer<typeof HookSchema>;

export const FinancialsScenarioSchema = z.object({
  name: z.enum(["conservative", "base", "optimistic"]),
  cacMax: z.number().nonnegative(),
  revenuePerLead: z.number().nonnegative(),
  monthlyBudget: z.number().nonnegative(),
  expectedLeads: z.number().nonnegative(),
});
export type FinancialsScenario = z.infer<typeof FinancialsScenarioSchema>;

export const FinancialsModelSchema = z.object({
  scenarios: z.array(FinancialsScenarioSchema),
  budgetBreakdown: z.record(z.string(), z.number().nonnegative()),
  notes: z.string().optional(),
  computedAt: z.string().datetime(),
});
export type FinancialsModel = z.infer<typeof FinancialsModelSchema>;
