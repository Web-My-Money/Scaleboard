import type { Member } from "@/lib/schemas";
import type { SessionProvider } from "./SessionProvider";
import { NotImplementedError } from "./SessionProvider";
import type { TeamRepo } from "./TeamRepo";

export class LocalSessionProvider implements SessionProvider {
  constructor(private readonly teamRepo: TeamRepo) {}

  async getCurrentUser(): Promise<Member | null> {
    const id = await this.teamRepo.getActiveUserId();
    if (!id) return null;
    return this.teamRepo.getMember(id);
  }

  async signIn(_email: string, _password: string): Promise<Member> {
    throw new NotImplementedError("Password sign-in");
  }

  async signOut(): Promise<void> {
    await this.teamRepo.setActiveUserId(null);
  }
}
