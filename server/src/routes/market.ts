import { Router } from 'express';
import { db } from '../db';
import { authMiddleware } from './auth';
import { getIo } from '../socket';

const router = Router();
router.use(authMiddleware);

// Helper function to safely execute DB queries
const executeDb = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getDb = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allDb = (query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// 1. Get Market Listings for a Room
router.get('/', async (req: any, res) => {
  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ error: 'Missing roomId' });

  try {
    const activeTransfers = await allDb(`
      SELECT 
        t.id, t.player_id, t.seller_club_id, t.asking_price, t.listing_type, 
        t.status, t.auction_ends_at, t.current_highest_bid, t.highest_bidder_club_id,
        p.name as player_name, p.position, p.quality, p.craque,
        c.name as seller_club_name,
        bc.name as highest_bidder_club_name
      FROM transfers t
      JOIN players p ON t.player_id = p.id
      JOIN clubs c ON t.seller_club_id = c.id
      LEFT JOIN clubs bc ON t.highest_bidder_club_id = bc.id
      WHERE t.status = 'ACTIVE' AND c.room_id = ?
    `, [roomId]);

    res.json({ transfers: activeTransfers });
  } catch (err) {
    res.status(500).json({ error: 'DB Error' });
  }
});

// 2. List a Player
router.post('/list', async (req: any, res) => {
  const userId = req.user.id;
  const { roomId, playerId, askingPrice, type } = req.body; // type = 'LIST' or 'AUCTION'

  if (!roomId || !playerId || !askingPrice || !type) return res.status(400).json({ error: 'Missing logic' });

  try {
    // Validate manager
    const manager = await getDb('SELECT club_id FROM managers WHERE user_id = ? AND room_id = ? AND status = ?', [userId, roomId, 'ACTIVE']);
    if (!manager) return res.status(403).json({ error: 'Not a manager here' });

    // Validate player belongs to manager's club
    const player = await getDb('SELECT id, club_id FROM players WHERE id = ?', [playerId]);
    if (!player || player.club_id !== manager.club_id) return res.status(403).json({ error: 'Player does not belong to your club' });

    // Check if already actively listed
    const existingListing = await getDb('SELECT id FROM transfers WHERE player_id = ? AND status = "ACTIVE"', [playerId]);
    if (existingListing) return res.status(400).json({ error: 'Player already listed' });

    const endsAt = type === 'AUCTION' ? new Date(Date.now() + 2 * 60 * 1000).toISOString() : null;

    db.run(
      'INSERT INTO transfers (player_id, seller_club_id, asking_price, listing_type, auction_ends_at) VALUES (?, ?, ?, ?, ?)',
      [playerId, manager.club_id, askingPrice, type, endsAt],
      () => {
        getIo().to(roomId.toString()).emit('market_update');
        res.json({ message: 'Player listed successfully' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'DB Error' });
  }
});

// 3. Bid on an AUCTION
router.post('/bid', async (req: any, res) => {
  const userId = req.user.id;
  const { roomId, transferId, bidAmount } = req.body;

  try {
    const manager = await getDb('SELECT club_id FROM managers WHERE user_id = ? AND room_id = ? AND status = ?', [userId, roomId, 'ACTIVE']);
    if (!manager) return res.status(403).json({ error: 'Unauthorized' });

    const transfer = await getDb('SELECT * FROM transfers WHERE id = ? AND status = "ACTIVE"', [transferId]);
    if (!transfer) return res.status(404).json({ error: 'Transfer not active' });
    if (transfer.listing_type !== 'AUCTION') return res.status(400).json({ error: 'This is not an auction' });
    if (transfer.seller_club_id === manager.club_id) return res.status(400).json({ error: 'Cannot bid on your own player' });
    
    const currentHighBid = Math.max(transfer.current_highest_bid, transfer.asking_price);
    if (bidAmount <= currentHighBid) return res.status(400).json({ error: 'Bid must be higher than ' + currentHighBid });

    // Check balance
    const club = await getDb('SELECT balance FROM clubs WHERE id = ?', [manager.club_id]);
    if (club.balance < bidAmount) return res.status(400).json({ error: 'Insufficient funds' });

    // Snipe Protection (Extend by 15s if < 15s remaining)
    let newEndsAt = transfer.auction_ends_at;
    const endsAtMs = new Date(newEndsAt).getTime();
    const remainingMs = endsAtMs - Date.now();
    if (remainingMs < 15000) {
      newEndsAt = new Date(Date.now() + 15000).toISOString();
    }

    db.run(
      'UPDATE transfers SET current_highest_bid = ?, highest_bidder_club_id = ?, auction_ends_at = ? WHERE id = ?',
      [bidAmount, manager.club_id, newEndsAt, transferId],
      () => {
        getIo().to(roomId.toString()).emit('market_update');
        res.json({ message: 'Bid successful' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'DB Error' });
  }
});

// 4. Buy Out a LIST
router.post('/buy', async (req: any, res) => {
  const userId = req.user.id;
  const { roomId, transferId } = req.body;

  try {
    const manager = await getDb('SELECT club_id FROM managers WHERE user_id = ? AND room_id = ? AND status = ?', [userId, roomId, 'ACTIVE']);
    if (!manager) return res.status(403).json({ error: 'Unauthorized' });

    const transfer = await getDb('SELECT * FROM transfers WHERE id = ? AND status = "ACTIVE"', [transferId]);
    if (!transfer) return res.status(404).json({ error: 'Transfer not active' });
    if (transfer.listing_type !== 'LIST') return res.status(400).json({ error: 'This is not a direct buy' });
    if (transfer.seller_club_id === manager.club_id) return res.status(400).json({ error: 'Cannot buy your own player' });

    const price = transfer.asking_price;
    const club = await getDb('SELECT balance FROM clubs WHERE id = ?', [manager.club_id]);
    if (club.balance < price) return res.status(400).json({ error: 'Insufficient funds' });

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      // Deduct buyer
      db.run('UPDATE clubs SET balance = balance - ? WHERE id = ?', [price, manager.club_id]);
      // Add seller
      db.run('UPDATE clubs SET balance = balance + ? WHERE id = ?', [price, transfer.seller_club_id]);
      // Transfer player
      db.run('UPDATE players SET club_id = ? WHERE id = ?', [manager.club_id, transfer.player_id]);
      // Mark as sold
      db.run('UPDATE transfers SET status = "SOLD" WHERE id = ?', [transferId]);
      
      db.run('COMMIT', () => {
        getIo().to(roomId.toString()).emit('market_update');
        res.json({ message: 'Purchase successful' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'DB Error' });
  }
});

export default router;
