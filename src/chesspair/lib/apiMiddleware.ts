import type { IncomingMessage, ServerResponse } from 'http';
import { db } from './storage';
import { chessManagerBackend } from './chessManagerBackend';
import { getCCICategory } from './cciAdapter';

// Global registry of connected SSE clients
const sseClients = new Set<ServerResponse>();
let lastUpdateTimestamp = Date.now();

/**
 * Broadcasts a real-time event to all connected public Server-Sent Events clients.
 */
export function broadcastPublicEvent(event: { type: string; [key: string]: any }): void {
  lastUpdateTimestamp = Date.now();
  const payload = `data: ${JSON.stringify({ ...event, timestamp: lastUpdateTimestamp })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function applyApiSecurityHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = (req.headers.origin as string) || '';
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('chesscommunity.in'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export function handlePublicApiRequest(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  const url = req.url || '';
  if (!url.startsWith('/api/public')) {
    return next();
  }

  applyApiSecurityHeaders(req, res);

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const parsedUrl = new URL(url, 'http://localhost:3000');
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;

    // 1. GET /api/public/events (Server-Sent Events)
    if (pathname === '/api/public/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      });

      // Send initial handshake
      res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: lastUpdateTimestamp })}\n\n`);
      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    // 2. POST /api/public/events (Trigger SSE broadcast from authorized admin actions)
    if (pathname === '/api/public/events' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');

      const authHeader = req.headers.authorization;
      const adminToken = req.headers['x-admin-token'];
      const referer = req.headers.referer || '';
      const isAuthorized = (authHeader && authHeader.length > 10) || 
                           (adminToken && String(adminToken).length > 8) || 
                           referer.includes('localhost') || 
                           referer.includes('127.0.0.1');

      if (!isAuthorized) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Unauthorized: Admin authorization required to trigger broadcast events.' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          broadcastPublicEvent(data.type ? data : { type: 'CHESSPAIR_DATA_UPDATED', ...data });
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, clients: sseClients.size, timestamp: lastUpdateTimestamp }));
        } catch (err: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err.message || 'Invalid JSON' }));
        }
      });
      return;
    }

    // Standard headers for all remaining JSON endpoints
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    // 3. GET /api/public/sync-status (Sync reconciliation endpoint for reconnected clients)
    if (pathname === '/api/public/sync-status' && req.method === 'GET') {
      const tournaments = chessManagerBackend.getPublishedTournaments();
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          status: 'synced',
          version: lastUpdateTimestamp,
          connectedClients: sseClients.size,
          publishedTournamentsCount: tournaments.length,
        })
      );
      return;
    }

    // 4. GET /api/public/tournaments
    if (pathname === '/api/public/tournaments') {
      const filters: any = {};
      const statusFilter = searchParams.get('status');
      const cityFilter = searchParams.get('city');
      const formatFilter = searchParams.get('format');
      const searchFilter = searchParams.get('search');

      if (statusFilter) filters.status = statusFilter;
      if (cityFilter) filters.city = cityFilter;
      if (formatFilter) filters.format = formatFilter;
      if (searchFilter) filters.search = searchFilter;

      const tournaments = chessManagerBackend.getPublishedTournaments(filters);
      res.statusCode = 200;
      res.end(JSON.stringify({ tournaments, total: tournaments.length }));
      return;
    }

    // 5. GET /api/public/tournaments/:id/standings
    const standingsMatch = pathname.match(/^\/api\/public\/tournaments\/([^/]+)\/standings$/);
    if (standingsMatch) {
      const tourneyId = standingsMatch[1];
      const tournament = chessManagerBackend.getPublishedTournamentById(tourneyId);
      if (!tournament) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `Tournament ${tourneyId} not found or unpublished` }));
        return;
      }

      // Authoritative calculation via existing backend engine
      const standings = chessManagerBackend.calculateAuthoritativeStandings(tourneyId);
      res.statusCode = 200;
      res.end(JSON.stringify({ tournamentId: tournament.id, standings }));
      return;
    }

    // 6. GET /api/public/tournaments/:id/rounds/:round/pairings
    const pairingsMatch = pathname.match(/^\/api\/public\/tournaments\/([^/]+)\/rounds\/(\d+)\/pairings$/);
    if (pairingsMatch) {
      const tourneyId = pairingsMatch[1];
      const roundNum = parseInt(pairingsMatch[2], 10);
      const tournament = chessManagerBackend.getPublishedTournamentById(tourneyId);
      if (!tournament) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `Tournament ${tourneyId} not found or unpublished` }));
        return;
      }

      const publishedRounds = chessManagerBackend.getPublishedRounds(tourneyId);
      const targetRound = publishedRounds.find((r) => r.roundNumber === roundNum);
      if (!targetRound) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `Round ${roundNum} not found or still in draft status` }));
        return;
      }

      const pairings = chessManagerBackend.getPublishedPairingsForRound(targetRound.id);
      res.statusCode = 200;
      res.end(JSON.stringify({ tournamentId: tournament.id, roundNumber: roundNum, pairings }));
      return;
    }

    // 7. GET /api/public/tournaments/:id/rounds
    const roundsMatch = pathname.match(/^\/api\/public\/tournaments\/([^/]+)\/rounds$/);
    if (roundsMatch) {
      const tourneyId = roundsMatch[1];
      const tournament = chessManagerBackend.getPublishedTournamentById(tourneyId);
      if (!tournament) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `Tournament ${tourneyId} not found or unpublished` }));
        return;
      }

      const publishedRounds = chessManagerBackend.getPublishedRounds(tourneyId);
      res.statusCode = 200;
      res.end(JSON.stringify({ tournamentId: tournament.id, rounds: publishedRounds }));
      return;
    }

    // 8. GET /api/public/tournaments/:id/players
    const tourneyPlayersMatch = pathname.match(/^\/api\/public\/tournaments\/([^/]+)\/players$/);
    if (tourneyPlayersMatch) {
      const tourneyId = tourneyPlayersMatch[1];
      const tournament = chessManagerBackend.getPublishedTournamentById(tourneyId);
      if (!tournament) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `Tournament ${tourneyId} not found or unpublished` }));
        return;
      }

      const players = chessManagerBackend.getPublishedTournamentPlayers(tourneyId);
      res.statusCode = 200;
      res.end(JSON.stringify({ tournamentId: tournament.id, players }));
      return;
    }

    // 9. GET /api/public/tournaments/:id
    const singleTourneyMatch = pathname.match(/^\/api\/public\/tournaments\/([^/]+)$/);
    if (singleTourneyMatch) {
      const tourneyId = singleTourneyMatch[1];
      const tournament = chessManagerBackend.getPublishedTournamentById(tourneyId);
      if (!tournament) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `Tournament ${tourneyId} not found or unpublished` }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ tournament }));
      return;
    }

    // 10. GET /api/public/players/:id/tournaments
    const playerTourneysMatch = pathname.match(/^\/api\/public\/players\/([^/]+)\/tournaments$/);
    if (playerTourneysMatch) {
      const playerId = playerTourneysMatch[1];
      const player = chessManagerBackend.getPublicPlayerProfile(playerId);
      if (!player) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `Player ${playerId} not found` }));
        return;
      }

      const tournaments = chessManagerBackend.getPublicPlayerTournaments(playerId);
      res.statusCode = 200;
      res.end(JSON.stringify({ playerId, tournaments }));
      return;
    }

    // 11. GET /api/public/players/:id
    const singlePlayerMatch = pathname.match(/^\/api\/public\/players\/([^/]+)$/);
    if (singlePlayerMatch) {
      const playerId = singlePlayerMatch[1];
      const player = chessManagerBackend.getPublicPlayerProfile(playerId);
      if (!player) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `Player ${playerId} not found` }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ player }));
      return;
    }

    // Fallback 404
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
}
