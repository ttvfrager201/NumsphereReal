import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import { ArrowUpRight, CheckCircle2, Zap, Shield, Users } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke('supabase-functions-get-plans');

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-black relative overflow-hidden" id="features">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Why Choose NumSphere</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">We're revolutionizing the way teams work with cutting-edge technology and unparalleled service.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Zap className="w-6 h-6 text-white" />, title: "Lightning Fast", description: "10x faster than traditional solutions" },
              { icon: <Shield className="w-6 h-6 text-white" />, title: "Enterprise Security", description: "Bank-grade encryption built-in" },
              { icon: <Users className="w-6 h-6 text-white" />, title: "Team Collaboration", description: "Seamless workflow for your entire team" },
              { icon: <CheckCircle2 className="w-6 h-6 text-white" />, title: "99.9% Uptime", description: "Reliability you can count on" }
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="mb-4 p-3 bg-white/10 rounded-lg w-fit">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/10 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center divide-x divide-white/10">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tighter">$1M+</div>
              <div className="text-gray-500 uppercase tracking-widest text-sm">Funding Raised</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tighter">500+</div>
              <div className="text-gray-500 uppercase tracking-widest text-sm">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tighter">99.9%</div>
              <div className="text-gray-500 uppercase tracking-widest text-sm">Uptime Guaranteed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-black relative" id="pricing">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Choose the perfect plan for your needs. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-zinc-950 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-lg">Join thousands of satisfied customers who trust us with their business.</p>
          <a href="/dashboard" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black">
            Get Started Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
