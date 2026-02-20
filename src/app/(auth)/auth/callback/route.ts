import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  // Helper to get the base URL for redirects
  const getBaseUrl = () => {
    // Use environment variable if set
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      return siteUrl.startsWith("http://") || siteUrl.startsWith("https://") 
        ? siteUrl 
        : `https://${siteUrl}`;
    }
    
    // Try to get from request headers
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const referer = request.headers.get("referer");
    
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        return `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (e) {
        // Fall through
      }
    }
    
    // Fallback to request origin
    const { origin } = new URL(request.url);
    return origin;
  };

  const getRedirectUrl = (path: string) => {
    const baseUrl = getBaseUrl();
    return `${baseUrl}${path}`;
  };

  // Helper to ensure user exists in public.users table
  async function ensureUserProfile(supabase: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingUser) {
          await supabase.from("users").upsert({
            id: user.id,
            user_id: user.id,
            name: user.user_metadata?.full_name || "",
            email: user.email || "",
            token_identifier: user.id,
            created_at: new Date().toISOString(),
          }, { onConflict: "id" });
        }
      }
    } catch (e) {
      // Silently continue — profile creation is best-effort
    }
  }

  // Helper to redirect to check-email page with success
  const redirectToCheckEmail = async (supabase: any) => {
    await ensureUserProfile(supabase);
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || "";
    
    // Redirect to check-email page with success parameter
    const checkEmailUrl = `/check-email?email=${encodeURIComponent(userEmail)}&success=true`;
    return NextResponse.redirect(getRedirectUrl(checkEmailUrl));
  };

  // Handle PKCE code exchange (OAuth like Google, or magic link via PKCE)
  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure user profile exists in public.users table
      await ensureUserProfile(supabase);
      
      // Check if this is an OAuth sign-in by examining the provider in app_metadata
      // or by checking if there are any provider identities (Google, GitHub, etc.)
      const { data: { user } } = await supabase.auth.getUser();
      const hasOAuthIdentity = user?.identities?.some(
        identity => identity.provider !== 'email'
      );
      
      if (hasOAuthIdentity) {
        // OAuth sign-in (Google, GitHub, etc.) — go straight to dashboard
        return NextResponse.redirect(getRedirectUrl(next));
      }
      
      // Email-based PKCE flow (magic link) — show check-email confirmation
      return redirectToCheckEmail(supabase);
    }
  }

  // Handle OTP token hash verification (magic link, email confirmation)
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (!error) {
      // For email confirmation/signup, show the check-email success page
      // For other types, redirect to dashboard
      if (type === "signup" || type === "email") {
        return redirectToCheckEmail(supabase);
      }
      await ensureUserProfile(supabase);
      return NextResponse.redirect(getRedirectUrl(next));
    }
  }

  // If we get here, try to check if user is already authenticated
  // (some email providers pre-fetch links which can consume the token)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await ensureUserProfile(supabase);
      return NextResponse.redirect(getRedirectUrl(next));
    }
  } catch (e) {
    // Fall through to error
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${getBaseUrl()}/sign-in?error=${encodeURIComponent("Could not verify your authentication. Please try again.")}`,
  );
}
