import { type NextRequest } from "next/server";
import { z } from "zod";
import { getClientRepo } from "@/lib/repo";
import { getAiClient } from "@/lib/ai";
import { getGuidelinesRepo } from "@/lib/guidelines";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

const RequestSchema = z.object({
  rawPaste: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("ai.invoke");
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 400);

  // Save the raw paste as draft BEFORE the AI call so we never lose it.
  const now = new Date().toISOString();
  await getClientRepo().saveBriefDraft(id, {
    rawPaste: parsed.data.rawPaste,
    createdAt: now,
    updatedAt: now,
  });

  // Pre-flight AI client construction. If anything is misconfigured (missing
  // API key, unsupported provider), surface a JSON 5xx synchronously rather
  // than failing mid-stream — the browser sees "Failed to fetch" otherwise.
  let ai;
  try {
    ai = getAiClient();
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "AI client misconfigured",
      503,
    );
  }

  // Assemble guidelines context (app-level + client-level, general + brief-structurer)
  const client = await getClientRepo().getClient(id);
  const { text: guidelinesContext } = await getGuidelinesRepo()
    .assembleGuidelinesContext(client.slug, "brief-structurer")
    .catch(() => ({ text: "" }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const iter = ai.generateStream({
        clientId: id,
        module: "brief-structurer",
        prompt: parsed.data.rawPaste,
        responseFormat: "json",
        temperature: 0.2,
        guidelinesContext: guidelinesContext || undefined,
      });
      try {
        for await (const chunk of iter) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: err instanceof Error ? err.message : String(err) })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
