"use client";

import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import { createClient } from "../../../../supabase/client";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "your email";
  const type = searchParams.get("type") || "sign-in";
  const success = searchParams.get("success") === "true";
  const [confirmed, setConfirmed] = useState(success);

  const checkSession = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setConfirmed(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }, [router]);

  useEffect(() => {
    // If success parameter is present, show success state immediately
    // But don't redirect - this tab was opened from the email link
    // The user should close this tab and return to the original tab
    if (success) {
      setConfirmed(true);
      return;
    }

    // Listen for auth state changes (works if user confirms in SAME browser)
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setConfirmed(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    });

    // Also poll every 2 seconds in case the auth state change event doesn't fire
    // (e.g. user confirms in a different browser tab)
    const interval = setInterval(() => {
      checkSession();
    }, 2000);

    // Check immediately on mount
    checkSession();

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router, checkSession, success]);

  if (confirmed) {
    // If success=true, this tab was opened from the email link
    // Show message to close tab and return to original tab
    if (success) {
      return (
        <div className="dark min-h-screen bg-black text-white selection:bg-white/20 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-24">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none opacity-60" />

            <div className="w-full max-w-md bg-white/5 border border-emerald-500/30 rounded-2xl p-8 relative z-10 backdrop-blur-sm shadow-2xl shadow-emerald-900/20">
              <div className="flex flex-col items-center space-y-6">
                {/* Logo */}
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2">
                  <span className="text-black font-bold text-3xl">N</span>
                </div>

                {/* Green check icon */}
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>

                {/* Title */}
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
                    Email Confirmed!
                  </h1>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Your email has been verified successfully.
                  </p>
                  <p className="text-white font-medium text-base bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 inline-block">
                    {email}
                  </p>
                </div>

                {/* Close tab notice */}
                <div className="flex flex-col items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-6 text-center w-full">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-sm font-medium text-emerald-400">
                    You can close this tab now
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Return to the original tab where you were waiting. The page will update automatically and redirect you to the dashboard.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-8 relative z-10">
              Powered by <span className="text-gray-400 font-medium">NumSphere</span>
            </p>
          </div>
        </div>
      );
    }

    // Regular success state (when confirmed in same tab)
    return (
      <div className="dark min-h-screen bg-black text-white selection:bg-white/20 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none opacity-60" />

          <div className="w-full max-w-md bg-white/5 border border-emerald-500/30 rounded-2xl p-8 relative z-10 backdrop-blur-sm shadow-2xl shadow-emerald-900/20">
            <div className="flex flex-col items-center space-y-6">
              {/* Logo */}
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2">
                <span className="text-black font-bold text-3xl">N</span>
              </div>

              {/* Green check icon */}
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>

              {/* Title */}
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
                  Email Confirmed!
                </h1>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Your email has been verified successfully.
                </p>
                <p className="text-white font-medium text-base bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 inline-block">
                  {email}
                </p>
              </div>

              {/* Redirect notice */}
              <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 text-center w-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <p className="text-sm text-gray-300">
                  Redirecting you to the dashboard...
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-8 relative z-10">
            Powered by <span className="text-gray-400 font-medium">NumSphere</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-black text-white selection:bg-white/20 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-24">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none opacity-50" />

        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 relative z-10 backdrop-blur-sm shadow-2xl shadow-black/50">
          <div className="flex flex-col items-center space-y-6">
            {/* Logo */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2">
              <span className="text-black font-bold text-3xl">N</span>
            </div>

            {/* Mail icon with animation */}
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Mail className="w-10 h-10 text-white animate-pulse" />
            </div>

            {/* Title */}
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Check your email
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                We sent a {type === "sign-up" ? "confirmation" : "magic"} link to
              </p>
              <p className="text-white font-medium text-base bg-white/5 px-4 py-2 rounded-lg border border-white/10 inline-block">
                {email}
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-3 text-center w-full">
              <p className="text-sm text-gray-400 leading-relaxed">
                Click the link in the email to{" "}
                {type === "sign-up" ? "verify your account" : "sign in"}.
                The link will expire in 24 hours.
              </p>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-4 text-left">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-xs text-gray-400">
                  This page will update automatically once you confirm your email.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-4 text-left">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-xs text-gray-400">
                  Don&apos;t see the email? Check your spam folder or{" "}
                  <Link
                    href={type === "sign-up" ? "/sign-up" : "/sign-in"}
                    className="text-white underline hover:text-gray-300 transition-colors"
                  >
                    try again
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Back link */}
            <Link
              href={type === "sign-up" ? "/sign-up" : "/sign-in"}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to {type === "sign-up" ? "Sign Up" : "Sign In"}
            </Link>
          </div>
        </div>

        {/* Brand footer */}
        <p className="text-xs text-gray-600 mt-8 relative z-10">
          Powered by <span className="text-gray-400 font-medium">NumSphere</span>
        </p>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="dark min-h-screen bg-black text-white flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
