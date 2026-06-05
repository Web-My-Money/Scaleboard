import { z } from "zod";
import { ClientLanguageSchema } from "./client";

export const CompetitorRefSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  notes: z.string().optional(),
});
export type CompetitorRef = z.infer<typeof CompetitorRefSchema>;

/**
 * Structured frontmatter of brief.md.
 * The prose body lives separately as the .body string.
 */
export const BriefFrontmatterSchema = z.object({
  offer: z.string().min(1),
  icp: z.string().min(1),
  usp: z.string().min(1),
  competitors: z.array(CompetitorRefSchema).default([]),
  kpi: z.string().min(1),
  budget: z.string().min(1),
  language: ClientLanguageSchema,
  approvedAt: z.string().datetime(),
});
export type BriefFrontmatter = z.infer<typeof BriefFrontmatterSchema>;

export const BriefSchema = z.object({
  frontmatter: BriefFrontmatterSchema,
  body: z.string(),
});
export type Brief = z.infer<typeof BriefSchema>;

/**
 * Draft state — raw paste + (optionally) AI-extracted preview that the user hasn't approved.
 * Persisted to brief.draft.md before any AI call to prevent data loss.
 */
export const BriefDraftSchema = z.object({
  rawPaste: z.string(),
  extracted: BriefFrontmatterSchema.partial().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type BriefDraft = z.infer<typeof BriefDraftSchema>;
