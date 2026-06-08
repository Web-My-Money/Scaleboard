import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getClientRepo } from "@/lib/repo";

export default async function HomePage() {
  const t = await getTranslations();
  const clients = await getClientRepo().listClients().catch(() => []);
  const active   = clients.filter((c) => c.status === "active");
  const boarding = clients.filter((c) => c.status === "onboarding");
  const paused   = clients.filter((c) => c.status === "paused");

  return (
    <main className="p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="label-caps mb-2">Dashboard</p>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
            {t("common.appName")}
            <span className="text-base font-normal ml-3" style={{ color: "var(--color-secondary)" }}>
              {t("common.appTagline")}
            </span>
          </h1>
        </div>
        <Link href="/onboarding" className="btn-primary text-base px-6 py-3">
          {t("sidebar.newClient")}
        </Link>
      </div>

      {/* Stats row — full width, equal columns */}
      {clients.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="glass-card p-6 flex flex-col gap-2">
            <div className="stat-value text-3xl">{active.length}</div>
            <div className="label-caps">Active clients</div>
          </div>
          <div className="glass-card p-6 flex flex-col gap-2">
            <div className="stat-value text-3xl" style={{ color: "var(--pearl-aqua)" }}>{boarding.length}</div>
            <div className="label-caps">Onboarding</div>
          </div>
          <div className="glass-card p-6 flex flex-col gap-2">
            <div className="stat-value text-3xl" style={{ color: "var(--color-secondary)" }}>{paused.length}</div>
            <div className="label-caps">Paused</div>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        /* Empty state */
        <div className="glass-card-elevated p-12 text-center max-w-md mx-auto mt-16">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text)" }}>
            {t("sidebar.empty")}
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-secondary)" }}>
            Create your first client workspace to get started with Scaleboard.
          </p>
          <Link href="/onboarding" className="btn-primary">
            {t("sidebar.newClient")}
          </Link>
        </div>
      ) : (
        /* Client grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {clients.map((c) => {
            const initials = c.name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
            const isOnboarding = c.status === "onboarding";
            return (
              <Link
                key={c.id}
                href={isOnboarding ? `/onboarding/${c.slug}` : `/clients/${c.slug}/brief`}
                className="glass-card p-4 group transition-all duration-200 hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-glass)" }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl grid place-items-center text-sm font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #1f2d56 0%, #8fccb6 100%)", color: "#040404" }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors"
                      style={{ color: "var(--color-text)" }}>
                      {c.name}
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: "var(--color-secondary)" }}>
                      {c.vertical}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className={`badge ${isOnboarding ? "badge-warning" : "badge-muted"}`}>
                    {t(`sidebar.groups.${c.status}` as never)}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(136,146,176,0.4)" }}>
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
