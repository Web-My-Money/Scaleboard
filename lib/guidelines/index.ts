import path from "node:path";
import type { GuidelinesRepo } from "./GuidelinesRepo";
import { FsGuidelinesRepo } from "./FsGuidelinesRepo";

export type { GuidelinesRepo, GuidelineDoc, GuidelinesLevel } from "./GuidelinesRepo";
export { FsGuidelinesRepo } from "./FsGuidelinesRepo";

let cached: GuidelinesRepo | null = null;

export function getGuidelinesRepo(): GuidelinesRepo {
  if (cached) return cached;
  const clientsRoot = process.env.WMM_DATA_DIR ?? "./data/clients";
  const dataRoot = path.dirname(path.resolve(clientsRoot));
  cached = new FsGuidelinesRepo(dataRoot);
  return cached;
}

export function __resetGuidelinesRepoForTests(): void {
  cached = null;
}
