"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/components/stores/useSidebar";
import type { ClientSummary, ClientStatus } from "@/lib/schemas";

const GROUP_ORDER: ClientStatus[] = ["active", "onboarding", "paused", "archived"];

function ScaleboardMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="sb-g" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#1f2d56"/>
          <stop offset="100%" stopColor="#8fccb6"/>
        </linearGradient>
        <filter id="sb-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Bar 1 — shortest */}
      <rect x="4"   y="31" width="11" height="13" rx="5.5" fill="url(#sb-g)" opacity="0.5"/>
      {/* Bar 2 — medium */}
      <rect x="18.5" y="19" width="11" height="25" rx="5.5" fill="url(#sb-g)" opacity="0.78"/>
      {/* Bar 3 — tallest, teal glow */}
      <rect x="33"  y="5"  width="11" height="39" rx="5.5" fill="#8fccb6" filter="url(#sb-glow)"/>
    </svg>
  );
}

const STATUS_DOTS: Record<ClientStatus, string> = {
  active:     "bg-success",
  onboarding: "bg-warning",
  paused:     "bg-secondary/60",
  archived:   "bg-white/20",
};

function ClientInitials({ name }: { name: string }) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "??";
}

export function Sidebar({ initialClients }: { initialClients: ClientSummary[] }) {
  const t = useTranslations("sidebar");
  const { collapsed, toggleCollapsed, expandedGroups, toggleGroup } = useSidebar();
  const [clients, setClients] = useState<ClientSummary[]>(initialClients);
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  // `[` shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "[" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCollapsed]);

  // Refresh client list on navigation
  useEffect(() => {
    let cancelled = false;
    fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: ClientSummary[]) => { if (!cancelled) setClients(list); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [pathname]);

  const grouped = useMemo(() => {
    const filter = search.trim().toLowerCase();
    const matched = filter
      ? clients.filter((c) =>
          c.name.toLowerCase().includes(filter) ||
          c.vertical.toLowerCase().includes(filter)
        )
      : clients;
    const map: Record<ClientStatus, ClientSummary[]> = { active: [], onboarding: [], paused: [], archived: [] };
    for (const c of matched) map[c.status].push(c);
    return map;
  }, [clients, search]);

  return (
    <aside
      className={`sidebar ${
        collapsed ? "w-[60px]" : "w-[268px]"
      } h-screen sticky top-0 flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden z-20`}
    >
      {/* Logo area */}
      <div
        className={`flex items-center border-b py-5 ${
          collapsed ? "justify-center px-2" : "gap-3 px-4"
        }`}
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="shrink-0 transition-all">
          <ScaleboardMark size={collapsed ? 28 : 38} />
        </div>
        {!collapsed && (
          <div>
            <div
              className="font-extrabold leading-tight tracking-tight"
              style={{ fontSize: "1.125rem", color: "var(--color-text)" }}
            >
              Scaleboard
            </div>
            <div
              className="tracking-wide mt-0.5"
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(143,204,182,0.55)",
              }}
            >
              by Web My Money
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary/40 text-xs">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "var(--color-text)",
              }}
            />
          </div>
        </div>
      )}

      {/* Client list */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {collapsed ? (
          /* Collapsed: initials only */
          <div className="flex flex-col items-center gap-1.5 py-2">
            {clients.slice(0, 12).map((c) => {
              const active = pathname?.includes(`/clients/${c.slug}`);
              return (
                <Link
                  key={c.id}
                  href={`/clients/${c.slug}/brief`}
                  title={`${c.name}\n${c.vertical}`}
                  className={`w-10 h-10 rounded-xl grid place-items-center text-[11px] font-bold transition-all duration-200 ${
                    active ? "shadow-glow-sm" : "hover:border-glass-border-teal"
                  }`}
                  style={
                    active
                      ? { background: "var(--pearl-aqua)", color: "#040404" }
                      : { background: "rgba(255,255,255,0.07)", color: "var(--color-secondary)" }
                  }
                >
                  <ClientInitials name={c.name} />
                </Link>
              );
            })}
          </div>
        ) : (
          /* Expanded: grouped list */
          <div className="space-y-3 py-1">
            {GROUP_ORDER.map((group) => {
              const items = grouped[group];
              if (items.length === 0) return null;
              const expanded = expandedGroups[group] ?? true;
              return (
                <div key={group}>
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-mono font-semibold tracking-widest uppercase transition-colors"
                    style={{ color: "rgba(136,146,176,0.5)" }}
                  >
                    <span>{t(`groups.${group}` as never)}</span>
                    <span className="text-[8px]" style={{ color: "rgba(136,146,176,0.3)" }}>
                      {expanded ? "▾" : "▸"}
                    </span>
                  </button>

                  {expanded && (
                    <ul className="space-y-0.5 mt-0.5">
                      {items.map((c) => {
                        const active = pathname?.includes(`/clients/${c.slug}`);
                        return (
                          <li key={c.id}>
                            <Link
                              href={`/clients/${c.slug}/brief`}
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-200 ${
                                active ? "sidebar-item-active" : "border border-transparent hover:bg-white/5"
                              }`}
                            >
                              {/* Initials badge */}
                              <div
                                className={`w-7 h-7 rounded-lg grid place-items-center text-[10px] font-bold shrink-0 ${
                                  active ? "text-[#040404]" : "text-secondary"
                                }`}
                                style={
                                  active
                                    ? { background: "var(--pearl-aqua)" }
                                    : { background: "rgba(255,255,255,0.08)" }
                                }
                              >
                                <ClientInitials name={c.name} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-xs font-semibold truncate leading-tight"
                                  style={{ color: active ? "var(--color-text)" : "rgba(228,232,255,0.75)" }}
                                >
                                  {c.name}
                                </div>
                                <div className="text-[10px] truncate" style={{ color: "rgba(136,146,176,0.6)" }}>
                                  {c.vertical}
                                </div>
                              </div>

                              {/* Status dot */}
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOTS[c.status]}`} />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}

            {clients.length === 0 && (
              <p className="text-xs px-2 py-3 text-center" style={{ color: "var(--color-secondary)" }}>
                {t("empty")}
              </p>
            )}
          </div>
        )}
      </nav>

      {/* Bottom: new client + collapse */}
      <div className="p-2 border-t border-white/5 flex items-center gap-2">
        {!collapsed && (
          <Link
            href="/onboarding"
            className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl text-center transition-all"
            style={{ background: "var(--pearl-aqua)", color: "#040404", boxShadow: "var(--shadow-glow-sm)" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "var(--pearl-aqua-dark)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "var(--pearl-aqua)"; }}
          >
            {t("newClient")}
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? t("expand") : t("collapse")}
          aria-label={collapsed ? t("expand") : t("collapse")}
          className="w-8 h-8 rounded-xl grid place-items-center text-xs transition-all hover:bg-white/8 shrink-0"
          style={{ color: "rgba(136,146,176,0.5)", background: "rgba(255,255,255,0.04)" }}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>
    </aside>
  );
}
