import { z } from "zod";

export const HanDimensionSchema = z.enum([
  "tension",
  "gravity",
  "lightness",
  "ritual",
  "alterity",
]);
export type HanDimension = z.infer<typeof HanDimensionSchema>;

export const DimensionScoreSchema = z.object({
  dimension: HanDimensionSchema,
  score: z.number().min(0).max(10),
  diagnosis: z.string(),
});
export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

export const AttractionAnalysisSchema = z.object({
  id: z.string().uuid(),
  creativeRef: z.string(),
  scores: z.array(DimensionScoreSchema).length(5),
  before: z.string().optional(),
  after: z.string().optional(),
  prioritizedChanges: z.array(z.string()).default([]),
  rewrite: z.string().optional(),
  computedAt: z.string().datetime(),
});
export type AttractionAnalysis = z.infer<typeof AttractionAnalysisSchema>;
