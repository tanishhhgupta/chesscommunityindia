import React, { useState, useEffect } from 'react';
import { Player, ChessTitle } from '../../types';
import {
  User,
  Save,
  FilePlus,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';

interface AddPlayerCardProps {
  onSaveAndClose: (playerData: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => void;
  onAddNew: (playerData: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialPlayer?: Player | null;
  totalPlayersCount: number;
  currentIndex?: number;
  onNavigatePlayer?: (direction: 'prev' | 'next') => void;
  allAvailablePlayers?: Player[];
}

export const AddPlayerCard: React.FC<AddPlayerCardProps> = ({
  onSaveAndClose,
  onAddNew,
  onCancel,
  initialPlayer,
  totalPlayersCount,
  currentIndex = totalPlayersCount,
  onNavigatePlayer,
  allAvailablePlayers = [],
}) => {
  // Sub-tabs: 'Basic' | 'Payments' | 'Notes'
  const [activeTab, setActiveTab] = useState<'basic' | 'payments' | 'notes'>('basic');

  // Form Fields (Basic Tab)
  const [surnameName, setSurnameName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [club, setClub] = useState('');
  const [federation, setFederation] = useState('India');
  const [title, setTitle] = useState<ChessTitle>('None');
  const [email, setEmail] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [labels, setLabels] = useState('');

  // Ratings (FIDE)
  const [fideId, setFideId] = useState('');
  const [ratingClassic, setRatingClassic] = useState('');
  const [ratingRapid, setRatingRapid] = useState('');
  const [ratingBlitz, setRatingBlitz] = useState('');

  // Ratings (Local)
  const [localId, setLocalId] = useState('');
  const [ratingLocal, setRatingLocal] = useState('');
  const [ratingLocalRapid, setRatingLocalRapid] = useState('');
  const [ratingLocalBlitz, setRatingLocalBlitz] = useState('');

  // Payments Tab
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'exempt'>('paid');
  const [paymentAmount, setPaymentAmount] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Online');
  const [paymentDate, setPaymentDate] = useState('2026-10-03');

  // Notes Tab
  const [notes, setNotes] = useState('');

  // Autocomplete dropdown state
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    if (initialPlayer) {
      setSurnameName(initialPlayer.surname || initialPlayer.name);
      setBirthdate(initialPlayer.birthdate || '');
      setSex(initialPlayer.sex || '');
      setClub(initialPlayer.club || '');
      setFederation(initialPlayer.federation || 'India');
      setTitle(initialPlayer.title || 'None');
      setEmail(initialPlayer.email || '');
      setPhone(initialPlayer.phone || '');
      setPhoneCountryCode(initialPlayer.phoneCountryCode || '+91');
      setLabels(initialPlayer.labels || '');
      setFideId(initialPlayer.fideId || '');
      setRatingClassic(initialPlayer.ratingClassic ? String(initialPlayer.ratingClassic) : String(initialPlayer.rating || ''));
      setRatingRapid(initialPlayer.ratingRapid ? String(initialPlayer.ratingRapid) : '');
      setRatingBlitz(initialPlayer.ratingBlitz ? String(initialPlayer.ratingBlitz) : '');
      setLocalId(initialPlayer.localId || '');
      setRatingLocal(initialPlayer.ratingLocal ? String(initialPlayer.ratingLocal) : '');
      setRatingLocalRapid(initialPlayer.ratingLocalRapid ? String(initialPlayer.ratingLocalRapid) : '');
      setRatingLocalBlitz(initialPlayer.ratingLocalBlitz ? String(initialPlayer.ratingLocalBlitz) : '');
      setPaymentStatus(initialPlayer.entryFeePaid ? 'paid' : 'pending');
      setPaymentAmount(initialPlayer.paymentAmount ? String(initialPlayer.paymentAmount) : '500');
      setPaymentMethod(initialPlayer.paymentMethod || 'UPI / Online');
      setPaymentDate(initialPlayer.paymentDate || '2026-10-03');
      setNotes(initialPlayer.notes || '');
    } else {
      resetForm();
    }
  }, [initialPlayer]);

  const resetForm = () => {
    setSurnameName('');
    setBirthdate('');
    setSex('');
    setClub('');
    setFederation('India');
    setTitle('None');
    setEmail('');
    setPhoneCountryCode('+91');
    setPhone('');
    setLabels('');
    setFideId('');
    setRatingClassic('');
    setRatingRapid('');
    setRatingBlitz('');
    setLocalId('');
    setRatingLocal('');
    setRatingLocalRapid('');
    setRatingLocalBlitz('');
    setPaymentStatus('paid');
    setPaymentAmount('500');
    setPaymentMethod('UPI / Online');
    setPaymentDate('2026-10-03');
    setNotes('');
  };

  const handleSearchChange = (query: string) => {
    setSurnameName(query);
    if (query.trim().length > 1) {
      const q = query.toLowerCase();
      const matches = allAvailablePlayers.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.surname && p.surname.toLowerCase().includes(q)) ||
          (p.fideId && p.fideId.includes(q))
      );
      setSearchResults(matches);
      setShowSearchDropdown(matches.length > 0);
    } else {
      setShowSearchDropdown(false);
    }
  };

  const handleSelectSearchedPlayer = (p: Player) => {
    setSurnameName(p.surname || p.name);
    setBirthdate(p.birthdate || '');
    setSex(p.sex || '');
    setClub(p.club || '');
    setFederation(p.federation || 'India');
    setTitle(p.title || 'None');
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setFideId(p.fideId || '');
    setRatingClassic(String(p.rating || ''));
    setRatingRapid(p.ratingRapid ? String(p.ratingRapid) : String(p.rating || ''));
    setRatingBlitz(p.ratingBlitz ? String(p.ratingBlitz) : String(p.rating || ''));
    setShowSearchDropdown(false);
  };

  const buildPlayerData = (): Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'> => {
    const mainRating =
      parseInt(ratingClassic, 10) ||
      parseInt(ratingRapid, 10) ||
      parseInt(ratingBlitz, 10) ||
      parseInt(ratingLocal, 10) ||
      1200;

    return {
      name: surnameName.trim(),
      surname: surnameName.trim(),
      birthdate: birthdate.trim() || undefined,
      sex: sex || undefined,
      club: club.trim() || undefined,
      federation: federation.trim() || 'India',
      title: title || 'None',
      email: email.trim() || undefined,
      phoneCountryCode,
      phone: phone.trim() || undefined,
      labels: labels.trim() || undefined,
      fideId: fideId.trim() || undefined,
      rating: mainRating,
      ratingClassic: ratingClassic ? parseInt(ratingClassic, 10) : undefined,
      ratingRapid: ratingRapid ? parseInt(ratingRapid, 10) : undefined,
      ratingBlitz: ratingBlitz ? parseInt(ratingBlitz, 10) : undefined,
      localId: localId.trim() || undefined,
      ratingLocal: ratingLocal ? parseInt(ratingLocal, 10) : undefined,
      ratingLocalRapid: ratingLocalRapid ? parseInt(ratingLocalRapid, 10) : undefined,
      ratingLocalBlitz: ratingLocalBlitz ? parseInt(ratingLocalBlitz, 10) : undefined,
      entryFeePaid: paymentStatus === 'paid',
      paymentAmount: paymentAmount ? parseInt(paymentAmount, 10) : undefined,
      paymentMethod,
      paymentDate,
      notes: notes.trim() || undefined,
      isActive: true,
    };
  };

  const handleSaveAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surnameName.trim()) return;
    onSaveAndClose(buildPlayerData());
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surnameName.trim()) return;
    onAddNew(buildPlayerData());
    resetForm();
  };

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden select-none animate-in fade-in duration-150">
      {/* Top Header Row: Icon + Title + Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-3.5">
        {/* Left: Silhouette User Icon + "Add Player" */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#442D1C] text-[#E8D1A7] flex items-center justify-center">
            <User size={18} />
          </div>
          <h2 className="text-xl font-bold text-[#442D1C] tracking-tight">
            {initialPlayer ? 'Edit Player' : 'Add Player'}
          </h2>
        </div>

        {/* Right: Sub-Tabs [ Basic | Payments | Notes ] */}
        <div className="flex items-center border border-[#d8cca8] rounded text-xs font-semibold overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-3.5 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'basic'
                ? 'bg-[#f0e8dc] text-[#442D1C] font-bold border-r border-[#d8cca8]'
                : 'bg-white text-stone-600 hover:text-[#442D1C] border-r border-[#d8cca8]'
            }`}
          >
            Basic
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#f0e8dc] text-[#442D1C] font-bold border-r border-[#d8cca8]'
                : 'bg-white text-stone-600 hover:text-[#442D1C] border-r border-[#d8cca8]'
            }`}
          >
            Payments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3.5 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[#f0e8dc] text-[#442D1C] font-bold'
                : 'bg-white text-stone-600 hover:text-[#442D1C]'
            }`}
          >
            Notes
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      <form onSubmit={handleSaveAndClose} className="p-4 sm:p-6 space-y-4 text-xs">
        {/* TAB 1: BASIC INFORMATION (Exactly as Screenshot) */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {/* ROW 1: Surname, Name (with search 🔍 icon) | Birthdate | Sex */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Surname, Name */}
              <div className="md:col-span-6 relative">
                <label className="block font-semibold text-slate-700 mb-1">
                  Surname, Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={surnameName}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Surname, Name"
                    className={`w-full pl-3 pr-8 py-2 text-xs bg-white rounded border transition-colors focus:outline-none ${
                      !surnameName
                        ? 'border-rose-300 bg-rose-50/20 focus:border-rose-400 focus:ring-1 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#84592B]'
                    }`}
                  />
                  <Search
                    size={15}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer hover:text-slate-800"
                    onClick={() => {
                      if (allAvailablePlayers.length > 0) {
                        setSearchResults(allAvailablePlayers);
                        setShowSearchDropdown(true);
                      }
                    }}
                  />
                </div>

                {/* Autocomplete Search Dropdown */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectSearchedPlayer(p)}
                        className="p-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {p.surname || p.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {p.club || 'No Club'} &bull; {p.federation}
                          </span>
                        </div>
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {p.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Birthdate */}
              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Birthdate
                </label>
                <input
                  type="text"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B]"
                />
              </div>

              {/* Sex */}
              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Sex
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B] cursor-pointer"
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* ROW 2: Club | Federation | Title */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Club */}
              <div className="md:col-span-6">
                <label className="block font-semibold text-slate-700 mb-1">
                  Club
                </label>
                <input
                  type="text"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  placeholder="Club name"
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B]"
                />
              </div>

              {/* Federation */}
              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Federation
                </label>
                <select
                  value={federation}
                  onChange={(e) => setFederation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B] cursor-pointer"
                >
                  <option value="India">🇮🇳 India</option>
                  <option value="USA">🇺🇸 USA</option>
                  <option value="Germany">🇩🇪 Germany</option>
                  <option value="France">🇫🇷 France</option>
                  <option value="Spain">🇪🇸 Spain</option>
                  <option value="England">🇬🇧 England</option>
                  <option value="FIDE">🏁 FIDE</option>
                </select>
              </div>

              {/* Title */}
              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Title
                </label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value as ChessTitle)}
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B] cursor-pointer"
                >
                  <option value="None">None</option>
                  <option value="GM">GM</option>
                  <option value="IM">IM</option>
                  <option value="WGM">WGM</option>
                  <option value="FM">FM</option>
                  <option value="WIM">WIM</option>
                  <option value="CM">CM</option>
                  <option value="WCM">WCM</option>
                </select>
              </div>
            </div>

            {/* ROW 3: E-mail Address | Phone Number | Labels */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* E-mail Address */}
              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B]"
                />
              </div>

              {/* Phone Number */}
              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className="w-20 px-1.5 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile number"
                    className="flex-1 px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B]"
                  />
                </div>
              </div>

              {/* Labels */}
              <div className="md:col-span-6">
                <label className="block font-semibold text-slate-700 mb-1">
                  Labels
                </label>
                <select
                  value={labels}
                  onChange={(e) => setLabels(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B] cursor-pointer"
                >
                  <option value="">Select or add label...</option>
                  <option value="U18">Under 18 (Junior)</option>
                  <option value="Above18">Above 18 (Open)</option>
                  <option value="Senior">Senior</option>
                  <option value="Academy">Academy Member</option>
                  <option value="Invited">Invited Master</option>
                </select>
              </div>
            </div>

            {/* Subtle Divider Line */}
            <div className="pt-2 border-t border-slate-200" />

            {/* ROW 4: FIDE Ratings (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  FIDE ID
                </label>
                <input
                  type="text"
                  value={fideId}
                  onChange={(e) => setFideId(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono focus:outline-none focus:border-[#84592B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rating Classic
                </label>
                <input
                  type="number"
                  value={ratingClassic}
                  onChange={(e) => setRatingClassic(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono focus:outline-none focus:border-[#84592B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rating Rapid
                </label>
                <input
                  type="number"
                  value={ratingRapid}
                  onChange={(e) => setRatingRapid(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono focus:outline-none focus:border-[#84592B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rating Blitz
                </label>
                <input
                  type="number"
                  value={ratingBlitz}
                  onChange={(e) => setRatingBlitz(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono focus:outline-none focus:border-[#84592B]"
                />
              </div>
            </div>

            {/* ROW 5: Local Ratings (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Local ID
                </label>
                <input
                  type="text"
                  value={localId}
                  onChange={(e) => setLocalId(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono focus:outline-none focus:border-[#84592B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rating Local
                </label>
                <input
                  type="number"
                  value={ratingLocal}
                  onChange={(e) => setRatingLocal(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono focus:outline-none focus:border-[#84592B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rating Rapid
                </label>
                <input
                  type="number"
                  value={ratingLocalRapid}
                  onChange={(e) => setRatingLocalRapid(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono focus:outline-none focus:border-[#84592B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rating Blitz
                </label>
                <input
                  type="number"
                  value={ratingLocalBlitz}
                  onChange={(e) => setRatingLocalBlitz(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono focus:outline-none focus:border-[#84592B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Entry Fee Payment Status
              </label>
              <div className="flex items-center gap-3">
                {[
                  { id: 'paid', label: 'Paid' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'exempt', label: 'Exempt / Free' },
                ].map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentStatus"
                      checked={paymentStatus === s.id}
                      onChange={() => setPaymentStatus(s.id as any)}
                      className="accent-[#84592B]"
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fee Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B]"
                >
                  <option value="UPI / Online">UPI / Online</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B]"
              />
            </div>
          </div>
        )}

        {/* TAB 3: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Arbiter &amp; Player Notes
              </label>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Requested round byes, accessibility requirements, special remarks..."
                className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-[#84592B]"
              />
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS BAR (Exactly as Screenshot) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100">
          {/* Save & Close */}
          <button
            type="submit"
            disabled={!surnameName.trim()}
            className="bg-[#442D1C] hover:bg-[#583a24] disabled:opacity-50 text-white font-bold px-4 py-2 rounded text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Save size={14} className="text-[#E8D1A7]" />
            <span>Save &amp; Close</span>
          </button>

          {/* Add New */}
          <button
            type="button"
            disabled={!surnameName.trim()}
            onClick={handleAddNew}
            className="bg-[#84592B] hover:bg-[#6c4822] disabled:opacity-50 text-white font-bold px-4 py-2 rounded text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FilePlus size={14} />
            <span>Add New</span>
          </button>

          {/* Pagination / Navigation: [ < ] [ 22 ] [ > ] */}
          <div className="flex items-center border border-slate-300 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => onNavigatePlayer && onNavigatePlayer('prev')}
              className="px-2.5 py-1.5 text-slate-600 hover:text-[#442D1C] hover:bg-slate-50 border-r border-slate-300 cursor-pointer"
              title="Previous Player"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="px-3 py-1.5 text-xs font-bold text-[#442D1C] bg-[#f0e8dc] border-r border-slate-300 min-w-[32px] text-center">
              {currentIndex}
            </span>

            <button
              type="button"
              onClick={() => onNavigatePlayer && onNavigatePlayer('next')}
              className="px-2.5 py-1.5 text-slate-600 hover:text-[#442D1C] hover:bg-slate-50 cursor-pointer"
              title="Next Player"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#e4e6eb] hover:bg-[#d8dbe0] text-slate-700 font-medium px-4 py-2 rounded text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
