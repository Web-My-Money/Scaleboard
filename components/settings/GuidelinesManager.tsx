"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { GuidelineDoc } from "@/lib/guidelines";

const ALL_MODULES = [
  "general",
  "strategy",
  "creative-request",
  "email-flows",
  "attraction-matrix",
  "test-lab",
] as const;

type ModuleKey = (typeof ALL_MODULES)[number];

const MODULE_LABELS: Record<ModuleKey, string> = {
  "general": "General (all modules)",
  "strategy": "Strategy",
  "creative-request": "Creative Requests",
  "email-flows": "Email Flows",
  "attraction-matrix": "Attraction Matrix",
  "test-lab": "Test Lab",
};

/** Props: either app-level (no clientId) or client-level (clientId present) */
export function GuidelinesManager({
  clientId,
  title,
}: {
  clientId?: string;
  title?: string;
}) {
  const t = useTranslations("common");
  const [activeModule, setActiveModule] = useState<ModuleKey>("general");
  const [docs, setDocs] = useState<GuidelineDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = clientId
    ? `/api/clients/${clientId}/guidelines`
    : "/api/guidelines";

  const load = useCallback(async () => {
    const res = await fetch(`${apiBase}/${activeModule}`);
    if (res.ok) setDocs(await res.json());
  }, [apiBase, activeModule]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${apiBase}/${activeModule}`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? `Upload failed (HTTP ${res.status})`);
    } else {
      await load();
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    const url = clientId
      ? `${apiBase}/${activeModule}/${id}`
      : `${apiBase}/${activeModule}/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div className="flex flex-col gap-3">
      {title && <h3 className="label-caps text-secondary">{title}</h3>}

      {/* Module tabs */}
      <div className="flex flex-wrap gap-1">
        {ALL_MODULES.map((m) => (
          <button
            key={m}
            onClick={() => setActiveModule(m)}
            className={`px-2 py-1 rounded-sm-token text-xs transition ${
              activeModule === m
                ? "bg-primary text-white"
                : "glass-card text-secondary hover:text-text"
            }`}
          >
            {MODULE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <label
        className={`glass-card border-dashed border-2 border-glass-border rounded-md-token p-4 flex flex-col items-center gap-1 cursor-pointer hover:bg-glass-elevated text-center ${
          uploading ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <span className="text-2xl">📄</span>
        <span className="text-sm font-medium">
          {uploading ? t("loading") : `Upload ${MODULE_LABELS[activeModule]} guideline`}
        </span>
        <span className="text-xs text-secondary">PDF · DOCX · TXT · MD — max 15 MB</span>
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f);
            e.target.value = "";
          }}
        />
      </label>

      {error && <p className="text-xs text-danger">{error}</p>}

      {/* Doc list */}
      {docs.length === 0 ? (
        <p className="text-xs text-secondary italic">
          No guidelines for {MODULE_LABELS[activeModule]} yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="glass-card px-3 py-2 flex items-center gap-2 text-sm"
            >
              <span className="text-base">📄</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{doc.filename}</div>
                <div className="text-xs text-secondary">
                  {MODULE_LABELS[doc.module as ModuleKey] ?? doc.module} ·{" "}
                  {(doc.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => void handleDelete(doc.id)}
                className="text-xs text-danger hover:underline ml-2"
                aria-label={`Delete ${doc.filename}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
