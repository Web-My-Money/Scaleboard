import { notFound, redirect } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { ActiveClientHydrator } from "@/components/clients/ActiveClientHydrator";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const client = await getClientRepo().getClient(slug);
    if (client.status === "onboarding") {
      redirect(`/onboarding/${slug}`);
    }
    return (
      <>
        <ActiveClientHydrator client={client} />
        {children}
      </>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
