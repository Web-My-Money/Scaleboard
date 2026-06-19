import { notFound } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { AttractionMatrixView } from "@/components/attraction-matrix/AttractionMatrixView";

export default async function AttractionMatrixPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const client = await getClientRepo().getClient(slug);
    const brief = await getClientRepo().getBrief(client.id);
    const analyses = await getClientRepo().listArtifacts(client.id, "attraction-matrix").catch(() => []);
    return (
      <main className="p-6 max-w-5xl mx-auto">
        <AttractionMatrixView client={client} brief={brief} analyses={analyses} />
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
