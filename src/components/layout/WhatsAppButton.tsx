import React, { useState } from "react";
import { sound } from "../../lib/audio";

export const WhatsAppButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    sound.playTactileClick();
    window.open("https://chat.whatsapp.com/chesscommunityindia", "_blank", "noopener,noreferrer");
  };

  return (
    <aside 
      aria-label="WhatsApp Community Contact"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 select-none"
    >
      {/* Slow Hover Lens Tooltip */}
      <div
        className={`hidden sm:flex items-center px-3.5 py-1.5 rounded-full border border-[#25D366]/40 bg-[#FAF7F2] text-xs font-sans font-medium text-[#1C1613] shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-500 pointer-events-none ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse mr-2" />
        <span>Join WhatsApp Community</span>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Open WhatsApp Community"
        className="relative group w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center bg-[#FAF7F2] hover:bg-[#F0ECE4] border border-[#25D366]/40 hover:border-[#25D366] shadow-[0_4px_16px_rgba(37,211,102,0.25)] hover:shadow-[0_4px_24px_rgba(37,211,102,0.4)] transition-all duration-500 hover:scale-110 active:scale-95 cursor-button focus:outline-none"
      >
        {/* Soft Ambient Pulse Ring */}
        <span className="absolute inset-0 rounded-full border border-[#25D366]/30 animate-ping opacity-30 pointer-events-none" />

        {/* Crisp Official WhatsApp SVG Emblem */}
        <svg
          className="w-6 h-6 text-[#25D366] group-hover:text-[#4ADE80] transition-colors duration-300 drop-shadow-[0_0_8px_rgba(37,211,102,0.6)]"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.004 2C6.48 2 2 6.48 2 12.004C2 13.774 2.463 15.485 3.342 16.994L2.062 21.666L6.872 20.404C8.337 21.205 9.99 21.625 12.004 21.625C17.527 21.625 22.007 17.145 22.007 11.622C22.007 6.098 17.527 2 12.004 2ZM12.004 19.988C10.257 19.988 8.799 19.516 7.502 18.745L7.185 18.557L4.331 19.305L5.093 16.525L4.887 16.197C4.043 14.854 3.637 13.347 3.637 11.622C3.637 7.008 7.39 3.255 12.004 3.255C16.618 3.255 20.371 7.008 20.371 11.622C20.371 16.236 16.618 19.988 12.004 19.988ZM16.592 14.288C16.34 14.162 15.105 13.555 14.878 13.471C14.651 13.387 14.483 13.345 14.315 13.597C14.147 13.849 13.664 14.417 13.517 14.585C13.37 14.753 13.223 14.774 12.971 14.648C12.719 14.522 11.906 14.256 10.944 13.398C10.194 12.73 9.686 11.906 9.539 11.654C9.392 11.402 9.523 11.266 9.65 11.141C9.763 11.028 9.902 10.847 10.028 10.7C10.154 10.553 10.196 10.448 10.28 10.28C10.364 10.112 10.322 9.965 10.259 9.839C10.196 9.713 9.692 8.473 9.482 7.969C9.278 7.478 9.071 7.545 8.917 7.537C8.77 7.529 8.602 7.529 8.434 7.529C8.266 7.529 7.993 7.592 7.762 7.844C7.531 8.096 6.88 8.705 6.88 9.944C6.88 11.183 7.783 12.38 7.909 12.548C8.035 12.716 9.682 15.26 12.203 16.349C12.803 16.608 13.27 16.762 13.635 16.878C14.237 17.069 14.787 17.042 15.221 16.977C15.705 16.905 16.711 16.368 16.921 15.78C17.131 15.192 17.131 14.688 17.068 14.583C17.005 14.478 16.844 14.414 16.592 14.288Z" />
        </svg>
      </button>
    </aside>
  );
};
