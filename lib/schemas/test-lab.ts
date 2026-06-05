import { z } from "zod";

export const TestVariableSchema = z.enum(["angle", "hook", "format", "proof", "cta", "offer"]);
export type TestVariable = z.infer<typeof TestVariableSchema>;

export const TestStatusSchema = z.enum(["planned", "in_progress", "completed", "paused"]);
export type TestStatus = z.infer<typeof TestStatusSchema>;

export const IceScoreSchema = z.object({
  impact: z.number().int().min(1).max(5),
  confidence: z.number().int().min(1).max(5),
  ease: z.number().int().min(1).max(5),
});
export type IceScore = z.infer<typeof IceScoreSchema>;

export const TestSchema = z.object({
  id: z.string().uuid(),
  variable: TestVariableSchema,
  hypothesis: z.string().min(1),
  hook: z.string().optional(),
  format: z.string().optional(),
  kpi: z.string().min(1),
  audience: z.string().optional(),
  ice: IceScoreSchema,
  status: TestStatusSchema,
  result: z.string().optional(),
  interpretation: z.string().optional(),
  nextAction: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Test = z.infer<typeof TestSchema>;
