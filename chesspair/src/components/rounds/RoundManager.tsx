import React, { useState, useEffect, useRef } from 'react';
import {
  EnginePairing,
  EnginePlayer,
  EngineRoundHistoryGame,
  EngineValidationResult,
  GameResult,
  Pairing,
  Player,
  Round,
  Tournament,
  TournamentPlayer,
} from '../../types';
import { useOrg } from '../../context/OrgContext';
import { getTournamentEngine } from '../../engine';
import { db } from '../../lib/storage';
import { PairingPreviewModal } from './PairingPreviewModal';
import { ManualSwapModal } from './ManualSwapModal';
import { ForfeitModal } from '../results/ForfeitModal';
import {
  Save,
  Trash2,
  ArrowLeftRight,
  Cloud,
  CheckCircle2,
  X,
  Sparkles,
  Plus,
  AlertTriangle,
} from 'lucide-react';

interface RoundManagerProps {
  tournament: Tournament;
  rounds: Round[];
  activeRoundNumber: number;
  onSelectRoundNumber: (roundNum: number) => void;
  pairings: (Pairing & { whitePlayer?: Player; blackPlayer?: Player })[];
  allTournamentPairings: Pairing[];
  tournamentPlayers: (TournamentPlayer & { player: Player })[];
  onGeneratePairings: (roundNumber: number, pairings: EnginePairing[], status: 'draft' | 'published') => void;
  onUpdateResult: (pairingId: string, result: GameResult, reason?: string) => void;
  onSwapPairing: (pairing1Id: string, pairing2Id: string, swapWhite: boolean, reason: string) => void;
  onPublishRound: (roundId: string) => void;
  onCompleteRound: (roundId: string) => void;
  onCreateNextRound: () => void;
}

/**
 * Format game result strictly matching ChessManager standard notation:
 * '1 : 0', '0 : 1', '½ : ½', '0 : 0', '- : -', '1F : 0', '0 : 1F', '1 : 0 (Bye)', etc.
 */
function formatDisplayResult(res: GameResult | undefined, isBye?: boolean): string {
  if (isBye && (!res || res === 'UNPLAYED' || res === '1-0_BYE')) return '1 : 0 (Bye)';
  if (res === '1-0_BYE') return '1 : 0 (Bye)';
  if (res === '0.5-BYE') return '½ : ½ (Bye)';
  if (res === '0-BYE') return '0 : 0 (Bye)';
  if (!res || res === 'UNPLAYED') return '- : -';
  if (res === '1-0') return '1 : 0';
  if (res === '0.5-0.5') return '½ : ½';
  if (res === '0-1') return '0 : 1';
  if (res === '0-0') return '0 : 0';
  if (res === '1F-0') return '1F : 0';
  if (res === '0-1F') return '0 : 1F';
  if (res === '0F-0F') return '0F : 0F';
  return res;
}

