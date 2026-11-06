import React, { useState, useEffect } from "react";
import { sound } from "../../lib/audio";
import { contentStore, resolveMediaUrl } from "../../lib/storage/contentStore";
import { Instagram, Youtube, Linkedin } from "lucide-react";

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState(() => contentStore.getSettings());

  useEffect(() => {
    const sync = () => setSettings(contentStore.getSettings());
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);
  return (
    <footer className="relative w-full glass-surface border-t border-white/50 text-[#4A3F36] pt-16 pb-10 z-10 font-sans backdrop-blur-xl bg-[#EDE6DC]/75">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#DCD1C2]">
          
          {/* Column 1: Brand (md:col-span-5) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D5C4B0] bg-[#FAF7F2] shrink-0 shadow-xs">
                <img
                  src={resolveMediaUrl(settings.logoUrl, 'brand_logo')}
                  alt="Chess Community India"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-display text-sm sm:text-base font-bold tracking-[0.14em] uppercase text-[#1C1613] leading-tight">
                  CHESS COMMUNITY INDIA
                </h3>
                <p className="font-sans text-[9px] tracking-[0.24em] uppercase text-[#7A6E63] font-medium">
                  OFFICIAL PLATFORM
                </p>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-[#594B40] max-w-sm leading-relaxed">
              Building a stronger chess ecosystem across India.
            </p>
          </div>

          {/* Column 2: Quick Links (md:col-span-4) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#1C1613]">
              Quick Links
            </h4>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 text-xs text-[#594B40]">
              <button
                onClick={() => { sound.playTactileClick(); onNavigate("cities"); }}
                className="text-left hover:text-[#1C1613] transition-colors cursor-link"
              >
                Cities
              </button>
              <button
                onClick={() => { sound.playTactileClick(); onNavigate("about"); }}
                className="text-left hover:text-[#1C1613] transition-colors cursor-link"
              >
                About Us
              </button>
              <button
                onClick={() => { sound.playTactileClick(); onNavigate("hiring"); }}
                className="text-left hover:text-[#1C1613] transition-colors cursor-link"
              >
                Hiring
              </button>
              <button
                onClick={() => { sound.playTactileClick(); onNavigate("events"); }}
                className="text-left hover:text-[#1C1613] transition-colors cursor-link"
              >
                Events
              </button>
              <button
                onClick={() => { sound.playTactileClick(); onNavigate("work-with-us"); }}
                className="text-left hover:text-[#1C1613] transition-colors cursor-link"
              >
                Work With Us
              </button>
              <button
                onClick={() => { sound.playTactileClick(); onNavigate("chess-pair"); }}
                className="text-left hover:text-[#1C1613] transition-colors cursor-link"
              >
                Chess Pair
              </button>
            </div>
          </div>

          {/* Column 3: Follow Us (md:col-span-3) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#1C1613]">
              Follow Us
            </h4>
            <div className="flex items-center gap-4 text-[#594B40]">
              <a
                href="https://instagram.com/chesscommunityindia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-[#D5C4B0] bg-[#FAF7F2] flex items-center justify-center hover:text-[#1C1613] hover:border-[#1C1613] transition-all"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@chesscommunityindia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-[#D5C4B0] bg-[#FAF7F2] flex items-center justify-center hover:text-[#1C1613] hover:border-[#1C1613] transition-all"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/company/chess-community-india"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-[#D5C4B0] bg-[#FAF7F2] flex items-center justify-center hover:text-[#1C1613] hover:border-[#1C1613] transition-all"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-[#D5C4B0] bg-[#FAF7F2] flex items-center justify-center hover:text-[#1C1613] hover:border-[#1C1613] transition-all"
                title="Discord"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright and Legal */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A6E63] gap-4">
          <p>&copy; {new Date().getFullYear()} Chess Community India. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <button
              onClick={() => { sound.playTactileClick(); onNavigate("about"); }}
              className="hover:text-[#1C1613] transition-colors cursor-link"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => { sound.playTactileClick(); onNavigate("about"); }}
              className="hover:text-[#1C1613] transition-colors cursor-link"
            >
              Terms
            </button>
            <button
              onClick={() => { sound.playTactileClick(); onNavigate("work-with-us"); }}
              className="hover:text-[#1C1613] transition-colors cursor-link"
            >
              Contact
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
