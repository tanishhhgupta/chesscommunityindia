import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { EngineStanding } from '../../types';
import { Calculator, Award, Shield } from 'lucide-react';

interface TiebreakBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  standing: EngineStanding | null;
}

export const TiebreakBreakdownModal: React.FC<TiebreakBreakdownModalProps> = ({
  isOpen,
  onClose,
  standing,
}) => {
  if (!standing) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${standing.playerName} - Tiebreak Audit & Math Breakdown`}
      subtitle={`Rank #${standing.rank} • Total Points: ${standing.score.toFixed(1)}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Metric summary boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Buchholz Cut-1</div>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {standing.buchholzCut1.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-500">Excludes lowest opp</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Buchholz Total</div>
            <div className="text-lg font-bold text-white font-mono">
              {standing.buchholzTotal.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-500">Sum of all opponents</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Sonneborn-Berger</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {standing.sonnebornBerger.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500">Wins + 0.5 * Draws</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Direct Encounter</div>
            <div className="text-lg font-bold text-blue-400 font-mono">
              {standing.directEncounter.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-500">Head-to-head points</div>
          </div>
        </div>

        {/* Round by Round Opponent Breakdown Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-2.5">Rnd</th>
                <th className="p-2.5">Brd</th>
                <th className="p-2.5">Color</th>
                <th className="p-2.5">Opponent</th>
                <th className="p-2.5">Elo</th>
                <th className="p-2.5">Result</th>
                <th className="p-2.5">Score</th>
                <th className="p-2.5 text-right">SB Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {standing.roundDetails.map((rd) => {
                let sbVal = 0;
                if (rd.pointsEarned === 1.0) sbVal = 1.0;
                else if (rd.pointsEarned === 0.5) sbVal = 0.5;

                return (
                  <tr key={rd.roundNumber} className="hover:bg-slate-800/40 text-slate-200">
                    <td className="p-2.5 font-mono text-slate-400">R{rd.roundNumber}</td>
                    <td className="p-2.5 font-mono text-slate-400">{rd.boardNumber}</td>
                    <td className="p-2.5 font-mono">
                      {rd.color === 'W' ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-bold text-[10px]">
                          W
                        </span>
                      ) : rd.color === 'B' ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-100 font-bold text-[10px] border border-slate-700">
                          B
                        </span>
                      ) : (
                        <span className="text-amber-400">BYE</span>
                      )}
                    </td>
                    <td className="p-2.5 font-semibold text-white">{rd.opponentName}</td>
                    <td className="p-2.5 font-mono text-slate-400">
                      {rd.opponentRating || '-'}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-amber-300">{rd.result}</td>
                    <td className="p-2.5 font-mono font-bold text-white">
                      +{rd.pointsEarned.toFixed(1)}
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-400">
                      {sbVal > 0 ? `${sbVal} × Opp Pts` : '0.00'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">Tiebreak Calculation Explanations:</div>
          <div>
            • <strong>Buchholz Cut-1 (BH-1)</strong> sums all opponent tournament scores except the lowest, protecting players against early underperforming opponents.
          </div>
          <div>
            • <strong>Sonneborn-Berger (SB)</strong> awards 100% of the defeated opponent&apos;s score and 50% of the drawn opponent&apos;s score.
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Close Breakdown
          </Button>
        </div>
      </div>
    </Modal>
  );
};
