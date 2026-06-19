"use client";

import { useState } from "react";
import type { Client, Brief } from "@/lib/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

const FLOW_CONFIG = [
  { type: "lead-nurture",       label: "Lead Nurture",        emoji: "🌱", desc: "Nuevo lead → educa y nutre hasta agendar" },
  { type: "pre-call",           label: "Pre-Call",            emoji: "📞", desc: "Cita agendada → prepara al prospecto" },
  { type: "no-show-recovery",   label: "No-Show Recovery",    emoji: "🔄", desc: "No se presentó → re-agenda o elimina" },
  { type: "sales-follow-up",    label: "Sales Follow-Up",     emoji: "💼", desc: "Llamada sin cierre → seguimiento post-call" },
  { type: "reactivation",       label: "Reactivation",        emoji: "⚡", desc: "Lead frío 30+ días → reactiva interés" },
  { type: "onboarding",         label: "Client Onboarding",   emoji: "🎯", desc: "Nuevo cliente → bienvenida y primeros pasos" },
] as const;
type FlowType = typeof FLOW_CONFIG[number]["type"];

const STEP_ICONS: Record<string, string> = {
  email: "✉️", sms: "💬", wait: "⏳", condition: "🔀", action: "⚙️",
};
const STEP_COLORS: Record<string, string> = {
  email: "rgba(143,204,182,0.12)", sms: "rgba(232,149,88,0.12)",
  wait: "rgba(255,255,255,0.05)", condition: "rgba(24,86,255,0.10)", action: "rgba(224,92,106,0.10)",
};

interface Props {
  client: Client;
  brief: Brief | null;
  savedFlows: Array<{ type: string; data: unknown }>;
}

