import Link from "next/link";
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-black pt-40 pb-24">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-[120px] rounded-full mix-blend-screen" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm text-gray-300 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Accepting new enterprise partners for Q4
            </div>

            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-8 leading-[1.1]">
              Intelligence, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">
                Architected.
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              NumSphere bridges the gap between theoretical AI models and revenue-generating enterprise infrastructure. We build scalable cognitive systems.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              >
                Start Integration
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              
              <Link
                href="#case-studies"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-sm font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-black"
              >
                View Case Studies
              </Link>
            </div>

            <div className="mt-24 pt-12 border-t border-white/10 w-full">
                <p className="text-sm text-gray-500 mb-8 tracking-widest uppercase">Trusted by engineering teams at</p>
                <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
                    {/* Placeholder logos using text for now */}
                    <div className="text-2xl font-bold text-white tracking-tighter">ACME</div>
                    <div className="text-2xl font-bold text-white tracking-tighter">Globex</div>
                    <div className="text-2xl font-bold text-white tracking-tighter">Soylent</div>
                    <div className="text-2xl font-bold text-white tracking-tighter">Initech</div>
                    <div className="text-2xl font-bold text-white tracking-tighter">Umbrella</div>
                </div>
            </div>
          </div>
        </div>
    </div>
  );
}
