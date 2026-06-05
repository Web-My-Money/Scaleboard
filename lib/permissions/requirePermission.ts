import type { Member } from "@/lib/schemas";
import { isAllowed, type Action } from "./map";

export class PermissionDeniedError extends Error {
  constructor(public readonly user: Member | null, public readonly action: Action) {
    super(
      user
        ? `Role ${user.role} is not allowed to perform ${action}`
        : `No active user; cannot perform ${action}`,
    );
    this.name = "PermissionDeniedError";
  }
}

export function requirePermission(user: Member | null, action: Action): void {
  if (!user) throw new PermissionDeniedError(null, action);
  if (!isAllowed(user.role, action)) throw new PermissionDeniedError(user, action);
}

export function canPerform(user: Member | null, action: Action): boolean {
  if (!user) return false;
  return isAllowed(user.role, action);
}
