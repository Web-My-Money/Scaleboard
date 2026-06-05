import { notFound } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { getTeamRepo } from "@/lib/team";
import { ClientSettings } from "@/components/settings/ClientSettings";

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
      <main className="p-6 max-w-4xl mx-auto">
        <ClientSettings client={client} members={members} />
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
