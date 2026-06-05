"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/components/stores/useSidebar";
import type { ClientSummary, ClientStatus } from "@/lib/schemas";

const GROUP_ORDER: ClientStatus[] = ["active", "onboarding", "paused", "archived"];

export function Sidebar({ initialClients }: { initialClients: ClientSummary[] }) {
  const t = useTranslations("sidebar");
  const { collapsed, toggleCollapsed, expandedGroups, toggleGroup } = useSidebar();
  const [clients, setClients] = useState<ClientSummary[]>(initialClients);
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "[" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCollapsed]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: ClientSummary[]) => {
        if (!cancelled) setClients(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const grouped = useMemo(() => {
    const filter = search.trim().toLowerCase();
    const matched = filter
      ? clients.filter(
          (c) =>
            c.name.toLowerCase().includes(filter) ||
            c.vertical.toLowerCase().includes(filter),
        )
      : clients;
    const map: Record<ClientStatus, ClientSummary[]> = {
      active: [],
      onboarding: [],
      paused: [],
      archived: [],
    };
    for (const c of matched) map[c.status].push(c);
    return map;
  }, [clients, search]);

  return (
    <aside
      className={`${collapsed ? "w-14" : "w-[280px]"} h-screen sticky top-0 transition-all glass-card-elevated m-2 flex flex-col`}
    >
      <div className="p-3 border-b border-glass-border flex items-center gap-2">
        {!collapsed && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-secondary/60"
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 py-2">
            {clients.slice(0, 12).map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.slug}/brief`}
                title={c.name}
                className={`w-9 h-9 rounded-md-token grid place-items-center text-xs font-semibold ${
                  pathname?.includes(`/clients/${c.slug}`)
                    ? "bg-primary text-white"
                    : "bg-glass-surface text-secondary hover:bg-glass-elevated"
                }`}
              >
                {c.name.slice(0, 2).toUpperCase()}
              </Link>
            ))}
          </div>
        ) : (
          GROUP_ORDER.map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;
            const expanded = expandedGroups[group] ?? false;
            return (
              <div key={group}>
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full label-caps text-secondary px-2 py-1 flex items-center justify-between hover:text-text"
                >
                  <span>{t(`groups.${group}`)}</span>
                  <span className="text-[0.6rem]">{expanded ? "▾" : "▸"}</span>
                </button>
                {expanded && (
                  <ul className="space-y-1 mt-1">
                    {items.map((c) => {
                      const active = pathname?.includes(`/clients/${c.slug}`);
                      return (
                        <li key={c.id}>
                          <Link
                            href={`/clients/${c.slug}/brief`}
                            className={`block px-3 py-2 rounded-md-token text-sm transition ${
                              active
                                ? "glass-card border-primary/40 shadow-glass text-text"
                                : "hover:bg-glass-surface text-secondary"
                            }`}
                          >
                            <div className="font-medium text-text truncate">{c.name}</div>
                            <div className="text-xs text-secondary truncate">{c.vertical}</div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}
        {clients.length === 0 && !collapsed && (
          <p className="text-sm text-secondary px-2 mt-2">{t("empty")}</p>
        )}
      </nav>

      <div className="p-3 border-t border-glass-border flex items-center gap-2">
        {!collapsed && (
          <Link
            href="/onboarding"
            className="flex-1 bg-primary text-white text-sm font-medium px-3 py-2 rounded-md-token hover:opacity-90"
          >
            {t("newClient")}
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? t("expand") : t("collapse")}
          aria-label={collapsed ? t("expand") : t("collapse")}
          className="w-9 h-9 rounded-md-token glass-card grid place-items-center text-sm font-mono"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>
    </aside>
  );
}
