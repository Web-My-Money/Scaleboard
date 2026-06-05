import { NextResponse } from "next/server";
import { getSessionProvider } from "@/lib/team";
import { requirePermission, PermissionDeniedError, type Action } from "@/lib/permissions";

export async function requireApiPermission(action: Action) {
  const user = await getSessionProvider().getCurrentUser();
  try {
    requirePermission(user, action);
    return { user };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return {
        error: NextResponse.json(
          { error: err.message, action: err.action },
          { status: user ? 403 : 401 },
        ),
      };
    }
    throw err;
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
