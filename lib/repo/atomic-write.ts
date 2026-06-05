import fs from "node:fs/promises";
import path from "node:path";

/**
 * Atomic write: write to <target>.tmp then rename. Avoids partial-write
 * corruption if the process is interrupted mid-write.
 */
export async function writeTextAtomic(target: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp-${process.pid}-${Math.floor(performance.now() * 1000)}`;
  try {
    await fs.writeFile(tmp, content, "utf8");
    await fs.rename(tmp, target);
  } catch (err) {
    try {
      await fs.unlink(tmp);
    } catch {
      // ignore — temp file may not exist
    }
    throw err;
  }
}

export async function writeJsonAtomic(target: string, value: unknown): Promise<void> {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await writeTextAtomic(target, text);
}

export async function appendJsonLine(target: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const line = `${JSON.stringify(value)}\n`;
  await fs.appendFile(target, line, "utf8");
}
