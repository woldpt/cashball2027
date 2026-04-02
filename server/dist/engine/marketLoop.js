"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMarketLoop = startMarketLoop;
const db_1 = require("../db");
const socket_1 = require("../socket");
const aiMarket_1 = require("./aiMarket");
// Scans active auctions every second
function startMarketLoop() {
    setInterval(() => {
        const now = new Date().toISOString();
        db_1.db.all(`
      SELECT t.id, t.player_id, t.seller_club_id, t.current_highest_bid, t.highest_bidder_club_id, c.room_id
      FROM transfers t
      JOIN clubs c ON t.seller_club_id = c.id
      WHERE t.status = 'ACTIVE' 
      AND t.listing_type = 'AUCTION'
      AND t.auction_ends_at <= ?
    `, [now], (err, rows) => {
            if (err)
                return;
            if (rows && rows.length > 0) {
                db_1.db.serialize(() => {
                    db_1.db.run('BEGIN TRANSACTION');
                    // Process all completed auctions
                    for (const t of rows) {
                        if (t.highest_bidder_club_id) {
                            // Deduct buyer (should already be validated, but we deduct here)
                            // Wait, safe to just deduct here or we lock funds on bid?
                            // Standard is deduct on completion. If overdraft, it generates loan_debt in future logic.
                            db_1.db.run('UPDATE clubs SET balance = balance - ? WHERE id = ?', [t.current_highest_bid, t.highest_bidder_club_id]);
                            // Credit Seller
                            db_1.db.run('UPDATE clubs SET balance = balance + ? WHERE id = ?', [t.current_highest_bid, t.seller_club_id]);
                            // Move Player
                            db_1.db.run('UPDATE players SET club_id = ? WHERE id = ?', [t.highest_bidder_club_id, t.player_id]);
                            // Complete Transfer
                            db_1.db.run('UPDATE transfers SET status = "SOLD" WHERE id = ?', [t.id]);
                        }
                        else {
                            // No one bid -> Expired without sale
                            db_1.db.run('UPDATE transfers SET status = "EXPIRED" WHERE id = ?', [t.id]);
                        }
                    }
                    db_1.db.run('COMMIT', () => {
                        const affectedRooms = new Set(rows.map(r => r.room_id));
                        affectedRooms.forEach(roomId => {
                            (0, socket_1.getIo)().to(roomId.toString()).emit('market_update');
                        });
                    });
                });
            }
        });
    }, 1000);
    // Bot logic runs every 10 seconds
    setInterval(() => {
        (0, aiMarket_1.evaluateBotsMarket)();
    }, 10000);
}
