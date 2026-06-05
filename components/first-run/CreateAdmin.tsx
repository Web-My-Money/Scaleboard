"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function CreateAdmin() {
  const t = useTranslations("firstRun");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, role: "admin" }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({ error: "Failed" }))).error ?? "Failed");
      setSubmitting(false);
      return;
    }
    router.refresh();
  }

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <form
        onSubmit={submit}
        className="glass-card-elevated p-8 w-full max-w-md flex flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-3 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/scaleboard-wordmark.svg" alt="Scaleboard by Web My Money" height={48} />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-1">{t("title")}</h1>
          <p className="text-sm text-secondary">{t("subtitle")}</p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label-caps text-secondary">{t("name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label-caps text-secondary">{t("email")}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-glass-surface border border-glass-border rounded-md-token px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-white font-medium rounded-md-token py-2 disabled:opacity-50"
        >
          {submitting ? "…" : t("submit")}
        </button>
      </form>
    </main>
  );
}
