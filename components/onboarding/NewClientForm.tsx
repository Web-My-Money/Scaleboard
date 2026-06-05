"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function NewClientForm() {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, vertical, language }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Failed" }));
      setError(body.error ?? "Failed");
      setSubmitting(false);
      return;
    }
    const created = await res.json();
    router.push(`/onboarding/${created.slug}`);
  }

  return (
    <form onSubmit={submit} className="glass-card-elevated p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("onboarding.title")}</h1>
      <label className="flex flex-col gap-1 text-sm">
        <span className="label-caps text-secondary">{t("onboarding.newClient.name")}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="label-caps text-secondary">{t("onboarding.newClient.vertical")}</span>
        <input
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
          required
          className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="label-caps text-secondary">{t("settings.app.language")}</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as "es" | "en")}
          className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-white font-medium rounded-md-token py-2 disabled:opacity-50"
      >
        {submitting ? "…" : t("onboarding.newClient.create")}
      </button>
    </form>
  );
}
