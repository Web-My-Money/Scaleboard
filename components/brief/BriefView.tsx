"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { Brief, BriefFrontmatter, Client } from "@/lib/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditableField = keyof Pick<BriefFrontmatter, "offer" | "icp" | "usp" | "kpi" | "budget">;
type SaveState = "idle" | "saving" | "saved" | "error";

// ─── Main component ───────────────────────────────────────────────────────────

export function BriefView({ client, brief }: { client: Client; brief: Brief }) {
  const [fm, setFm] = useState<BriefFrontmatter>(brief.frontmatter);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (updated: BriefFrontmatter) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState("saving");
      try {
        const res = await fetch(`/api/clients/${client.id}/brief`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ frontmatter: updated, body: brief.body }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setSaveState("saved");
        saveTimer.current = setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("error");
        saveTimer.current = setTimeout(() => setSaveState("idle"), 3000);
      }
    },
    [client.id, brief.body],
  );

  function updateField(field: EditableField, value: string) {
    const updated = { ...fm, [field]: value };
    setFm(updated);
    persist(updated);
  }

  function addCompetitor(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const updated = { ...fm, competitors: [...fm.competitors, { name, slug }] };
    setFm(updated);
    persist(updated);
  }

  function removeCompetitor(slug: string) {
    const updated = { ...fm, competitors: fm.competitors.filter((c) => c.slug !== slug) };
    setFm(updated);
    persist(updated);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">{client.vertical}</p>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
            {client.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Save indicator */}
          <SaveIndicator state={saveState} />
          <Link href={`/onboarding/${client.slug}`} className="btn-ghost text-sm">
            Re-run AI →
          </Link>
        </div>
      </div>

      {/* Editable bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <EditableField
          label="Offer"
          value={fm.offer}
          onSave={(v) => updateField("offer", v)}
          accent="primary"
          rows={5}
        />
        <EditableField
          label="ICP"
          value={fm.icp}
          onSave={(v) => updateField("icp", v)}
          rows={5}
        />
        <EditableField
          label="USP"
          value={fm.usp}
          onSave={(v) => updateField("usp", v)}
          rows={5}
        />
        <EditableField
          label="KPI"
          value={fm.kpi}
          onSave={(v) => updateField("kpi", v)}
          accent="success"
          rows={5}
        />
        <EditableField
          label="Budget"
          value={fm.budget}
          onSave={(v) => updateField("budget", v)}
          accent="warning"
          rows={4}
        />

        {/* Competitors — tag editor */}
        <CompetitorsField
          competitors={fm.competitors}
          onAdd={addCompetitor}
          onRemove={removeCompetitor}
        />
      </div>

      {/* Full brief notes */}
      {brief.body && (
        <div className="glass-card p-4">
          <p className="label-caps mb-3">Full brief</p>
          <pre
            className="text-xs whitespace-pre-wrap font-sans leading-relaxed"
            style={{ color: "var(--color-secondary)" }}
          >
            {brief.body}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Save indicator ───────────────────────────────────────────────────────────

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const styles: Record<SaveState, { text: string; color: string }> = {
    idle:   { text: "",          color: "" },
    saving: { text: "Saving…",   color: "var(--color-secondary)" },
    saved:  { text: "✓ Saved",   color: "var(--pearl-aqua)" },
    error:  { text: "⚠ Error",   color: "#e05c6a" },
  };
  const { text, color } = styles[state];
  return (
    <span className="text-xs font-medium transition-opacity" style={{ color, fontFamily: "var(--font-space-grotesk)" }}>
      {text}
    </span>
  );
}

// ─── Editable text field ──────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onSave,
  accent,
  rows = 4,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  accent?: "primary" | "success" | "warning";
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const accentClass = accent ? `accent-${accent}` : "";

  function startEdit() {
    setDraft(value);
    setEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      // auto-size
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, 10);
  }

  function commit() {
    setEditing(false);
    if (draft.trim() !== value.trim()) onSave(draft.trim());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") { setEditing(false); setDraft(value); }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
    // auto-grow
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <div
      className={`glass-card p-4 ${accentClass} group relative`}
      style={{ cursor: editing ? "default" : "text" }}
      onClick={() => !editing && startEdit()}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="label-caps">{label}</p>
        {!editing && (
          <span
            className="label-caps opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--pearl-aqua)", letterSpacing: "0.06em" }}
          >
            Edit
          </span>
        )}
        {editing && (
          <span className="label-caps" style={{ color: "var(--color-secondary)" }}>
            ⌘↵ save · esc cancel
          </span>
        )}
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={commit}
          onKeyDown={onKeyDown}
          rows={rows}
          className="w-full text-sm leading-relaxed resize-none focus:outline-none bg-transparent"
          style={{
            color: "var(--color-text)",
            border: "none",
            padding: 0,
            fontFamily: "var(--font-inter)",
            lineHeight: "1.6",
            minHeight: `${rows * 1.6}rem`,
          }}
        />
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)", lineHeight: "1.6" }}>
          {value || <span style={{ color: "var(--color-muted)" }}>Click to add…</span>}
        </p>
      )}
    </div>
  );
}

// ─── Competitors tag editor ───────────────────────────────────────────────────

function CompetitorsField({
  competitors,
  onAdd,
  onRemove,
}: {
  competitors: BriefFrontmatter["competitors"];
  onAdd: (name: string) => void;
  onRemove: (slug: string) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const name = inputVal.trim();
    if (!name) return;
    onAdd(name);
    setInputVal("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="glass-card p-4 group">
      <p className="label-caps mb-3">Competitors</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {competitors.map((c) => (
          <span
            key={c.slug}
            className="badge badge-muted flex items-center gap-1.5 pr-1.5"
            style={{ paddingLeft: "0.6rem" }}
          >
            {c.name}
            <button
              onClick={() => onRemove(c.slug)}
              className="hover:text-danger transition-colors leading-none"
              style={{ color: "var(--color-secondary)", fontSize: "0.7rem" }}
              aria-label={`Remove ${c.name}`}
            >
              ✕
            </button>
          </span>
        ))}
        {competitors.length === 0 && (
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>
            None added yet
          </span>
        )}
      </div>

      {/* Add competitor input */}
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add competitor…"
          className="flex-1 text-xs bg-transparent focus:outline-none placeholder:opacity-40"
          style={{
            border: "none",
            color: "var(--color-text)",
            fontFamily: "var(--font-inter)",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            paddingBottom: "4px",
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!inputVal.trim()}
          className="text-xs font-semibold disabled:opacity-30 transition-opacity"
          style={{ color: "var(--pearl-aqua)" }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}
