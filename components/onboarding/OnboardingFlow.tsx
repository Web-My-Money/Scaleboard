"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Client, BriefDraft, BriefFrontmatter } from "@/lib/schemas";

type Phase = "paste" | "structuring" | "review";

export function OnboardingFlow({
  client,
  initialDraft,
}: {
  client: Client;
  initialDraft: BriefDraft | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("paste");
  const [rawPaste, setRawPaste] = useState(initialDraft?.rawPaste ?? "");
  const [streaming, setStreaming] = useState("");
  const [extracted, setExtracted] = useState<Partial<BriefFrontmatter> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  async function runStructurer() {
    setError(null);
    setStreaming("");
    setExtracted(null);
    setPhase("structuring");
    try {
      const res = await fetch(`/api/clients/${client.id}/brief/structure`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rawPaste }),
      });
      if (!res.ok || !res.body) {
        setError(`HTTP ${res.status}`);
        setPhase("paste");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx = buffer.indexOf("\n\n");
        while (idx >= 0) {
          const evt = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (evt.startsWith("data: ")) {
            try {
              const chunk = JSON.parse(evt.slice(6));
              if (chunk.type === "delta") {
                fullText += chunk.text ?? "";
                setStreaming(fullText);
              } else if (chunk.type === "error") {
                setError(chunk.error);
              }
            } catch {
              // ignore malformed chunk
            }
          }
          idx = buffer.indexOf("\n\n");
        }
      }
      const jsonText = extractJson(fullText);
      if (!jsonText) {
        setError("Could not extract JSON from AI response");
        return;
      }
      try {
        const parsed = JSON.parse(jsonText) as Partial<BriefFrontmatter>;
        setExtracted(parsed);
        setPhase("review");
      } catch (err) {
        setError(`Invalid JSON: ${(err as Error).message}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("paste");
    }
  }

  async function commit() {
    if (!extracted) return;
    setCommitting(true);
    setError(null);
    const now = new Date().toISOString();
    const frontmatter: BriefFrontmatter = {
      offer: extracted.offer ?? "",
      icp: extracted.icp ?? "",
      usp: extracted.usp ?? "",
      competitors: extracted.competitors ?? [],
      kpi: extracted.kpi ?? "",
      budget: extracted.budget ?? "",
      language: extracted.language ?? client.language,
      approvedAt: now,
    };
    const res = await fetch(`/api/clients/${client.id}/brief`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ frontmatter, body: rawPaste }),
    });
    if (!res.ok) {
      setError(`Commit failed: HTTP ${res.status}`);
      setCommitting(false);
      return;
    }
    router.push(`/clients/${client.slug}/brief`);
  }

  if (phase === "paste") {
    return (
      <section className="glass-card-elevated p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{client.name}</h1>
        <p className="label-caps text-secondary">{t("onboarding.paste.title")}</p>
        <textarea
          value={rawPaste}
          onChange={(e) => setRawPaste(e.target.value)}
          placeholder={t("onboarding.paste.placeholder")}
          rows={16}
          className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 font-mono text-sm"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          onClick={runStructurer}
          disabled={!rawPaste.trim()}
          className="bg-primary text-white font-medium rounded-md-token py-2 disabled:opacity-50"
        >
          {t("onboarding.paste.submit")}
        </button>
      </section>
    );
  }

  if (phase === "structuring") {
    return (
      <section className="glass-card-elevated p-6 flex flex-col gap-4">
        <p className="label-caps text-secondary">AI structuring…</p>
        <pre className="bg-glass-surface rounded-md-token p-4 font-mono text-xs whitespace-pre-wrap max-h-[60vh] overflow-auto">
          {streaming || t("common.loading")}
        </pre>
        {error && <p className="text-sm text-danger">{error}</p>}
      </section>
    );
  }

  // review phase
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-4">
        <p className="label-caps text-secondary mb-2">{t("onboarding.review.rawPaste")}</p>
        <pre className="font-mono text-xs whitespace-pre-wrap">{rawPaste}</pre>
      </div>
      <div className="glass-card-elevated p-4 flex flex-col gap-3">
        <h2 className="text-xl font-bold">{t("onboarding.review.title")}</h2>
        <p className="text-sm text-secondary">{t("onboarding.review.subtitle")}</p>
        <FieldRow
          label={t("brief.fields.offer")}
          value={extracted?.offer ?? ""}
          onChange={(v) => setExtracted({ ...extracted, offer: v })}
        />
        <FieldRow
          label={t("brief.fields.icp")}
          value={extracted?.icp ?? ""}
          onChange={(v) => setExtracted({ ...extracted, icp: v })}
        />
        <FieldRow
          label={t("brief.fields.usp")}
          value={extracted?.usp ?? ""}
          onChange={(v) => setExtracted({ ...extracted, usp: v })}
        />
        <FieldRow
          label={t("brief.fields.kpi")}
          value={extracted?.kpi ?? ""}
          onChange={(v) => setExtracted({ ...extracted, kpi: v })}
        />
        <FieldRow
          label={t("brief.fields.budget")}
          value={extracted?.budget ?? ""}
          onChange={(v) => setExtracted({ ...extracted, budget: v })}
        />
        <div className="flex flex-col gap-1 text-sm">
          <span className="label-caps text-secondary">{t("brief.fields.competitors")}</span>
          <textarea
            value={(extracted?.competitors ?? []).map((c) => c.name).join("\n")}
            onChange={(e) =>
              setExtracted({
                ...extracted,
                competitors: e.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((name) => ({
                    name,
                    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                  })),
              })
            }
            rows={3}
            className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 font-mono text-sm"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setPhase("paste")}
            className="flex-1 glass-card py-2 text-sm hover:bg-glass-elevated"
          >
            {t("onboarding.review.rerun")}
          </button>
          <button
            onClick={commit}
            disabled={committing}
            className="flex-1 bg-primary text-white font-medium rounded-md-token py-2 disabled:opacity-50"
          >
            {committing ? "…" : t("onboarding.review.approve")}
          </button>
        </div>
      </div>
    </section>
  );
}

function FieldRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="label-caps text-secondary">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2"
      />
    </label>
  );
}

function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
