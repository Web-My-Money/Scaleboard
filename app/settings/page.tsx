import { readAppSettings } from "@/lib/i18n/app-settings-store";
import { getTeamRepo, getSessionProvider } from "@/lib/team";
import { AppSettings } from "@/components/settings/AppSettings";

export default async function AppSettingsPage() {
  const settings = await readAppSettings();
  const members = await getTeamRepo().listMembers();
  const activeUser = await getSessionProvider().getCurrentUser();
  const clientsRoot = process.env.WMM_DATA_DIR ?? "./data/clients";

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <AppSettings
        settings={settings}
        members={members}
        activeUserId={activeUser?.id ?? null}
        dataFolder={clientsRoot}
      />
    </main>
  );
}
