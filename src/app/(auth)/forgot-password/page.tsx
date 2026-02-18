import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions";
import Navbar from "@/components/navbar";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
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
              <h1 className="text-3xl font-bold tracking-tight text-white">Reset Password</h1>
              <p className="text-sm text-gray-400">
                Remember your password?{" "}
                <Link
                  className="text-white font-medium hover:text-gray-300 hover:underline transition-all"
                  href="/sign-in"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <form className="flex flex-col space-y-4">
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

              <SubmitButton
                formAction={forgotPasswordAction}
                pendingText="Sending reset link..."
                className="w-full h-11 bg-white/10 text-white hover:bg-white/20 font-medium border border-white/10"
              >
                Reset Password
              </SubmitButton>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
