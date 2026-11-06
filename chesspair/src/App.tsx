import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrgProvider, useOrg } from './context/OrgContext';
import { db } from './lib/storage';
import {
  AuditLog,
  EnginePairing,
  GameResult,
  Pairing,
  Player,
  Round,
  Tournament,
  TournamentPlayer,
} from './types';
import { Navbar } from './components/layout/Navbar';
import { TournamentsView } from './components/tournaments/TournamentsView';
import { CreateTournamentView } from './components/tournaments/CreateTournamentView';
import { TournamentDetailView } from './components/tournaments/TournamentDetailView';
import { CreateTournamentModal } from './components/tournaments/CreateTournamentModal';
import { PlayersView } from './components/players/PlayersView';
import { PlayerModal } from './components/players/PlayerModal';
import { CsvImportModal } from './components/players/CsvImportModal';
import { ArbiterDeskView } from './components/arbiter/ArbiterDeskView';
import { AuditLogView } from './components/audit/AuditLogView';
import { PublicPortal } from './components/public/PublicPortal';
import { ShareModal } from './components/tournaments/ShareModal';

const AppContent: React.FC = () => {
  const { activeOrg } = useOrg();
  const { currentUser } = useAuth();

  // Default to 'tournaments' (Image 1 from user screenshot)
  const [currentView, setCurrentView] = useState<string>('tournaments');
  const [activeTournamentId, setActiveTournamentId] = useState<string>('trn-khc');

  // Application Data States
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Tournament-specific Data States
  const [tournamentRounds, setTournamentRounds] = useState<Round[]>([]);
  const [tournamentPairings, setTournamentPairings] = useState<Pairing[]>([]);
  const [tournamentParticipants, setTournamentParticipants] = useState<
    (TournamentPlayer & { player: Player })[]
  >([]);

  // Modals state
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Refresh active organization data
  const loadOrgData = useCallback(() => {
    if (!activeOrg) return;
    const orgTournaments = db.getTournaments(activeOrg.id);
    const orgPlayers = db.getPlayers(activeOrg.id);
    const orgLogs = db.getAuditLogs(activeOrg.id);

    setTournaments(orgTournaments);
    setPlayers(orgPlayers);
    setAuditLogs(orgLogs);

    // Default to first tournament if active is missing
    if (orgTournaments.length > 0) {
      if (!orgTournaments.some((t) => t.id === activeTournamentId)) {
        setActiveTournamentId(orgTournaments[0].id);
      }
    }
  }, [activeOrg, activeTournamentId]);

  // Refresh active tournament data
  const loadTournamentData = useCallback(() => {
    if (!activeTournamentId) return;
    const rnds = db.getRounds(activeTournamentId);
    const pairs = db.getAllPairingsForTournament(activeTournamentId);
    const tPlayers = db.getTournamentPlayers(activeTournamentId);

    setTournamentRounds(rnds);
    setTournamentPairings(pairs);
    setTournamentParticipants(tPlayers);
  }, [activeTournamentId]);

  useEffect(() => {
    loadOrgData();
  }, [loadOrgData]);

  useEffect(() => {
    loadTournamentData();
  }, [loadTournamentData]);

  const handleNavigate = (view: string, tournamentId?: string) => {
    if (tournamentId) {
      setActiveTournamentId(tournamentId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Tournament Handlers ---
  const handleCreateTournament = (
    data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>,
    selectedPlayerIds: string[]
  ) => {
    const created = db.createTournament(data);
    db.setTournamentPlayers(created.id, selectedPlayerIds);

    // Create Round 1 automatically
    db.createRound(created.id, 1);

    db.addAuditLog({
      organizationId: activeOrg.id,
      tournamentId: created.id,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'UPDATE_SETTINGS',
      details: {
        tournamentName: created.name,
        format: created.format,
        roundsCount: created.roundsCount,
        registeredPlayersCount: selectedPlayerIds.length,
      },
    });

    loadOrgData();
    setActiveTournamentId(created.id);
    setCurrentView('tournament-detail');
  };

  const handleUpdateTournament = (updates: Partial<Tournament>) => {
    if (!activeTournamentId) return;
    db.updateTournament(activeTournamentId, updates);
    loadOrgData();
    loadTournamentData();
  };

  const handleDeleteTournament = (tournamentId: string) => {
    db.deleteTournament(tournamentId);
    loadOrgData();
    setCurrentView('tournaments');
  };

  // --- Player Handlers ---
  const handleSavePlayer = (
    playerData: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingPlayer) {
      db.updatePlayer(editingPlayer.id, playerData);
      db.addAuditLog({
        organizationId: activeOrg.id,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        action: 'UPDATE_SETTINGS',
        details: { updatedPlayer: playerData.name },
      });
    } else {
      const created = db.createPlayer({
        ...playerData,
        organizationId: activeOrg.id,
      });
      db.addAuditLog({
        organizationId: activeOrg.id,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        action: 'REGISTER_PLAYER',
        details: { playerName: created.name, rating: created.rating },
      });
    }
    setEditingPlayer(null);
    loadOrgData();
  };

  const handleAddPlayerToTournament = (
    playerData: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>,
    tournamentId?: string
  ) => {
    const targetTId = tournamentId || activeTournamentId || activeTournament?.id;
    const created = db.createPlayer({
      ...playerData,
      organizationId: activeOrg.id,
    });
    db.addPlayerToTournament(targetTId, created.id);
    db.addAuditLog({
      organizationId: activeOrg.id,
      tournamentId: targetTId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'REGISTER_PLAYER',
      details: { playerName: created.name, rating: created.rating },
    });
    loadOrgData();
    loadTournamentData();
  };

  const handleUpdatePlayerInTournament = (
    playerId: string,
    updates: Partial<Player>,
    tournamentId?: string
  ) => {
    db.updatePlayer(playerId, updates);
    loadOrgData();
    loadTournamentData();
  };

  const handleDeletePlayer = (playerId: string) => {
    db.deletePlayer(playerId);
    loadOrgData();
  };

  const handleImportPlayers = (
    imported: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[]
  ) => {
    db.importPlayers(activeOrg.id, imported);
    db.addAuditLog({
      organizationId: activeOrg.id,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'REGISTER_PLAYER',
      details: { count: imported.length, method: 'CSV_IMPORT' },
    });
    loadOrgData();
  };

  // --- Round & Pairing Handlers ---
  const handleGeneratePairings = (
    roundNumber: number,
    pairings: EnginePairing[],
    status: 'draft' | 'published'
  ) => {
    let round = tournamentRounds.find((r) => r.roundNumber === roundNumber);
    if (!round) {
      round = db.createRound(activeTournamentId, roundNumber);
    }

    db.updateRoundStatus(round.id, status);

    const pairingsToSave = pairings.map((p) => ({
      boardNumber: p.boardNumber,
      whitePlayerId: p.whitePlayerId,
      blackPlayerId: p.blackPlayerId,
      result: (p.isBye ? '1-0_BYE' : 'UNPLAYED') as GameResult,
      isBye: p.isBye,
      byeType: p.byeType,
      isManualOverride: false,
    }));

    db.savePairings(round.id, activeTournamentId, pairingsToSave);

    db.addAuditLog({
      organizationId: activeOrg.id,
      tournamentId: activeTournamentId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: status === 'published' ? 'PUBLISH_ROUND' : 'GENERATE_PAIRINGS',
      details: {
        roundNumber,
        boardsCount: pairings.length,
        status,
        engine: 'BasicSwissEngine',
      },
    });

    loadTournamentData();
    loadOrgData();
  };

  const handleUpdateResult = (pairingId: string, result: GameResult, reason?: string) => {
    db.updatePairingResult(pairingId, result);

    db.addAuditLog({
      organizationId: activeOrg.id,
      tournamentId: activeTournamentId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'ENTER_RESULT',
      details: { pairingId, result, reason },
    });

    loadTournamentData();
  };

  const handleSwapPairing = (
    pairing1Id: string,
    pairing2Id: string,
    swapWhite: boolean,
    reason: string
  ) => {
    db.swapPairing(pairing1Id, pairing2Id, swapWhite, reason);

    db.addAuditLog({
      organizationId: activeOrg.id,
      tournamentId: activeTournamentId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'MANUAL_SWAP',
      details: { pairing1Id, pairing2Id, swapWhite, reason },
    });

    loadTournamentData();
  };

  const handlePublishRound = (roundId: string) => {
    db.updateRoundStatus(roundId, 'published');
    const rnd = tournamentRounds.find((r) => r.id === roundId);

    db.addAuditLog({
      organizationId: activeOrg.id,
      tournamentId: activeTournamentId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'PUBLISH_ROUND',
      details: { roundNumber: rnd?.roundNumber },
    });

    loadTournamentData();
  };

  const handleCompleteRound = (roundId: string) => {
    db.updateRoundStatus(roundId, 'completed');
    const rnd = tournamentRounds.find((r) => r.id === roundId);

    const currentT = tournaments.find((t) => t.id === activeTournamentId);
    if (currentT && rnd) {
      if (rnd.roundNumber < currentT.roundsCount) {
        db.updateTournament(currentT.id, { currentRound: rnd.roundNumber + 1 });
        db.createRound(currentT.id, rnd.roundNumber + 1);
      } else {
        db.updateTournament(currentT.id, { status: 'completed' });
      }
    }

    loadTournamentData();
    loadOrgData();
  };

  const handleCreateNextRound = () => {
    const nextRoundNum = tournamentRounds.length + 1;
    db.createRound(activeTournamentId, nextRoundNum);
    db.updateTournament(activeTournamentId, { currentRound: nextRoundNum });
    loadTournamentData();
    loadOrgData();
  };

  const handleWithdrawPlayer = (playerId: string) => {
    const currentT = tournaments.find((t) => t.id === activeTournamentId);
    if (!currentT) return;
    db.withdrawPlayer(activeTournamentId, playerId, currentT.currentRound);
    db.addAuditLog({
      organizationId: activeOrg.id,
      tournamentId: activeTournamentId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'WITHDRAW_PLAYER',
      details: { playerId, roundNumber: currentT.currentRound },
    });
    loadTournamentData();
  };

  const handleReinstatePlayer = (playerId: string) => {
    if (!activeTournamentId) return;
    db.reinstatePlayer(activeTournamentId, playerId);
    db.addAuditLog({
      organizationId: activeOrg.id,
      tournamentId: activeTournamentId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'REINSTATE_PLAYER',
      details: { playerId },
    });
    loadOrgData();
    loadTournamentData();
  };

  const handleImportPlayersToTournament = (
    imported: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[],
    tournamentId?: string
  ) => {
    const targetTId = tournamentId || activeTournamentId || activeTournament?.id;
    if (!targetTId) return;
    const createdPlayers = db.importPlayers(activeOrg.id, imported);
    createdPlayers.forEach((p) => {
      db.addPlayerToTournament(targetTId, p.id);
    });
    db.addAuditLog({
      organizationId: activeOrg.id,
      tournamentId: targetTId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'REGISTER_PLAYER',
      details: { count: createdPlayers.length, method: 'FILE_IMPORT_TOURNAMENT' },
    });
    loadOrgData();
    loadTournamentData();
  };

  const handleBatchUpdateTournamentPlayers = (
    playerIds: string[],
    updates: Partial<TournamentPlayer>
  ) => {
    if (!activeTournamentId) return;
    db.batchUpdateTournamentPlayers(activeTournamentId, playerIds, updates);
    loadTournamentData();
  };

  const activeTournament = tournaments.find((t) => t.id === activeTournamentId) || tournaments[0];

  // If in Public Spectator Portal view, render spectator mode
  if (currentView === 'public-portal') {
    return (
      <PublicPortal
        tournaments={tournaments}
        selectedTournamentId={activeTournamentId}
        allRounds={db.getRounds(activeTournamentId)}
        allPairings={db.getAllPairingsForTournament(activeTournamentId)}
        allTournamentPlayers={db.getTournamentPlayers(activeTournamentId)}
        onBackToApp={() => setCurrentView('tournaments')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        activeTournamentName={activeTournament?.name}
        onNavigate={handleNavigate}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col w-full">
        {/* VIEW 1: TOURNAMENTS LIST (Screenshot 1) */}
        {currentView === 'tournaments' && (
          <TournamentsView
            tournaments={tournaments}
            onSelectTournament={(id) => handleNavigate('tournament-detail', id)}
            onOpenCreateTournament={() => setCurrentView('create-tournament')}
            onNavigate={handleNavigate}
          />
        )}

        {/* VIEW 2: NEW TOURNAMENT 2-STEP WIZARD (Screenshots 2 & 3) */}
        {currentView === 'create-tournament' && (
          <CreateTournamentView
            availablePlayers={players}
            onCreate={handleCreateTournament}
            onCancel={() => setCurrentView('tournaments')}
          />
        )}

        {/* VIEW 3: TOURNAMENT DETAIL & DASHBOARD (Screenshots 4 & 5) */}
        {currentView === 'tournament-detail' && activeTournament && (
          <TournamentDetailView
            tournament={activeTournament}
            rounds={tournamentRounds}
            pairings={tournamentPairings}
            tournamentPlayers={tournamentParticipants}
            allOrgPlayers={players}
            auditLogs={auditLogs}
            onBack={() => setCurrentView('tournaments')}
            onNavigate={handleNavigate}
            onGeneratePairings={handleGeneratePairings}
            onUpdateResult={handleUpdateResult}
            onSwapPairing={handleSwapPairing}
            onPublishRound={handlePublishRound}
            onCompleteRound={handleCompleteRound}
            onCreateNextRound={handleCreateNextRound}
            onWithdrawPlayer={handleWithdrawPlayer}
            onReinstatePlayer={handleReinstatePlayer}
            onImportPlayersToTournament={handleImportPlayersToTournament}
            onUpdateTournament={handleUpdateTournament}
            onDeleteTournament={handleDeleteTournament}
            onAddPlayerToTournament={handleAddPlayerToTournament}
            onUpdatePlayerInTournament={handleUpdatePlayerInTournament}
            onBatchUpdatePlayers={handleBatchUpdateTournamentPlayers}
          />
        )}

        {/* VIEW 4: PLAYERS ROSTER DIRECTORY */}
        {currentView === 'players' && (
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <PlayersView
              players={players}
              onOpenAddPlayer={() => {
                setEditingPlayer(null);
                setIsPlayerModalOpen(true);
              }}
              onEditPlayer={(p) => {
                setEditingPlayer(p);
                setIsPlayerModalOpen(true);
              }}
              onDeletePlayer={handleDeletePlayer}
              onOpenCsvImport={() => setIsCsvModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 5: ARBITER DESK */}
        {currentView === 'arbiter-desk' && (
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <ArbiterDeskView
              tournaments={tournaments}
              allRounds={tournamentRounds}
              allPairings={tournamentPairings}
              auditLogs={auditLogs}
              onOpenTournament={(id) => handleNavigate('tournament-detail', id)}
              onNavigate={handleNavigate}
            />
          </div>
        )}

        {/* VIEW 6: AUDIT LOGS */}
        {currentView === 'audit-logs' && (
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <AuditLogView auditLogs={auditLogs} />
          </div>
        )}
      </div>

      {/* Global Modals */}
      <CreateTournamentModal
        isOpen={isCreateTournamentOpen}
        onClose={() => setIsCreateTournamentOpen(false)}
        availablePlayers={players}
        onCreate={handleCreateTournament}
      />

      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => {
          setIsPlayerModalOpen(false);
          setEditingPlayer(null);
        }}
        player={editingPlayer}
        onSave={handleSavePlayer}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleImportPlayers}
      />

      {activeTournament && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          tournament={activeTournament}
          onOpenPublicPortal={() => handleNavigate('public-portal', activeTournament.id)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <AppContent />
      </OrgProvider>
    </AuthProvider>
  );
}

export default App;
