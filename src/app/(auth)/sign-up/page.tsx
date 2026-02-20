import { signUpAction, signInWithGoogle } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Signup(props: {
  searchParams: Promise<Message & { email?: string }>;
}) {
  const searchParams = await props.searchParams;
  // Extract email from searchParams - Next.js searchParams includes all query params
  const email = "email" in searchParams && typeof searchParams.email === "string" 
    ? searchParams.email 
    : undefined;
  
  // Check if there's ONLY a message (not error/success) - in that case show just the message
  if ("message" in searchParams && !("error" in searchParams) && !("success" in searchParams)) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md bg-black text-white">
        <FormMessage message={searchParams} />
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
              <h1 className="text-3xl font-bold tracking-tight text-white">Create Account</h1>
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link
                  className="text-white font-medium hover:text-gray-300 hover:underline transition-all"
                  href="/sign-in"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 20.45c4.6667 0 8.0416-3.2916 8.0416-8.2083 0-.75-.0833-1.4583-.2083-2.125h-7.8333v4.0416h4.5c-.2083 1.25-1.25 3.375-4.5 3.375-2.7083 0-4.9166-2.25-4.9166-5.0416s2.2083-5.0417 4.9166-5.0417c1.4167 0 2.7084.5 3.6667 1.4167l2.9583-2.9584c-1.8333-1.7083-4.2916-2.7083-6.625-2.7083-5.5 0-10 4.5-10 10s4.5 10 10 10z"
                    fill="currentColor"
                  />
                </svg>
                Sign up with Google
              </button>
            </form>

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

            <form className="flex flex-col space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="bg-zinc-900/50 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 focus:ring-white/20 h-11"
                  />
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
                    defaultValue={email}
                    required
                    className="bg-zinc-900/50 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 focus:ring-white/20 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                    className="bg-zinc-900/50 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 focus:ring-white/20 h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SubmitButton
                  formAction={signUpAction}
                  pendingText="Signing up..."
                  className="w-full h-11 bg-white text-black hover:bg-gray-200 font-medium border border-transparent transition-colors"
                >
                  Sign up
                </SubmitButton>
              </div>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
