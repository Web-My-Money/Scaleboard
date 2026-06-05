import type { InviteInput, Member } from "@/lib/schemas";

export interface TeamRepo {
  listMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | null>;
  inviteMember(input: InviteInput): Promise<Member>;
  updateMember(id: string, patch: Partial<Omit<Member, "id" | "createdAt">>): Promise<Member>;
  removeMember(id: string): Promise<void>;
  getActiveUserId(): Promise<string | null>;
  setActiveUserId(id: string | null): Promise<void>;
}
