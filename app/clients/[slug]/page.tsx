import { redirect } from "next/navigation";

export default async function ClientHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/clients/${slug}/brief`);
}
