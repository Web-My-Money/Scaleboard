import path from "node:path";
import type { TeamRepo } from "./TeamRepo";
import type { SessionProvider } from "./SessionProvider";
import { FsTeamRepo } from "./FsTeamRepo";
import { LocalSessionProvider } from "./LocalSessionProvider";

export type { TeamRepo } from "./TeamRepo";
export type { SessionProvider } from "./SessionProvider";
export { NotImplementedError } from "./SessionProvider";
export { FsTeamRepo } from "./FsTeamRepo";
export { LocalSessionProvider } from "./LocalSessionProvider";

let cachedRepo: TeamRepo | null = null;
let cachedSession: SessionProvider | null = null;

function dataRoot(): string {
  const clientsRoot = process.env.WMM_DATA_DIR ?? "./data/clients";
  return path.dirname(path.resolve(clientsRoot));
}

export function getTeamRepo(): TeamRepo {
  if (cachedRepo) return cachedRepo;
  const driver = process.env.STORAGE_DRIVER ?? "fs";
  if (driver === "supabase") {
    throw new Error("STORAGE_DRIVER=supabase: SupabaseTeamRepo is a future spec.");
  }
  cachedRepo = new FsTeamRepo(dataRoot());
  return cachedRepo;
}

export function getSessionProvider(): SessionProvider {
  if (cachedSession) return cachedSession;
  cachedSession = new LocalSessionProvider(getTeamRepo());
  return cachedSession;
}

/** For tests only. */
export function __resetTeamForTests(): void {
  cachedRepo = null;
  cachedSession = null;
}
