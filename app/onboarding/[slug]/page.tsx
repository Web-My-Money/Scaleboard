import { notFound, redirect } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const client = await getClientRepo().getClient(slug);
    if (client.status !== "onboarding") {
      redirect(`/clients/${slug}/brief`);
    }
    const draft = await getClientRepo().getBriefDraft(client.id);
    return (
      <main className="p-6 max-w-5xl mx-auto">
        <OnboardingFlow client={client} initialDraft={draft} />
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
