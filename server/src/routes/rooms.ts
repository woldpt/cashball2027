import { Router } from 'express';
import { db } from '../db';

const router = Router();

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a room
router.post('/create', (req, res) => {
  const { username, passwordHash } = req.body; // In a real app we'd hash here, but UI can send hashed for prototype simplicity
  if (!username) return res.status(400).json({ error: 'Username required' });

  const roomCode = generateRoomCode();
  
  db.serialize(() => {
    db.run(
      'INSERT INTO rooms (code) VALUES (?)',
      [roomCode],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error creating room' });
        
        const roomId = this.lastID;

        // Assign a team from Division 4 (Campeonato de Portugal) randomly
        db.get(
          'SELECT id, name FROM clubs WHERE division = 4 ORDER BY RANDOM() LIMIT 1',
          (err, club: any) => {
            if (err || !club) return res.status(500).json({ error: 'No available clubs found' });
            
            // Assign manager founder
            db.run(
              'INSERT INTO managers (username, password_hash, club_id, is_founder, room_id) VALUES (?, ?, ?, 1, ?)',
              [username, passwordHash || 'demo', club.id, roomId],
              function(err) {
                if (err) return res.status(500).json({ error: 'Error creating manager' });
                const managerId = this.lastID;
                res.json({ message: 'Room created', roomCode, managerId, club });
              }
            );
          }
        );
      }
    );
  });
});

// Join a room
router.post('/join', (req, res) => {
  const { roomCode, username, passwordHash } = req.body;
  if (!roomCode || !username) return res.status(400).json({ error: 'Missing parameters' });

  db.get('SELECT id FROM rooms WHERE code = ?', [roomCode.toUpperCase()], (err, room: any) => {
    if (err || !room) return res.status(404).json({ error: 'Room not found' });

    const roomId = room.id;

    // Check count
    db.get('SELECT COUNT(*) as count FROM managers WHERE room_id = ?', [roomId], (err, row: any) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (row.count >= 8) return res.status(403).json({ error: 'Room is full (max 8 humans)' });

      // Find an available division 4 club not managed by human in this room
      db.get(`
        SELECT c.id, c.name FROM clubs c 
        WHERE c.division = 4 
        AND c.id NOT IN (SELECT club_id FROM managers WHERE room_id = ?)
        ORDER BY RANDOM() LIMIT 1
      `, [roomId], (err, club: any) => {
        if (err || !club) return res.status(500).json({ error: 'No available clubs for joining' });

        db.run(
          'INSERT INTO managers (username, password_hash, club_id, is_founder, room_id) VALUES (?, ?, ?, 0, ?)',
          [username, passwordHash || 'demo', club.id, roomId],
          function(err) {
            if (err) return res.status(500).json({ error: 'Error joining room / Username taking' });
            
            res.json({ message: 'Joined successfully', managerId: this.lastID, club });
          }
        );
      });
    });
  });
});

export default router;
