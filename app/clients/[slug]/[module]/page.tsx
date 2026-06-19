import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

// All main modules now have real pages — this catch-all handles unknown routes only
const PLACEHOLDER_MODULES = new Set<string>([]); // empty: notFound() for all

export default async function ModulePlaceholder({
  params,
}: {
  params: Promise<{ slug: string; module: string }>;
}) {
  const { module } = await params;
  if (!PLACEHOLDER_MODULES.has(module)) notFound();
  const t = await getTranslations();
  return (
    <main className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card-elevated p-6 col-span-full">
          <div className="label-caps text-secondary mb-2">
            {t(`topbar.modules.${module}` as never)}
          </div>
          <h2 className="text-xl font-bold mb-2">{t("common.comingSoon")}</h2>
          <p className="text-sm text-secondary">
            This module will be wired up by its own follow-up spec built on top of the workspace
            foundation.
          </p>
        </div>
      </div>
    </main>
  );
}
