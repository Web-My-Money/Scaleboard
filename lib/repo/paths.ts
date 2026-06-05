import path from "node:path";
import fs from "node:fs/promises";
import slugifyLib from "slugify";

export function slugFromName(name: string): string {
  return slugifyLib(name, { lower: true, strict: true, trim: true });
}

export async function uniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  if (!(await exists(baseSlug))) return baseSlug;
  let n = 2;
  while (true) {
    const candidate = `${baseSlug}-${n}`;
    if (!(await exists(candidate))) return candidate;
    n += 1;
    if (n > 9999) {
      throw new Error(`Could not generate unique slug from base "${baseSlug}"`);
    }
  }
}

export interface RepoPaths {
  /** Root containing all client folders (configurable via WMM_DATA_DIR). */
  clientsRoot: string;
  /** Parent of clientsRoot; holds team.json + app-settings.json. */
  dataRoot: string;
}

export function resolveRepoPaths(clientsRoot: string): RepoPaths {
  const resolved = path.resolve(clientsRoot);
  return {
    clientsRoot: resolved,
    dataRoot: path.dirname(resolved),
  };
}

export function clientFolder(paths: RepoPaths, slug: string): string {
  return path.join(paths.clientsRoot, slug);
}

export type ArtifactDir =
  | "competitors"
  | "densification-pack"
  | "creative-requests"
  | "email-flows"
  | "attraction-matrix"
  | "test-lab"
  | "context/uploads";

export type ArtifactPath = readonly [ArtifactDir | "", string] | readonly [string];

export function artifactPath(paths: RepoPaths, slug: string, p: ArtifactPath): string {
  if (p.length === 1) {
    return path.join(clientFolder(paths, slug), p[0]);
  }
  const [dir, file] = p;
  return dir ? path.join(clientFolder(paths, slug), dir, file) : path.join(clientFolder(paths, slug), file);
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
