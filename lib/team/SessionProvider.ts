import type { Member } from "@/lib/schemas";

export interface SessionProvider {
  /** v1: reads team.json.activeUserId. v2: reads Supabase session. */
  getCurrentUser(): Promise<Member | null>;
  /** v1: throws "not implemented". v2: Supabase password sign-in. */
  signIn(email: string, password: string): Promise<Member>;
  signOut(): Promise<void>;
}

export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not implemented in v1`);
    this.name = "NotImplementedError";
  }
}
