/**
 * GET  /api/clients/:id/creative-requests         — list saved requests
 * POST /api/clients/:id/creative-requests/generate — generate new request
 */
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

const GenerateSchema = z.object({
  angleId: z.union([z.string(), z.number()]).optional(),
  platform: z.string().default("Meta"),
  objective: z.string().default("Leads"),
  funnelStage: z.string().default("Cold"),
  numStatics:   z.number().int().min(0).max(8).default(3),
  numVideos:    z.number().int().min(0).max(6).default(2),
  numCarousels: z.number().int().min(0).max(4).default(0),
  notes: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const artifacts = await getClientRepo().listArtifacts(id, "creative-requests");
  return NextResponse.json(artifacts);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireApiPermission("ai.invoke");
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const input = GenerateSchema.safeParse(body);
  if (!input.success) return jsonError(input.error.message, 400);

  const client = await getClientRepo().getClient(id);
  const brief = await getClientRepo().getBrief(id);
  if (!brief) return jsonError("Brief not committed yet", 400);

  // Load angles + hooks from densification pack
  const angles = await getClientRepo().readArtifact(id, ["densification-pack", "angles.json"], z.array(z.any())).catch(() => null);
  const hooks = await getClientRepo().readArtifact(id, ["densification-pack", "hooks.json"], z.array(z.any())).catch(() => null);

  const selectedAngle = angles?.find((a: Record<string, unknown>) =>
    input.data.angleId ? String(a.id) === String(input.data.angleId) || String(a.id) === String(input.data.angleId) : true
  ) ?? angles?.[0];

  const selectedHooks = hooks?.filter((h: Record<string, unknown>) =>
    selectedAngle ? String(h.angleId) === String(selectedAngle?.id) : true
  ) ?? [];

  const { text: guidelinesContext } = await getGuidelinesRepo()
    .assembleGuidelinesContext(client.slug, "creative-request")
    .catch(() => ({ text: "" }));

  let ai;
  try { ai = getAiClient(); }
  catch (err) { return jsonError(err instanceof Error ? err.message : "AI error", 503); }

  const prompt = `Generate a complete WMM Creative Request for:

Client: ${client.name}
Vertical: ${client.vertical}
Platform: ${input.data.platform}
Objective: ${input.data.objective}
Funnel Stage: ${input.data.funnelStage}

Brief summary:
- Offer: ${brief.frontmatter.offer}
- ICP: ${brief.frontmatter.icp}
- USP: ${brief.frontmatter.usp}
- KPI: ${brief.frontmatter.kpi}

${selectedAngle ? `Selected Angle:
- Name: ${selectedAngle.name ?? selectedAngle.title}
- Belief attacked: ${selectedAngle.belief ?? selectedAngle.beliefAttacked}
- Counter belief: ${selectedAngle.counter ?? selectedAngle.counterBelief}
- Emotion: ${selectedAngle.emotion ?? selectedAngle.emotionalDriver}
- Proposition: ${selectedAngle.proposition}` : "No angle selected — choose the strongest angle from the brief."}

${selectedHooks.length ? `Top hooks for this angle:\n${selectedHooks.slice(0, 5).map((h: Record<string, unknown>, i: number) => `${i + 1}. [${h.pattern}] ${h.text}`).join("\n")}` : ""}

${input.data.notes ? `Additional notes: ${input.data.notes}` : ""}

QUANTITIES REQUIRED (generate exactly this many — no more, no less):
- Static angles: ${input.data.numStatics} ${input.data.numStatics === 0 ? "(skip — do not generate any)" : ""}
- Video angles: ${input.data.numVideos} ${input.data.numVideos === 0 ? "(skip — do not generate any)" : ""}
- Carousel angles: ${input.data.numCarousels} ${input.data.numCarousels === 0 ? "(skip — do not generate any)" : ""}

Follow the WMM Creative Request SOP from the guidelines exactly.
Every requested creative type must be fully populated with complete copy.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }
      try {
        const result = await ai.generate({
          clientId: id,
          module: "creative-request",
          prompt,
          guidelinesContext: guidelinesContext || undefined,
          maxTokens: 8000,
          temperature: 0.6,
        });

        const parsed = safeJSON(result.text);
        if (!parsed) {
          send({ type: "error", error: "Could not parse creative request JSON" });
          return;
        }

        // Save with datestamp
        const date = new Date().toISOString().slice(0, 10);
        const slug = (client.name + "-" + input.data.platform)
          .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const filename = `${date}-${slug}.json`;

        await getClientRepo().writeArtifact(
          id,
          ["creative-requests", filename],
          parsed,
          z.any(),
        );

        send({ type: "done", data: parsed, filename });
      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
