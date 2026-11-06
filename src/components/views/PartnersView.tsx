import React, { useState, useEffect } from "react";
import { contentStore, PartnerCollaborator, resolveMediaUrl } from "../../lib/storage/contentStore";
import { sound } from "../../lib/audio";
import { ArrowRight, Building2, Handshake } from "lucide-react";

interface PartnersViewProps {
  onNavigate: (view: string) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({ onNavigate }) => {
  const [partners, setPartners] = useState<PartnerCollaborator[]>(() =>
    contentStore.getPartners(false)
  );

  useEffect(() => {
    const sync = () => {
      setPartners(contentStore.getPartners(false));
    };
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-6 sm:px-12 max-w-5xl mx-auto space-y-24">
      
      {/* 1. Header */}
      <section className="space-y-4 apple-scroll-reveal">
        <span className="text-xs font-sans tracking-[0.2em] text-[#C5A059] uppercase block font-semibold">
          Partners
        </span>
        <h1 className="text-5xl sm:text-7xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          Growing Together.
        </h1>
        <p className="text-base sm:text-lg text-[#9CA3A8] font-normal max-w-xl font-sans leading-relaxed">
          Working with organisations, institutions, schools, colleges and partners to grow chess communities.
        </p>
      </section>

      {/* 2. Clean Progressive Logo Presentation */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 apple-scroll-reveal">
        {partners.map((p) => (
          <div
            key={p.id}
            className="p-8 rounded-2xl quiet-card flex flex-col justify-between space-y-6 group hover:border-[#C5A059]/40 transition-colors"
          >
            <div className="h-12 flex items-center">
              <img
                src={resolveMediaUrl(p.logoUrl, p.slotKey || `partner_${p.id}`)}
                alt={p.name}
                className="max-h-10 max-w-full object-contain filter brightness-90 group-hover:brightness-100 transition-all"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider block">
                {p.category || "OFFICIAL PARTNER"}
              </span>
              <h3 className="text-base font-serif-editorial font-bold text-white group-hover:text-[#C5A059] transition-colors">
                {p.name}
              </h3>
              <p className="text-xs text-[#9CA3A8] font-light leading-relaxed">
                {p.description || "Grassroots and sanctioned ecosystem collaborator."}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Academic Chapter Grant CTA */}
      <section className="border-t border-[rgba(245, 242, 235,0.05)] pt-16 flex flex-col sm:flex-row items-center justify-between gap-6 apple-scroll-reveal">
        <div>
          <h3 className="text-2xl font-serif-editorial font-bold text-white">Representing a college or university?</h3>
          <p className="text-xs text-[#9CA3A8] mt-1 font-light">Apply for free FIDE-standard boards, DGT clocks, and a sanctioned campus chapter.</p>
        </div>
        <button
          onClick={() => onNavigate("join")}
          className="accent-gold-btn px-6 py-3 rounded-full text-sm font-sans font-semibold text-[#08161A] shadow-lg"
        >
          Partner With Us
        </button>
      </section>

    </div>
  );
};
