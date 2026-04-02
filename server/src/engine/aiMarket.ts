import { db } from '../db';
import { getIo } from '../socket';

/**
 * Automates bot bidding on auctions that are actively about to expire.
 */
export function evaluateBotsMarket() {
  // Find all ACTIVE auctions
  db.all(`
    SELECT t.id, t.player_id, t.current_highest_bid, t.asking_price, t.highest_bidder_club_id, t.auction_ends_at, t.seller_club_id, p.quality, c.room_id
    FROM transfers t
    JOIN players p ON t.player_id = p.id
    JOIN clubs c ON t.seller_club_id = c.id
    WHERE t.status = 'ACTIVE' AND t.listing_type = 'AUCTION'
  `, [], (err, auctions: any[]) => {
    if (err || !auctions || auctions.length === 0) return;

    db.all(`SELECT id as club_id, balance, room_id FROM clubs`, (err, clubs: any[]) => {
      if (err) return;

      db.all(`SELECT club_id FROM managers WHERE status = 'ACTIVE'`, (err, humans: any[]) => {
        if (err) return;
        const humanSet = new Set(humans.map(h => h.club_id));

        for (const auction of auctions) {
          const currentBid = Math.max(auction.current_highest_bid, auction.asking_price);
          
          // Randomly find a bot club in same room that can afford + 5%
          const eligibleBots = clubs.filter(c => 
            c.room_id === auction.room_id && 
            !humanSet.has(c.club_id) && 
            c.club_id !== auction.seller_club_id &&
            c.club_id !== auction.highest_bidder_club_id &&
            c.balance >= currentBid * 1.05
          );

          if (eligibleBots.length > 0 && Math.random() > 0.5) {
            // Pick a random bot
            const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
            const newBid = Math.floor(currentBid * 1.05);

            // Calculate snipe protection
            let newEndsAt = auction.auction_ends_at;
            const remainingMs = new Date(newEndsAt).getTime() - Date.now();
            if (remainingMs < 15000) {
              newEndsAt = new Date(Date.now() + 15000).toISOString();
            }

            db.run(
              'UPDATE transfers SET current_highest_bid = ?, highest_bidder_club_id = ?, auction_ends_at = ? WHERE id = ?',
              [newBid, bot.club_id, newEndsAt, auction.id],
              () => {
                getIo().to(auction.room_id.toString()).emit('market_update');
                console.log(`[AI] Bot Club ${bot.club_id} placed bid ${newBid} on Transfer ${auction.id}`);
              }
            );
          }
        }
      });
    });
  });
}
