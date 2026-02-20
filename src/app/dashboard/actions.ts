"use server";

import { createClient } from "../../../supabase/server";
import { revalidatePath } from "next/cache";

export async function markCallHandled(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("missed_calls")
    .update({ status: "handled" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function sendBookingLink(id: string) {
  const supabase = await createClient();
  
  // In a real app, this would send an SMS via Twilio or similar
  // For now, we just update the status to 'texted'
  
  const { error } = await supabase
    .from("missed_calls")
    .update({ status: "texted" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateSettings(settings: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("settings")
    .upsert({ 
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function saveBusinessProfile(profile: {
  business_name: string;
  address?: string;
  phone_number?: string;
  email?: string;
  logo_url?: string;
  booking_slug: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("business_profiles")
    .upsert({
      user_id: user.id,
      ...profile,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("business_profiles")
    .select("id, user_id")
    .eq("booking_slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  
  // Available if no record exists, or it belongs to the current user
  return !data || data.user_id === user.id;
}

export async function getBusinessProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createMockCall() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const names = ["Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Evan Wright"];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomPhone = `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;

  const { error } = await supabase
    .from("missed_calls")
    .insert({
      user_id: user.id,
      caller_name: randomName,
      phone_number: randomPhone,
      called_at: new Date().toISOString(),
      status: 'new'
    });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
