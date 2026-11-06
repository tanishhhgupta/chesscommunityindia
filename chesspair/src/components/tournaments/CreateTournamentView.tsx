import React, { useState } from 'react';
import { Tournament, TournamentFormat, TimeControlCategory, Player } from '../../types';
import { useOrg } from '../../context/OrgContext';
import { Wand2, UploadCloud, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { ImportFileModal } from './ImportFileModal';
import { Footer } from '../layout/Footer';

interface CreateTournamentViewProps {
  availablePlayers: Player[];
  onCreate: (
    tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>,
    selectedPlayerIds: string[]
  ) => void;
  onCancel: () => void;
}

export const CreateTournamentView: React.FC<CreateTournamentViewProps> = ({
  availablePlayers,
  onCreate,
  onCancel,
}) => {
  const { activeOrg } = useOrg();

  // Wizard Step: 1 = General, 2 = Technical
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('Jabalpur');
  const [federation, setFederation] = useState('India');
  const [startDate, setStartDate] = useState('2026-10-03');
  const [endDate, setEndDate] = useState('2026-10-03');

  // Step 2 Fields
  const [chiefArbiter, setChiefArbiter] = useState('Tanay Trait');
  const [timeControl, setTimeControl] = useState<TimeControlCategory>('rapid');
  const [timeMinutes, setTimeMinutes] = useState<number>(15);
  const [timeUnit, setTimeUnit] = useState('min');
  const [incrementSeconds, setIncrementSeconds] = useState<string>('');
  const [incrementUnit, setIncrementUnit] = useState('sec');
  const [pairingFormat, setPairingFormat] = useState<TournamentFormat>('basic_swiss');
  const [roundsCount, setRoundsCount] = useState<number>(9);

  // Toggles
  const [showOnCalendar, setShowOnCalendar] = useState(true);
  const [allowPlayerSignup, setAllowPlayerSignup] = useState(true);
  const [isFideRated, setIsFideRated] = useState(true);
  const [isLocalRated, setIsLocalRated] = useState(false);

  // Import Modal
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
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div>
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#442D1C] tracking-tight">
            New Tournament
          </h1>
          {step === 2 && (
            <p className="text-sm font-semibold text-slate-600 mt-1">{name}</p>
          )}
        </div>

        {/* STEP 1: Basic Settings */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Form */}
            <form onSubmit={handleContinue} className="md:col-span-7 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ganpati meets Chess"
                  className={`w-full px-3 py-2 text-sm bg-white rounded-md border focus:outline-none transition-colors ${
                    !name
                      ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-1 focus:ring-rose-300'
                      : 'border-slate-300 focus:border-[#84592B]'
                  }`}
                />
              </div>

              {/* City & Federation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Jabalpur"
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Federation
                  </label>
                  <select
                    value={federation}
                    onChange={(e) => setFederation(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B] cursor-pointer"
                  >
                    <option value="India">🇮🇳 India</option>
                    <option value="USA">🇺🇸 USA</option>
                    <option value="Germany">🇩🇪 Germany</option>
                    <option value="France">🇫🇷 France</option>
                    <option value="Spain">🇪🇸 Spain</option>
                    <option value="England">🇬🇧 England</option>
                    <option value="Poland">🇵🇱 Poland</option>
                    <option value="FIDE">🏁 FIDE</option>
                  </select>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="bg-[#84592B] hover:bg-[#6c4822] disabled:opacity-50 text-white font-bold text-sm px-6 py-2 rounded-md shadow-sm transition-colors cursor-pointer"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-[#e4e6eb] hover:bg-[#d8dbe0] text-slate-700 font-medium text-sm px-5 py-2 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Right Column: Import from File Button */}
            <div className="md:col-span-5 flex flex-col justify-center pt-6 md:pt-14">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="w-full sm:w-auto bg-[#442D1C] hover:bg-[#583a24] active:scale-[0.99] text-white font-bold text-sm py-3 px-6 rounded-md shadow flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <UploadCloud size={20} className="text-[#E8D1A7]" />
                <span>Import From File</span>
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center sm:text-left">
                Directly upload a Swiss-Manager TRF, CSV, or PGN tournament file.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Technical Configuration */}
        {step === 2 && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column Form */}
            <div className="md:col-span-7 space-y-4">
              {/* Chief Arbiter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chief Arbiter
                </label>
                <input
                  type="text"
                  value={chiefArbiter}
                  onChange={(e) => setChiefArbiter(e.target.value)}
                  placeholder="Arbiter name"
                  className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                />
              </div>

              {/* Time Control Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Time Control
                </label>
                <select
                  value={timeControl}
                  onChange={(e) => {
                    const val = e.target.value as TimeControlCategory;
                    setTimeControl(val);
                    if (val === 'blitz') {
                      setTimeMinutes(3);
                      setIncrementSeconds('2');
                    } else if (val === 'rapid') {
                      setTimeMinutes(15);
                      setIncrementSeconds('10');
                    } else if (val === 'classical') {
                      setTimeMinutes(90);
                      setIncrementSeconds('30');
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B] cursor-pointer"
                >
                  <option value="rapid">Rapid</option>
                  <option value="blitz">Blitz</option>
                  <option value="classical">Classical</option>
                  <option value="bullet">Bullet</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Time & Time per Move */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(Number(e.target.value) || 1)}
                      className="flex-1 px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                    />
                    <select
                      value={timeUnit}
                      onChange={(e) => setTimeUnit(e.target.value)}
                      className="w-20 px-2 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B] cursor-pointer"
                    >
                      <option value="min">min</option>
                      <option value="sec">sec</option>
                      <option value="hours">hours</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time per Move
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={incrementSeconds}
                      onChange={(e) => setIncrementSeconds(e.target.value)}
                      placeholder="0"
                      className="flex-1 px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                    />
                    <select
                      value={incrementUnit}
                      onChange={(e) => setIncrementUnit(e.target.value)}
                      className="w-20 px-2 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B] cursor-pointer"
                    >
                      <option value="sec">sec</option>
                      <option value="min">min</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pairing & Rounds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pairing
                  </label>
                  <select
                    value={pairingFormat}
                    onChange={(e) => setPairingFormat(e.target.value as TournamentFormat)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B] cursor-pointer"
                  >
                    <option value="basic_swiss">Swiss System</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="knockout">Knockout</option>
                    <option value="team">Team System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rounds
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={roundsCount}
                    onChange={(e) => setRoundsCount(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-[#84592B]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="bg-[#442D1C] hover:bg-[#583a24] text-white font-bold text-sm px-6 py-2 rounded-md shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Wand2 size={15} className="text-[#E8D1A7]" />
                  <span>Create</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-[#e4e6eb] hover:bg-[#d8dbe0] text-slate-700 font-medium text-sm px-5 py-2 rounded-md transition-colors cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>

            {/* Right Column: Toggle Switches */}
            <div className="md:col-span-5 space-y-4 pt-2">
              {/* Toggle 1: Show on Calendar */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setShowOnCalendar(!showOnCalendar)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer ${
                    showOnCalendar ? 'bg-[#84592B]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                      showOnCalendar ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-800">
                  Show this Tournament on ChessManager&apos;s Calendar
                </span>
              </label>

              {/* Toggle 2: Allow sign up */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setAllowPlayerSignup(!allowPlayerSignup)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer ${
                    allowPlayerSignup ? 'bg-[#84592B]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                      allowPlayerSignup ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-800">
                  Allow players to sign up
                </span>
              </label>

              {/* Toggle 3: FIDE Rated */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setIsFideRated(!isFideRated)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer ${
                    isFideRated ? 'bg-[#84592B]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                      isFideRated ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-800">
                  FIDE Rated Tournament
                </span>
              </label>

              {/* Toggle 4: Local Rated */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setIsLocalRated(!isLocalRated)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer ${
                    isLocalRated ? 'bg-[#84592B]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                      isLocalRated ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-800">
                  Local Rated Tournament
                </span>
              </label>
            </div>
          </form>
        )}
      </div>

      {/* Centered Footer */}
      <Footer />

      {/* File Import Modal */}
      <ImportFileModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