export function EmailFlowsView({ client, brief, savedFlows }: Props) {
  const [activeFlow, setActiveFlow] = useState<FlowType>("lead-nurture");
  const [flows, setFlows] = useState<Record<string, AnyObj | null>>(() => {
    const init: Record<string, AnyObj | null> = {};
    savedFlows.forEach(({ type, data }) => { init[type] = data as AnyObj | null; });
    return init;
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const currentFlow = flows[activeFlow];
  const config = FLOW_CONFIG.find((f) => f.type === activeFlow)!;

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${client.id}/email-flows`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ flowType: activeFlow }),
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
          buf = buf.slice(idx + 2);
          idx = buf.indexOf("\n\n");
          if (!line.startsWith("data: ")) continue;
          const evt = JSON.parse(line.slice(6)) as AnyObj;
          if (evt.type === "done") setFlows((f) => ({ ...f, [activeFlow]: evt.data as AnyObj }));
          if (evt.type === "error") setError(String(evt.error));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function exportAll() {
    const rows = ["Step,Type,Wait,Subject,Body,SMS,Purpose"];
    (currentFlow?.steps ?? []).forEach((s: AnyObj) => {
      rows.push([
        s.stepNum, s.type, s.waitDelay ?? "",
        `"${(s.email?.subjectLine ?? "").replace(/"/g, "'")}"`,
        `"${(s.email?.body ?? "").replace(/"/g, "'").replace(/\n/g, " ")}"`,
        `"${(s.sms?.message ?? "").replace(/"/g, "'")}"`,
        `"${(s.purpose ?? "").replace(/"/g, "'")}"`
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${client.name}-${activeFlow}-flow.csv`; a.click();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">{client.vertical}</p>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
            {client.name} — Email Flows
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-secondary)" }}>
            6 flujos GHL-ready. Genera, revisa y exporta para importar en GoHighLevel.
          </p>
        </div>
      </div>

      {!brief && (
        <div className="glass-card p-4 text-sm text-center" style={{ color: "var(--color-secondary)" }}>
          Completa el onboarding y aprueba el brief primero.
        </div>
      )}

      {/* Flow selector grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {FLOW_CONFIG.map((fc) => {
          const isActive = activeFlow === fc.type;
          const hasData = !!flows[fc.type];
          return (
            <button
              key={fc.type}
              onClick={() => setActiveFlow(fc.type)}
              className="glass-card p-3 text-left transition-all"
              style={{
                border: isActive ? "1px solid rgba(143,204,182,0.4)" : undefined,
                background: isActive ? "rgba(143,204,182,0.08)" : undefined,
                boxShadow: isActive ? "var(--shadow-glow-sm)" : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{fc.emoji}</span>
                {hasData && <span className="badge badge-success">✓</span>}
              </div>
              <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{fc.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-secondary)" }}>{fc.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Active flow */}
      <div className="glass-card-elevated p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{config.emoji}</span>
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{config.label}</h2>
            </div>
            {currentFlow && (
              <p className="text-sm mt-1" style={{ color: "var(--color-secondary)" }}>
                {currentFlow.totalDuration} · {(currentFlow.steps ?? []).length} steps · {currentFlow.trigger}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {currentFlow && (
              <>
                <button onClick={exportAll} className="btn-ghost text-sm">Export CSV</button>
                <button
                  onClick={() => copyText("json", JSON.stringify(currentFlow, null, 2))}
                  className="btn-ghost text-sm"
                >
                  {copied === "json" ? "✓ Copied" : "Copy JSON"}
                </button>
              </>
            )}
            <button
              onClick={generate}
              disabled={generating || !brief}
              className="btn-primary"
            >
              {generating ? (
                <span className="flex items-center gap-2"><span className="spinner" /> Generating…</span>
              ) : currentFlow ? "Regenerate" : "Generate Flow"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>}

        {generating && !currentFlow && (
          <div className="glass-card p-4 flex items-center gap-3 text-sm" style={{ color: "var(--color-secondary)" }}>
            <span className="spinner" /> Building {config.label} flow for GHL…
          </div>
        )}

        {/* Flow summary */}
        {currentFlow && (
          <>
            <div className="glass-card p-3">
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{currentFlow.summary}</p>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-2">
              {(currentFlow.steps ?? []).map((step: AnyObj) => (
                <div
                  key={step.stepNum}
                  className="rounded-xl p-4"
                  style={{ background: STEP_COLORS[step.type] ?? "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-start gap-3">
                    {/* Step number */}
                    <div className="w-7 h-7 rounded-lg grid place-items-center text-xs font-bold shrink-0"
                      style={{ background: "rgba(255,255,255,0.10)", color: "var(--color-secondary)" }}>
                      {step.stepNum}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span>{STEP_ICONS[step.type] ?? "•"}</span>
                        <span className="badge badge-muted">{step.type.toUpperCase()}</span>
                        {step.waitDelay && <span className="label-caps" style={{ color: "var(--color-secondary)" }}>{step.waitDelay}</span>}
                        {step.email?.tone && <span className="badge badge-muted">{step.email.tone}</span>}
                      </div>

                      <p className="text-xs mb-2" style={{ color: "var(--pearl-aqua)" }}>{step.purpose}</p>

                      {/* Email */}
                      {step.type === "email" && step.email && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="label-caps mb-0.5">Subject</p>
                              <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{step.email.subjectLine}</p>
                              <p className="text-xs" style={{ color: "var(--color-secondary)" }}>{step.email.previewText}</p>
                            </div>
                            <button onClick={() => copyText(`email-${step.stepNum}`, `Subject: ${step.email.subjectLine}\n\n${step.email.body}`)}
                              className="text-xs shrink-0" style={{ color: "var(--color-secondary)" }}>
                              {copied === `email-${step.stepNum}` ? "✓" : "Copy"}
                            </button>
                          </div>
                          <div className="glass-card p-3">
                            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" style={{ color: "var(--color-secondary)" }}>
                              {step.email.body}
                            </pre>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold" style={{ color: "var(--pearl-aqua)" }}>→ {step.email.ctaText}</span>
                          </div>
                        </div>
                      )}

                      {/* SMS */}
                      {step.type === "sms" && step.sms && (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm" style={{ color: "var(--color-text)" }}>{step.sms.message}</p>
                          <button onClick={() => copyText(`sms-${step.stepNum}`, step.sms.message)}
                            className="text-xs shrink-0" style={{ color: "var(--color-secondary)" }}>
                            {copied === `sms-${step.stepNum}` ? "✓" : "Copy"}
                          </button>
                        </div>
                      )}

                      {/* Condition/Action */}
                      {step.conditionLogic && <p className="text-sm" style={{ color: "var(--color-secondary)" }}>🔀 {step.conditionLogic}</p>}
                      {step.ghlAction && <p className="text-sm" style={{ color: "var(--color-secondary)" }}>⚙️ {step.ghlAction}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* GHL Setup notes */}
            {currentFlow.ghlSetupNotes?.length > 0 && (
              <div className="glass-card p-4">
                <p className="label-caps mb-2">GHL Setup Notes</p>
                <ul className="flex flex-col gap-1">
                  {currentFlow.ghlSetupNotes.map((note: string, i: number) => (
                    <li key={i} className="text-sm" style={{ color: "var(--color-secondary)" }}>→ {note}</li>
                  ))}
                </ul>
                {currentFlow.tagsNeeded?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="label-caps mr-2">Tags:</span>
                    {currentFlow.tagsNeeded.map((tag: string) => (
                      <span key={tag} className="badge badge-muted">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
