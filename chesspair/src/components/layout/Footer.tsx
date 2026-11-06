import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-8 mt-auto flex flex-col items-center justify-center text-center select-none">
      <div className="flex items-center gap-0.5 text-[#442D1C] font-bold text-lg tracking-tight">
        <span>chess</span>
        <span className="text-[#84592B] font-extrabold mx-0.5">:</span>
        <span>manager</span>
      </div>
      <p className="text-[11px] text-[#6e5848] mt-1">
        Official Tournament Pairing & Management Engine
      </p>
    </footer>
  );
};
