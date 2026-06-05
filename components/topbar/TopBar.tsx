"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Client, Member } from "@/lib/schemas";

const MODULES = [
  "brief",
  "strategy",
  "creative-requests",
  "email-flows",
  "attraction-matrix",
  "test-lab",
  "settings",
] as const;

export function TopBar({
  client,
  currentUser,
}: {
  client?: Client | null;
  currentUser?: Member | null;
}) {
  const t = useTranslations();
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);
  const currentModule = segments[2] ?? "brief";

  return (
    <header className="glass-card-elevated mx-2 mt-2 px-4 py-2 flex items-center gap-4">
      <nav className="flex items-center gap-1 text-sm">
        <Link href="/" className="text-secondary hover:text-text">
          {t("common.appName")}
        </Link>
        {client && (
          <>
            <span className="text-secondary/60">›</span>
            <Link
              href={`/clients/${client.slug}/brief`}
              className="text-text font-medium hover:text-primary"
            >
              {client.name}
            </Link>
            <span className="text-secondary/60">›</span>
            <span className="text-secondary">{t(`topbar.modules.${currentModule}` as never)}</span>
          </>
        )}
      </nav>

      <div className="flex-1" />

      {client && (
        <div className="flex items-center gap-1 text-xs">
          {MODULES.map((m) => {
            const isActive = currentModule === m;
            const briefRequired = m !== "brief" && m !== "settings" && client.status === "onboarding";
            return (
              <Link
                key={m}
                href={briefRequired ? `/clients/${client.slug}/brief` : `/clients/${client.slug}/${m}`}
                aria-disabled={briefRequired}
                title={briefRequired ? t("onboarding.gated") : undefined}
                className={`px-2 py-1 rounded-sm-token transition ${
                  isActive
                    ? "bg-primary text-white"
                    : briefRequired
                      ? "text-secondary/40 cursor-not-allowed"
                      : "text-secondary hover:text-text"
                }`}
              >
                {t(`topbar.modules.${m}` as never)}
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/settings"
        className="w-9 h-9 grid place-items-center rounded-md-token glass-card text-sm"
        title={t("topbar.settings")}
      >
        ⚙
      </Link>

      {currentUser && (
        <div
          className="w-9 h-9 grid place-items-center rounded-full bg-primary text-white text-xs font-semibold"
          title={`${currentUser.name} (${currentUser.role})`}
        >
          {currentUser.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
      )}
    </header>
  );
}
