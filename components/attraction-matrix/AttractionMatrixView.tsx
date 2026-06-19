"use client";

import { useState } from "react";
import type { Client, Brief } from "@/lib/schemas";
import type { ArtifactRef } from "@/lib/repo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

const DIMENSIONS = [
  { key: "tension",   es: "Tensión",   desc: "Deseo no resuelto — la brecha que jalona la atención" },
  { key: "gravity",   es: "Gravedad",  desc: "Peso, autoridad — la sensación de que esto importa" },
  { key: "lightness", es: "Leveza",    desc: "Elegancia, ausencia de fricción" },
  { key: "ritual",    es: "Ritual",    desc: "Ceremonia, pertenencia a algo" },
  { key: "alterity",  es: "Alteridad", desc: "Otredad, misterio — lo que no se puede agarrar del todo" },
];

const SCORE_COLOR = (score: number) => {
  if (score >= 8) return "var(--pearl-aqua)";
  if (score >= 5) return "#E89558";
  return "#e05c6a";
};

interface Props {
  client: Client;
  brief: Brief | null;
  analyses: ArtifactRef[];
}

export function AttractionMatrixView({ client, brief, analyses }: Props) {
  const [creative, setCreative] = useState("");
  const [result, setResult] = useState<AnyObj | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewHistory, setViewHistory] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function analyze() {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/clients/${client.id}/attraction-matrix`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ creative }),
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
          if (evt.type === "done") setResult(evt.data as AnyObj);
          if (evt.type === "error") setError(String(evt.error));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setGenerating(false); }
  }

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const totalScore = result?.totalScore ?? result?.scores?.reduce((acc: number, s: AnyObj) => acc + (s.score ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">{client.vertical}</p>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
            {client.name} — Attraction Matrix
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-secondary)" }}>
            Análisis filosófico-estratégico basado en las 5 dimensiones de Byung-Chul Han.
          </p>
        </div>
        {analyses.length > 0 && (
          <button onClick={() => setViewHistory(!viewHistory)} className="btn-ghost text-sm">
            {viewHistory ? "← Analizar" : `History (${analyses.length})`}
          </button>
        )}
      </div>

      {/* History */}
      {viewHistory && (
        <div className="flex flex-col gap-2">
          {analyses.map((ref) => (
            <div key={ref.filename} className="glass-card px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-sm">{ref.filename.replace(/\.json$/, "")}</div>
                <div className="text-xs" style={{ color: "var(--color-secondary)" }}>{new Date(ref.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {!viewHistory && (
        <div className="glass-card-elevated p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="label-caps">Copy o concepto a analizar</span>
            <textarea
              value={creative}
              onChange={(e) => setCreative(e.target.value)}
              rows={6}
              placeholder="Pega aquí el copy de un ad, un headline, un concepto de video, o una propuesta de valor. El análisis evaluará las 5 dimensiones y propondrá una versión mejorada."
              className="glass-input font-sans"
            />
          </label>
          {error && <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>}
          <button onClick={analyze} disabled={generating || !creative.trim()} className="btn-primary">
            {generating
              ? <span className="flex items-center gap-2"><span className="spinner" />Analizando…</span>
              : "Analizar con Attraction Matrix"}
          </button>
        </div>
      )}

      {/* Results */}
      {result && !viewHistory && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Score overview */}
          <div className="glass-card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="label-caps mb-1">Score total</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black"
                    style={{ fontFamily: "monospace", color: SCORE_COLOR(totalScore / 5) }}>
                    {totalScore}
                  </span>
                  <span className="text-lg" style={{ color: "var(--color-secondary)" }}>/50</span>
                </div>
              </div>
              <p className="text-sm max-w-xs text-right" style={{ color: "var(--color-secondary)" }}>
                {result.overallDiagnosis}
              </p>
            </div>

            {/* Radar-style bar chart */}
            <div className="flex flex-col gap-3">
              {DIMENSIONS.map((dim) => {
                const scoreObj = result.scores?.find((s: AnyObj) =>
                  s.dimension === dim.key || s.dimensionEs === dim.es
                );
                const score = scoreObj?.score ?? 0;
                return (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{dim.es}</span>
                        <span className="text-xs ml-2" style={{ color: "var(--color-secondary)" }}>{dim.desc}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: SCORE_COLOR(score), fontFamily: "monospace" }}>
                        {score}/10
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${score * 10}%`, background: SCORE_COLOR(score) }} />
                    </div>
                    {scoreObj?.diagnosis && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>{scoreObj.diagnosis}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority changes */}
          {result.prioritizedChanges?.length > 0 && (
            <div className="glass-card p-4 flex flex-col gap-3">
              <p className="label-caps">Cambios prioritarios</p>
              {result.prioritizedChanges.map((ch: AnyObj, i: number) => (
                <div key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full grid place-items-center text-xs font-bold shrink-0"
                    style={{ background: "var(--pearl-aqua)", color: "#040404" }}>{ch.priority ?? i+1}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{ch.change}</p>
                    <p className="text-xs" style={{ color: "var(--color-secondary)" }}>{ch.why}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Before / After */}
          {(result.before || result.after) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.before && (
                <div className="glass-card p-4 accent-danger">
                  <p className="label-caps mb-2" style={{ color: "#e05c6a" }}>Antes</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>{result.before}</p>
                </div>
              )}
              {result.after && (
                <div className="glass-card p-4 accent-primary">
                  <div className="flex items-center justify-between mb-2">
                    <p className="label-caps" style={{ color: "var(--pearl-aqua)" }}>Después</p>
                    <button onClick={() => copy("after", result.after)}
                      className="text-xs" style={{ color: "var(--color-secondary)" }}>
                      {copiedKey === "after" ? "✓" : "Copy"}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{result.after}</p>
                </div>
              )}
            </div>
          )}

          {/* Verdict */}
          {result.summary && (
            <div className="glass-card p-3 text-center">
              <p className="text-sm font-medium" style={{ color: "var(--pearl-aqua)" }}>→ {result.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
