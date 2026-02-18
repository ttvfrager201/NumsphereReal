import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { startOfDay, endOfDay } from "date-fns";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch missed calls
  const { data: missedCalls } = await supabase
    .from("missed_calls")
    .select("*")
    .eq("user_id", user.id)
    .order("called_at", { ascending: false })
    .limit(20);

  // Fetch bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .gte("appointment_time", new Date().toISOString())
    .order("appointment_time", { ascending: true })
    .limit(20);

  // Fetch settings
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Calculate stats
  const today = new Date();
  const startOfToday = startOfDay(today).toISOString();
  const endOfToday = endOfDay(today).toISOString();

  // This is a simplified stats query. In production, use RPC or specific queries.
  const { count: missedCallsToday } = await supabase
    .from("missed_calls")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("called_at", startOfToday)
    .lte("called_at", endOfToday);

  const { count: bookingsToday } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfToday) // assuming created_at is when the booking was made
    .lte("created_at", endOfToday);

  // Mock revenue calculation
  const revenueCaptured = (bookingsToday || 0) * 50; 

  // Conversion rate: (bookings today / calls today) * 100
  const conversionRate = missedCallsToday ? Math.round(((bookingsToday || 0) / missedCallsToday) * 100) : 0;

  return (
    <DashboardClient
      missedCalls={missedCalls || []}
      bookings={bookings || []}
      settings={settings}
      stats={{
        missedCallsToday: missedCallsToday || 0,
        bookingsToday: bookingsToday || 0,
        revenueCaptured,
        conversionRate,
      }}
    />
  );
}
