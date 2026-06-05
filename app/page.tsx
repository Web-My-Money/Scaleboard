import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getClientRepo } from "@/lib/repo";

export default async function HomePage() {
  const t = await getTranslations();
  const clients = await getClientRepo().listClients().catch(() => []);

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold">{t("common.appName")}</h1>
          <span className="label-caps text-secondary">{t("common.appTagline")}</span>
        </div>
        <Link
          href="/onboarding"
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md-token hover:opacity-90"
        >
          {t("sidebar.newClient")}
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-secondary">{t("sidebar.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.slug}/brief`}
              className="glass-card p-4 hover:shadow-glass-lg transition"
            >
              <div className="label-caps text-secondary mb-1">{c.vertical}</div>
              <div className="text-lg font-semibold">{c.name}</div>
              <div className="text-xs text-secondary mt-2 uppercase tracking-wide">
                {t(`sidebar.groups.${c.status}` as never)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
