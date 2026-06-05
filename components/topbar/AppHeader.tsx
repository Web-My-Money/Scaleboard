"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Member } from "@/lib/schemas";
import { useActiveClient } from "@/components/stores/useActiveClient";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ClientModuleTabs } from "./ClientModuleTabs";

export function AppHeader({ currentUser }: { currentUser: Member | null }) {
  const t = useTranslations();
  const { client, setClient } = useActiveClient();
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (!pathname.startsWith("/clients/") && client) setClient(null);
  }, [pathname, client, setClient]);

  return (
    <header className="glass-card-elevated mx-2 mt-2 px-4 py-2 flex items-center gap-4 min-h-[3rem]">
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80" aria-label={t("common.appName")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/scaleboard-mark.svg" alt="" width={24} height={24} />
          <span className="font-semibold text-text">{t("common.appName")}</span>
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
          </>
        )}
      </nav>

      <div className="flex-1" />

      {client && <ClientModuleTabs slug={client.slug} clientStatus={client.status} />}

      <Link
        href="/settings"
        className="w-9 h-9 grid place-items-center rounded-md-token glass-card text-sm hover:bg-glass-elevated"
        title={t("topbar.settings")}
        aria-label={t("topbar.settings")}
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
