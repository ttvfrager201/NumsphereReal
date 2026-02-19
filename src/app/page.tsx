import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import { ArrowUpRight, CheckCircle2, Zap, Shield, Users } from 'lucide-react';
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";

const content = [
  {
    title: "Lightning Fast",
    description:
      "10x faster than traditional solutions. We've optimized every aspect of our platform to ensure that you get the speed you need to stay ahead of the competition.",
    content: (
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,var(--cyan-500),var(--emerald-500))] flex items-center justify-center text-white">
        <Zap className="w-10 h-10" />
      </div>
    ),
  },
  {
    title: "Enterprise Security",
    description:
      "Bank-grade encryption built-in. Your data is safe with us. We use the latest security standards to protect your information from unauthorized access.",
    content: (
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,var(--pink-500),var(--indigo-500))] flex items-center justify-center text-white">
        <Shield className="w-10 h-10" />
      </div>
    ),
  },
  {
    title: "Team Collaboration",
    description:
      "Seamless workflow for your entire team. Work together in real-time with our collaborative tools designed to boost productivity and efficiency.",
    content: (
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,var(--orange-500),var(--yellow-500))] flex items-center justify-center text-white">
        <Users className="w-10 h-10" />
      </div>
    ),
  },
  {
    title: "99.9% Uptime",
    description:
      "Reliability you can count on. Our infrastructure is designed to ensure that your services are always available when you need them.",
    content: (
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,var(--cyan-500),var(--blue-500))] flex items-center justify-center text-white">
        <CheckCircle2 className="w-10 h-10" />
      </div>
    ),
  },
];

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
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Why Choose NumSphere</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">We're revolutionizing the way teams work with cutting-edge technology and unparalleled service.</p>
          </div>
          
          <StickyScroll content={content} />
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
