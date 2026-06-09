"use client";

import { useState } from "react";
import type { Client, Brief } from "@/lib/schemas";
import type { ArtifactRef } from "@/lib/repo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

interface Props {
  client: Client;
  brief: Brief | null;
  angles: AnyObj[];
  savedList: ArtifactRef[];
}

const PLATFORMS = ["Meta", "Google", "Meta + Google"];
const OBJECTIVES = ["Leads", "Sales", "Traffic", "Awareness", "Retargeting"];
const FUNNEL_STAGES = ["Cold", "Warm", "Hot"];

export function CreativeRequestView({ client, brief, angles, savedList }: Props) {
  const [selectedAngleId, setSelectedAngleId] = useState(angles[0]?.id ?? "");
  const [platform, setPlatform] = useState("Meta");
  const [objective, setObjective] = useState("Leads");
  const [funnelStage, setFunnelStage] = useState("Cold");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AnyObj | null>(null);
  const [savedFilename, setSavedFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"form" | "result" | "history">("form");
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/clients/${client.id}/creative-requests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ angleId: selectedAngleId, platform, objective, funnelStage, notes }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `HTTP ${res.status}`);
        setGenerating(false);
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
          if (evt.type === "done") {
            setResult(evt.data);
            setSavedFilename(evt.filename ?? null);
            setViewMode("result");
          }
          if (evt.type === "error") setError(String(evt.error));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  function copyBlock(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedBlock(label);
    setTimeout(() => setCopiedBlock(null), 2000);
  }

  function copyAll() {
    if (!result) return;
    copyBlock("all", JSON.stringify(result, null, 2));
  }

  const selectedAngle = angles.find((a) => String(a.id) === String(selectedAngleId));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label-caps text-secondary mb-1">{client.vertical}</div>
          <h1 className="text-2xl font-bold">{client.name} — Creative Requests</h1>
          <p className="text-sm text-secondary mt-1">
            Génera el template completo WMM para el equipo de diseño.
            {!angles.length && " Run Strategy first to pre-load angles."}
          </p>
        </div>
        <div className="flex gap-2">
          {savedList.length > 0 && (
            <button onClick={() => setViewMode("history")} className="glass-card px-3 py-2 text-sm hover:bg-glass-elevated">
              History ({savedList.length})
            </button>
          )}
          {result && (
            <button onClick={() => setViewMode("form")} className="glass-card px-3 py-2 text-sm hover:bg-glass-elevated">
              ← New request
            </button>
          )}
        </div>
      </div>

      {!brief && (
        <div className="glass-card p-4 text-sm text-secondary text-center">
          Complete onboarding and commit a brief first.
        </div>
      )}

      {/* FORM */}
      {viewMode === "form" && brief && (
        <div className="glass-card-elevated p-6 flex flex-col gap-4 max-w-2xl">
          {/* Angle selector */}
          <label className="flex flex-col gap-1">
            <span className="label-caps text-secondary">Angle</span>
            {angles.length === 0 ? (
              <div className="text-sm text-secondary italic glass-card px-3 py-2">
                No angles saved yet — run Strategy Engine first.
              </div>
            ) : (
              <select
                value={selectedAngleId}
                onChange={(e) => setSelectedAngleId(e.target.value)}
                className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 text-sm"
              >
                {angles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name ?? a.title} [{a.funnel}]
                  </option>
                ))}
              </select>
            )}
            {selectedAngle && (
              <p className="text-xs text-secondary mt-1">{selectedAngle.proposition}</p>
            )}
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="label-caps text-secondary">Platform</span>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 text-sm">
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-caps text-secondary">Objective</span>
              <select value={objective} onChange={(e) => setObjective(e.target.value)} className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 text-sm">
                {OBJECTIVES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-caps text-secondary">Funnel Stage</span>
              <select value={funnelStage} onChange={(e) => setFunnelStage(e.target.value)} className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 text-sm">
                {FUNNEL_STAGES.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="label-caps text-secondary">Additional notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Specific requirements, tone, budget constraints, reference creatives…"
              className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 text-sm"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            onClick={generate}
            disabled={generating}
            className="bg-primary text-white font-semibold rounded-md-token py-2.5 disabled:opacity-50 hover:opacity-90"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Generating creative request…
              </span>
            ) : "Generate Creative Request"}
          </button>
        </div>
      )}

      {/* RESULT */}
      {viewMode === "result" && result && (
        <CreativeRequestResult result={result} filename={savedFilename} onCopyAll={copyAll} copiedBlock={copiedBlock} onCopyBlock={copyBlock} />
      )}

      {/* HISTORY */}
      {viewMode === "history" && (
        <div className="flex flex-col gap-3">
          <button onClick={() => setViewMode("form")} className="self-start glass-card px-3 py-2 text-sm hover:bg-glass-elevated">← Back</button>
          {savedList.map((ref) => (
            <div key={ref.filename} className="glass-card px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{ref.filename.replace(/\.json$/, "")}</div>
                <div className="text-xs text-secondary">{new Date(ref.updatedAt).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={async () => {
                    // Load the saved JSON and display it as a result
                    const res = await fetch(`/api/clients/${client.id}/guidelines/general`).catch(() => null);
                    // Actually load via the artifact read endpoint
                    const dataRes = await fetch(`/api/clients/${client.id}/creative-requests/${encodeURIComponent(ref.filename)}`);
                    if (dataRes.ok) {
                      const data = await dataRes.json();
                      setResult(data);
                      setSavedFilename(ref.filename.replace(/\.json$/, ""));
                      setViewMode("result");
                    }
                  }}
                  className="text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{ color: "var(--pearl-aqua)" }}
                >
                  View →
                </button>
                <button
                  onClick={() => copyBlock(ref.filename, ref.filename.replace(/\.json$/, ""))}
                  className="text-xs text-secondary hover:text-text"
                >
                  {copiedBlock === ref.filename ? "✓" : "Copy name"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreativeRequestResult({ result, filename, onCopyAll, copiedBlock, onCopyBlock }: {
  result: AnyObj; filename: string | null;
  onCopyAll: () => void; copiedBlock: string | null;
  onCopyBlock: (label: string, text: string) => void;
}) {
  const [activeSection, setActiveSection] = useState<"static" | "video" | "lp" | "naming">("static");
  const ci = result.campaignInfo ?? {};
  const cp = result.conversionPoint ?? {};

  // Normalize: AI may return angles nested under 'deliverables' or at top level
  const deliverables = result.deliverables ?? result;
  const staticAngles: AnyObj[] = deliverables.staticAngles ?? result.staticAngles ?? [];
  const videoAngles: AnyObj[]  = deliverables.videoAngles  ?? result.videoAngles  ?? [];

  // Normalize file naming: 'nomenclature.fileNames' or 'fileNaming.files'
  const nomenclature = result.nomenclature ?? {};
  const fileNaming   = result.fileNaming ?? {};
  const deliveryFolder = nomenclature.deliveryFolder ?? fileNaming.clientCode ?? "";
  const staticFiles: string[]  = nomenclature.fileNames?.adsStatic ?? [];
  const videoFiles: string[]   = nomenclature.fileNames?.adsVideo  ?? [];
  const legacyFiles: AnyObj[]  = fileNaming.files ?? [];

  function copyText(label: string, obj: unknown) {
    onCopyBlock(label, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Meta strip */}
      <div className="glass-card-elevated p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <InfoChip label="Client" value={ci.client} />
          <InfoChip label="Platform" value={ci.platform} />
          <InfoChip label="Objective" value={ci.objective} />
          <InfoChip label="Funnel" value={ci.funnelStage} />
          <InfoChip label="CTA" value={cp.primaryCTA} />
        </div>
        <div className="flex gap-2">
          {filename && (
            <span className="label-caps text-secondary">{filename.replace(/\.json$/, "")}</span>
          )}
          <button onClick={onCopyAll} className="glass-card px-3 py-1.5 text-sm hover:bg-glass-elevated">
            {copiedBlock === "all" ? "✓ Copied" : "Copy all JSON"}
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1">
        {(["static", "video", "lp", "naming"] as const).map((s) => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-3 py-1.5 rounded-sm-token text-sm transition ${activeSection === s ? "bg-primary text-white" : "glass-card text-secondary hover:text-text"}`}>
            {s === "static" ? `Static (${staticAngles.length})` :
             s === "video" ? `Video (${videoAngles.length})` :
             s === "lp" ? "Landing Page" : "File Naming"}
          </button>
        ))}
      </div>

      {/* Static angles */}
      {activeSection === "static" && (
        <div className="flex flex-col gap-4">
          {staticAngles.map((a: AnyObj) => (
            <div key={a.angleNum} className="glass-card-elevated p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="label-caps bg-primary/10 text-primary px-2 py-0.5 rounded-sm-token">{a.angleNum}</span>
                  <span className="label-caps glass-card px-2 py-0.5 text-secondary">{a.theme}</span>
                </div>
                <button onClick={() => copyText(a.angleNum, a)} className="text-xs text-secondary hover:text-text">
                  {copiedBlock === a.angleNum ? "✓" : "Copy"}
                </button>
              </div>
              {/* Avatar / concept */}
              {(a.avatar ?? a.concept) && (
                <p className="text-xs" style={{ color: "var(--color-secondary)" }}>{a.avatar ?? a.concept}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Hook (new format) or Copy IN headline (old format) */}
                <CopyField label="Hook / Headline" value={a.hook ?? a.copyIn?.headline} onCopy={() => copyText(`${a.angleNum}-hook`, a.hook ?? a.copyIn?.headline)} copied={copiedBlock === `${a.angleNum}-hook`} />
                {/* Supporting copy or primary text */}
                <CopyField label="Supporting Copy / Primary text" value={a.supportingCopy ?? a.copyOut?.primaryText} onCopy={() => copyText(`${a.angleNum}-body`, a.supportingCopy ?? a.copyOut?.primaryText)} copied={copiedBlock === `${a.angleNum}-body`} />
                {/* CTA */}
                <CopyField label="CTA" value={a.cta ?? a.copyIn?.ctaText} onCopy={() => copyText(`${a.angleNum}-cta`, a.cta ?? a.copyIn?.ctaText)} copied={copiedBlock === `${a.angleNum}-cta`} />
                {/* Copy OUT fields (if present) */}
                {a.copyOut?.headline && <CopyField label="Copy OUT — Headline" value={a.copyOut.headline} onCopy={() => copyText(`${a.angleNum}-oh`, a.copyOut.headline)} copied={copiedBlock === `${a.angleNum}-oh`} />}
                {a.copyOut?.description && <CopyField label="Copy OUT — Description" value={a.copyOut.description} onCopy={() => copyText(`${a.angleNum}-od`, a.copyOut.description)} copied={copiedBlock === `${a.angleNum}-od`} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video angles */}
      {activeSection === "video" && (
        <div className="flex flex-col gap-4">
          {videoAngles.map((a: AnyObj) => (
            <div key={a.angleNum} className="glass-card-elevated p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="label-caps bg-primary/10 text-primary px-2 py-0.5 rounded-sm-token">{a.angleNum}</span>
                  <span className="label-caps glass-card px-2 py-0.5 text-secondary">{a.format}</span>
                  <span className="label-caps glass-card px-2 py-0.5 text-secondary">{a.estimatedLength}</span>
                </div>
                <button onClick={() => copyText(a.angleNum + "v", a)} className="text-xs text-secondary hover:text-text">
                  {copiedBlock === a.angleNum + "v" ? "✓" : "Copy"}
                </button>
              </div>
              <CopyField label="Hook" value={a.hook} onCopy={() => copyText(`${a.angleNum}-hook`, a.hook)} copied={copiedBlock === `${a.angleNum}-hook`} />
              <div className="flex flex-col gap-1">
                <span className="label-caps text-secondary">Script beats</span>
                {(a.beats ?? []).map((b: AnyObj) => (
                  <div key={b.beatNum} className="glass-card px-3 py-2 text-sm flex gap-3">
                    <span className="label-caps text-secondary w-6 shrink-0">B{b.beatNum}</span>
                    <div>
                      <div className="text-secondary text-xs">On screen: {b.onScreen}</div>
                      <div>VO: {b.vo}</div>
                    </div>
                  </div>
                ))}
              </div>
              <CopyField label="Final CTA frame" value={a.finalCTAFrame} onCopy={() => copyText(`${a.angleNum}-frame`, a.finalCTAFrame)} copied={copiedBlock === `${a.angleNum}-frame`} />
              <CopyField label="Copy OUT — Primary text" value={a.copyOut?.primaryText} onCopy={() => copyText(`${a.angleNum}-vpt`, a.copyOut?.primaryText)} copied={copiedBlock === `${a.angleNum}-vpt`} />
            </div>
          ))}
        </div>
      )}

      {/* LP */}
      {activeSection === "lp" && result.landingPage && (
        <div className="glass-card-elevated p-4 flex flex-col gap-3">
          <div className="font-semibold">Landing Page</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CopyField label="H1" value={result.landingPage.hero?.h1} onCopy={() => copyText("lp-h1", result.landingPage.hero?.h1)} copied={copiedBlock === "lp-h1"} />
            <CopyField label="Subheadline" value={result.landingPage.hero?.sub} onCopy={() => copyText("lp-sub", result.landingPage.hero?.sub)} copied={copiedBlock === "lp-sub"} />
            <CopyField label="Primary CTA" value={result.landingPage.primaryCTA} onCopy={() => copyText("lp-cta", result.landingPage.primaryCTA)} copied={copiedBlock === "lp-cta"} />
            <CopyField label="Final CTA button" value={result.landingPage.finalCTA?.button} onCopy={() => copyText("lp-fcta", result.landingPage.finalCTA?.button)} copied={copiedBlock === "lp-fcta"} />
          </div>
          <div>
            <div className="label-caps text-secondary mb-1">Benefits</div>
            {(result.landingPage.benefits ?? []).map((b: string, i: number) => (
              <div key={i} className="text-sm">• {b}</div>
            ))}
          </div>
        </div>
      )}

      {/* File naming */}
      {activeSection === "naming" && (
        <div className="glass-card-elevated p-4 flex flex-col gap-3">
          {deliveryFolder && (
            <div className="flex items-center gap-2">
              <span className="label-caps text-secondary">Delivery folder</span>
              <code className="font-mono text-sm" style={{ color: "var(--pearl-aqua)" }}>{deliveryFolder}</code>
              <button onClick={() => copyText("folder", deliveryFolder)} className="text-xs text-secondary hover:text-text ml-1">
                {copiedBlock === "folder" ? "✓" : "Copy"}
              </button>
            </div>
          )}
          {/* New format: flat lists of filenames */}
          {staticFiles.length > 0 && (
            <div>
              <div className="label-caps mb-2">Static files</div>
              <div className="flex flex-col gap-1.5">
                {staticFiles.map((name: string, i: number) => (
                  <div key={i} className="glass-card px-3 py-2 flex items-center justify-between gap-4">
                    <code className="font-mono text-sm flex-1">{name}</code>
                    <button onClick={() => copyText(`sn-${i}`, name)} className="text-xs text-secondary hover:text-text shrink-0">
                      {copiedBlock === `sn-${i}` ? "✓" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {videoFiles.length > 0 && (
            <div>
              <div className="label-caps mb-2">Video files</div>
              <div className="flex flex-col gap-1.5">
                {videoFiles.map((name: string, i: number) => (
                  <div key={i} className="glass-card px-3 py-2 flex items-center justify-between gap-4">
                    <code className="font-mono text-sm flex-1">{name}</code>
                    <button onClick={() => copyText(`vn-${i}`, name)} className="text-xs text-secondary hover:text-text shrink-0">
                      {copiedBlock === `vn-${i}` ? "✓" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Legacy format fallback */}
          {legacyFiles.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {legacyFiles.map((f: AnyObj, i: number) => (
                <div key={i} className="glass-card px-3 py-2 flex items-center justify-between gap-4">
                  <span className="label-caps text-secondary w-16">{f.type}</span>
                  <code className="font-mono text-sm flex-1">{f.name}</code>
                  <button onClick={() => copyText(`fn-${i}`, f.name)} className="text-xs text-secondary hover:text-text">
                    {copiedBlock === `fn-${i}` ? "✓" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="label-caps text-secondary" style={{ fontSize: "0.6rem" }}>{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function CopyField({ label, value, onCopy, copied }: { label: string; value?: string; onCopy: () => void; copied: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="label-caps text-secondary">{label}</span>
        <button onClick={onCopy} className="text-xs text-secondary hover:text-text">{copied ? "✓" : "Copy"}</button>
      </div>
      <div className="glass-card px-3 py-2 text-sm">{value}</div>
    </div>
  );
}
