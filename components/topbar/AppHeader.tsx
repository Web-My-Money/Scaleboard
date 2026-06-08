"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Member } from "@/lib/schemas";
import { useActiveClient } from "@/components/stores/useActiveClient";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ClientModuleTabs } from "./ClientModuleTabs";

function ClientInitials({ name }: { name: string }) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";
}

export function AppHeader({ currentUser }: { currentUser: Member | null }) {
  const t = useTranslations();
  const { client, setClient } = useActiveClient();
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (!pathname.startsWith("/clients/") && client) setClient(null);
  }, [pathname, client, setClient]);

  return (
    <header
      className="mx-2 mt-2 flex items-center gap-4 px-5"
      style={{
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "14px",
        minHeight: "60px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 shrink-0">
        {client ? (
          <>
            <Link href="/" className="hover:text-secondary transition-colors font-medium text-sm" style={{ color: "var(--color-muted)" }}>
              {t("common.appName")}
            </Link>
            <span style={{ color: "rgba(255,255,255,0.12)" }}>›</span>
            <Link
              href={`/clients/${client.slug}/brief`}
              className="font-semibold text-base hover:text-primary transition-colors"
              style={{ color: "var(--color-text)" }}
            >
              {client.name}
            </Link>
          </>
        ) : (
          <Link href="/" className="font-semibold text-base" style={{ color: "var(--color-text)" }}>
            {t("common.appName")}
          </Link>
        )}
      </nav>

      {/* Separator */}
      {client && <div className="w-px h-5 bg-white/10 shrink-0" />}

      {/* Module tabs — scrollable, masked edges */}
      {client && (
        <div className="flex-1 min-w-0">
          <ClientModuleTabs slug={client.slug} clientStatus={client.status} />
        </div>
      )}

      {/* Spacer when no client */}
      {!client && <div className="flex-1" />}

      {/* Settings */}
      <Link
        href="/settings"
        title={t("topbar.settings")}
        aria-label={t("topbar.settings")}
        className="w-9 h-9 grid place-items-center rounded-xl transition-all text-secondary hover:text-text shrink-0"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M7.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M6.073 1.5a1.5 1.5 0 00-1.478 1.255L4.44 3.57a5.5 5.5 0 00-.87.505l-.772-.264a1.5 1.5 0 00-1.826.75l-.5 1a1.5 1.5 0 00.426 1.903l.666.499a5.52 5.52 0 000 1.074l-.666.5a1.5 1.5 0 00-.427 1.902l.5 1a1.5 1.5 0 001.827.75l.771-.264c.272.188.563.357.87.505l.155.815A1.5 1.5 0 006.073 13.5h2.854a1.5 1.5 0 001.478-1.255l.155-.815c.307-.148.598-.317.87-.505l.771.264a1.5 1.5 0 001.827-.75l.5-1a1.5 1.5 0 00-.427-1.903l-.666-.499a5.52 5.52 0 000-1.074l.666-.5a1.5 1.5 0 00.427-1.902l-.5-1a1.5 1.5 0 00-1.827-.75l-.771.264a5.5 5.5 0 00-.87-.505l-.155-.815A1.5 1.5 0 008.927 1.5H6.073zm-.565 2.118A4 4 0 017.5 3a4 4 0 011.992.618l.214.135.937-.32a.5.5 0 01.608.25l.5 1a.5.5 0 01-.142.634l-.81.607a4.02 4.02 0 010 1.552l.81.607a.5.5 0 01.142.634l-.5 1a.5.5 0 01-.608.25l-.937-.32-.214.135A4 4 0 017.5 10a4 4 0 01-1.992-.618l-.214-.135-.937.32a.5.5 0 01-.608-.25l-.5-1a.5.5 0 01.142-.634l.81-.607a4.019 4.019 0 010-1.552l-.81-.607a.5.5 0 01-.142-.634l.5-1a.5.5 0 01.608-.25l.937.32.214-.135z" fill="currentColor"/>
        </svg>
      </Link>

      {/* User avatar */}
      {currentUser && (
        <Link
          href="/settings"
          title={`${currentUser.name} — ${currentUser.role}`}
          className="w-9 h-9 rounded-xl grid place-items-center text-[11px] font-bold text-white shrink-0 transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #1f2d56 0%, #8fccb6 100%)", boxShadow: "var(--shadow-glow-sm)" }}
        >
          <ClientInitials name={currentUser.name} />
        </Link>
      )}
    </header>
  );
}
