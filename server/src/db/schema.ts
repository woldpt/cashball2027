export const schemaSQL = `
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  current_season INTEGER DEFAULT 1,
  current_week INTEGER DEFAULT 1,
  game_state TEXT DEFAULT 'PRE_EPOCA',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  division INTEGER NOT NULL,
  stadium_capacity INTEGER DEFAULT 10000,
  balance INTEGER DEFAULT 0,
  loan_debt INTEGER DEFAULT 0,
  moral INTEGER DEFAULT 50,
  room_id INTEGER,
  FOREIGN KEY(room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS managers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  club_id INTEGER,
  status TEXT DEFAULT 'ACTIVE',
  is_founder BOOLEAN DEFAULT 0,
  room_id INTEGER,
  FOREIGN KEY(club_id) REFERENCES clubs(id),
  FOREIGN KEY(room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  club_id INTEGER,
  position TEXT NOT NULL, -- GR, DEF, MED, ATA
  quality INTEGER NOT NULL, -- 1 to 50
  salary INTEGER NOT NULL,
  aggressiveness INTEGER NOT NULL, -- 1 to 5
  craque BOOLEAN DEFAULT 0,
  FOREIGN KEY(club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  competition TEXT NOT NULL, -- 'LEAGUE' or 'CUP'
  home_club_id INTEGER,
  away_club_id INTEGER,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  simulation_report TEXT, -- JSON
  FOREIGN KEY(room_id) REFERENCES rooms(id),
  FOREIGN KEY(home_club_id) REFERENCES clubs(id),
  FOREIGN KEY(away_club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS tactics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL,
  club_id INTEGER NOT NULL,
  formation TEXT DEFAULT '4-3-3',
  style TEXT DEFAULT 'EQUILIBRADO',
  submitted BOOLEAN DEFAULT 0,
  starting_eleven TEXT, -- JSON array of player_ids
  subs TEXT, -- JSON array of player_ids
  FOREIGN KEY(match_id) REFERENCES matches(id),
  FOREIGN KEY(club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  seller_club_id INTEGER NOT NULL,
  asking_price INTEGER NOT NULL,
  listing_type TEXT NOT NULL, -- 'LIST' or 'AUCTION'
  status TEXT DEFAULT 'ACTIVE',
  auction_ends_at DATETIME,
  current_highest_bid INTEGER DEFAULT 0,
  highest_bidder_club_id INTEGER,
  FOREIGN KEY(player_id) REFERENCES players(id),
  FOREIGN KEY(seller_club_id) REFERENCES clubs(id),
  FOREIGN KEY(highest_bidder_club_id) REFERENCES clubs(id)
);
`;
