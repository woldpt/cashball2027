import sqlite3 from 'sqlite3';
import { schemaSQL } from './schema';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../../cashball.sqlite');

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.exec(schemaSQL, (err) => {
    if (err) {
      console.error('Error applying schema:', err.message);
    } else {
      console.log('Database schema applied successfully.');
    }
  });
}
