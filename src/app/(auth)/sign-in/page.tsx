import { signInAction, signInWithGoogle } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface LoginProps {
  searchParams: Promise<Message>;
}

export default async function SignInPage({ searchParams }: LoginProps) {
  const message = await searchParams;

  if ("message" in message) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md bg-black text-white">
        <FormMessage message={message} />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-black text-white selection:bg-white/20 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none opacity-50" />

        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 relative z-10 backdrop-blur-sm transition-all hover:bg-white/10 shadow-2xl shadow-black/50">
          <div className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
              <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <Link
                  className="text-white font-medium hover:text-gray-300 hover:underline transition-all"
                  href="/sign-up"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <form className="flex flex-col space-y-4">
              <button
                formAction={signInWithGoogle}
                formNoValidate
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 20.45c4.6667 0 8.0416-3.2916 8.0416-8.2083 0-.75-.0833-1.4583-.2083-2.125h-7.8333v4.0416h4.5c-.2083 1.25-1.25 3.375-4.5 3.375-2.7083 0-4.9166-2.25-4.9166-5.0416s2.2083-5.0417 4.9166-5.0417c1.4167 0 2.7084.5 3.6667 1.4167l2.9583-2.9584c-1.8333-1.7083-4.2916-2.7083-6.625-2.7083-5.5 0-10 4.5-10 10s4.5 10 10 10z"
                    fill="currentColor"
                  />
                </svg>
                Sign in with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black/50 px-2 text-gray-500 backdrop-blur-sm">
                    Or continue with email
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 focus:ring-white/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Password
                  </Label>
                  <Link
                    className="text-xs text-gray-400 hover:text-white hover:underline transition-all"
                    href="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 focus:ring-white/20 h-11"
                />
              </div>

              <SubmitButton
                className="w-full h-11 bg-white/10 text-white hover:bg-white/20 font-medium border border-white/10"
                pendingText="Signing in..."
                formAction={signInAction}
              >
                Sign in with Email
              </SubmitButton>

              <FormMessage message={message} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
