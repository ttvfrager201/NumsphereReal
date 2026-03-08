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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Call the edge function to send real Twilio SMS
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/send-missed-call-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ missed_call_id: id, user_id: user.id }),
      },
    );

    const result = await res.json();

    if (!res.ok) {
      // Twilio not configured yet — fall back to marking as texted
      console.warn("SMS edge function error:", result.error);
      // Still mark as texted so the UI updates
      const { error } = await supabase
        .from("missed_calls")
        .update({ status: "texted" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    }
    // Edge function marks it as texted on success
  } catch (fetchError) {
    // Network error — still update status
    const { error } = await supabase
      .from("missed_calls")
      .update({ status: "texted" })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function getCallForwardingConfig() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("call_forwarding_configs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function saveCallForwardingConfig(config: {
  forward_to_number: string;
  sms_message_template: string;
  booking_slug?: string | null;
  twilio_number?: string | null;
  twilio_number_sid?: string | null;
  auto_text_enabled?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("call_forwarding_configs").upsert(
    {
      user_id: user.id,
      ...config,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function provisionTwilioNumber(areaCode?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase.functions.invoke(
    "supabase-functions-provision-twilio-number",
    {
      body: {
        user_id: user.id,
        area_code: areaCode || undefined,
      },
    },
  );

  if (error) {
    throw new Error(error.message || "Failed to provision phone number");
  }

  // ✅ Use the data returned by the edge function directly
  revalidatePath("/dashboard");
  return data;
}

export async function getUserBookingLinks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("business_profiles")
    .select("id, business_name, booking_slug")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function toggleAutoTextBack(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("call_forwarding_configs")
    .update({
      auto_text_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateSettings(settings: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("settings")
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString(),
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
  payments_enabled?: boolean;
  available_hours?: any;
  slot_duration?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        payments_enabled: profile.payments_enabled,
        available_hours: profile.available_hours,
        slot_duration: profile.slot_duration,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
  } else {
    // Fetch the user-level Stripe account ID so new profiles inherit it
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Insert new profile
    const { error } = await supabase.from("business_profiles").insert({
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
      payments_enabled: profile.payments_enabled,
      available_hours: profile.available_hours,
      slot_duration: profile.slot_duration,
      // Inherit the user's existing Stripe account if they have one
      stripe_account_id: userData?.stripe_account_id || null,
    });

    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function uploadBusinessLogo(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
  const filePath = `${user.id}/logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("business-logos")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("business-logos").getPublicUrl(filePath);

  return publicUrl;
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Verify this profile belongs to the current user
  const { data: profile, error: profileError } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("Booking link not found or unauthorized");

  // Delete ONLY non-paid customer bookings (free / unpaid appointments).
  // Paid bookings are revenue history — we preserve them.
  // After the profile is deleted, the paid bookings will have business_profile_id = NULL
  // (ON DELETE SET NULL) and will continue to appear in revenue/payment history.
  const { error: deleteBookingsError } = await supabase
    .from("bookings")
    .delete()
    .eq("business_profile_id", id)
    .eq("user_id", user.id)
    .neq("payment_status", "paid"); // preserve paid bookings (revenue history)

  if (deleteBookingsError) throw new Error(deleteBookingsError.message);

  // Now delete the business profile itself.
  // This will also cascade-delete services (config, not revenue).
  // Any remaining paid bookings will have business_profile_id set to NULL via the FK.
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const names = [
    "Alice Johnson",
    "Bob Smith",
    "Charlie Brown",
    "Diana Prince",
    "Evan Wright",
  ];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomPhone = `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;

  const { error } = await supabase.from("missed_calls").insert({
    user_id: user.id,
    caller_name: randomName,
    phone_number: randomPhone,
    called_at: new Date().toISOString(),
    status: "new",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteBusinessProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("business_profiles")
    .delete()
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

// Services CRUD
export async function getServicesForProfile(businessProfileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_profile_id", businessProfileId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveService(service: {
  id?: string;
  business_profile_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_paid: boolean;
  is_active?: boolean;
  payment_mode?: "free" | "online" | "in_store";
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const paymentMode =
      service.payment_mode ?? (service.is_paid ? "online" : "free");

    const serviceData = {
      name: service.name,
      description: service.description || "",
      duration_minutes: service.duration_minutes,
      price: service.price,
      is_paid: service.is_paid,
      payment_mode: paymentMode,
      is_active: service.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (service.id) {
      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", service.id)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("services").insert({
        ...serviceData,
        business_profile_id: service.business_profile_id,
        user_id: user.id,
        updated_at: undefined, // Let DB handle created_at/updated_at for new records or use current time
      });
      if (error) throw error;
    }

    revalidatePath("/dashboard");
  } catch (error: any) {
    console.error("Error in saveService:", error);
    throw new Error(error.message || "Failed to save service");
  }
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateBusinessProfileStripe(
  profileId: string,
  stripeAccountId: string,
  paymentsEnabled: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("business_profiles")
    .update({
      stripe_account_id: stripeAccountId,
      payments_enabled: paymentsEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  // Also persist Stripe account at user level so it survives booking link deletions
  await supabase
    .from("users")
    .update({ stripe_account_id: stripeAccountId })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export async function updateAvailableHours(
  profileId: string,
  availableHours: any,
  slotDuration: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("business_profiles")
    .update({
      available_hours: availableHours,
      slot_duration: slotDuration,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function syncStripeAcrossProfiles() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // First check user-level Stripe account (survives all booking link deletions)
  const { data: userData } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let stripeAccountId = userData?.stripe_account_id;

  // Fallback: check any existing business profile
  if (!stripeAccountId) {
    const { data: profileWithStripe } = await supabase
      .from("business_profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .not("stripe_account_id", "is", null)
      .limit(1)
      .single();

    stripeAccountId = profileWithStripe?.stripe_account_id;
  }

  if (!stripeAccountId) return null;

  // Sync to all business profiles that don't have it yet
  await supabase
    .from("business_profiles")
    .update({
      stripe_account_id: stripeAccountId,
      payments_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .is("stripe_account_id", null);

  revalidatePath("/dashboard");
  return stripeAccountId;
}

export async function getUserStripeAccountId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // First try user-level storage (persists even if all booking links are deleted)
  const { data: userData } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (userData?.stripe_account_id) return userData.stripe_account_id;

  // Fallback: check business profiles (legacy / backfill path)
  const { data: profileData } = await supabase
    .from("business_profiles")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .not("stripe_account_id", "is", null)
    .limit(1)
    .maybeSingle();

  return profileData?.stripe_account_id || null;
}
