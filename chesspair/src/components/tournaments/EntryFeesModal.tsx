import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Player, TournamentPlayer } from '../../types';
import { Check, CreditCard, DollarSign, Search, CheckCircle2, XCircle } from 'lucide-react';

interface EntryFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentPlayers: (TournamentPlayer & { player: Player })[];
  onTogglePaid: (playerId: string, paid: boolean) => void;
}

export const EntryFeesModal: React.FC<EntryFeesModalProps> = ({
  isOpen,
  onClose,
  tournamentPlayers,
  onTogglePaid,
}) => {
  const [feeAmount, setFeeAmount] = useState<number>(500);
  const [currency, setCurrency] = useState('₹');
  const [search, setSearch] = useState('');
  const [paidStatus, setPaidStatus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    tournamentPlayers.forEach((tp) => {
      initial[tp.playerId] = tp.player.entryFeePaid ?? true;
    });
    return initial;
  });

  const handleToggle = (playerId: string) => {
    const nextVal = !paidStatus[playerId];
    setPaidStatus((prev) => ({ ...prev, [playerId]: nextVal }));
    onTogglePaid(playerId, nextVal);
  };

  const handleMarkAll = (val: boolean) => {
    const updated: Record<string, boolean> = {};
    tournamentPlayers.forEach((tp) => {
      updated[tp.playerId] = val;
      onTogglePaid(tp.playerId, val);
    });
    setPaidStatus(updated);
  };

  const filtered = tournamentPlayers.filter((tp) =>
    tp.player.name.toLowerCase().includes(search.toLowerCase())
  );

  const paidCount = tournamentPlayers.filter((tp) => paidStatus[tp.playerId]).length;
  const totalCollected = paidCount * feeAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Entry Fees Management"
      subtitle="Track registration payments and fee collection for participants."
      maxWidth="xl"
    >
      <div className="space-y-4 text-slate-800">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Entry Fee Per Player</span>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-8 px-1.5 py-1 text-center bg-white border border-slate-300 rounded font-bold text-xs"
              />
              <input
                type="number"
                value={feeAmount}
                onChange={(e) => setFeeAmount(Number(e.target.value) || 0)}
                className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
              />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase">Paid / Total</span>
            <div className="text-lg font-black text-emerald-800 mt-1">
              {paidCount} / {tournamentPlayers.length}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-amber-700 uppercase">Total Collected</span>
            <div className="text-lg font-black text-amber-900 mt-1">
              {currency}{totalCollected.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Search & Bulk Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleMarkAll(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
            >
              Mark All Paid
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => handleMarkAll(false)}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Mark All Unpaid
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Player</th>
                <th className="py-2.5 px-3 font-semibold">Rating</th>
                <th className="py-2.5 px-3 font-semibold text-right">Fee</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tp) => {
                const isPaid = paidStatus[tp.playerId] ?? true;
                return (
                  <tr key={tp.playerId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {tp.player.surname || tp.player.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {tp.initialRating}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                      {currency}{feeAmount}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleToggle(tp.playerId)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {isPaid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {isPaid ? 'Paid' : 'Pending'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="navy" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
