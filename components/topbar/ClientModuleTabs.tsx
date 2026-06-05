"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const MODULES = [
  "brief",
  "strategy",
  "creative-requests",
  "email-flows",
  "attraction-matrix",
  "test-lab",
  "settings",
] as const;

export function ClientModuleTabs({
  slug,
  clientStatus,
}: {
  slug: string;
  clientStatus: string;
}) {
  const t = useTranslations();
  const pathname = usePathname() ?? "";
  const currentModule = pathname.split("/")[3] ?? "brief";

  return (
    <div className="flex items-center gap-1 text-xs">
      {MODULES.map((m) => {
        const isActive = currentModule === m;
        const gated = m !== "brief" && m !== "settings" && clientStatus === "onboarding";
        return (
          <Link
            key={m}
            href={gated ? `/clients/${slug}/brief` : `/clients/${slug}/${m}`}
            aria-disabled={gated}
            title={gated ? t("onboarding.gated") : undefined}
            className={`px-2 py-1 rounded-sm-token transition ${
              isActive
                ? "bg-primary text-white"
                : gated
                  ? "text-secondary/40 cursor-not-allowed"
                  : "text-secondary hover:text-text"
            }`}
          >
            {t(`topbar.modules.${m}` as never)}
          </Link>
        );
      })}
    </div>
  );
}
