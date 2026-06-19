import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getClientRepo } from "@/lib/repo";
import { getAiClient } from "@/lib/ai";
import { getGuidelinesRepo } from "@/lib/guidelines";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FLOW_TYPES = ["lead-nurture","pre-call","no-show-recovery","sales-follow-up","reactivation","onboarding"] as const;
type FlowType = typeof FLOW_TYPES[number];

const FLOW_LABELS: Record<FlowType, string> = {
  "lead-nurture": "Lead Nurture",
  "pre-call": "Pre-Call",
  "no-show-recovery": "No-Show Recovery",
  "sales-follow-up": "Sales Follow-Up",
  "reactivation": "Reactivation",
  "onboarding": "Client Onboarding",
};

const FLOW_TRIGGERS: Record<FlowType, string> = {
  "lead-nurture": "New lead opts in / fills form",
  "pre-call": "Appointment booked — send before the call",
  "no-show-recovery": "Appointment was missed / no-show tagged",
  "sales-follow-up": "Call completed — prospect did not close",
  "reactivation": "Lead went cold (30+ days no activity)",
  "onboarding": "New client signs contract / pays first invoice",
};

function safeJSON(raw: string): unknown | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

const GenerateSchema = z.object({ flowType: z.enum(FLOW_TYPES) });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const flows = await Promise.all(
    FLOW_TYPES.map(async (ft) => {
      const data = await getClientRepo().readArtifact(id, ["email-flows", `${ft}.json`], z.any()).catch(() => null);
      return { type: ft, label: FLOW_LABELS[ft], exists: data !== null, data };
    })
  );
  return NextResponse.json(flows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("ai.invoke");
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => ({}));
  const input = GenerateSchema.safeParse(body);
  if (!input.success) return jsonError(input.error.message, 400);

  const client = await getClientRepo().getClient(id);
  const brief = await getClientRepo().getBrief(id);
  if (!brief) return jsonError("Brief not committed yet", 400);

  const ft = input.data.flowType;
  const { text: guidelinesContext } = await getGuidelinesRepo()
    .assembleGuidelinesContext(client.slug, "email-flows")
    .catch(() => ({ text: "" }));

  let ai;
  try { ai = getAiClient(); }
  catch (err) { return jsonError(err instanceof Error ? err.message : "AI error", 503); }

  const prompt = `Generate a "${FLOW_LABELS[ft]}" email automation flow for GoHighLevel.

Client: ${client.name} | Vertical: ${client.vertical}
Trigger: ${FLOW_TRIGGERS[ft]}

Brief:
- Offer: ${brief.frontmatter.offer}
- ICP: ${brief.frontmatter.icp}
- USP: ${brief.frontmatter.usp}
- KPI: ${brief.frontmatter.kpi}
- Budget: ${brief.frontmatter.budget}

Generate 6-10 steps. Include emails with full body copy, SMS messages, waits, conditions, and GHL actions.
The flow should be production-ready — the team can import it directly.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }
      try {
        const result = await ai.generate({
          clientId: id, module: "email-flows",
          prompt, guidelinesContext: guidelinesContext || undefined,
          maxTokens: 4000, temperature: 0.6,
        });
        const parsed = safeJSON(result.text);
        if (!parsed) { send({ type: "error", error: "Could not parse flow JSON" }); return; }
        await getClientRepo().writeArtifact(id, ["email-flows", `${ft}.json`], parsed, z.any());
        send({ type: "done", data: parsed, flowType: ft });
      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : String(err) });
      } finally { controller.close(); }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
