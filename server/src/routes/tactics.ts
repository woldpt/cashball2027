import { Router } from 'express';
import { db } from '../db';
import { authMiddleware } from './auth';
import { autoSubmitAITactics } from '../engine/ai';
import { startMatchLoop } from '../engine/matchLoop';

const router = Router();
router.use(authMiddleware);

router.post('/submit', (req: any, res) => {
  const userId = req.user.id;
  const { roomId, formation, style, starting_eleven, subs } = req.body;

  if (!roomId || !formation) return res.status(400).json({ error: 'Missing params' });

  // 1. Get the room's current week & state
  db.get('SELECT current_week, game_state FROM rooms WHERE id = ?', [roomId], (err, room: any) => {
    if (err || !room) return res.status(404).json({ error: 'Room err' });
    
    if (room.game_state !== 'IN_PROGRESS' && room.game_state !== 'PRE_MATCH') {
       return res.status(400).json({ error: 'Game is not waiting for tactics right now.' });
    }

    // 2. Identify the active club of this user
    db.get('SELECT club_id FROM managers WHERE room_id = ? AND user_id = ? AND status = ?', [roomId, userId, 'ACTIVE'], (err, manager: any) => {
      if (err || !manager) return res.status(403).json({ error: 'Not an active manager in this room' });
      
      const clubId = manager.club_id;
      const currentWeek = room.current_week;

      // 3. Find the match ID for this club in the current week
      db.get('SELECT id FROM matches WHERE room_id = ? AND week = ? AND (home_club_id = ? OR away_club_id = ?)', 
        [roomId, currentWeek, clubId, clubId], 
        (err, match: any) => {
        if (err || !match) return res.status(400).json({ error: 'No match for you this week (calendar empty?)' });

        const matchId = match.id;

        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          // Update or insert tactic
          db.get('SELECT id FROM tactics WHERE match_id = ? AND club_id = ?', [matchId, clubId], (err, existingTactic) => {
            if (existingTactic) {
               db.run('UPDATE tactics SET formation = ?, style = ?, starting_eleven = ?, subs = ?, submitted = 1 WHERE id = ?',
                 [formation, style, JSON.stringify(starting_eleven||[]), JSON.stringify(subs||[]), (existingTactic as any).id]);
            } else {
               db.run('INSERT INTO tactics (match_id, club_id, formation, style, submitted, starting_eleven, subs) VALUES (?, ?, ?, ?, 1, ?, ?)',
                 [matchId, clubId, formation, style, JSON.stringify(starting_eleven||[]), JSON.stringify(subs||[])]);
            }

            db.run('COMMIT', async (err) => {
               if (err) return res.status(500).json({ error: 'DB commit error' });
               
               res.json({ message: 'Tactic submitted successfully.' });

               // Gate Logic: Check if all HUMAN managers submitted
               checkGateAndExecute(roomId, currentWeek);
            });
          });
        });
      });
    });
  });
});

async function checkGateAndExecute(roomId: number, week: number) {
  // Get count of active human managers
  db.get('SELECT COUNT(*) as c FROM managers WHERE room_id = ? AND status = ?', [roomId, 'ACTIVE'], (err, row: any) => {
    if (err || !row) return;
    const humanCount = row.c;

    // Get count of submitted tactics by humans this week
    db.get(`
      SELECT COUNT(*) as c 
      FROM tactics t
      JOIN managers m ON m.club_id = t.club_id
      WHERE t.match_id IN (SELECT id FROM matches WHERE room_id = ? AND week = ?)
      AND m.room_id = ? AND m.status = 'ACTIVE'
      AND t.submitted = 1
    `, [roomId, week, roomId], async (err, rowT: any) => {
      
      const submittedCount = rowT ? rowT.c : 0;
      console.log(`✅ Room ${roomId} Week ${week} Gate Check: ${submittedCount} / ${humanCount}`);
      
      if (submittedCount >= humanCount) {
        // TRIGGER CORE ENGINE!
        console.log(`🚀 All humans ready! Triggering AutoAI and Match Loop for Room ${roomId}`);
        await autoSubmitAITactics(roomId, week);
        
        // This runs asynchronously in background, emitting websockets
        startMatchLoop(roomId, week);
      }
    });
  });
}

export default router;
