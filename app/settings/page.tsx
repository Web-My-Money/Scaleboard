import { readAppSettings } from "@/lib/i18n/app-settings-store";
import { getTeamRepo, getSessionProvider } from "@/lib/team";
import { AppSettings } from "@/components/settings/AppSettings";
import { GuidelinesManager } from "@/components/settings/GuidelinesManager";

export default async function AppSettingsPage() {
  const settings = await readAppSettings();
  const members = await getTeamRepo().listMembers();
  const activeUser = await getSessionProvider().getCurrentUser();
  const clientsRoot = process.env.WMM_DATA_DIR ?? "./data/clients";

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <AppSettings
        settings={settings}
        members={members}
        activeUserId={activeUser?.id ?? null}
        dataFolder={clientsRoot}
      />

      {/* App-level guidelines — apply to ALL clients */}
      <section className="glass-card-elevated p-4 flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Agency Guidelines</h2>
          <p className="text-sm text-secondary mt-1">
            Documents uploaded here are injected into every AI generation call across all clients.
            Use this for agency templates, brand voice rules, WMM SOPs, and module-specific format guides.
          </p>
        </div>
        <GuidelinesManager title="Guidelines by module" />
      </section>
    </main>
  );
}
