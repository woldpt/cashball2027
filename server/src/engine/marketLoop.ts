import { db } from '../db';
import { getIo } from '../socket';
import { evaluateBotsMarket } from './aiMarket';

// Scans active auctions every second
export function startMarketLoop() {
  setInterval(() => {
    const now = new Date().toISOString();
    
    db.all(`
      SELECT t.id, t.player_id, t.seller_club_id, t.current_highest_bid, t.highest_bidder_club_id, c.room_id
      FROM transfers t
      JOIN clubs c ON t.seller_club_id = c.id
      WHERE t.status = 'ACTIVE' 
      AND t.listing_type = 'AUCTION'
      AND t.auction_ends_at <= ?
    `, [now], (err, rows: any[]) => {
      if (err) return;
      
      if (rows && rows.length > 0) {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Process all completed auctions
          for (const t of rows) {
            if (t.highest_bidder_club_id) {
              // Deduct buyer (should already be validated, but we deduct here)
              // Wait, safe to just deduct here or we lock funds on bid?
              // Standard is deduct on completion. If overdraft, it generates loan_debt in future logic.
              db.run('UPDATE clubs SET balance = balance - ? WHERE id = ?', [t.current_highest_bid, t.highest_bidder_club_id]);
              
              // Credit Seller
              db.run('UPDATE clubs SET balance = balance + ? WHERE id = ?', [t.current_highest_bid, t.seller_club_id]);
              
              // Move Player
              db.run('UPDATE players SET club_id = ? WHERE id = ?', [t.highest_bidder_club_id, t.player_id]);
              
              // Complete Transfer
              db.run('UPDATE transfers SET status = "SOLD" WHERE id = ?', [t.id]);
            } else {
              // No one bid -> Expired without sale
              db.run('UPDATE transfers SET status = "EXPIRED" WHERE id = ?', [t.id]);
            }
          }

          db.run('COMMIT', () => {
            const affectedRooms = new Set(rows.map(r => r.room_id));
            affectedRooms.forEach(roomId => {
              getIo().to(roomId.toString()).emit('market_update');
            });
          });
        });
      }
    });

  }, 1000);

  // Bot logic runs every 10 seconds
  setInterval(() => {
    evaluateBotsMarket();
  }, 10000);
}
