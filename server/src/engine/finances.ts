import { db } from '../db';
import { getIo } from '../socket';

/**
 * Calculates ticket sales for the home club based on stadium capacity and attendance.
 * Attendance factor incorporates a base percentage + random variation.
 */
export function processMatchRevenue(homeClubId: number, scoreA: number, scoreB: number): Promise<void> {
  return new Promise((resolve) => {
    db.get('SELECT stadium_capacity, moral, room_id FROM clubs WHERE id = ?', [homeClubId], (err, club: any) => {
      if (err || !club) return resolve();

      // Attendance calc: base 60% + moral influence (max 25%) + random variance
      let attendancePct = 0.60 + ((club.moral / 100) * 0.25) + (Math.random() * 0.15);
      if (attendancePct > 1) attendancePct = 1;

      // Ensure some bonus if win
      if (scoreA > scoreB) attendancePct = Math.min(1.0, attendancePct + 0.1);

      const attendance = Math.floor(club.stadium_capacity * attendancePct);
      const ticketPrice = 15; // €15 flat rate 
      const revenue = attendance * ticketPrice;

      db.serialize(() => {
        db.run('UPDATE clubs SET balance = balance + ? WHERE id = ?', [revenue, homeClubId]);
        
        // Broadcast the specific club's update
        getIo().to(club.room_id.toString()).emit('finance_update', { 
            clubId: homeClubId, 
            message: `Receita de Bilheteira: €${revenue.toLocaleString()} (${attendance} espectantes)`
        });
        
        resolve();
      });
    });
  });
}

/**
 * Weekly cycle that deducts all active player salaries from their clubs.
 * Converts negative balances into loans with interest.
 */
export function processWeeklyFinances(roomId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // Determine the sum of player salaries for each club in this room
    db.all(`
      SELECT c.id as club_id, c.balance, c.loan_debt, IFNULL(SUM(p.salary), 0) as total_salaries
      FROM clubs c
      LEFT JOIN players p ON p.club_id = c.id
      WHERE c.room_id = ?
      GROUP BY c.id
    `, [roomId], (err, clubs: any[]) => {
      if (err) return reject(err);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const updateStmt = db.prepare('UPDATE clubs SET balance = ?, loan_debt = ? WHERE id = ?');

        for (const club of clubs) {
          let newBalance = club.balance - club.total_salaries;
          let newDebt = club.loan_debt;

          // Process 2.5% interest on existing debt
          if (newDebt > 0) {
            newDebt = Math.floor(newDebt * 1.025);
          }

          // Force bankruptcy net
          if (newBalance < 0) {
            const shortFall = Math.abs(newBalance);
            newDebt += shortFall;
            newBalance = 0; // The loan covers the immediate overdraft
          }

          updateStmt.run(newBalance, newDebt, club.club_id);
        }

        updateStmt.finalize();

        db.run('COMMIT', (err) => {
          if (err) return reject(err);
          // Broadcast so dashboard sees new balances naturally 
          getIo().to(roomId.toString()).emit('finance_cycle_complete');
          resolve();
        });
      });
    });
  });
}
