import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Pairing, Player } from '../../types';
import { Shuffle, AlertCircle } from 'lucide-react';

interface ManualSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairings: (Pairing & { whitePlayer?: Player; blackPlayer?: Player })[];
  initialBoard1Id?: string;
  initialBoard2Id?: string;
  onSwap: (pairing1Id: string, pairing2Id: string, swapWhite: boolean, reason: string) => void;
}

export const ManualSwapModal: React.FC<ManualSwapModalProps> = ({
  isOpen,
  onClose,
  pairings,
  initialBoard1Id,
  initialBoard2Id,
  onSwap,
}) => {
  const regularPairings = pairings.filter((p) => !p.isBye);

  const [board1Id, setBoard1Id] = useState<string>(initialBoard1Id || regularPairings[0]?.id || '');
  const [board2Id, setBoard2Id] = useState<string>(initialBoard2Id || regularPairings[1]?.id || '');
  const [swapPiece, setSwapPiece] = useState<'white' | 'black'>('white');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialBoard1Id) setBoard1Id(initialBoard1Id);
      if (initialBoard2Id) setBoard2Id(initialBoard2Id);
      else if (!board2Id && regularPairings.length > 1) {
        setBoard2Id(regularPairings[1].id);
      }
    }
  }, [isOpen, initialBoard1Id, initialBoard2Id]);

  const p1 = regularPairings.find((p) => p.id === board1Id);
  const p2 = regularPairings.find((p) => p.id === board2Id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!board1Id || !board2Id || board1Id === board2Id || !reason.trim()) return;

    onSwap(board1Id, board2Id, swapPiece === 'white', reason.trim());
    setReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arbiter Manual Pairing Adjustment"
      subtitle="Swap players between boards with documented audit justification"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Audit Policy:</strong> All manual pairings modifications are permanently recorded in the tournament audit trail with your timestamp and justification.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Board A
            </label>
            <select
              value={board1Id}
              onChange={(e) => setBoard1Id(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#84592B]"
            >
              {regularPairings.map((p) => {
                const wName = p.whitePlayer?.surname || p.whitePlayer?.name || (p.whitePlayerId ? `Player ${p.whitePlayerId}` : 'White');
                const bName = p.blackPlayer?.surname || p.blackPlayer?.name || (p.blackPlayerId ? `Player ${p.blackPlayerId}` : 'Black');
                return (
                  <option key={p.id} value={p.id}>
                    Board {p.boardNumber}: {wName} vs {bName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Board B
            </label>
            <select
              value={board2Id}
              onChange={(e) => setBoard2Id(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#84592B]"
            >
              {regularPairings.map((p) => {
                const wName = p.whitePlayer?.surname || p.whitePlayer?.name || (p.whitePlayerId ? `Player ${p.whitePlayerId}` : 'White');
                const bName = p.blackPlayer?.surname || p.blackPlayer?.name || (p.blackPlayerId ? `Player ${p.blackPlayerId}` : 'Black');
                return (
                  <option key={p.id} value={p.id}>
                    Board {p.boardNumber}: {wName} vs {bName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Piece Color to Swap
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSwapPiece('white')}
              className={`p-2.5 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                swapPiece === 'white'
                  ? 'bg-[#442D1C] text-[#E8D1A7] border-[#442D1C]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-[#FAF7F2]'
              }`}
            >
              Swap White Players (♔)
            </button>
            <button
              type="button"
              onClick={() => setSwapPiece('black')}
              className={`p-2.5 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                swapPiece === 'black'
                  ? 'bg-[#442D1C] text-[#E8D1A7] border-[#442D1C]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-[#FAF7F2]'
              }`}
            >
              Swap Black Players (♚)
            </button>
          </div>
        </div>

        {/* Preview of Swap */}
        {p1 && p2 && board1Id !== board2Id && (() => {
          const p1White = p1.whitePlayer?.surname || p1.whitePlayer?.name || (p1.whitePlayerId ? `Player ${p1.whitePlayerId}` : 'White');
          const p1Black = p1.blackPlayer?.surname || p1.blackPlayer?.name || (p1.blackPlayerId ? `Player ${p1.blackPlayerId}` : 'Black');
          const p2White = p2.whitePlayer?.surname || p2.whitePlayer?.name || (p2.whitePlayerId ? `Player ${p2.whitePlayerId}` : 'White');
          const p2Black = p2.blackPlayer?.surname || p2.blackPlayer?.name || (p2.blackPlayerId ? `Player ${p2.blackPlayerId}` : 'Black');

          const b1WhiteOutcome = swapPiece === 'white' ? p2White : p1White;
          const b1BlackOutcome = swapPiece === 'black' ? p2Black : p1Black;
          const b2WhiteOutcome = swapPiece === 'white' ? p1White : p2White;
          const b2BlackOutcome = swapPiece === 'black' ? p1Black : p2Black;

          return (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-700">Swap Outcome Preview:</div>
              <div className="text-slate-600 font-mono text-[11px]">
                • Board {p1.boardNumber} will become:{' '}
                <strong className="text-slate-900">{b1WhiteOutcome}</strong> vs{' '}
                <strong className="text-slate-900">{b1BlackOutcome}</strong>
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                • Board {p2.boardNumber} will become:{' '}
                <strong className="text-slate-900">{b2WhiteOutcome}</strong> vs{' '}
                <strong className="text-slate-900">{b2BlackOutcome}</strong>
              </div>
            </div>
          );
        })()}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Official Arbiter Justification *
          </label>
          <textarea
            required
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Player travel delay accommodation approved by Chief Arbiter."
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#84592B]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="amber"
            type="submit"
            disabled={board1Id === board2Id || !reason.trim()}
            icon={<Shuffle size={15} />}
          >
            Confirm Swap & Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
