import React, { useState, useEffect, useMemo } from "react";
import { contentStore, PartnerCollaborator, resolveMediaUrl } from "../../lib/storage/contentStore";

interface PartnersMarqueeProps {
  className?: string;
  onNavigate?: (view: string) => void;
}

export const PartnersMarquee: React.FC<PartnersMarqueeProps> = ({
  className = "",
}) => {
  const [partners, setPartners] = useState<PartnerCollaborator[]>(() =>
    contentStore.getPartners(false)
  );

  // Subscribe to persistent content store updates and synchronization events
  useEffect(() => {
    const syncPartners = () => {
      setPartners(contentStore.getPartners(false));
    };

    window.addEventListener("cci-content-synced", syncPartners);
    const unsubscribe = contentStore.subscribe(syncPartners);

    return () => {
      window.removeEventListener("cci-content-synced", syncPartners);
      unsubscribe();
    };
  }, []);

  // Duplicate sequence internally for a seamless, gapless 50% translation loop
  const loopLogos = useMemo(() => {
    if (partners.length === 0) return [];
    // Repeat sequence enough times so 50% width fills wide screens
    const repeats = partners.length < 5 ? 4 : 2;
    const duplicated: (PartnerCollaborator & { keyId: string })[] = [];
    for (let cycle = 0; cycle < repeats * 2; cycle++) {
      partners.forEach((partner, pIndex) => {
        duplicated.push({
          ...partner,
          keyId: `${partner.id}-cycle-${cycle}-${pIndex}`,
        });
      });
    }
    return duplicated;
  }, [partners]);

  if (partners.length === 0) {
    return null;
  }

  return (
    <section 
      aria-label="Partners & Collaborators"
      className={`relative py-7 sm:py-9 max-w-7xl mx-auto px-4 sm:px-8 border-t border-[#E3D8CB]/80 ${className}`}
    >
      {/* 1. Restrained Header */}
      <div className="text-center mb-5 sm:mb-6">
        <h3 className="text-[11px] sm:text-xs font-sans tracking-[0.25em] text-[#8E5830] uppercase font-bold">
          OUR PARTNERS & COLLABORATORS
        </h3>
        <p className="text-xs sm:text-[13px] text-[#7A6E63] italic font-serif mt-1">
          Building the chess ecosystem together.
        </p>
      </div>

      {/* 2. Seamless Marquee Showcase */}
      <div className="relative w-full overflow-hidden marquee-container select-none">
        
        {/* Soft edge masking gradients for organic entrance/exit */}
        <div 
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 z-10 bg-gradient-to-r from-[#F4EFEA] via-[#F4EFEA]/80 to-transparent" 
          aria-hidden="true" 
        />
        <div 
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 z-10 bg-gradient-to-l from-[#F4EFEA] via-[#F4EFEA]/80 to-transparent" 
          aria-hidden="true" 
        />

        {/* Continuous Left-to-Right Animated Track */}
        <div className="marquee-track-ltr flex items-center gap-10 sm:gap-14 md:gap-16 py-2">
          {loopLogos.map((item) => {
            const resolvedSrc = resolveMediaUrl(
              item.logoUrl,
              item.slotKey || `partner_${item.id}`
            );

            const logoElement = (
              <img
                src={resolvedSrc}
                alt={`${item.name} logo`}
                loading="lazy"
                className="h-8 sm:h-10 md:h-11 max-w-[130px] sm:max-w-[160px] md:max-w-[180px] w-auto object-contain filter grayscale contrast-125 opacity-75 hover:grayscale-0 hover:opacity-100 hover:contrast-100 transition-all duration-300 drop-shadow-2xs"
              />
            );

            return (
              <div
                key={item.keyId}
                className="shrink-0 flex items-center justify-center transition-transform duration-200 hover:scale-[1.03]"
                title={`${item.name} • ${item.category || "Official Partner"}`}
              >
                {item.websiteUrl && item.websiteUrl !== "#" ? (
                  <a
                    href={item.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-1 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#8E5830]/30 rounded-md"
                  >
                    {logoElement}
                  </a>
                ) : (
                  <div className="flex items-center justify-center p-1">
                    {logoElement}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default PartnersMarquee;
