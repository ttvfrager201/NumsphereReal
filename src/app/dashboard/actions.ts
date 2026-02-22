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
  id?: string;
  business_name: string;
  address?: string;
  phone_number?: string;
  email?: string;
  logo_url?: string;
  booking_slug: string;
  theme_color?: string;
  accent_color?: string;
  dark_mode?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  if (profile.id) {
    // Update existing profile
    const { error } = await supabase
      .from("business_profiles")
      .update({
        business_name: profile.business_name,
        address: profile.address,
        phone_number: profile.phone_number,
        email: profile.email,
        logo_url: profile.logo_url,
        booking_slug: profile.booking_slug,
        theme_color: profile.theme_color,
        accent_color: profile.accent_color,
        dark_mode: profile.dark_mode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
  } else {
    // Insert new profile
    const { error } = await supabase
      .from("business_profiles")
      .insert({
        user_id: user.id,
        business_name: profile.business_name,
        address: profile.address,
        phone_number: profile.phone_number,
        email: profile.email,
        logo_url: profile.logo_url,
        booking_slug: profile.booking_slug,
        theme_color: profile.theme_color,
        accent_color: profile.accent_color,
        dark_mode: profile.dark_mode,
      });

    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function uploadBusinessLogo(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
  const filePath = `${user.id}/logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("business-logos")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage
    .from("business-logos")
    .getPublicUrl(filePath);

  return publicUrl;
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

export async function getAllBusinessProfiles() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function deleteBusinessProfileById(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("business_profiles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
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

export async function deleteBusinessProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("business_profiles")
    .delete()
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
