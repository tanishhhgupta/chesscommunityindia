import React from "react";
import { 
  Trophy, 
  Users, 
  MapPin, 
  Heart, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Globe2, 
  Coffee 
} from "lucide-react";

export const CommunityImpact: React.FC = () => {
  const stats = [
    {
      label: "Active Verified Players",
      value: "12,500+",
      detail: "Spanning 45 Elo Micro-Tiers",
      icon: Users,
      color: "text-white",
    },
    {
      label: "Decentralized City Hubs",
      value: "24+",
      detail: "From Jabalpur to Delhi NCR",
      icon: MapPin,
      color: "text-[#C9A45C]",
    },
    {
      label: "FIDE Swiss Tournaments",
      value: "180+",
      detail: "Zero Arbiter Software Failures",
      icon: Trophy,
      color: "text-[#E0C895]",
    },
    {
      label: "Total Prize Pools Awarded",
      value: "₹15,00,000+",
      detail: "Directly Distributed to Talent",
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "School & Youth Trainees",
      value: "4,200+",
      detail: "Free Educational Coaching",
      icon: Heart,
      color: "text-red-400",
    },
    {
      label: "Free Public Chess Tables",
      value: "150+",
      detail: "Installed in Cafes & Public Parks",
      icon: Coffee,
      color: "text-blue-400",
    },
  ];

  return (
    <section className="py-24 relative bg-[#080808] text-[#F5F1E8] border-t border-[rgba(245, 242, 235,0.04)] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#C9A45C]/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#C9A45C]/30 text-xs font-semibold text-[#E0C895] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Grassroots Impact &bull; Nationwide Footprint</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white font-serif-editorial tracking-wide">
            Democratic, Accessible &amp; <br />
            <span className="gold-gradient-text">Relentlessly Grassroots.</span>
          </h2>

          <p className="text-[#8D8D8D] text-sm sm:text-base leading-relaxed">
            Chess Community India began with one simple pledge: remove financial barriers, bring chess boards to open public spaces, and run world-class FIDE Swiss tournaments with mathematical precision.
          </p>
        </div>

        {/* 6 Key Impact Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card rounded-3xl p-8 border border-[rgba(245, 242, 235,0.06)] hover:border-[#C9A45C]/40 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
              >
                {/* Micro corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.03] to-transparent pointer-events-none" />

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#121212] border border-[rgba(245, 242, 235,0.06)] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>

                  <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight mb-2 ${stat.color}`}>
                    {stat.value}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">
                    {stat.label}
                  </h3>

                  <p className="text-xs text-[#8D8D8D]">
                    {stat.detail}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[rgba(245, 242, 235,0.04)] flex items-center justify-between text-[11px] text-[#8D8D8D]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
                    Verified CCI Telemetry
                  </span>
                  <span className="font-mono text-slate-500">#{String(i + 1).padStart(2, "0")}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Founding Philosophy Banner */}
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-[#C9A45C]/20 relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C9A45C]">
                The Founding Credo
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-serif-editorial">
                "We don't wait for grand halls. A cup of chai and a wooden board in a public garden is enough to spark a grandmaster."
              </h3>
              <p className="text-xs sm:text-sm text-[#8D8D8D] leading-relaxed max-w-2xl">
                Founded by <strong>Tanish Gupta</strong> in Jabalpur, Chess Community India remains 100% committed to keeping tournaments affordable, nurturing community arbiters, and celebrating every move from blunder to brilliance.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <a
                href="#join-portal"
                className="gold-gradient-btn px-6 py-3.5 rounded-2xl text-[#080808] font-black text-xs sm:text-sm text-center shadow-xl hover:scale-102 transition-transform"
              >
                Join the Movement
              </a>
              <a
                href="#about"
                className="px-6 py-3.5 rounded-2xl bg-[#181818] hover:bg-[#222222] text-[#F5F1E8] font-bold text-xs sm:text-sm text-center border border-[rgba(245, 242, 235,0.06)] transition-colors"
              >
                Read Founding Story
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