export const RoundManager: React.FC<RoundManagerProps> = ({
  tournament,
  rounds,
  activeRoundNumber,
  onSelectRoundNumber,
  pairings,
  allTournamentPairings,
  tournamentPlayers,
  onGeneratePairings,
  onUpdateResult,
  onSwapPairing,
  onPublishRound,
  onCompleteRound,
  onCreateNextRound,
}) => {
  const { permissions } = useOrg();

  const currentRound = rounds.find((r) => r.roundNumber === activeRoundNumber);

  // Selection state for board checkboxes
  const [selectedPairingIds, setSelectedPairingIds] = useState<Set<string>>(new Set());

  // Result quick popover state
  const [activeResultPopoverId, setActiveResultPopoverId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Save feedback state
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapPreselect, setSwapPreselect] = useState<[string, string] | null>(null);
  const [forfeitPairing, setForfeitPairing] = useState<
    (Pairing & { whitePlayer?: Player; blackPlayer?: Player }) | null
  >(null);

  // Engine draft pairings state for preview
  const [enginePairings, setEnginePairings] = useState<EnginePairing[]>([]);
  const [validationResult, setValidationResult] = useState<EngineValidationResult>({
    isValid: true,
    hasErrors: false,
    hasWarnings: false,
    issues: [],
  });

  // Comprehensive player resolution map across tournament players and pairings
  const playerMap = React.useMemo(() => {
    const map = new Map<string, Player>();
    tournamentPlayers.forEach((tp) => {
      if (tp.player) map.set(tp.playerId, tp.player);
    });
    pairings.forEach((p) => {
      if (p.whitePlayer && p.whitePlayerId && !map.has(p.whitePlayerId)) {
        map.set(p.whitePlayerId, p.whitePlayer);
      }
      if (p.blackPlayer && p.blackPlayerId && !map.has(p.blackPlayerId)) {
        map.set(p.blackPlayerId, p.blackPlayer);
      }
    });
    allTournamentPairings.forEach((p) => {
      if (p.whitePlayer && p.whitePlayerId && !map.has(p.whitePlayerId)) {
        map.set(p.whitePlayerId, p.whitePlayer);
      }
      if (p.blackPlayer && p.blackPlayerId && !map.has(p.blackPlayerId)) {
        map.set(p.blackPlayerId, p.blackPlayer);
      }
    });
    return map;
  }, [tournamentPlayers, pairings, allTournamentPairings]);

  const getPlayer = (playerId: string | null | undefined): Player | undefined => {
    if (!playerId) return undefined;
    if (playerMap.has(playerId)) return playerMap.get(playerId);
    const p = db.getPlayer(playerId);
    if (p) {
      playerMap.set(playerId, p);
      return p;
    }
    return undefined;
  };

  // Filter pairings to current round if an unfiltered tournament pairings array was passed
  const activePairings = React.useMemo(() => {
    if (currentRound && pairings.some((p) => p.roundId !== currentRound.id)) {
      return pairings.filter((p) => p.roundId === currentRound.id);
    }
    return pairings;
  }, [pairings, currentRound]);

  // Dismiss popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveResultPopoverId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Reset selected rows when switching rounds
  useEffect(() => {
    setSelectedPairingIds(new Set());
    setActiveResultPopoverId(null);
  }, [activeRoundNumber]);

  // Build player histories and scores for engine and score badges
  const buildEnginePlayers = (): EnginePlayer[] => {
    return tournamentPlayers.map((tp, idx) => {
      const pId = tp.playerId;
      const historyColors: ('W' | 'B' | 'NONE')[] = [];
      const oppIds: string[] = [];
      let totalScore = 0;
      let hasBye = false;

      // Scan completed and published past rounds
      for (let r = 1; r < activeRoundNumber; r++) {
        const roundGames = allTournamentPairings.filter((p) => {
          const rnd = rounds.find((rd) => rd.id === p.roundId);
          return rnd && rnd.roundNumber === r;
        });

        const playerGame = roundGames.find(
          (p) => p.whitePlayerId === pId || p.blackPlayerId === pId
        );

        if (playerGame) {
          if (playerGame.isBye) {
            historyColors.push('NONE');
            hasBye = true;
            if (playerGame.result === '0.5-BYE') totalScore += 0.5;
            else if (playerGame.result === '0-BYE') totalScore += 0.0;
            else totalScore += 1.0;
          } else if (playerGame.whitePlayerId === pId) {
            historyColors.push('W');
            if (playerGame.blackPlayerId) oppIds.push(playerGame.blackPlayerId);
            if (playerGame.result === '1-0' || playerGame.result === '1F-0' || playerGame.result === '1-0_BYE') totalScore += 1.0;
            else if (playerGame.result === '0.5-0.5' || playerGame.result === '0.5-BYE') totalScore += 0.5;
            else if (playerGame.result === '0-0' || playerGame.result === '0F-0F' || playerGame.result === '0-BYE') totalScore += 0.0;
          } else {
            historyColors.push('B');
            if (playerGame.whitePlayerId) oppIds.push(playerGame.whitePlayerId);
            if (playerGame.result === '0-1' || playerGame.result === '0-1F' || playerGame.result === '1-0_BYE') totalScore += 1.0;
            else if (playerGame.result === '0.5-0.5' || playerGame.result === '0.5-BYE') totalScore += 0.5;
            else if (playerGame.result === '0-0' || playerGame.result === '0F-0F' || playerGame.result === '0-BYE') totalScore += 0.0;
          }
        }
      }

      return {
        id: pId,
        name: tp.player.name,
        rating: tp.initialRating,
        title: tp.player.title,
        federation: tp.player.federation,
        seed: tp.seedNumber || idx + 1,
        score: totalScore,
        colorHistory: historyColors,
        opponentIds: oppIds,
        receivedBye: hasBye,
        isWithdrawn: tp.isWithdrawn || !!tp.isPaused,
      };
    });
  };

  const handleRunPairingEngine = () => {
    const engine = getTournamentEngine(tournament.format);
    const enginePlayers = buildEnginePlayers();

    const previousRoundsHistory: EngineRoundHistoryGame[][] = [];
    for (let r = 1; r < activeRoundNumber; r++) {
      const roundR = rounds.find((rd) => rd.roundNumber === r);
      if (roundR) {
        const rPairings = allTournamentPairings.filter((p) => p.roundId === roundR.id);
        previousRoundsHistory.push(
          rPairings.map((p) => ({
            roundNumber: r,
            boardNumber: p.boardNumber,
            whitePlayerId: p.whitePlayerId,
            blackPlayerId: p.blackPlayerId,
            result: p.result,
            isBye: p.isBye,
            byeType: p.byeType,
          }))
        );
      }
    }

    const generated = engine.pairRound({
      roundNumber: activeRoundNumber,
      players: enginePlayers,
      previousRounds: previousRoundsHistory,
    });

    const validation = engine.validatePairings(generated, enginePlayers, previousRoundsHistory);

    setEnginePairings(generated);
    setValidationResult(validation);
    setIsPreviewModalOpen(true);
  };

  const handlePublishFromPreview = () => {
    onGeneratePairings(activeRoundNumber, enginePairings, 'published');
    setIsPreviewModalOpen(false);
  };

  const handleSaveDraftFromPreview = () => {
    onGeneratePairings(activeRoundNumber, enginePairings, 'draft');
    setIsPreviewModalOpen(false);
  };

  // Check if all games in round have results
  const allResultsEntered =
    activePairings.length > 0 && activePairings.every((p) => p.isBye || p.result !== 'UNPLAYED');

  const enginePlayers = buildEnginePlayers();
  const playerScoresMap = new Map<string, number>();
  enginePlayers.forEach((ep) => {
    playerScoresMap.set(ep.id, ep.score);
  });

  // Calculate total rounds to render in the top switcher bar
  const totalRoundsCount = Math.max(
    tournament.roundsCount || 1,
    rounds.length,
    ...rounds.map((r) => r.roundNumber)
  );
  const roundNumbersList = Array.from({ length: totalRoundsCount }, (_, i) => i + 1);

  // Detect players who are registered in the tournament but NOT paired in the current round
  const pairedPlayerIds = new Set<string>();
  activePairings.forEach((p) => {
    if (p.whitePlayerId) pairedPlayerIds.add(p.whitePlayerId);
    if (p.blackPlayerId) pairedPlayerIds.add(p.blackPlayerId);
  });
  const activeUnwithdrawnPlayers = tournamentPlayers.filter((tp) => !tp.isWithdrawn && !tp.isPaused);
  const unpairedPlayers = activeUnwithdrawnPlayers.filter(
    (tp) => !pairedPlayerIds.has(tp.playerId)
  );

  // Checkbox handlers
  const handleToggleSelectAll = () => {
    if (selectedPairingIds.size === activePairings.length) {
      setSelectedPairingIds(new Set());
    } else {
      setSelectedPairingIds(new Set(activePairings.map((p) => p.id)));
    }
  };

  const handleToggleSelectPairing = (id: string) => {
    const next = new Set(selectedPairingIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPairingIds(next);
  };

  // Toolbar Actions
  const handleTrashAction = () => {
    if (selectedPairingIds.size > 0) {
      selectedPairingIds.forEach((id) => onUpdateResult(id, 'UNPLAYED'));
      const count = selectedPairingIds.size;
      setSelectedPairingIds(new Set());
      setSaveSuccessMsg(`Cleared results on ${count} selected board(s).`);
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } else {
      const hasAnyResults = activePairings.some((p) => p.result !== 'UNPLAYED');
      if (!hasAnyResults) {
        alert('Select boards with checkboxes to clear their results.');
        return;
      }
      if (confirm(`Clear all results for Round ${activeRoundNumber}?`)) {
        activePairings.forEach((p) => onUpdateResult(p.id, 'UNPLAYED'));
        setSaveSuccessMsg(`All results cleared for Round ${activeRoundNumber}.`);
        setTimeout(() => setSaveSuccessMsg(null), 2500);
      }
    }
  };

  const handleOpenSwap = () => {
    if (selectedPairingIds.size === 2) {
      const ids = Array.from(selectedPairingIds) as [string, string];
      setSwapPreselect(ids);
    } else {
      setSwapPreselect(null);
    }
    setIsSwapModalOpen(true);
  };

  const handleSave = () => {
    setSaveSuccessMsg(`Round ${activeRoundNumber} pairings & results saved successfully.`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleSelectResult = (pairingId: string, result: GameResult) => {
    onUpdateResult(pairingId, result);
    setActiveResultPopoverId(null);
  };

  const canEnterResults = permissions.canEnterResults && currentRound?.status !== 'completed';

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* TOP ROUND SELECTION BAR (Screenshot Top) */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Grouped Round Selector Button Group */}
        <div className="inline-flex items-center rounded-md border border-gray-300 bg-white shadow-sm overflow-hidden text-xs">
          <span className="px-3.5 py-1.5 text-gray-700 font-semibold bg-white border-r border-gray-200 select-none">
            Round:
          </span>
          {roundNumbersList.map((rNum) => {
            const isSelected = rNum === activeRoundNumber;
            return (
              <button
                key={rNum}
                onClick={() => onSelectRoundNumber(rNum)}
                className={`px-3.5 py-1.5 border-r border-gray-200 last:border-r-0 font-medium transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#442D1C] text-[#E8D1A7] font-bold shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-[#FAF7F2] hover:text-[#442D1C]'
                }`}
              >
                {rNum}
              </button>
            );
          })}
        </div>

        {/* Right: Round status pill + actions and Save button */}
        <div className="flex items-center gap-2.5">
          {currentRound && (
            <div className="hidden md:flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider border ${
                  currentRound.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentRound.status === 'published'
                    ? 'bg-[#9D9167]/15 text-[#442D1C] border-[#9D9167]/40'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {currentRound.status === 'draft' ? 'Draft' : currentRound.status}
              </span>

              {currentRound.status === 'draft' && permissions.canManageRounds && activePairings.length > 0 && (
                <button
                  onClick={() => onPublishRound(currentRound.id)}
                  className="text-xs bg-[#442D1C] text-white px-3 py-1.5 rounded-md hover:bg-[#583a24] font-medium transition-colors cursor-pointer shadow-sm"
                >
                  Publish
                </button>
              )}

              {currentRound.status === 'published' && permissions.canManageRounds && (
                <button
                  disabled={!allResultsEntered}
                  onClick={() => onCompleteRound(currentRound.id)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors shadow-sm ${
                    allResultsEntered
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                  title={
                    allResultsEntered
                      ? 'Complete round and lock results'
                      : 'Enter all results to complete round'
                  }
                >
                  Complete Round
                </button>
              )}

              {permissions.canManageRounds &&
                rounds.length < tournament.roundsCount &&
                currentRound?.status === 'completed' && (
                  <button
                    onClick={onCreateNextRound}
                    className="text-xs bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Plus size={13} /> Add Round {rounds.length + 1}
                  </button>
                )}
            </div>
          )}

          {/* Save Button (Floppy disk icon + Save) */}
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#84592B] hover:bg-[#6c4822] text-white font-medium text-xs rounded border border-[#6c4822] shadow-sm transition-colors cursor-pointer"
          >
            <Save size={13} className="text-[#E8D1A7]" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Unpaired Registered Players Alert Banner */}
      {unpairedPlayers.length > 0 && currentRound?.status !== 'completed' && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>{unpairedPlayers.length} registered player(s)</strong> not yet paired in Round {activeRoundNumber}:{' '}
              <span className="font-semibold text-amber-950">
                {unpairedPlayers.map((p) => p.player.name).join(', ')}
              </span>
            </span>
          </div>
          {permissions.canManageRounds && (
            <button
              onClick={handleRunPairingEngine}
              className="px-3 py-1.5 bg-[#442D1C] text-[#E8D1A7] rounded text-xs font-semibold hover:bg-[#583a24] transition-colors cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-[#E8D1A7]" />
              <span>Pair Players (Swiss)</span>
            </button>
          )}
        </div>
      )}

      {/* MAIN SECTION: TABLE ON LEFT, 3-BUTTON VERTICAL TOOLBAR ON RIGHT */}
      <div className="flex items-start gap-3">
        {/* Pairings Table Card */}
        <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-gray-200 bg-[#FAF7F2] text-xs font-semibold text-[#442D1C]">
                  <th className="py-3 px-3 w-12 text-left">#</th>
                  <th className="py-3 px-4 text-left">White Pieces</th>
                  <th className="py-3 px-2 w-16 text-center">Pts</th>
                  <th className="py-3 px-4 w-36 text-center">Round {activeRoundNumber}</th>
                  <th className="py-3 px-2 w-16 text-center">Pts</th>
                  <th className="py-3 px-4 text-left">Black Pieces</th>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={activePairings.length > 0 && selectedPairingIds.size === activePairings.length}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#84592B] accent-[#84592B] focus:ring-0 cursor-pointer"
                      title="Select / Deselect All Boards"
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {activePairings.length > 0 ? (
                  activePairings.map((pairing) => {
                    const isSelected = selectedPairingIds.has(pairing.id);
                    const whitePlayer = pairing.whitePlayer || getPlayer(pairing.whitePlayerId);
                    const blackPlayer = pairing.blackPlayer || getPlayer(pairing.blackPlayerId);

                    const whiteName = whitePlayer?.surname || whitePlayer?.name;
                    const blackName = blackPlayer?.surname || blackPlayer?.name;

                    const whiteScore = pairing.whitePlayerId
                        ? playerScoresMap.get(pairing.whitePlayerId) ?? 0
                      : 0;
                    const blackScore = pairing.blackPlayerId
                      ? playerScoresMap.get(pairing.blackPlayerId) ?? 0
                      : 0;
                    const isPopoverOpen = activeResultPopoverId === pairing.id;

                    return (
                      <tr
                        key={pairing.id}
                        className={`hover:bg-[#FAF7F2]/60 transition-colors ${
                          isSelected ? 'bg-[#f0e8dc]/60' : ''
                        }`}
                      >
                        {/* Board Number Column (#) */}
                        <td className="py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                          {pairing.boardNumber}.
                        </td>

                        {/* White Pieces Column (Warm brown clickable name) */}
                        <td className="py-2.5 px-4 font-medium">
                          {whiteName ? (
                            <span
                              className="text-[#442D1C] hover:text-[#743014] hover:underline cursor-pointer font-semibold"
                              title={`Rating: ${whitePlayer?.rating ?? '-'}`}
                            >
                              {whitePlayer?.title && whitePlayer.title !== 'None' && !whiteName.startsWith(whitePlayer.title) && (
                                <span className="text-amber-700 font-bold text-[11px] mr-1">{whitePlayer.title}</span>
                              )}
                              {whiteName}
                            </span>
                          ) : pairing.whitePlayerId ? (
                            <span className="text-stone-700 font-medium">
                              Player {pairing.whitePlayerId}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No Player</span>
                          )}
                        </td>

                        {/* White Pts Column (Pill Badge) */}
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-block bg-[#f0e8dc] text-[#442D1C] font-semibold text-[11px] px-2.5 py-0.5 rounded-full min-w-[34px]">
                            {whiteScore.toFixed(1)}
                          </span>
                        </td>

                        {/* Result Column (Interactive white rounded button) */}
                        <td className="py-2 px-4 text-center relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canEnterResults) {
                                setActiveResultPopoverId(isPopoverOpen ? null : pairing.id);
                              }
                            }}
                            className={`border border-gray-300 bg-white rounded-md px-6 py-1.5 text-xs font-semibold shadow-sm transition-all text-center inline-flex items-center justify-center min-w-[88px] select-none ${
                              pairing.result === 'UNPLAYED'
                                ? 'text-gray-400 hover:border-gray-400 hover:text-gray-600'
                                : 'text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                            } ${!canEnterResults ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                          >
                            {formatDisplayResult(pairing.result, pairing.isBye)}
                          </button>

                          {/* Quick Result Selector Popover with 0-0, Byes, and standard results */}
                          {isPopoverOpen && (
                            <div
                              ref={popoverRef}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute z-40 top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl p-2.5 flex flex-col gap-2 min-w-[210px] animate-in fade-in zoom-in-95 text-left"
                            >
                              {/* Standard Match Results */}
                              <div>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Match Result
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '1-0')}
                                    className={`px-2 py-1.5 text-xs font-bold rounded border cursor-pointer transition-colors text-center ${
                                      pairing.result === '1-0'
                                        ? 'bg-[#442D1C] text-[#E8D1A7] border-[#442D1C]'
                                        : 'bg-white hover:bg-[#FAF7F2] text-[#442D1C] border-stone-200'
                                    }`}
                                  >
                                    1 : 0
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '0.5-0.5')}
                                    className={`px-2 py-1.5 text-xs font-bold rounded border cursor-pointer transition-colors text-center ${
                                      pairing.result === '0.5-0.5'
                                        ? 'bg-[#442D1C] text-[#E8D1A7] border-[#442D1C]'
                                        : 'bg-white hover:bg-[#FAF7F2] text-[#442D1C] border-stone-200'
                                    }`}
                                  >
                                    ½ : ½
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '0-1')}
                                    className={`px-2 py-1.5 text-xs font-bold rounded border cursor-pointer transition-colors text-center ${
                                      pairing.result === '0-1'
                                        ? 'bg-[#442D1C] text-[#E8D1A7] border-[#442D1C]'
                                        : 'bg-white hover:bg-[#FAF7F2] text-[#442D1C] border-stone-200'
                                    }`}
                                  >
                                    0 : 1
                                  </button>
                                </div>
                              </div>

                              {/* Zero Points / Forfeits */}
                              <div>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Zero Points / Forfeits
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '0-0')}
                                    className={`px-1.5 py-1 text-[11px] font-mono font-bold rounded border cursor-pointer transition-colors text-center ${
                                      pairing.result === '0-0'
                                        ? 'bg-[#743014] text-white border-[#743014]'
                                        : 'bg-white hover:bg-rose-50 text-[#743014] border-stone-200'
                                    }`}
                                    title="Double loss / 0-0 (0 pts each)"
                                  >
                                    0 : 0
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '1F-0')}
                                    className="px-1.5 py-1 text-[11px] font-mono text-gray-700 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer text-center"
                                    title="White wins by forfeit"
                                  >
                                    1F : 0
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '0-1F')}
                                    className="px-1.5 py-1 text-[11px] font-mono text-gray-700 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer text-center"
                                    title="Black wins by forfeit"
                                  >
                                    0 : 1F
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '0F-0F')}
                                    className="px-1.5 py-1 text-[11px] font-mono text-gray-700 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer text-center"
                                    title="Double forfeit (0 pts each)"
                                  >
                                    0F : 0F
                                  </button>
                                </div>
                              </div>

                              {/* Byes & Reset */}
                              <div>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Byes &amp; Reset
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '1-0_BYE')}
                                    className="px-1 py-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer text-center"
                                    title="1.0 Full-point bye"
                                  >
                                    1 Bye
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '0.5-BYE')}
                                    className="px-1 py-1 text-[11px] font-mono text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 cursor-pointer text-center"
                                    title="0.5 Half-point bye"
                                  >
                                    ½ Bye
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, '0-BYE')}
                                    className="px-1 py-1 text-[11px] font-mono text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer text-center"
                                    title="0.0 Zero-point bye"
                                  >
                                    0 Bye
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectResult(pairing.id, 'UNPLAYED')}
                                    className="px-1 py-1 text-[11px] font-mono font-medium text-rose-600 hover:bg-rose-50 rounded border border-rose-200 cursor-pointer text-center"
                                    title="Reset to Unplayed"
                                  >
                                    - : -
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Black Pts Column (Pill Badge) */}
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-block bg-[#f0e8dc] text-[#442D1C] font-semibold text-[11px] px-2.5 py-0.5 rounded-full min-w-[34px]">
                            {pairing.isBye ? '-' : blackScore.toFixed(1)}
                          </span>
                        </td>

                        {/* Black Pieces Column (Warm brown clickable name) */}
                        <td className="py-2.5 px-4 font-medium">
                          {pairing.isBye ? (
                            <span className="text-gray-400 italic font-medium">[BYE]</span>
                          ) : blackName ? (
                            <span
                              className="text-[#442D1C] hover:text-[#743014] hover:underline cursor-pointer font-semibold"
                              title={`Rating: ${blackPlayer?.rating ?? '-'}`}
                            >
                              {blackPlayer?.title && blackPlayer.title !== 'None' && !blackName.startsWith(blackPlayer.title) && (
                                <span className="text-amber-700 font-bold text-[11px] mr-1">{blackPlayer.title}</span>
                              )}
                              {blackName}
                            </span>
                          ) : pairing.blackPlayerId ? (
                            <span className="text-stone-700 font-medium">
                              Player {pairing.blackPlayerId}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No Player</span>
                          )}
                        </td>

                        {/* Row Checkbox Column */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectPairing(pairing.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#84592B] accent-[#84592B] focus:ring-0 cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-[#442D1C]">
                          Round {activeRoundNumber} pairings have not been generated yet.
                        </p>
                        <p className="text-xs text-stone-500">
                          Click the cloud icon on the right or below to pair players using the FIDE Swiss engine.
                        </p>
                        {permissions.canManageRounds && (
                          <button
                            onClick={handleRunPairingEngine}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#442D1C] text-[#E8D1A7] rounded-md text-xs font-semibold hover:bg-[#583a24] transition-colors cursor-pointer shadow-sm"
                          >
                            <Sparkles size={14} className="text-[#E8D1A7]" />
                            <span>Generate Swiss Pairings</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT VERTICAL TOOLBAR (Screenshot Right: 3 square buttons) */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm w-11 flex flex-col shrink-0 divide-y border-[#d8cca8] divide-[#d8cca8]/60 self-start sticky top-24">
          {/* Button 1: Trash (Clear selected / all results) */}
          <button
            type="button"
            onClick={handleTrashAction}
            className="p-3 text-gray-400 hover:text-rose-600 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer"
            title={
              selectedPairingIds.size > 0
                ? `Clear results on ${selectedPairingIds.size} selected board(s)`
                : 'Clear results in this round'
            }
          >
            <Trash2 size={16} />
          </button>

          {/* Button 2: Swap (Manual Swap) */}
          <button
            type="button"
            onClick={handleOpenSwap}
            className="p-3 text-gray-400 hover:text-[#84592B] hover:bg-[#FAF7F2] flex items-center justify-center transition-colors cursor-pointer"
            title="Manual Player / Board Swap"
          >
            <ArrowLeftRight size={16} />
          </button>

          {/* Button 3: Cloud (Calculate / Generate Pairings) */}
          <button
            type="button"
            onClick={handleRunPairingEngine}
            className="p-3 text-gray-400 hover:text-[#84592B] hover:bg-[#FAF7F2] flex items-center justify-center transition-colors cursor-pointer"
            title="Generate / Calculate Swiss Pairings"
          >
            <Cloud size={16} />
          </button>
        </div>
      </div>

      {/* Modals */}
      <PairingPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        roundNumber={activeRoundNumber}
        pairings={enginePairings}
        playerMap={playerMap}
        validation={validationResult}
        onPublish={handlePublishFromPreview}
        onSaveDraft={handleSaveDraftFromPreview}
      />

      <ManualSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => {
          setIsSwapModalOpen(false);
          setSwapPreselect(null);
        }}
        pairings={activePairings.map((p) => ({
          ...p,
          whitePlayer: p.whitePlayer || getPlayer(p.whitePlayerId),
          blackPlayer: p.blackPlayer || getPlayer(p.blackPlayerId),
        }))}
        initialBoard1Id={swapPreselect ? swapPreselect[0] : undefined}
        initialBoard2Id={swapPreselect ? swapPreselect[1] : undefined}
        onSwap={onSwapPairing}
      />

      <ForfeitModal
        isOpen={Boolean(forfeitPairing)}
        onClose={() => setForfeitPairing(null)}
        pairing={
          forfeitPairing
            ? {
                ...forfeitPairing,
                whitePlayer: forfeitPairing.whitePlayer || getPlayer(forfeitPairing.whitePlayerId),
                blackPlayer: forfeitPairing.blackPlayer || getPlayer(forfeitPairing.blackPlayerId),
              }
            : null
        }
        onSaveResult={onUpdateResult}
      />
    </div>
  );
};
