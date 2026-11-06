import React from 'react';
import { GameResult, Pairing, Player, RoundStatus } from '../../types';
import { useOrg } from '../../context/OrgContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { MoreHorizontal, AlertCircle, Shuffle, ShieldAlert } from 'lucide-react';

interface PairingBoardProps {
  pairing: Pairing & { whitePlayer?: Player; blackPlayer?: Player };
  roundStatus: RoundStatus;
  whiteColorHistory?: string[];
  blackColorHistory?: string[];
  whiteScore?: number;
  blackScore?: number;
  onUpdateResult: (pairingId: string, result: GameResult) => void;
  onOpenForfeitModal: (pairing: Pairing & { whitePlayer?: Player; blackPlayer?: Player }) => void;
  onOpenSwapModal?: () => void;
}

export const PairingBoard: React.FC<PairingBoardProps> = ({
  pairing,
  roundStatus,
  whiteColorHistory = [],
  blackColorHistory = [],
  whiteScore = 0,
  blackScore = 0,
  onUpdateResult,
  onOpenForfeitModal,
  onOpenSwapModal,
}) => {
  const { permissions } = useOrg();
  const canEnter = permissions.canEnterResults && roundStatus !== 'completed';

  const formatColorBadge = (history: string[]) => {
    if (!history || history.length === 0) return null;
    return (
      <div className="flex items-center gap-0.5">
        {history.map((c, idx) => (
          <span
            key={idx}
            className={`w-3.5 h-3.5 rounded text-[9px] font-mono font-bold flex items-center justify-center border ${
              c === 'W'
                ? 'bg-slate-100 text-slate-900 border-slate-300'
                : c === 'B'
                ? 'bg-slate-900 text-slate-100 border-slate-700'
                : 'bg-amber-950 text-amber-300 border-amber-700'
            }`}
            title={`Round ${idx + 1}: ${c === 'W' ? 'White' : c === 'B' ? 'Black' : 'Bye'}`}
          >
            {c}
          </span>
        ))}
      </div>
    );
  };

  if (pairing.isBye) {
    return (
      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30">
            {pairing.boardNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {pairing.whitePlayer?.title !== 'None' ? `${pairing.whitePlayer?.title} ` : ''}
                {pairing.whitePlayer?.surname || pairing.whitePlayer?.name || (pairing.whitePlayerId ? `Player ${pairing.whitePlayerId}` : 'Assigned Player')}
              </span>
              <span className="font-mono text-xs text-amber-300">
                (Elo: {pairing.whitePlayer?.rating})
              </span>
              <Badge variant="amber" size="sm">
                1.0 FULL-POINT BYE
              </Badge>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Current Score: <strong className="text-white">{whiteScore.toFixed(1)}</strong></span>
              <span>• Odd field automatic allocation</span>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800/40">
          Result: 1.0 (Bye)
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm">
      {/* Board Number & Warning Flags */}
      <div className="flex items-center justify-between lg:justify-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
          {pairing.boardNumber}
        </div>

        {pairing.isManualOverride && (
          <span
            className="text-[11px] px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-700/60 text-purple-300 flex items-center gap-1"
            title={pairing.manualReason || 'Arbiter adjustment'}
          >
            <Shuffle size={12} /> Adjusted
          </span>
        )}
      </div>

      {/* Players Row */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        {/* White Player */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              ♔
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                {pairing.whitePlayer?.title !== 'None' && (
                  <span className="text-amber-400 font-mono text-[11px]">
                    {pairing.whitePlayer?.title}
                  </span>
                )}
                <span className="truncate">{pairing.whitePlayer?.surname || pairing.whitePlayer?.name || (pairing.whitePlayerId ? `Player ${pairing.whitePlayerId}` : 'No Player')}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span>Elo: <strong className="text-amber-300">{pairing.whitePlayer?.rating}</strong></span>
                <span>Pts: <strong className="text-slate-200">{whiteScore.toFixed(1)}</strong></span>
              </div>
            </div>
          </div>
          <div className="shrink-0">{formatColorBadge(whiteColorHistory)}</div>
        </div>

        {/* Black Player */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              ♚
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                {pairing.blackPlayer?.title !== 'None' && (
                  <span className="text-amber-400 font-mono text-[11px]">
                    {pairing.blackPlayer?.title}
                  </span>
                )}
                <span className="truncate">{pairing.blackPlayer?.surname || pairing.blackPlayer?.name || (pairing.blackPlayerId ? `Player ${pairing.blackPlayerId}` : 'No Player')}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span>Elo: <strong className="text-amber-300">{pairing.blackPlayer?.rating}</strong></span>
                <span>Pts: <strong className="text-slate-200">{blackScore.toFixed(1)}</strong></span>
              </div>
            </div>
          </div>
          <div className="shrink-0">{formatColorBadge(blackColorHistory)}</div>
        </div>
      </div>

      {/* Result Entry & Status Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
        {/* Fast Action Buttons if allowed */}
        {canEnter ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateResult(pairing.id, '1-0')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                pairing.result === '1-0'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
              }`}
              title="White Wins (1 - 0)"
            >
              1 - 0
            </button>
            <button
              onClick={() => onUpdateResult(pairing.id, '0.5-0.5')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                pairing.result === '0.5-0.5'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
              }`}
              title="Draw (½ - ½)"
            >
              ½ - ½
            </button>
            <button
              onClick={() => onUpdateResult(pairing.id, '0-1')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                pairing.result === '0-1'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
              }`}
              title="Black Wins (0 - 1)"
            >
              0 - 1
            </button>

            {/* Special / Forfeit button */}
            <button
              onClick={() => onOpenForfeitModal(pairing)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Forfeits, Byes & Special Results"
            >
              <MoreHorizontal size={14} />
            </button>

            {pairing.result !== 'UNPLAYED' && (
              <button
                onClick={() => onUpdateResult(pairing.id, 'UNPLAYED')}
                className="text-[10px] text-slate-500 hover:text-rose-400 px-1 py-0.5 rounded cursor-pointer"
                title="Clear Result"
              >
                Clear
              </button>
            )}
          </div>
        ) : (
          <div className="font-mono text-sm font-bold text-amber-400 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800">
            {pairing.result === 'UNPLAYED' ? 'Scheduled' : pairing.result}
          </div>
        )}
      </div>
    </div>
  );
};
