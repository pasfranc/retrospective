import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'retro.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDatabase() {
  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      facilitator_email TEXT NOT NULL,
      votes_per_person INTEGER NOT NULL,
      current_phase TEXT NOT NULL DEFAULT 'waiting',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Participants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('facilitator', 'participant')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'joined')),
      joined_at INTEGER,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      UNIQUE(session_id, email)
    )
  `);

  // Notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      author_email TEXT NOT NULL,
      column TEXT NOT NULL CHECK(column IN ('start', 'stop', 'continue')),
      text TEXT NOT NULL,
      group_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // Groups table
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      column TEXT NOT NULL CHECK(column IN ('start', 'stop', 'continue', 'mixed')),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // Votes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      email TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('note', 'group')),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      UNIQUE(session_id, email, target_id)
    )
  `);

  // Action items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      title TEXT NOT NULL,
      assignee TEXT NOT NULL,
      linked_to TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully');
}

// Initialize the database BEFORE creating prepared statements
initDatabase();

// Session queries
export const sessionQueries = {
  create: db.prepare(`
    INSERT INTO sessions (id, facilitator_email, votes_per_person, current_phase, created_at, updated_at)
    VALUES (?, ?, ?, 'waiting', ?, ?)
  `),

  getById: db.prepare(`
    SELECT * FROM sessions WHERE id = ?
  `),

  updatePhase: db.prepare(`
    UPDATE sessions SET current_phase = ?, updated_at = ? WHERE id = ?
  `),

  delete: db.prepare(`
    DELETE FROM sessions WHERE id = ?
  `)
};

// Participant queries
export const participantQueries = {
  create: db.prepare(`
    INSERT INTO participants (session_id, email, role, status, joined_at)
    VALUES (?, ?, ?, 'pending', NULL)
  `),

  getBySession: db.prepare(`
    SELECT * FROM participants WHERE session_id = ? ORDER BY role DESC, joined_at ASC
  `),

  updateStatus: db.prepare(`
    UPDATE participants SET status = 'joined', joined_at = ? WHERE session_id = ? AND email = ?
  `),

  getByEmail: db.prepare(`
    SELECT * FROM participants WHERE session_id = ? AND email = ?
  `)
};

// Note queries
export const noteQueries = {
  create: db.prepare(`
    INSERT INTO notes (id, session_id, author_email, column, text, group_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  getBySession: db.prepare(`
    SELECT * FROM notes WHERE session_id = ? ORDER BY created_at ASC
  `),

  updateGroup: db.prepare(`
    UPDATE notes SET group_id = ? WHERE id = ?
  `),

  delete: db.prepare(`
    DELETE FROM notes WHERE id = ?
  `)
};

// Group queries
export const groupQueries = {
  create: db.prepare(`
    INSERT INTO groups (id, session_id, title, column, created_at)
    VALUES (?, ?, ?, ?, ?)
  `),

  getBySession: db.prepare(`
    SELECT * FROM groups WHERE session_id = ? ORDER BY created_at ASC
  `),

  updateTitle: db.prepare(`
    UPDATE groups SET title = ? WHERE id = ?
  `),

  updateColumn: db.prepare(`
    UPDATE groups SET column = ? WHERE id = ?
  `),

  delete: db.prepare(`
    DELETE FROM groups WHERE id = ?
  `)
};

// Vote queries
export const voteQueries = {
  cast: db.prepare(`
    INSERT INTO votes (session_id, email, target_id, target_type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `),

  remove: db.prepare(`
    DELETE FROM votes WHERE session_id = ? AND email = ? AND target_id = ?
  `),

  getBySession: db.prepare(`
    SELECT * FROM votes WHERE session_id = ?
  `),

  countByUser: db.prepare(`
    SELECT COUNT(*) as count FROM votes WHERE session_id = ? AND email = ?
  `),

  countByTarget: db.prepare(`
    SELECT COUNT(*) as count FROM votes WHERE session_id = ? AND target_id = ?
  `)
};

// Action item queries
export const actionQueries = {
  create: db.prepare(`
    INSERT INTO action_items (id, session_id, title, assignee, linked_to, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  getBySession: db.prepare(`
    SELECT * FROM action_items WHERE session_id = ? ORDER BY created_at ASC
  `),

  delete: db.prepare(`
    DELETE FROM action_items WHERE id = ?
  `)
};

export default db;
