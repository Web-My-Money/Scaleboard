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
  const analyses = await getClientRepo().listArtifacts(id, "attraction-matrix").catch(() => []);
  return NextResponse.json(analyses);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("ai.invoke");
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => ({}));
  const creative: string = body.creative ?? "";
  if (!creative.trim()) return jsonError("'creative' field required — paste the copy or concept to analyze", 400);

  const client = await getClientRepo().getClient(id);
  const brief = await getClientRepo().getBrief(id);
  const { text: guidelinesContext } = await getGuidelinesRepo()
    .assembleGuidelinesContext(client.slug, "attraction-matrix")
    .catch(() => ({ text: "" }));

  let ai;
  try { ai = getAiClient(); }
  catch (err) { return jsonError(err instanceof Error ? err.message : "AI error", 503); }

  const prompt = `Analyze this creative/copy through the Attraction Matrix (5 Han dimensions):

Client: ${client.name} | Vertical: ${client.vertical}
${brief ? `Offer: ${brief.frontmatter.offer}\nICP: ${brief.frontmatter.icp}` : ""}

Creative to analyze:
"""
${creative}
"""

Score each dimension 1-10. Provide a rewritten "after" version that improves all dimensions.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }
      try {
        const result = await ai.generate({
          clientId: id, module: "attraction-matrix",
          prompt, guidelinesContext: guidelinesContext || undefined,
          maxTokens: 3000, temperature: 0.5,
        });
        const parsed = safeJSON(result.text);
        if (!parsed) { send({ type: "error", error: "Could not parse matrix JSON" }); return; }
        const date = new Date().toISOString().slice(0, 10);
        const slug = creative.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const filename = `${date}-${slug}.json`;
        await getClientRepo().writeArtifact(id, ["attraction-matrix", filename], parsed, z.any());
        send({ type: "done", data: parsed, filename });
      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : String(err) });
      } finally { controller.close(); }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
