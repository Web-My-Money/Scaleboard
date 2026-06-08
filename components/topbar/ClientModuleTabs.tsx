"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const MODULES = [
  { key: "brief",             label: "Brief" },
  { key: "strategy",          label: "Strategy" },
  { key: "creative-requests", label: "Creative" },
  { key: "financials",        label: "Financials" },
  { key: "email-flows",       label: "Emails" },
  { key: "attraction-matrix", label: "Attraction" },
  { key: "test-lab",          label: "Test Lab" },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"] | "settings";

export function ClientModuleTabs({ slug, clientStatus }: { slug: string; clientStatus: string }) {
  const t = useTranslations();
  const pathname = usePathname() ?? "";
  const currentModule = (pathname.split("/")[3] ?? "brief") as ModuleKey;

  return (
    <nav className="flex items-center justify-between w-full">
      {MODULES.map(({ key, label }) => {
        const isActive = currentModule === key;
        const gated = key !== "brief" && clientStatus === "onboarding";
        return (
          <Link
            key={key}
            href={gated ? `/clients/${slug}/brief` : `/clients/${slug}/${key}`}
            aria-disabled={gated}
            title={gated ? t("onboarding.gated") : undefined}
            className="relative flex-1 text-center py-1 text-sm font-medium transition-all duration-150"
            style={{
              color: isActive ? "#040404" : gated ? "rgba(251,251,251,0.25)" : "rgba(251,251,251,0.55)",
              background: isActive ? "var(--pearl-aqua)" : "transparent",
              borderRadius: "8px",
              cursor: gated ? "not-allowed" : "pointer",
              pointerEvents: gated ? "none" : "auto",
              boxShadow: isActive ? "var(--shadow-glow-sm)" : "none",
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
