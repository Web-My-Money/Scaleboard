"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Brief, Client } from "@/lib/schemas";

export function BriefView({ client, brief }: { client: Client; brief: Brief }) {
  const t = useTranslations();
  const fm = brief.frontmatter;
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="label-caps text-secondary">{client.vertical}</div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
        </div>
        <Link
          href={`/onboarding/${client.slug}`}
          className="glass-card px-3 py-2 text-sm hover:bg-glass-elevated"
        >
          {t("onboarding.review.rerun")}
        </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label={t("brief.fields.offer")}>{fm.offer}</Field>
        <Field label={t("brief.fields.icp")}>{fm.icp}</Field>
        <Field label={t("brief.fields.usp")}>{fm.usp}</Field>
        <Field label={t("brief.fields.kpi")}>{fm.kpi}</Field>
        <Field label={t("brief.fields.budget")}>{fm.budget}</Field>
        <Field label={t("brief.fields.competitors")}>
          {fm.competitors.length ? (
            <ul className="list-disc list-inside">
              {fm.competitors.map((c) => (
                <li key={c.slug}>{c.name}</li>
              ))}
            </ul>
          ) : (
            "—"
          )}
        </Field>
      </section>

      {brief.body && (
        <section className="glass-card p-4">
          <div className="label-caps text-secondary mb-2">Notes</div>
          <pre className="whitespace-pre-wrap text-sm font-sans">{brief.body}</pre>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-3">
      <div className="label-caps text-secondary mb-1">{label}</div>
      <div className="text-sm text-text">{children}</div>
    </div>
  );
}
