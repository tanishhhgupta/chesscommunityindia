import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { GameResult, Pairing, Player } from '../../types';

interface ForfeitModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairing: (Pairing & { whitePlayer?: Player; blackPlayer?: Player }) | null;
  onSaveResult: (pairingId: string, result: GameResult, reason?: string) => void;
}

export const ForfeitModal: React.FC<ForfeitModalProps> = ({
  isOpen,
  onClose,
  pairing,
  onSaveResult,
}) => {
  const [selectedResult, setSelectedResult] = useState<GameResult>('1F-0');
  const [reason, setReason] = useState('');

  if (!pairing) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveResult(pairing.id, selectedResult, reason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Special Result / Forfeit - Board ${pairing.boardNumber}`}
      subtitle={`${pairing.whitePlayer?.surname || pairing.whitePlayer?.name || (pairing.whitePlayerId ? `Player ${pairing.whitePlayerId}` : 'White')} (White) vs ${pairing.isBye ? '[BYE]' : (pairing.blackPlayer?.surname || pairing.blackPlayer?.name || (pairing.blackPlayerId ? `Player ${pairing.blackPlayerId}` : 'Black'))} (Black)`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Result Type
          </label>

          <div className="space-y-2">
            {[
              { val: '1F-0', label: '1F - 0 : White wins by forfeit (Black no-show)', pts: 'White 1.0, Black 0.0' },
              { val: '0-1F', label: '0 - 1F : Black wins by forfeit (White no-show)', pts: 'White 0.0, Black 1.0' },
              { val: '0F-0F', label: '0F - 0F : Double forfeit (Both players absent)', pts: 'White 0.0, Black 0.0' },
              { val: '0-0', label: '0 - 0 : Double loss (0.0 pts each)', pts: 'White 0.0, Black 0.0' },
              { val: '1-0_BYE', label: '1 Bye : Full-point bye (Unpaired/Assigned)', pts: '1.0 pt allocated' },
              { val: '0.5-BYE', label: '½ Bye : Half-point bye agreement', pts: '0.5 pts allocated' },
              { val: '0-BYE', label: '0 Bye : Zero-point bye (Withdrawal/Skip)', pts: '0.0 pts allocated' },
            ].map((opt) => (
              <label
                key={opt.val}
                className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer text-xs transition-colors ${
                  selectedResult === opt.val
                    ? 'bg-[#f0e8dc] border-[#84592B] text-[#442D1C] font-medium ring-1 ring-[#84592B]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="forfeit-result"
                    checked={selectedResult === opt.val}
                    onChange={() => setSelectedResult(opt.val as GameResult)}
                    className="text-[#84592B] accent-[#84592B] focus:ring-[#84592B]"
                  />
                  <span className="font-semibold">{opt.label}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{opt.pts}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Arbiter Note (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Player did not arrive before 30-minute default time."
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#84592B]/20 focus:border-[#84592B]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Apply Result
          </Button>
        </div>
      </form>
    </Modal>
  );
};
