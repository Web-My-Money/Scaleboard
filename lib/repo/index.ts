import type { ClientRepo } from "./ClientRepo";
import { FsClientRepo } from "./FsClientRepo";

export * from "./ClientRepo";
export * from "./errors";
export { FsClientRepo } from "./FsClientRepo";

let cached: ClientRepo | null = null;

export function getClientRepo(): ClientRepo {
  if (cached) return cached;
  const driver = process.env.STORAGE_DRIVER ?? "fs";
  if (driver === "supabase") {
    throw new Error(
      "STORAGE_DRIVER=supabase: SupabaseClientRepo is a future spec; not implemented yet.",
    );
  }
  const root = process.env.WMM_DATA_DIR ?? "./data/clients";
  cached = new FsClientRepo(root);
  return cached;
}

/** For tests: reset the cached singleton. */
export function __resetClientRepoForTests(): void {
  cached = null;
}
