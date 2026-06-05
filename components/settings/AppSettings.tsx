"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AppSettings as AppSettingsT, Member, Role } from "@/lib/schemas";

const ROLES: Role[] = ["admin", "strategist", "media_buyer", "designer", "viewer"];

export function AppSettings({
  settings,
  members,
  activeUserId,
  dataFolder,
}: {
  settings: AppSettingsT;
  members: Member[];
  activeUserId: string | null;
  dataFolder: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [memberList, setMemberList] = useState(members);
  const [active, setActive] = useState(activeUserId);
  const [showAdd, setShowAdd] = useState(false);

  async function patchSettings(patch: Partial<AppSettingsT>) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setS(await res.json());
      router.refresh();
    }
  }

  async function switchActive(id: string | null) {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (res.ok) {
      setActive(id);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("settings.app.title")}</h1>

      <section className="glass-card-elevated p-4 flex flex-col gap-3">
        <h2 className="label-caps text-secondary">General</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label-caps text-secondary">{t("settings.app.language")}</span>
          <select
            value={s.uiLanguage}
            onChange={(e) => patchSettings({ uiLanguage: e.target.value as "es" | "en" })}
            className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 w-fit"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label-caps text-secondary">{t("settings.app.aiProvider")}</span>
          <select
            value={s.aiProvider}
            onChange={(e) => patchSettings({ aiProvider: e.target.value as "anthropic" | "openrouter" })}
            className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 w-fit"
          >
            <option value="anthropic">Anthropic (direct)</option>
            <option value="openrouter" disabled>
              OpenRouter (future)
            </option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label-caps text-secondary">{t("settings.app.defaultModel")}</span>
          <input
            value={s.defaultModel}
            onChange={(e) => setS({ ...s, defaultModel: e.target.value })}
            onBlur={() => patchSettings({ defaultModel: s.defaultModel })}
            className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 max-w-sm"
          />
        </label>
        <div className="text-sm">
          <div className="label-caps text-secondary mb-1">{t("settings.app.dataFolder")}</div>
          <code className="font-mono text-xs bg-glass-surface px-2 py-1 rounded-sm-token">
            {dataFolder}
          </code>
        </div>
      </section>

      <section className="glass-card-elevated p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="label-caps text-secondary">{t("settings.team.title")}</h2>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="text-xs bg-primary text-white rounded-sm-token px-3 py-1"
          >
            {t("settings.team.addMember")}
          </button>
        </div>

        {showAdd && (
          <AddMemberForm
            onAdd={(m) => {
              setMemberList((list) => [...list, m]);
              setShowAdd(false);
              router.refresh();
            }}
          />
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="label-caps text-secondary">{t("settings.team.iAm")}</span>
          <select
            value={active ?? ""}
            onChange={(e) => switchActive(e.target.value || null)}
            className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 max-w-sm"
          >
            <option value="">—</option>
            {memberList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({t(`settings.team.roles.${m.role}` as never)})
              </option>
            ))}
          </select>
        </label>

        <ul className="flex flex-col gap-2">
          {memberList.map((m) => (
            <li key={m.id} className="glass-card p-3 flex items-center gap-3">
              <div className="w-9 h-9 grid place-items-center rounded-full bg-primary text-white text-xs font-semibold">
                {m.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs text-secondary">{m.email}</div>
              </div>
              <select
                value={m.role}
                onChange={async (e) => {
                  const role = e.target.value as Role;
                  const res = await fetch(`/api/team/${m.id}`, {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ role }),
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setMemberList((list) => list.map((x) => (x.id === m.id ? updated : x)));
                    router.refresh();
                  }
                }}
                className="bg-glass-surface border border-glass-border rounded-sm-token px-2 py-1 text-xs"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`settings.team.roles.${r}` as never)}
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  await fetch(`/api/team/${m.id}`, { method: "DELETE" });
                  setMemberList((list) => list.filter((x) => x.id !== m.id));
                  router.refresh();
                }}
                className="text-xs text-danger hover:underline"
                title={t("common.delete")}
                aria-label={t("common.delete")}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AddMemberForm({ onAdd }: { onAdd: (m: Member) => void }) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("strategist");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({ error: "Failed" }))).error ?? "Failed");
      return;
    }
    onAdd(await res.json());
    setName("");
    setEmail("");
  }

  return (
    <form onSubmit={submit} className="glass-card p-3 flex flex-col gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("firstRun.name")}
        required
        className="bg-glass-surface border border-glass-border rounded-sm-token px-2 py-1 text-sm"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("firstRun.email")}
        required
        className="bg-glass-surface border border-glass-border rounded-sm-token px-2 py-1 text-sm"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="bg-glass-surface border border-glass-border rounded-sm-token px-2 py-1 text-sm"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {t(`settings.team.roles.${r}` as never)}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="submit"
        className="bg-primary text-white text-xs rounded-sm-token py-1"
      >
        {t("settings.team.addMember")}
      </button>
    </form>
  );
}
