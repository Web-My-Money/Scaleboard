import { z } from "zod";

export const ChecklistItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  done: z.boolean(),
  notes: z.string().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ChecklistSchema = z.object({
  items: z.array(ChecklistItemSchema),
  updatedAt: z.string().datetime(),
});
export type Checklist = z.infer<typeof ChecklistSchema>;

export const DEFAULT_LAUNCH_READINESS_ITEMS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "pixel_installed", label: "Meta Pixel installed and firing" },
  { key: "conversion_events_tested", label: "Conversion events tested" },
  { key: "naming_conventions_applied", label: "WMM naming conventions applied" },
  { key: "creatives_approved", label: "Creatives approved by client" },
  { key: "ghl_pipeline_configured", label: "GHL pipeline configured" },
  { key: "google_ads_account_linked", label: "Google Ads account linked" },
] as const;
