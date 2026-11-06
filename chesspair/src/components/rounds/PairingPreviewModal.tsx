import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EnginePairing, EngineValidationResult, Player } from '../../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Send,
  Save,
  ShieldAlert,
} from 'lucide-react';

interface PairingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundNumber: number;
  pairings: EnginePairing[];
  playerMap: Map<string, Player>;
  validation: EngineValidationResult;
  onPublish: () => void;
  onSaveDraft: () => void;
}

export const PairingPreviewModal: React.FC<PairingPreviewModalProps> = ({
  isOpen,
  onClose,
  roundNumber,
  pairings,
  playerMap,
  validation,
  onPublish,
  onSaveDraft,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Round ${roundNumber} Pairing Preview & Validation`}
      subtitle="Review engine pairing suggestions, score groups, and constraint validation before publishing"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Validation Status Summary Bar */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            validation.isValid
              ? validation.hasWarnings
                ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-600/40 text-rose-200'
          }`}
        >
          {validation.isValid ? (
            validation.hasWarnings ? (
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            )
          ) : (
            <XCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
          )}

          <div className="text-xs space-y-1">
            <div className="font-bold text-white text-sm">
              {validation.isValid
                ? validation.hasWarnings
                  ? 'Pairings Valid with Minor Warnings'
                  : 'Pairings Fully Validated & Compliant'
                : 'Pairings Invalidation Detected'}
            </div>
            <p className="text-slate-300">
              {validation.isValid
                ? 'Score group brackets, color alternation, and rematch prevention checks passed.'
                : 'One or more pairing constraints are violated. Please review issues below before publishing.'}
            </p>

            {validation.issues.length > 0 && (
              <div className="pt-1.5 space-y-1">
                {validation.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`text-[11px] font-mono flex items-center gap-1.5 ${
                      issue.severity === 'error'
                        ? 'text-rose-400'
                        : issue.severity === 'warning'
                        ? 'text-amber-300'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>•</span>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pairing Boards Grid */}
        <div className="border border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-3 w-16">Board</th>
                <th className="p-3">White Player</th>
                <th className="p-3 text-center w-16">VS</th>
                <th className="p-3">Black Player</th>
                <th className="p-3 text-right">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {pairings.map((p) => {
                const white = p.whitePlayerId ? playerMap.get(p.whitePlayerId) : undefined;
                const black = p.blackPlayerId ? playerMap.get(p.blackPlayerId) : undefined;

                if (p.isBye) {
                  return (
                    <tr key={p.boardNumber} className="bg-amber-950/20 text-slate-200">
                      <td className="p-3 font-mono text-amber-400 font-bold">
                        Brd {p.boardNumber}
                      </td>
                      <td className="p-3" colSpan={3}>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {white?.surname || white?.name || (p.whitePlayerId ? `Player ${p.whitePlayerId}` : 'Assigned Player')}
                          </span>
                          <span className="font-mono text-xs text-slate-400">
                            (Rating: {white?.rating || '-'})
                          </span>
                          <Badge variant="amber" size="sm">
                            1.0 FULL-POINT BYE
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-[11px] text-slate-400">
                        Odd Field Allocation
                      </td>
                    </tr>
                  );
                }

                const whiteName = white?.surname || white?.name;
                const blackName = black?.surname || black?.name;

                return (
                  <tr key={p.boardNumber} className="hover:bg-slate-800/40 text-slate-200">
                    <td className="p-3 font-mono text-slate-400 font-bold">
                      {p.boardNumber}
                    </td>

                    {/* White Player */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded bg-slate-100 text-slate-900 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                          W
                        </span>
                        <div>
                          <div className="font-semibold text-white">
                            {white?.title && white.title !== 'None' && !whiteName?.startsWith(white.title) ? `${white.title} ` : ''}
                            {whiteName || (p.whitePlayerId ? `Player ${p.whitePlayerId}` : 'TBD')}
                          </div>
                          <div className="text-[11px] font-mono text-amber-300/80">
                            Rating: {white?.rating || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* VS */}
                    <td className="p-3 text-center font-bold text-slate-500 font-mono">
                      vs
                    </td>

                    {/* Black Player */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                          B
                        </span>
                        <div>
                          <div className="font-semibold text-white">
                            {black?.title && black.title !== 'None' && !blackName?.startsWith(black.title) ? `${black.title} ` : ''}
                            {blackName || (p.blackPlayerId ? `Player ${p.blackPlayerId}` : 'TBD')}
                          </div>
                          <div className="text-[11px] font-mono text-amber-300/80">
                            Rating: {black?.rating || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-right text-slate-500 text-[11px] font-mono">
                      {p.notes || 'Engine Paired'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Publishing will make pairings immediately visible to players on the spectator portal.
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={onSaveDraft}
              icon={<Save size={15} />}
            >
              Save as Draft
            </Button>
            <Button
              variant="amber"
              disabled={validation.hasErrors}
              onClick={onPublish}
              icon={<Send size={15} />}
            >
              Publish Pairings
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
