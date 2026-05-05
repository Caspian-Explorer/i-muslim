import { redirect } from "next/navigation";

export default async function EditMosqueRedirect({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  redirect(`/${locale}/admin/mosques?edit=${encodeURIComponent(slug)}`);
}
