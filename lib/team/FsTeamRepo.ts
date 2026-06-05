import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { TeamFileSchema, InviteInputSchema, MemberSchema } from "@/lib/schemas";
import type { Member, InviteInput, TeamFile } from "@/lib/schemas";
import { writeJsonAtomic } from "@/lib/repo/atomic-write";
import { exists } from "@/lib/repo/paths";
import type { TeamRepo } from "./TeamRepo";

export class FsTeamRepo implements TeamRepo {
  private readonly file: string;

  constructor(dataRoot: string) {
    this.file = path.join(path.resolve(dataRoot), "team.json");
  }

  async listMembers(): Promise<Member[]> {
    const t = await this.read();
    return t.members;
  }

  async getMember(id: string): Promise<Member | null> {
    const t = await this.read();
    return t.members.find((m) => m.id === id) ?? null;
  }

  async inviteMember(input: InviteInput): Promise<Member> {
    const parsed = InviteInputSchema.parse(input);
    const t = await this.read();
    if (t.members.some((m) => m.email.toLowerCase() === parsed.email.toLowerCase())) {
      throw new Error(`Member with email ${parsed.email} already exists`);
    }
    const member: Member = {
      id: randomUUID(),
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      createdAt: new Date().toISOString(),
    };
    MemberSchema.parse(member);
    t.members.push(member);
    if (!t.activeUserId) t.activeUserId = member.id;
    await this.write(t);
    return member;
  }

  async updateMember(
    id: string,
    patch: Partial<Omit<Member, "id" | "createdAt">>,
  ): Promise<Member> {
    const t = await this.read();
    const idx = t.members.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error(`Member ${id} not found`);
    const existing = t.members[idx]!;
    const merged: Member = MemberSchema.parse({ ...existing, ...patch, id: existing.id, createdAt: existing.createdAt });
    t.members[idx] = merged;
    await this.write(t);
    return merged;
  }

  async removeMember(id: string): Promise<void> {
    const t = await this.read();
    t.members = t.members.filter((m) => m.id !== id);
    if (t.activeUserId === id) {
      t.activeUserId = t.members[0]?.id ?? null;
    }
    await this.write(t);
  }

  async getActiveUserId(): Promise<string | null> {
    const t = await this.read();
    return t.activeUserId;
  }

  async setActiveUserId(id: string | null): Promise<void> {
    const t = await this.read();
    if (id !== null && !t.members.some((m) => m.id === id)) {
      throw new Error(`Cannot set active user to unknown id ${id}`);
    }
    t.activeUserId = id;
    await this.write(t);
  }

  private async read(): Promise<TeamFile> {
    if (!(await exists(this.file))) {
      return { members: [], activeUserId: null };
    }
    const raw = await fs.readFile(this.file, "utf8");
    return TeamFileSchema.parse(JSON.parse(raw));
  }

  private async write(t: TeamFile): Promise<void> {
    TeamFileSchema.parse(t);
    await writeJsonAtomic(this.file, t);
  }
}
