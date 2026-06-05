import fs from "node:fs/promises";
import path from "node:path";
import { AppSettingsSchema, DEFAULT_APP_SETTINGS } from "@/lib/schemas";
import type { AppSettings } from "@/lib/schemas";
import { writeJsonAtomic } from "@/lib/repo/atomic-write";
import { exists } from "@/lib/repo/paths";

function settingsPath(): string {
  const clientsRoot = process.env.WMM_DATA_DIR ?? "./data/clients";
  return path.join(path.dirname(path.resolve(clientsRoot)), "app-settings.json");
}

export async function readAppSettings(): Promise<AppSettings> {
  const file = settingsPath();
  if (!(await exists(file))) {
    return { ...DEFAULT_APP_SETTINGS, updatedAt: new Date().toISOString() };
  }
  const raw = await fs.readFile(file, "utf8");
  return AppSettingsSchema.parse(JSON.parse(raw));
}

export async function writeAppSettings(
  patch: Partial<Omit<AppSettings, "updatedAt">>,
): Promise<AppSettings> {
  const current = await readAppSettings();
  const merged: AppSettings = AppSettingsSchema.parse({
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  await writeJsonAtomic(settingsPath(), merged);
  return merged;
}
