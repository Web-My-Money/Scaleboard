import { notFound } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { z } from "zod";
import { TestLabView } from "@/components/test-lab/TestLabView";

export default async function TestLabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const client = await getClientRepo().getClient(slug);
    const brief = await getClientRepo().getBrief(client.id);
    const angles = await getClientRepo().readArtifact(client.id, ["densification-pack", "angles.json"], z.array(z.any())).catch(() => null);
    const existing = await getClientRepo().readArtifact(client.id, ["test-lab", "tests.json"], z.any()).catch(() => null);
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <TestLabView
          client={client}
          brief={brief}
          angles={(angles as Record<string, unknown>[] | null) ?? []}
          initialData={existing}
        />
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
