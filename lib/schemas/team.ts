import { z } from "zod";

export const RoleSchema = z.enum(["admin", "strategist", "media_buyer", "designer", "viewer"]);
export type Role = z.infer<typeof RoleSchema>;

export const MemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: RoleSchema,
  createdAt: z.string().datetime(),
});
export type Member = z.infer<typeof MemberSchema>;

export const TeamFileSchema = z.object({
  members: z.array(MemberSchema),
  activeUserId: z.string().uuid().nullable(),
});
export type TeamFile = z.infer<typeof TeamFileSchema>;

export const InviteInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: RoleSchema,
});
export type InviteInput = z.infer<typeof InviteInputSchema>;
