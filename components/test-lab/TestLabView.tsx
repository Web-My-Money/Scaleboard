"use client";

import { useState } from "react";
import type { Client, Brief } from "@/lib/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

const VARIABLE_COLORS: Record<string, string> = {
  angle:  "rgba(143,204,182,0.15)",
  hook:   "rgba(232,149,88,0.15)",
  format: "rgba(88,52,148,0.20)",
  proof:  "rgba(24,86,255,0.15)",
  cta:    "rgba(224,92,106,0.15)",
  offer:  "rgba(255,193,7,0.15)",
};
const VARIABLE_LABEL_COLORS: Record<string, string> = {
  angle: "#8fccb6", hook: "#E89558", format: "#9b59b6",
  proof: "#5c8bff", cta: "#e05c6a", offer: "#ffc107",
};
const ZONE_CONFIG = {
  bullseye: { label: "🎯 Bullseye", color: "#8fccb6", range: "13–15" },
  ring2:    { label: "Ring 2",      color: "#E89558", range: "11–12" },
  ring3:    { label: "Ring 3",      color: "#8892B0", range: "9–10" },
  periphery:{ label: "Periphery",   color: "rgba(255,255,255,0.3)", range: "<9" },
};
const STATUS_OPTIONS = ["planned", "in_progress", "completed", "paused"];

interface Props {
  client: Client;
  brief: Brief | null;
  angles: AnyObj[];
  initialData: unknown;
}

