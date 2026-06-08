import { notFound } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { getTeamRepo } from "@/lib/team";
import { ClientSettings } from "@/components/settings/ClientSettings";
import { GuidelinesManager } from "@/components/settings/GuidelinesManager";

export default async function ClientSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const client = await getClientRepo().getClient(slug);
    const members = await getTeamRepo().listMembers();
    return (
      <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
        <ClientSettings client={client} members={members} />

        {/* Client-level guidelines — stack on top of app-level guidelines */}
        <section className="glass-card-elevated p-4 flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">Client Guidelines</h2>
            <p className="text-sm text-secondary mt-1">
              Documents specific to <strong>{client.name}</strong>: campaign briefs, brand
              voice docs, creative references, or module overrides. These are layered on top
              of the Agency Guidelines when generating content for this client.
            </p>
          </div>
          <GuidelinesManager clientId={client.id} title="Guidelines by module" />
        </section>
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
