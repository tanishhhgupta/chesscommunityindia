import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Tournament, TournamentFormat, TimeControlCategory, Player } from '../../types';
import { useOrg } from '../../context/OrgContext';
import { Wand2, UploadCloud } from 'lucide-react';
import { ImportFileModal } from './ImportFileModal';
import { db } from '../../lib/storage';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePlayers: Player[];
  onCreate: (
    tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>,
    selectedPlayerIds: string[]
  ) => void;
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  availablePlayers,
  onCreate,
}) => {
  const { activeOrg } = useOrg();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Jabalpur');
  const [federation, setFederation] = useState('India');
  const [startDate, setStartDate] = useState('2026-10-03');
  const [endDate, setEndDate] = useState('2026-10-03');

  const [chiefArbiter, setChiefArbiter] = useState('Tanay Trait');
  const [timeControl, setTimeControl] = useState<TimeControlCategory>('rapid');
  const [timeMinutes, setTimeMinutes] = useState<number>(15);
  const [timeUnit, setTimeUnit] = useState('min');
  const [incrementSeconds, setIncrementSeconds] = useState<string>('');
  const [incrementUnit, setIncrementUnit] = useState('sec');
  const [pairingFormat, setPairingFormat] = useState<TournamentFormat>('basic_swiss');
  const [roundsCount, setRoundsCount] = useState<number>(9);

  const [showOnCalendar, setShowOnCalendar] = useState(true);
  const [allowPlayerSignup, setAllowPlayerSignup] = useState(true);
  const [isFideRated, setIsFideRated] = useState(true);
  const [isLocalRated, setIsLocalRated] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const timeControlStr = incrementSeconds
      ? `${timeMinutes}${timeUnit} + ${incrementSeconds}${incrementUnit}`
      : `${timeMinutes} ${timeUnit}`;

    const selectedPlayerIds = availablePlayers.slice(0, 16).map((p) => p.id);

    onCreate(
      {
        organizationId: activeOrg.id,
        name: name.trim(),
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || `tournament-${Date.now()}`,
        description: `${timeControlStr} ${pairingFormat} chess tournament held in ${city}, ${federation}.`,
        format: pairingFormat,
        engineVersion: 'basic-swiss-v1',
        timeControlCategory: timeControl,
        timeControlString: timeControlStr,
        roundsCount: Number(roundsCount) || 5,
        currentRound: 1,
        status: 'in_progress',
        pointsWin: 1.0,
        pointsDraw: 0.5,
        pointsLoss: 0.0,
        tiebreakRules: ['buchholz_cut1', 'buchholz_median', 'sonneborn_berger', 'direct_encounter', 'wins'],
        isPublic: true,
        city: city.trim(),
        federation: federation.trim(),
        venue: `${city}, ${federation}`,
        chiefArbiter: chiefArbiter.trim(),
        startDate,
        endDate,
        showOnCalendar,
        allowPlayerSignup,
        isFideRated,
        isLocalRated,
        timeMinutes,
        timeUnit,
        incrementSeconds: incrementSeconds ? Number(incrementSeconds) : 0,
        incrementUnit,
      },
      selectedPlayerIds
    );

    // Reset
    setStep(1);
    setName('');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={step === 1 ? 'New Tournament' : `New Tournament - ${name}`}
        subtitle={step === 1 ? 'Step 1: General Information' : 'Step 2: Technical Configuration'}
        maxWidth="2xl"
      >
        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleContinue} className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ganpati meets Chess"
                  className={`w-full px-3 py-2 text-sm bg-white rounded-md border focus:outline-none transition-colors ${
                    !name
                      ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400'
                      : 'border-slate-300 focus:border-[#84592B]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Federation</label>
                  <select
                    value={federation}
                    onChange={(e) => setFederation(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                  >
                    <option value="India">🇮🇳 India</option>
                    <option value="USA">🇺🇸 USA</option>
                    <option value="Germany">🇩🇪 Germany</option>
                    <option value="France">🇫🇷 France</option>
                    <option value="England">🇬🇧 England</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="bg-[#84592B] hover:bg-[#6c4822] disabled:opacity-50 text-white font-bold text-sm px-6 py-2 rounded-md shadow-sm transition-colors cursor-pointer"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#e4e6eb] hover:bg-[#d8dbe0] text-slate-700 font-medium text-sm px-5 py-2 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="md:col-span-5 flex flex-col justify-center pt-4 md:pt-10">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="w-full bg-[#442D1C] hover:bg-[#583a24] text-white font-bold text-sm py-3 px-4 rounded-md shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud size={18} className="text-[#E8D1A7]" />
                <span>Import From File</span>
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Upload Swiss-Manager TRF, CSV, or PGN
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Arbiter</label>
                <input
                  type="text"
                  value={chiefArbiter}
                  onChange={(e) => setChiefArbiter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time Control</label>
                <select
                  value={timeControl}
                  onChange={(e) => setTimeControl(e.target.value as TimeControlCategory)}
                  className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none"
                >
                  <option value="rapid">Rapid</option>
                  <option value="blitz">Blitz</option>
                  <option value="classical">Classical</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(Number(e.target.value) || 1)}
                      className="flex-1 px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none"
                    />
                    <select
                      value={timeUnit}
                      onChange={(e) => setTimeUnit(e.target.value)}
                      className="w-16 px-1 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none"
                    >
                      <option value="min">min</option>
                      <option value="sec">sec</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time per Move</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={incrementSeconds}
                      onChange={(e) => setIncrementSeconds(e.target.value)}
                      placeholder="0"
                      className="flex-1 px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none"
                    />
                    <select
                      value={incrementUnit}
                      onChange={(e) => setIncrementUnit(e.target.value)}
                      className="w-16 px-1 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none"
                    >
                      <option value="sec">sec</option>
                      <option value="min">min</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pairing</label>
                  <select
                    value={pairingFormat}
                    onChange={(e) => setPairingFormat(e.target.value as TournamentFormat)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none"
                  >
                    <option value="basic_swiss">Swiss System</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="knockout">Knockout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rounds</label>
                  <input
                    type="number"
                    min="1"
                    value={roundsCount}
                    onChange={(e) => setRoundsCount(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-[#442D1C] hover:bg-[#583a24] text-white font-bold text-sm px-6 py-2 rounded-md shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Wand2 size={14} className="text-[#E8D1A7]" />
                  <span>Create</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-[#e4e6eb] hover:bg-[#d8dbe0] text-slate-700 font-medium text-sm px-5 py-2 rounded-md cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="md:col-span-5 space-y-3 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOnCalendar}
                  onChange={(e) => setShowOnCalendar(e.target.checked)}
                  className="w-4 h-4 text-[#84592B] rounded accent-[#84592B]"
                />
                <span className="text-xs font-medium text-slate-800">
                  Show on ChessManager&apos;s Calendar
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowPlayerSignup}
                  onChange={(e) => setAllowPlayerSignup(e.target.checked)}
                  className="w-4 h-4 text-[#84592B] rounded accent-[#84592B]"
                />
                <span className="text-xs font-medium text-slate-800">
                  Allow players to sign up
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFideRated}
                  onChange={(e) => setIsFideRated(e.target.checked)}
                  className="w-4 h-4 text-[#84592B] rounded accent-[#84592B]"
                />
                <span className="text-xs font-medium text-slate-800">
                  FIDE Rated Tournament
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isLocalRated}
                  onChange={(e) => setIsLocalRated(e.target.checked)}
                  className="w-4 h-4 text-[#84592B] rounded accent-[#84592B]"
                />
                <span className="text-xs font-medium text-slate-800">
                  Local Rated Tournament
                </span>
              </label>
            </div>
          </form>
        )}
      </Modal>

      <ImportFileModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportPlayers={(importedPlayers) => {
          const createdPlayers = db.importPlayers(activeOrg.id, importedPlayers);
          const playerIds = createdPlayers.map((p) => p.id);
          onCreate(
            {
              organizationId: activeOrg.id,
              name: name || 'Imported Swiss Tournament',
              slug: (name || 'imported-swiss-tournament')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '') || `tournament-${Date.now()}`,
              description: `Imported Swiss chess tournament held in ${city}, ${federation}.`,
              city: city || 'Jabalpur',
              federation: federation || 'IND',
              venue: `${city || 'Jabalpur'}, ${federation || 'IND'}`,
              startDate,
              endDate,
              format: pairingFormat,
              engineVersion: 'basic-swiss-v1',
              roundsCount: Number(roundsCount) || 5,
              currentRound: 1,
              status: 'in_progress',
              chiefArbiter: chiefArbiter.trim() || 'Chief Arbiter',
              timeControlCategory: timeControl,
              timeControlString: '15m + 10s',
              pointsWin: 1.0,
              pointsDraw: 0.5,
              pointsLoss: 0.0,
              tiebreakRules: ['buchholz_cut1', 'buchholz_median', 'sonneborn_berger', 'direct_encounter', 'wins'],
              isPublic: true,
              isFideRated,
              isLocalRated,
              allowPlayerSignup: true,
              showOnCalendar: true,
              timeMinutes: 15,
              timeUnit: 'm',
              incrementSeconds: 10,
              incrementUnit: 's',
            },
            playerIds
          );
          setIsImportModalOpen(false);
          onClose();
        }}
      />
    </>
  );
};
