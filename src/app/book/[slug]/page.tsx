import { createClient } from "../../../../supabase/server";
import { notFound } from "next/navigation";
import { BookingPageClient } from "./booking-page-client";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("booking_slug", slug)
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  return <BookingPageClient profile={profile} />;
}
