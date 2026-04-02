import { db } from './index';
import fs from 'fs';
import path from 'path';

const CLUBS_PATH = path.resolve(__dirname, './fixtures/clubs.json');
const NAMES_PATH = path.resolve(__dirname, './fixtures/names.json');

const clubsData = JSON.parse(fs.readFileSync(CLUBS_PATH, 'utf-8'));
const namesData = JSON.parse(fs.readFileSync(NAMES_PATH, 'utf-8'));

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName() {
  const first = namesData[randomInt(0, namesData.length - 1)];
  const last = namesData[randomInt(0, namesData.length - 1)];
  return `${first} ${last}`;
}

/**
 * Seeds clubs and players for a SPECIFIC room.
 * Each room gets its own copy of 32 clubs + players.
 */
export function seedRoomData(roomId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const clubStmt = db.prepare('INSERT INTO clubs (name, division, balance, room_id) VALUES (?, ?, ?, ?)');
      const playerStmt = db.prepare('INSERT INTO players (name, club_id, position, quality, salary, aggressiveness, craque) VALUES (?, ?, ?, ?, ?, ?, ?)');

      // We need to track club IDs as they are inserted
      let insertedCount = 0;
      const totalClubs = clubsData.length;

      clubsData.forEach((club: any) => {
        const initialBalance = Math.floor(1000000 / club.division);
        
        clubStmt.run([club.name, club.division, initialBalance, roomId], function(this: any, err: any) {
          if (err) { console.error('Seed club error:', err); return; }
          
          const clubId = this.lastID;
          const baseQuality = 50 - (club.division * 10);

          const generatePlayers = (count: number, position: string) => {
            for (let i = 0; i < count; i++) {
              const q = randomInt(Math.max(1, baseQuality - 5), Math.min(50, baseQuality + 10));
              const ag = randomInt(1, 5);
              const salary = q * 100;
              let craque = 0;
              if ((position === 'MED' || position === 'ATA') && Math.random() < 0.1) {
                craque = 1;
              }
              playerStmt.run([randomName(), clubId, position, q, salary, ag, craque]);
            }
          };

          generatePlayers(2, 'GR');
          generatePlayers(6, 'DEF');
          generatePlayers(6, 'MED');
          generatePlayers(4, 'ATA');

          insertedCount++;
          if (insertedCount === totalClubs) {
            clubStmt.finalize();
            playerStmt.finalize();
            db.run('COMMIT', (err) => {
              if (err) return reject(err);
              console.log(`[SEED] Room ${roomId}: ${totalClubs} clubs and players seeded.`);
              resolve();
            });
          }
        });
      });
    });
  });
}

// Legacy: seed without room (for direct CLI usage)
export function runSeed() {
  db.serialize(() => {
    db.run("DELETE FROM players");
    db.run("DELETE FROM clubs");
    console.log('Seeding clubs and players (legacy mode, no room_id)...');

    const clubStmt = db.prepare('INSERT INTO clubs (name, division, balance) VALUES (?, ?, ?)');
    const playerStmt = db.prepare('INSERT INTO players (name, club_id, position, quality, salary, aggressiveness, craque) VALUES (?, ?, ?, ?, ?, ?, ?)');

    clubsData.forEach((club: any, index: number) => {
      const clubId = index + 1;
      const initialBalance = Math.floor(1000000 / club.division);
      clubStmt.run([club.name, club.division, initialBalance]);

      const baseQuality = 50 - (club.division * 10);
      const generatePlayers = (count: number, position: string) => {
        for (let i = 0; i < count; i++) {
          const q = randomInt(Math.max(1, baseQuality - 5), Math.min(50, baseQuality + 10));
          const ag = randomInt(1, 5);
          const salary = q * 100;
          let craque = 0;
          if ((position === 'MED' || position === 'ATA') && Math.random() < 0.1) {
            craque = 1;
          }
          playerStmt.run([randomName(), clubId, position, q, salary, ag, craque]);
        }
      };

      generatePlayers(2, 'GR');
      generatePlayers(6, 'DEF');
      generatePlayers(6, 'MED');
      generatePlayers(4, 'ATA');
    });

    clubStmt.finalize();
    playerStmt.finalize();
    console.log('Seed complete.');
  });
}

if (require.main === module) {
  setTimeout(() => runSeed(), 1000);
}
