import { notFound } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { z } from "zod";
import { EmailFlowsView } from "@/components/email-flows/EmailFlowsView";

export default async function EmailFlowsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const client = await getClientRepo().getClient(slug);
    const brief = await getClientRepo().getBrief(client.id);
    const FLOWS = ["lead-nurture","pre-call","no-show-recovery","sales-follow-up","reactivation","onboarding"];
    const savedFlows = await Promise.all(
      FLOWS.map(async (ft) => ({
        type: ft,
        data: await getClientRepo().readArtifact(client.id, ["email-flows", `${ft}.json`], z.any()).catch(() => null),
      }))
    );
    return (
      <main className="p-6 max-w-5xl mx-auto">
        <EmailFlowsView client={client} brief={brief} savedFlows={savedFlows} />
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
