import { db } from '../db';

/**
 * Automates tactic submission for any club that is NOT controlled by a human manager,
 * for a specifically requested week.
 */
export function autoSubmitAITactics(roomId: number, week: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // 1. Identify all matches for this room and week
    db.all('SELECT id, home_club_id, away_club_id FROM matches WHERE room_id = ? AND week = ?', [roomId, week], async (err, matches: any[]) => {
      if (err) return reject(err);
      if (matches.length === 0) return resolve();

      // Get all clubs controlled by humans (active managers)
      db.all('SELECT club_id FROM managers WHERE room_id = ? AND status = ?', [roomId, 'ACTIVE'], (err, humanManagers: any[]) => {
        if (err) return reject(err);
        
        const humanClubIds = new Set(humanManagers.map(m => m.club_id));

        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          const insertTactic = db.prepare(`
            INSERT INTO tactics (match_id, club_id, formation, style, submitted, starting_eleven, subs)
            VALUES (?, ?, '4-4-2', 'EQUILIBRADO', 1, '[]', '[]')
          `);

          let botProcessed = 0;

          matches.forEach(m => {
            // Home Club AI
            if (!humanClubIds.has(m.home_club_id)) {
              insertTactic.run(m.id, m.home_club_id);
              botProcessed++;
            }
            // Away Club AI
            if (!humanClubIds.has(m.away_club_id)) {
              insertTactic.run(m.id, m.away_club_id);
              botProcessed++;
            }
          });

          insertTactic.finalize();
          
          db.run('COMMIT', (err) => {
            if (err) return reject(err);
            console.log(`[AI] Auto-submitted tactics for ${botProcessed} bot-controlled clubs.`);
            resolve();
          });
        });
      });
    });
  });
}
