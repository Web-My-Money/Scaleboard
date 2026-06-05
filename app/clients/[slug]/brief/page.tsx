import { notFound } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { BriefView } from "@/components/brief/BriefView";
import { getTranslations } from "next-intl/server";

export default async function BriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations();
  try {
    const client = await getClientRepo().getClient(slug);
    const brief = await getClientRepo().getBrief(client.id);
    if (!brief) {
      return (
        <main className="p-6">
          <div className="glass-card p-8 text-center">
            <p className="text-secondary">{t("onboarding.gated")}</p>
          </div>
        </main>
      );
    }
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <BriefView client={client} brief={brief} />
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
