"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Client, Member, ClientStatus } from "@/lib/schemas";

const STATUS_OPTIONS: ClientStatus[] = ["onboarding", "active", "paused", "archived"];

export function ClientSettings({ client, members }: { client: Client; members: Member[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [c, setC] = useState<Client>(client);
  const [saving, setSaving] = useState(false);

  async function save(patch: Partial<Client>) {
    setSaving(true);
    const res = await fetch(`/api/clients/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      setC(updated);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("settings.client.title")}</h1>

      <section className="glass-card-elevated p-4 flex flex-col gap-3">
        <h2 className="label-caps text-secondary">{t("settings.client.platforms")}</h2>
        <Field
          label={t("settings.client.metaBusinessId")}
          value={c.platforms.metaBusinessId ?? ""}
          onSave={(v) => save({ platforms: { ...c.platforms, metaBusinessId: v || undefined } })}
        />
        <Field
          label={t("settings.client.googleAdsAccountId")}
          value={c.platforms.googleAdsAccountId ?? ""}
          onSave={(v) =>
            save({ platforms: { ...c.platforms, googleAdsAccountId: v || undefined } })
          }
        />
        <Field
          label={t("settings.client.ghlLocationId")}
          value={c.platforms.ghlLocationId ?? ""}
          onSave={(v) => save({ platforms: { ...c.platforms, ghlLocationId: v || undefined } })}
        />
      </section>

      <section className="glass-card-elevated p-4 flex flex-col gap-3">
        <h2 className="label-caps text-secondary">{t("settings.client.status")}</h2>
        <select
          value={c.status}
          onChange={(e) => save({ status: e.target.value as ClientStatus })}
          disabled={saving}
          className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2 text-sm w-fit"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`sidebar.groups.${s}` as never)}
            </option>
          ))}
        </select>
      </section>

      <section className="glass-card-elevated p-4 flex flex-col gap-3">
        <h2 className="label-caps text-secondary">{t("settings.client.assignments")}</h2>
        {(["strategy", "mediaBuying", "design"] as const).map((role) => (
          <label key={role} className="flex flex-col gap-1 text-sm">
            <span className="label-caps text-secondary">{role}</span>
            <select
              value={c.assignments[role] ?? ""}
              onChange={(e) =>
                save({
                  assignments: {
                    ...c.assignments,
                    [role]: e.target.value || undefined,
                  },
                })
              }
              disabled={saving}
              className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2"
            >
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </label>
        ))}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const [v, setV] = useState(value);
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="label-caps text-secondary">{label}</span>
      <div className="flex gap-2">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => v !== value && onSave(v)}
          className="flex-1 bg-glass-surface border border-glass-border rounded-md-token px-3 py-2"
        />
      </div>
    </label>
  );
}
