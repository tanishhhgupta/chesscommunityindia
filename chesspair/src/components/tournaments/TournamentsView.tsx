import React, { useState } from 'react';
import { Tournament } from '../../types';
import { useOrg } from '../../context/OrgContext';
import {
  Wand2,
  Calendar,
  Users,
  Hourglass,
  Flag,
  Search,
} from 'lucide-react';
import { Footer } from '../layout/Footer';

interface TournamentsViewProps {
  tournaments: Tournament[];
  onSelectTournament: (tournamentId: string) => void;
  onOpenCreateTournament: () => void;
  onNavigate: (view: string, tournamentId?: string) => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  tournaments,
  onSelectTournament,
  onOpenCreateTournament,
}) => {
  const { permissions } = useOrg();
  const [selectedFilter, setSelectedFilter] = useState<'ongoing' | 'not_started' | 'finished'>('finished');
  const [search, setSearch] = useState('');

  // Status mapping
  const ongoingTournaments = tournaments.filter(
    (t) => t.status === 'in_progress'
  );
  const notStartedTournaments = tournaments.filter(
    (t) => t.status === 'registration' || t.status === 'draft'
  );
  const finishedTournaments = tournaments.filter(
    (t) => t.status === 'completed' || t.status === 'archived'
  );

  const filterMap = {
    ongoing: ongoingTournaments,
    not_started: notStartedTournaments,
    finished: finishedTournaments,
  };

  const currentList = filterMap[selectedFilter] || tournaments;

  const filtered = currentList.filter((t) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      (t.city && t.city.toLowerCase().includes(query)) ||
      (t.venue && t.venue.toLowerCase().includes(query)) ||
      (t.timeControlString && t.timeControlString.toLowerCase().includes(query))
    );
  });

  const getFormatLabel = (t: Tournament) => {
    if (t.timeControlCategory === 'blitz') return 'Blitz';
    if (t.timeControlCategory === 'rapid') return 'Rapid';
    if (t.timeControlCategory === 'classical') return 'Classical';
    if (t.timeControlCategory === 'bullet') return 'Bullet';
    return 'Rapid';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '20.09.2026';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  const getCountryFlag = (fed?: string) => {
    if (!fed) return '🇮🇳';
    const f = fed.toUpperCase();
    if (f === 'INDIA' || f === 'IND') return '🇮🇳';
    if (f === 'USA') return '🇺🇸';
    if (f === 'GERMANY' || f === 'GER') return '🇩🇪';
    if (f === 'FRANCE' || f === 'FRA') return '🇫🇷';
    if (f === 'ENGLAND' || f === 'ENG' || f === 'GBR') return '🇬🇧';
    return '🏁';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Action Button + Filter Card */}
        <div className="md:col-span-3 space-y-3">
          {/* New Tournament Button */}
          {permissions.canManageTournaments && (
            <button
              onClick={onOpenCreateTournament}
              className="w-full bg-[#442D1C] hover:bg-[#583a24] active:scale-[0.99] text-white font-bold text-sm py-2.5 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Wand2 size={16} className="text-[#E8D1A7]" />
              <span>New Tournament</span>
            </button>
          )}

          {/* Status Filter Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="divide-y divide-slate-100">
              {/* Ongoing */}
              <button
                onClick={() => setSelectedFilter('ongoing')}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer relative ${
                  selectedFilter === 'ongoing'
                    ? 'bg-[#f0e8dc] font-semibold text-[#442D1C]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Ongoing</span>
                <span className="bg-[#E8D1A7]/40 text-[#442D1C] font-bold px-2 py-0.5 rounded text-[11px] min-w-[20px] text-center">
                  {ongoingTournaments.length}
                </span>
                {selectedFilter === 'ongoing' && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-white" />
                )}
              </button>

              {/* Not Started */}
              <button
                onClick={() => setSelectedFilter('not_started')}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer relative ${
                  selectedFilter === 'not_started'
                    ? 'bg-[#f0e8dc] font-semibold text-[#442D1C]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Not Started</span>
                <span className="bg-[#E8D1A7]/40 text-[#442D1C] font-bold px-2 py-0.5 rounded text-[11px] min-w-[20px] text-center">
                  {notStartedTournaments.length}
                </span>
                {selectedFilter === 'not_started' && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-white" />
                )}
              </button>

              {/* Finished */}
              <button
                onClick={() => setSelectedFilter('finished')}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer relative ${
                  selectedFilter === 'finished'
                    ? 'bg-[#f0e8dc] font-semibold text-[#442D1C]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Finished</span>
                <span className="bg-[#E8D1A7]/40 text-[#442D1C] font-bold px-2 py-0.5 rounded text-[11px] min-w-[20px] text-center">
                  {finishedTournaments.length}
                </span>
                {selectedFilter === 'finished' && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-white" />
                )}
              </button>
            </div>

            {/* Search Box */}
            <div className="p-2.5 border-t border-slate-100 bg-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
                <Search
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tournaments Cards List */}
        <div className="md:col-span-9 space-y-3.5">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-500 shadow-sm">
              <p className="text-sm font-semibold">No tournaments found in this category.</p>
              <p className="text-xs text-slate-400 mt-1">
                Try selecting another status tab or click &ldquo;New Tournament&rdquo; to create one.
              </p>
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTournament(t.id)}
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow transition-shadow relative overflow-hidden p-4 cursor-pointer group"
              >
                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#84592B] transition-colors">
                  {t.name}
                </h3>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-600 mt-2.5">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    {/* Date */}
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-500" />
                      <span>{formatDate(t.startDate)}</span>
                    </div>

                    {/* Players */}
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-500" />
                      <span>{t.playersCount ?? 16} players</span>
                    </div>

                    {/* Time Control */}
                    <div className="flex items-center gap-1.5">
                      <Hourglass size={14} className="text-slate-500" />
                      <span>{getFormatLabel(t)}</span>
                    </div>

                    {/* Rounds */}
                    <div className="flex items-center gap-1.5">
                      <Flag size={14} className="text-slate-500" />
                      <span>
                        {t.status === 'completed'
                          ? `${t.roundsCount}/${t.roundsCount}`
                          : `${t.currentRound}/${t.roundsCount}`}{' '}
                        rounds
                      </span>
                    </div>
                  </div>

                  {/* Location & Flag */}
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 ml-auto">
                    <span>{getCountryFlag(t.federation)}</span>
                    <span>
                      {t.city ? `${t.city}, ${t.federation || 'India'}` : (t.venue || 'India')}
                    </span>
                  </div>
                </div>

                {/* Spiced Wine Accent Line at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#743014]" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <Footer />
    </div>
  );
};
