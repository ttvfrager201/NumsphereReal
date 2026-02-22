import { createClient } from "../../../../supabase/server";
import { notFound } from "next/navigation";
import { RescheduleClient } from "./reschedule-client";

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, business_profiles(*)")
    .eq("reschedule_token", token)
    .maybeSingle();

  if (error || !booking) {
    notFound();
  }

  return <RescheduleClient booking={booking} token={token} />;
}
