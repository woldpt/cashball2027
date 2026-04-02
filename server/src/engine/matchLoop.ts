import { db } from '../db';
import { simulateHalfTime, TeamStats, PlayerStats } from './simulation';
import { getIo } from '../socket';

/**
 * Executes a full live match week for a given room.
 */
export async function startMatchLoop(roomId: number, week: number) {
  // Update state to lock submissions
  db.run(`UPDATE rooms SET game_state = 'MATCH_DAY_LIVE' WHERE id = ?`, [roomId]);
  
  // Inform clients that UI should transition to LiveMatch overlay
  getIo().to(roomId.toString()).emit('match_prep_started', { week });

  try {
    // 1. Fetch matches
    const matches = await new Promise<any[]>((resolve, reject) => {
      db.all(`SELECT * FROM matches WHERE room_id = ? AND week = ?`, [roomId, week], (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });

    if (matches.length === 0) return finishMatchLoop(roomId, week);

    // 2. We will just simulate match by match and collect events.
    // In a real app we need to fetch the 11 starting players for each club.
    // For simplicity of this MVP timeline, we simulate with dummy team stats OR fetch players.
    const liveMatchesData = await Promise.all(matches.map(async (m) => {
      const homeStats = await buildTeamStats(m.home_club_id, m.id, true);
      const awayStats = await buildTeamStats(m.away_club_id, m.id, false);

      // Play 1st Half
      const half1 = simulateHalfTime(homeStats, awayStats, 0, 45); // no referee bias for now
      
      return {
        matchId: m.id,
        homeStats,
        awayStats,
        half1
      };
    }));

    // Start 1st Half broadcast
    await broadcastHalf(roomId, liveMatchesData, 1, 45);

    // HT Pause
    getIo().to(roomId.toString()).emit('halftime', { duration: 30 });
    await new Promise(r => setTimeout(r, 30000)); // wait 30 seconds

    // Calculate 2nd Half
    const liveMatchesDataH2 = liveMatchesData.map((m: any) => {
      const half2 = simulateHalfTime(m.homeStats, m.awayStats, 0, 45);
      // Offset minutes
      half2.events.forEach(e => e.minute += 45);
      return { ...m, half2 };
    });

    // Start 2nd Half broadcast
    await broadcastHalf(roomId, liveMatchesDataH2, 46, 90, 'half2');

    // Finalize
    getIo().to(roomId.toString()).emit('match_ended');
    await finalizeMatches(liveMatchesDataH2);
    await finishMatchLoop(roomId, week);

  } catch (err) {
    console.error('Match loop error:', err);
    await finishMatchLoop(roomId, week);
  }
}

async function buildTeamStats(clubId: number, matchId: number, isHome: boolean): Promise<TeamStats> {
  const club = await getSingle(`SELECT * FROM clubs WHERE id = ?`, [clubId]);
  const tactic = await getSingle(`SELECT * FROM tactics WHERE club_id = ? AND match_id = ?`, [clubId, matchId]);
  
  // Actually we should fetch players FROM tactic.starting_eleven JSON
  // But if empty/missing, let's fetch top 11 players
  let players: PlayerStats[] = [];
  try {
    const ids = JSON.parse(tactic?.starting_eleven || '[]');
    if (ids.length > 0) {
      const pRows = await new Promise<any[]>((res) => {
        db.all(`SELECT position, quality, aggressiveness, craque FROM players WHERE id IN (${ids.join(',')})`, (e, r) => res(r || []));
      });
      players = pRows;
    } else {
      // Fallback
      players = await new Promise<any[]>((res) => {
        db.all(`SELECT position, quality, aggressiveness, craque FROM players WHERE club_id = ? LIMIT 11`, [clubId], (e, r) => res(r || []));
      });
    }
  } catch(e) {
    players = [];
  }

  return {
    players,
    formation: tactic?.formation || '4-4-2',
    style: tactic?.style || 'EQUILIBRADO',
    moral: club?.moral || 50,
    isHome
  };
}

async function broadcastHalf(roomId: number, liveMatches: any[], startMin: number, endMin: number, objKey: string = 'half1') {
  for (let m = startMin; m <= endMin; m++) {
    // Collect events for minute `m` across all matches
    const minuteEvents: any[] = [];
    for (const match of liveMatches) {
      const matchHalf = match[objKey];
      const matchMinuteEvents = matchHalf.events.filter((e: any) => e.minute === m);
      
      for (const ev of matchMinuteEvents) {
        minuteEvents.push({
          matchId: match.matchId,
          minute: m,
          team: ev.team,
          type: ev.type,
          text: `${ev.team === 'A' ? 'Equipa da Casa' : 'Visitante'} marcou um ${ev.type}`
        });
      }
    }
    
    // Broadcast the minute clock globally
    getIo().to(roomId.toString()).emit('match_tick', { minute: m, events: minuteEvents });

    // Wait 1 second = 1 game minute
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function finalizeMatches(liveMatchesDataH2: any[]) {
  return new Promise<void>((resolve) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare('UPDATE matches SET home_score=?, away_score=?, status=?, simulation_report=? WHERE id=?');
      
      for(const m of liveMatchesDataH2) {
        const h1 = m.half1;
        const h2 = m.half2;
        const totalHome = h1.scoreA + h2.scoreA;
        const totalAway = h1.scoreB + h2.scoreB;
        const allEvts = [...h1.events, ...h2.events];

        stmt.run(totalHome, totalAway, 'COMPLETED', JSON.stringify(allEvts), m.matchId);
      }

      stmt.finalize();
      db.run('COMMIT', () => resolve());
    });
  });
}

function finishMatchLoop(roomId: number, week: number) {
  return new Promise<void>((resolve) => {
    // Setup for next week. Game State resets. Week increments.
    db.run(`UPDATE rooms SET game_state = 'PRE_MATCH', current_week = ? WHERE id = ?`, [week + 1, roomId], () => {
      resolve();
    });
  });
}

// Helpers
function getSingle(query: string, params: any[]): Promise<any> {
  return new Promise((resolve) => {
    db.get(query, params, (err, row) => resolve(row));
  });
}