export function TestLabView({ client, brief, angles, initialData }: Props) {
  const [data, setData] = useState<AnyObj | null>(initialData as AnyObj | null);
  const [view, setView] = useState<"board" | "bullseye">("board");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const experiments: AnyObj[] = data?.experiments ?? [];
  const grouped = {
    bullseye: experiments.filter((e) => e.zone === "bullseye"),
    ring2:    experiments.filter((e) => e.zone === "ring2"),
    ring3:    experiments.filter((e) => e.zone === "ring3"),
    periphery:experiments.filter((e) => e.zone === "periphery"),
  };

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${client.id}/test-lab`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok || !res.body) {
        const b = await res.json().catch(() => null);
        setError(b?.error ?? `HTTP ${res.status}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx = buf.indexOf("\n\n");
        while (idx >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2); idx = buf.indexOf("\n\n");
          if (!line.startsWith("data: ")) continue;
          const evt = JSON.parse(line.slice(6)) as AnyObj;
          if (evt.type === "done") setData(evt.data as AnyObj);
          if (evt.type === "error") setError(String(evt.error));
        }
      }
      if (data) setData((d) => d);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setGenerating(false); }
  }

  async function updateTest(testId: string, patch: AnyObj) {
    const res = await fetch(`/api/clients/${client.id}/test-lab`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ _action: "update", testId, patch }),
    });
    if (res.ok) setData(await res.json());
  }

  function exportCSV() {
    const rows = ["ID,Variable,Hypothesis,KPI,Impact,Confidence,Ease,ICE Total,Zone,Status,Result"];
    experiments.forEach((e) => {
      rows.push([
        e.id, e.variable,
        `"${(e.hypothesis ?? "").replace(/"/g, "'")}"`,
        e.kpi, e.ice?.impact, e.ice?.confidence, e.ice?.ease, e.iceTotal, e.zone, e.status,
        `"${(e.result ?? "").replace(/"/g, "'")}"`
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${client.name}-test-lab.csv`; a.click();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">{client.vertical}</p>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
            {client.name} — Test Lab
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-secondary)" }}>
            {experiments.length > 0 ? `${experiments.length} experimentos · ICE+Bullseye Framework` : "Genera 6 experimentos priorizados desde el brief y ángulos de estrategia."}
          </p>
        </div>
        <div className="flex gap-2">
          {experiments.length > 0 && (
            <button onClick={exportCSV} className="btn-ghost text-sm">Export CSV</button>
          )}
          <button onClick={generate} disabled={generating || !brief} className="btn-primary">
            {generating ? <span className="flex items-center gap-2"><span className="spinner" />Generating…</span>
              : data ? "Regenerate" : "Generate Tests"}
          </button>
        </div>
      </div>

      {!brief && <div className="glass-card p-4 text-sm text-center" style={{ color: "var(--color-secondary)" }}>Completa el onboarding primero.</div>}
      {angles.length === 0 && brief && <div className="glass-card p-3 text-sm" style={{ color: "var(--color-secondary)" }}>💡 Corre Strategy primero para que los ángulos se pre-carguen en los experimentos.</div>}
      {error && <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>}
      {generating && <div className="glass-card p-4 flex items-center gap-3 text-sm" style={{ color: "var(--color-secondary)" }}><span className="spinner" />Priorizando experimentos con ICE+Bullseye…</div>}

      {experiments.length > 0 && (
        <>
          {/* View toggle + summary stats */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(["board", "bullseye"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className="module-tab"
                  style={view === v ? { background: "var(--pearl-aqua)", color: "#040404", fontWeight: 600, borderRadius: "8px", boxShadow: "var(--shadow-glow-sm)" } : {}}>
                  {v === "board" ? "📋 Board" : "🎯 Bullseye"}
                </button>
              ))}
            </div>
            <div className="flex gap-3 text-xs" style={{ color: "var(--color-secondary)" }}>
              {Object.entries(grouped).map(([zone, exps]) => (
                <span key={zone} style={{ color: ZONE_CONFIG[zone as keyof typeof ZONE_CONFIG].color }}>
                  {ZONE_CONFIG[zone as keyof typeof ZONE_CONFIG].label}: {exps.length}
                </span>
              ))}
            </div>
          </div>

          {/* BOARD VIEW */}
          {view === "board" && (
            <div className="flex flex-col gap-3">
              {experiments.map((exp) => (
                <ExperimentCard key={exp.id} exp={exp} onUpdate={(patch) => updateTest(exp.id, patch)} />
              ))}
            </div>
          )}

          {/* BULLSEYE VIEW */}
          {view === "bullseye" && (
            <div className="flex flex-col gap-4">
              {(["bullseye","ring2","ring3","periphery"] as const).map((zone) => {
                const zc = ZONE_CONFIG[zone];
                const exps = grouped[zone];
                if (exps.length === 0) return null;
                return (
                  <div key={zone}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-bold" style={{ color: zc.color }}>{zc.label}</span>
                      <span className="label-caps">ICE {zc.range}</span>
                      <span className="badge badge-muted">{exps.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {exps.map((exp) => (
                        <ExperimentCard key={exp.id} exp={exp} compact onUpdate={(patch) => updateTest(exp.id, patch)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Testing notes */}
          {data?.testingNotes && (
            <div className="glass-card p-4">
              <p className="label-caps mb-2">Testing Strategy</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>{data.testingNotes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExperimentCard({ exp, compact = false, onUpdate }: {
  exp: AnyObj; compact?: boolean; onUpdate: (patch: AnyObj) => void;
}) {
  const zc = ZONE_CONFIG[exp.zone as keyof typeof ZONE_CONFIG] ?? ZONE_CONFIG.periphery;
  const varColor = VARIABLE_LABEL_COLORS[exp.variable] ?? "var(--color-secondary)";
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState(exp.result ?? "");

  return (
    <div className="glass-card p-4 flex flex-col gap-2"
      style={{ borderLeft: `3px solid ${zc.color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="label-caps font-bold" style={{ color: varColor }}>
            {exp.variable?.toUpperCase() ?? "TEST"}
          </span>
          <span className="badge badge-muted">{exp.id}</span>
          <span className="label-caps" style={{ color: zc.color }}>{zc.label}</span>
        </div>
        {/* ICE total */}
        <span className="text-xl font-black" style={{ color: zc.color, fontFamily: "monospace" }}>
          {exp.iceTotal ?? ((exp.ice?.impact ?? 0) + (exp.ice?.confidence ?? 0) + (exp.ice?.ease ?? 0))}
        </span>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{exp.hypothesis}</p>

      {!compact && exp.hook && (
        <p className="text-xs italic" style={{ color: "var(--color-secondary)" }}>"{exp.hook}"</p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {exp.kpi && <span className="label-caps">KPI: {exp.kpi}</span>}
        {exp.format && <span className="badge badge-muted">{exp.format}</span>}
        {exp.audience && <span className="badge badge-muted">{exp.audience}</span>}
      </div>

      {/* ICE bars */}
      {!compact && (
        <div className="flex gap-3 text-xs">
          {[["I", exp.ice?.impact], ["C", exp.ice?.confidence], ["E", exp.ice?.ease]].map(([l, v]) => (
            <div key={l as string} className="flex items-center gap-1">
              <span className="label-caps">{l as string}</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="w-2 h-2 rounded-sm"
                    style={{ background: n <= (v as number) ? zc.color : "rgba(255,255,255,0.10)" }} />
                ))}
              </div>
              <span style={{ color: "var(--color-secondary)" }}>{v}/5</span>
            </div>
          ))}
        </div>
      )}

      {/* Status + result */}
      <div className="flex items-center gap-2 mt-1">
        <select
          value={exp.status ?? "planned"}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className="glass-input text-xs"
          style={{ width: "fit-content", padding: "2px 8px" }}
        >
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        {exp.status === "completed" && !editing && (
          <button onClick={() => setEditing(true)}
            className="text-xs" style={{ color: "var(--pearl-aqua)" }}>
            {exp.result ? "Edit result" : "+ Add result"}
          </button>
        )}
      </div>
      {editing && (
        <div className="flex gap-2 mt-1">
          <input
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="Describe the result and interpretation…"
            className="glass-input text-sm flex-1"
          />
          <button onClick={() => { onUpdate({ result }); setEditing(false); }} className="btn-primary text-sm px-3">Save</button>
          <button onClick={() => setEditing(false)} className="btn-ghost text-sm px-3">×</button>
        </div>
      )}
      {exp.result && !editing && (
        <p className="text-xs" style={{ color: "var(--pearl-aqua)" }}>→ {exp.result}</p>
      )}
    </div>
  );
}
