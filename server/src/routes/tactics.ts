import { Router } from 'express';
import { db } from '../db';
import { io } from '../index'; // we'll use this to broadcast

const router = Router();

// Submit a tactic for a given match
router.post('/submit', (req, res) => {
  const { roomId, matchId, clubId, formation, style, startingEleven, subs } = req.body;

  if (!matchId || !clubId) return res.status(400).json({ error: 'Missing parameters' });

  // Update tactics DB
  db.run(
    `UPDATE tactics SET 
      formation = ?, style = ?, starting_eleven = ?, subs = ?, submitted = 1
     WHERE match_id = ? AND club_id = ?`,
    [formation, style, JSON.stringify(startingEleven), JSON.stringify(subs), matchId, clubId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Error submitting tactic' });
      
      if (this.changes === 0) {
        // If it didn't exist we should insert, but usually matches/tactics rows are pre-generated
        db.run(
          `INSERT INTO tactics (match_id, club_id, formation, style, starting_eleven, subs, submitted)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
           [matchId, clubId, formation, style, JSON.stringify(startingEleven), JSON.stringify(subs)],
           (err2) => {
             if (err2) return res.status(500).json({ error: 'Error inserting tactic' });
             checkMatchReady(roomId, matchId);
             return res.json({ success: true });
           }
        );
      } else {
        checkMatchReady(roomId, matchId);
        res.json({ success: true });
      }
    }
  );
});

// Check if all human/active coaches for a specific week/match have submitted
function checkMatchReady(roomId: number, matchId: number) {
  // Notify room that someone submitted
  io.to(String(roomId)).emit('tactic_submitted', { matchId });

  // Here we would ideally check if all matches for the current_week have tactics submitted
  // If yes, we trigger the simulation loop for the whole round!
  
  // Example query:
  // SELECT COUNT(*) as pending FROM tactics WHERE match_id IN (SELECT id FROM matches WHERE week = X) AND submitted = 0
  
  // Real implementation of the loop checking goes here 
  // For prototype logic, we can emit a placeholder indicating match ready
  setTimeout(() => {
    console.log(`Checking if match ${matchId} in room ${roomId} is ready...`);
    // Example: Trigger simulation
    // io.to(String(roomId)).emit('simulation_started', { matchId });
  }, 1000);
}

export default router;
