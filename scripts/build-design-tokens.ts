#!/usr/bin/env tsx
/**
 * Parse docs/input/DESIGN.md frontmatter into lib/design-tokens/tokens.ts.
 * Canonical path: editing DESIGN.md is the only sanctioned way to change tokens.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.resolve(__dirname, "..");
const DESIGN_MD = path.join(ROOT, "docs/input/DESIGN.md");
const OUT = path.join(ROOT, "lib/design-tokens/tokens.ts");

interface Frontmatter {
  name: string;
  colors: Record<string, string>;
  typography: {
    h1: { fontFamily: string; fontSize: string };
    "body-md": { fontFamily: string; fontSize: string };
    "label-caps": { fontFamily: string; fontSize: string };
    sourceScale?: string;
    weights?: string;
  };
  rounded: { sm: string; md: string };
  spacing: { sm: string; md: string; sourceScale?: string };
}

function parse(): Frontmatter {
  const raw = fs.readFileSync(DESIGN_MD, "utf8");
  const { data } = matter(raw);
  if (!data || typeof data !== "object") {
    throw new Error(`No frontmatter found in ${DESIGN_MD}`);
  }
  return data as Frontmatter;
}

function emit(fm: Frontmatter): string {
  const lines: string[] = [];
  lines.push("// AUTO-GENERATED from docs/input/DESIGN.md by scripts/build-design-tokens.ts.");
  lines.push("// Do not edit by hand; edit DESIGN.md and run `npm run build:tokens`.");
  lines.push("");
  lines.push("export const designTokens = {");
  lines.push(`  name: ${JSON.stringify(fm.name)},`);
  lines.push("  colors: {");
  for (const [k, v] of Object.entries(fm.colors)) {
    lines.push(`    ${k}: ${JSON.stringify(v)},`);
  }
  lines.push("  },");
  lines.push("  typography: {");
  lines.push(`    h1: ${JSON.stringify(fm.typography.h1)},`);
  lines.push(`    bodyMd: ${JSON.stringify(fm.typography["body-md"])},`);
  lines.push(`    labelCaps: ${JSON.stringify(fm.typography["label-caps"])},`);
  if (fm.typography.weights) {
    lines.push(`    weights: ${JSON.stringify(fm.typography.weights)},`);
  }
  lines.push("  },");
  lines.push("  radii: {");
  lines.push(`    sm: ${JSON.stringify(fm.rounded.sm)},`);
  lines.push(`    md: ${JSON.stringify(fm.rounded.md)},`);
  lines.push("  },");
  lines.push("  spacing: {");
  lines.push(`    sm: ${JSON.stringify(fm.spacing.sm)},`);
  lines.push(`    md: ${JSON.stringify(fm.spacing.md)},`);
  lines.push("  },");
  lines.push("} as const;");
  lines.push("");
  lines.push("export type DesignTokens = typeof designTokens;");
  lines.push("");
  return lines.join("\n");
}

function main(): void {
  const fm = parse();
  const code = emit(fm);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, code, "utf8");
  console.log(`✓ Wrote ${path.relative(ROOT, OUT)}`);
}

main();
