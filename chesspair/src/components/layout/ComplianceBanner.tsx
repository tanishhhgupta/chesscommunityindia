import React, { useState } from 'react';
import { ShieldAlert, Info, ChevronRight, X } from 'lucide-react';

export const ComplianceBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-b border-amber-600/30 px-4 py-2.5 text-xs text-amber-200/90">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
            <ShieldAlert size={15} />
          </span>
          <div>
            <span className="font-semibold text-amber-300">Basic Swiss Engine Active:</span>{' '}
            <span className="text-slate-300">
              ChessPair v1 operates under an internal score-bracket heuristic. Official FIDE compliance (Handbook C.04.3.2) is not claimed until independent validation is completed.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium cursor-pointer"
          >
            <Info size={13} />
            <span>{showDetails ? 'Hide Details' : 'Architecture Notice'}</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-slate-800/80 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="max-w-7xl mx-auto mt-3 p-3.5 bg-slate-950/90 rounded-xl border border-amber-500/20 text-slate-300 text-xs space-y-2">
          <div className="font-semibold text-amber-400 flex items-center gap-1.5">
            <ChevronRight size={14} /> Modular Tournament Engine Architecture
          </div>
          <p>
            The pairing module is completely decoupled in <code className="text-amber-300">src/engine/</code> behind the <code className="text-amber-300">TournamentEngine</code> interface. It implements score groups, color balance, rematch prevention, and automatic bye allocation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="font-medium text-emerald-400">Basic Swiss Engine</div>
              <div className="text-[11px] text-slate-400">Active - High-integrity pairing with automated unit test suite.</div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="font-medium text-blue-400">Round Robin (Berger)</div>
              <div className="text-[11px] text-slate-400">Plug-and-play module included for all-play-all tournaments.</div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="font-medium text-purple-400">Knockout Brackets</div>
              <div className="text-[11px] text-slate-400">Modular bracket seeding for single/double elimination events.</div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="font-medium text-amber-400">FIDE Dutch Suite</div>
              <div className="text-[11px] text-slate-400">Reserved integration slot for accredited FIDE endorsement.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
