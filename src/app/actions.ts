"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

// Helper to get the correct redirect URL for email callbacks
function getEmailRedirectUrl(): string {
  // For development, default to localhost:3001
  if (process.env.NODE_ENV === "development") {
    // Check if NEXT_PUBLIC_SITE_URL is set
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      // Ensure it has protocol
      const url = siteUrl.startsWith("http://") || siteUrl.startsWith("https://") 
        ? siteUrl 
        : `http://${siteUrl}`;
      return `${url}/auth/callback`;
    }
    // Default to localhost:3001 for development
    return "http://localhost:3001/auth/callback";
  }
  
  // For production, use environment variable
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set in production");
  }
  // Ensure it has protocol
  const url = siteUrl.startsWith("http://") || siteUrl.startsWith("https://") 
    ? siteUrl 
    : `https://${siteUrl}`;
  return `${url}/auth/callback`;
}

export const signInWithMagicLinkAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();

  if (!email) {
    return encodedRedirect("error", "/sign-in", "Email is required");
  }

  // Prevent automatic user creation - only allow sign-in for existing users
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
      shouldCreateUser: false, // Don't create users on sign-in
    },
  });

  if (error) {
    // If user doesn't exist (shouldCreateUser: false), redirect them to sign-up page
    // Common error messages when user doesn't exist:
    // - "User not found"
    // - "signups not allowed" (when signups are disabled for OTP)
    // - "Email rate limit exceeded" might also indicate user doesn't exist in some cases
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes("user not found") ||
      errorMessage.includes("signups not allowed") ||
      errorMessage.includes("signup not allowed") ||
      (error.status === 400 && errorMessage.includes("email"))
    ) {
      // Redirect to sign-up with error message and pre-filled email
      return redirect(
        `/sign-up?error=${encodeURIComponent("No account found with this email. Please sign up to create an account.")}&email=${encodeURIComponent(email)}`
      );
    }
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect(`/check-email?email=${encodeURIComponent(email)}&type=sign-in`);
};

export const signUpWithMagicLinkAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const fullName = formData.get("full_name")?.toString() || '';
  const supabase = await createClient();

  if (!email) {
    return encodedRedirect("error", "/sign-up", "Email is required");
  }

  // signInWithOtp automatically creates users if they don't exist (shouldCreateUser defaults to true)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
      shouldCreateUser: true, // Explicitly enable automatic user creation
      data: {
        full_name: fullName,
      }
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  return redirect(`/check-email?email=${encodeURIComponent(email)}&type=sign-up`);
};

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || '';
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
      data: {
        full_name: fullName,
        email: email,
      }
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  // Don't insert into users table here — it happens in /auth/callback after email is confirmed
  return redirect(`/check-email?email=${encodeURIComponent(email)}&type=sign-up`);
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signInWithGoogle = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://num-sphere.vercel.app'}/auth/callback`,
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  if (data.url) {
    return redirect(data.url);
  }
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    return false;
  }

  return !!subscription;
};
