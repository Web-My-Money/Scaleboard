import "./globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { plusJakartaSans, jetBrainsMono } from "./fonts";
import { getTeamRepo, getSessionProvider } from "@/lib/team";
import { getClientRepo } from "@/lib/repo";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { AppHeader } from "@/components/topbar/AppHeader";
import { CreateAdmin } from "@/components/first-run/CreateAdmin";

export const metadata: Metadata = {
  title: "Scaleboard by Web My Money",
  description: "Marketing performance operating system for the Web My Money team.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  const members = await getTeamRepo().listMembers().catch(() => []);
  const needsBootstrap = members.length === 0;
  const currentUser = needsBootstrap ? null : await getSessionProvider().getCurrentUser();
  const clients = needsBootstrap ? [] : await getClientRepo().listClients().catch(() => []);

  return (
    <html lang={locale} className={`${plusJakartaSans.variable} ${jetBrainsMono.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {needsBootstrap ? (
            <CreateAdmin />
          ) : (
            <div className="flex min-h-screen">
              <Sidebar initialClients={clients} />
              <div className="flex-1 flex flex-col">
                <AppHeader currentUser={currentUser} />
                <div className="flex-1 p-2">{children}</div>
              </div>
            </div>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
