import { db } from '../db';

/**
 * Implements a standard Round-Robin tournament algorithm 
 * to generate a 14-week schedule for an 8-team division.
 */
function createRoundRobinForDivision(clubs: any[], division: number): any[] {
  const matches: any[] = [];
  const numTeams = clubs.length;
  // If odd, we usually add a dummy, but we expect exactly 8 teams
  if (numTeams !== 8) throw new Error(`Expected exactly 8 teams for Division ${division}`);

  const teams = [...clubs];
  
  // First Half (Weeks 1-7)
  for (let week = 1; week <= 7; week++) {
    for (let i = 0; i < numTeams / 2; i++) {
      const home = teams[i];
      const away = teams[numTeams - 1 - i];
      matches.push({ week, home_club_id: home.id, away_club_id: away.id, competition: 'LEAGUE' });
    }
    // Rotate array: keep index 0 fixed, shift the rest
    const last = teams.pop();
    teams.splice(1, 0, last);
  }

  // Second Half (Weeks 8-14) - reverse Home/Away
  for (let week = 8; week <= 14; week++) {
    const firstHalfWeek = week - 7;
    const previousMatches = matches.filter(m => m.week === firstHalfWeek);
    
    for (const match of previousMatches) {
      matches.push({ 
        week, 
        home_club_id: match.away_club_id, 
        away_club_id: match.home_club_id, 
        competition: 'LEAGUE' 
      });
    }
  }

  return matches;
}

export function generateSchedule(roomId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // Get all clubs for this room order by division
    db.all(`SELECT id, division FROM clubs WHERE room_id = ? ORDER BY division ASC`, [roomId], (err, clubs: any[]) => {
      if (err) return reject(err);
      if (clubs.length !== 32) return reject(new Error('Room does not have 32 clubs. Seed failed.'));

      let allMatches: any[] = [];
      
      // Group by division and schedule
      for (let div = 1; div <= 4; div++) {
        const divClubs = clubs.filter(c => c.division === div);
        const divMatches = createRoundRobinForDivision(divClubs, div);
        allMatches = allMatches.concat(divMatches);
      }

      // Insert all matches into the database under current season (default 1)
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare(`
          INSERT INTO matches (room_id, season, week, competition, home_club_id, away_club_id)
          VALUES (?, 1, ?, ?, ?, ?)
        `);

        for (const m of allMatches) {
          stmt.run(roomId, m.week, m.competition, m.home_club_id, m.away_club_id);
        }

        stmt.finalize();
        
        // Update room state to 'IN_PROGRESS'
        db.run(`UPDATE rooms SET game_state = 'IN_PROGRESS', current_week = 1 WHERE id = ?`, [roomId]);
        
        db.run('COMMIT', (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  });
}
