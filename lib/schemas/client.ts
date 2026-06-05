import { z } from "zod";

export const ClientStatusSchema = z.enum(["onboarding", "active", "paused", "archived"]);
export type ClientStatus = z.infer<typeof ClientStatusSchema>;

export const ClientLanguageSchema = z.enum(["es", "en"]);
export type ClientLanguage = z.infer<typeof ClientLanguageSchema>;

export const PlatformsSchema = z.object({
  metaBusinessId: z.string().optional(),
  googleAdsAccountId: z.string().optional(),
  ghlLocationId: z.string().optional(),
});
export type Platforms = z.infer<typeof PlatformsSchema>;

export const AssignmentsSchema = z.object({
  strategy: z.string().uuid().optional(),
  mediaBuying: z.string().uuid().optional(),
  design: z.string().uuid().optional(),
});
export type Assignments = z.infer<typeof AssignmentsSchema>;

const SlugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "slug must be lowercase, hyphen-separated, ASCII");

export const ClientSchema = z.object({
  id: z.string().uuid(),
  slug: SlugSchema,
  name: z.string().min(1),
  vertical: z.string().min(1),
  status: ClientStatusSchema,
  language: ClientLanguageSchema,
  platforms: PlatformsSchema,
  owners: z.array(z.string().uuid()),
  assignments: AssignmentsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Client = z.infer<typeof ClientSchema>;

export const CreateClientInputSchema = z.object({
  name: z.string().min(1),
  vertical: z.string().min(1),
  slug: SlugSchema.optional(),
  language: ClientLanguageSchema.default("es"),
  platforms: PlatformsSchema.optional(),
});
export type CreateClientInput = z.infer<typeof CreateClientInputSchema>;

export const ClientSummarySchema = ClientSchema.pick({
  id: true,
  slug: true,
  name: true,
  vertical: true,
  status: true,
  language: true,
  updatedAt: true,
});
export type ClientSummary = z.infer<typeof ClientSummarySchema>;
