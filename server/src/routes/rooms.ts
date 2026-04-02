import { Router } from 'express';
import { db } from '../db';
import { authMiddleware } from './auth';

const router = Router();

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// All room routes require authentication
router.use(authMiddleware);

// List user's rooms
router.get('/my-rooms', (req: any, res) => {
  const userId = req.user.id;
  db.all(`
    SELECT r.id, r.code, r.game_state, c.name as club_name, m.is_founder, m.id as manager_id 
    FROM rooms r
    JOIN managers m ON m.room_id = r.id
    JOIN clubs c ON m.club_id = c.id
    WHERE m.user_id = ?
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ rooms: rows });
  });
});

// Create a room
router.post('/create', (req: any, res) => {
  const userId = req.user.id;
  const roomCode = generateRoomCode();
  
  db.serialize(() => {
    db.run(
      'INSERT INTO rooms (code, founder_id) VALUES (?, ?)',
      [roomCode, userId],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error creating room' });
        const roomId = this.lastID;

        // Assign a team from Division 4
        db.get(
          'SELECT id, name FROM clubs WHERE division = 4 ORDER BY RANDOM() LIMIT 1',
          (err, club: any) => {
            if (err || !club) return res.status(500).json({ error: 'No available clubs' });
            
            // Assign manager founder attached to user_id
            db.run(
              'INSERT INTO managers (user_id, club_id, is_founder, room_id) VALUES (?, ?, 1, ?)',
              [userId, club.id, roomId],
              function(err) {
                if (err) return res.status(500).json({ error: 'Error creating manager' });
                res.json({ message: 'Room created', roomCode, managerId: this.lastID, club });
              }
            );
          }
        );
      }
    );
  });
});

// Join a room
router.post('/join', (req: any, res) => {
  const userId = req.user.id;
  const { roomCode } = req.body;
  if (!roomCode) return res.status(400).json({ error: 'Missing code' });

  db.get('SELECT id FROM rooms WHERE code = ?', [roomCode.toUpperCase()], (err, room: any) => {
    if (err || !room) return res.status(404).json({ error: 'Room not found' });
    const roomId = room.id;

    // Check if user is already in room
    db.get('SELECT id FROM managers WHERE room_id = ? AND user_id = ?', [roomId, userId], (err, existingManager: any) => {
      if (existingManager) return res.status(400).json({ error: 'Já estás nesta sala.' });

      // Check count
      db.get('SELECT COUNT(*) as count FROM managers WHERE room_id = ?', [roomId], (err, row: any) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (row.count >= 8) return res.status(403).json({ error: 'Room is full (max 8 humans)' });

        // Find available div 4 club
        db.get(`
          SELECT c.id, c.name FROM clubs c 
          WHERE c.division = 4 
          AND c.id NOT IN (SELECT club_id FROM managers WHERE room_id = ?)
          ORDER BY RANDOM() LIMIT 1
        `, [roomId], (err, club: any) => {
          if (err || !club) return res.status(500).json({ error: 'No available clubs' });

          db.run(
            'INSERT INTO managers (user_id, club_id, is_founder, room_id) VALUES (?, ?, 0, ?)',
            [userId, club.id, roomId],
            function(err) {
              if (err) return res.status(500).json({ error: 'Error joining room' });
              res.json({ message: 'Joined successfully', managerId: this.lastID, club });
            }
          );
        });
      });
    });
  });
});

// Delete Room
router.delete('/:code', (req: any, res) => {
  const userId = req.user.id;
  const roomCode = req.params.code;

  db.get('SELECT id, founder_id FROM rooms WHERE code = ?', [roomCode.toUpperCase()], (err, room: any) => {
    if (err || !room) return res.status(404).json({ error: 'Room not found' });
    
    if (room.founder_id !== userId) {
      return res.status(403).json({ error: 'Only the founder can delete this room' });
    }

    db.serialize(() => {
      // In a real app we'd have ON DELETE CASCADE or clean up associated tables
      db.run('DELETE FROM tactics WHERE match_id IN (SELECT id FROM matches WHERE room_id = ?)', [room.id]);
      db.run('DELETE FROM matches WHERE room_id = ?', [room.id]);
      db.run('DELETE FROM managers WHERE room_id = ?', [room.id]);
      db.run('DELETE FROM rooms WHERE id = ?', [room.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error deleting room' });
        res.json({ message: 'Room deleted' });
      });
    });
  });
});

export default router;
