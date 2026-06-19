import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getClientRepo } from "@/lib/repo";
import { getAiClient } from "@/lib/ai";
import { getGuidelinesRepo } from "@/lib/guidelines";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJSON(raw: string): unknown | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const data = await getClientRepo().readArtifact(id, ["test-lab", "tests.json"], z.any()).catch(() => null);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // PATCH: update a test (status, result, ice scores)
  if (body._action === "update") {
    const gate = await requireApiPermission("module.test-lab.edit");
    if ("error" in gate) return gate.error;
    const existing = await getClientRepo().readArtifact(id, ["test-lab", "tests.json"], z.any()).catch(() => null) as Record<string, unknown> | null;
    if (!existing) return jsonError("No test lab data found", 404);
    const experiments = (existing.experiments as Array<Record<string, unknown>>) ?? [];
    const updated = experiments.map((e) => e.id === body.testId ? { ...e, ...body.patch } : e);
    const merged = { ...existing, experiments: updated };
    await getClientRepo().writeArtifact(id, ["test-lab", "tests.json"], merged, z.any());
    return NextResponse.json(merged);
  }

  // Generate new experiments
  const gate = await requireApiPermission("ai.invoke");
  if ("error" in gate) return gate.error;

  const client = await getClientRepo().getClient(id);
  const brief = await getClientRepo().getBrief(id);
  if (!brief) return jsonError("Brief not committed yet", 400);

  const angles = await getClientRepo().readArtifact(id, ["densification-pack", "angles.json"], z.array(z.any())).catch(() => null);
  const { text: guidelinesContext } = await getGuidelinesRepo()
    .assembleGuidelinesContext(client.slug, "test-lab")
    .catch(() => ({ text: "" }));

  let ai;
  try { ai = getAiClient(); }
  catch (err) { return jsonError(err instanceof Error ? err.message : "AI error", 503); }

  const anglesText = angles?.length
    ? `\nAngles available for testing:\n${angles.slice(0, 6).map((a: Record<string, unknown>, i: number) => `${i+1}. ${a.name ?? a.title} — ${a.proposition}`).join("\n")}`
    : "";

  const prompt = `Generate a test backlog for:

Client: ${client.name} | Vertical: ${client.vertical}
Offer: ${brief.frontmatter.offer}
ICP: ${brief.frontmatter.icp}
KPI: ${brief.frontmatter.kpi}${anglesText}

Generate 6 experiments covering different variables (angle, hook, format, proof, cta, offer).
Score each with ICE methodology. Prioritize by Bullseye zone.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }
      try {
        const result = await ai.generate({
          clientId: id, module: "test-lab",
          prompt, guidelinesContext: guidelinesContext || undefined,
          maxTokens: 3000, temperature: 0.5,
        });
        const parsed = safeJSON(result.text);
        if (!parsed) { send({ type: "error", error: "Could not parse test lab JSON" }); return; }
        await getClientRepo().writeArtifact(id, ["test-lab", "tests.json"], parsed, z.any());
        send({ type: "done", data: parsed });
      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : String(err) });
      } finally { controller.close(); }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
