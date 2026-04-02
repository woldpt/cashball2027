import { db } from './src/db/index';
import { seedRoomData } from './src/db/seed';

process.on('unhandledRejection', (e) => { console.error('ERR:', e); process.exit(1); });

setTimeout(() => {
  db.run('INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (999, ?, ?)', ['t', 'x'], () => {
    db.run('INSERT INTO rooms (code, founder_id) VALUES (?, ?)', ['FIXTUR', 999], async function(err) {
      if (err) { console.error('Room err:', err.message); process.exit(1); }
      const rId = this.lastID;
      await seedRoomData(rId);
      db.get('SELECT COUNT(*) as c FROM clubs WHERE room_id = ?', [rId], (e, r: any) => {
        console.log(`Clubs: ${r.c}`);
        db.get('SELECT COUNT(*) as c FROM players WHERE club_id IN (SELECT id FROM clubs WHERE room_id = ?)', [rId], (e, r: any) => {
          console.log(`Players: ${r.c} (expected: ${36*24}=${36*24})`);
          db.all('SELECT c.name, c.division, COUNT(p.id) as squad FROM clubs c LEFT JOIN players p ON p.club_id=c.id WHERE c.room_id=? GROUP BY c.id ORDER BY c.division, c.name', [rId], (e, rows: any) => {
            rows.forEach((r: any) => console.log(`  Div${r.division} ${r.name}: ${r.squad} jogadores`));
            // Cleanup
            db.run('DELETE FROM players WHERE club_id IN (SELECT id FROM clubs WHERE room_id = ?)', [rId]);
            db.run('DELETE FROM clubs WHERE room_id = ?', [rId]);
            db.run('DELETE FROM rooms WHERE code = ?', ['FIXTUR']);
            db.run('DELETE FROM users WHERE id = 999', () => { process.exit(0); });
          });
        });
      });
    });
  });
}, 2000);
