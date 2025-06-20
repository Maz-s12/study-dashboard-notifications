import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Get the absolute path to the database file
const dbPath = path.resolve(__dirname, '../../data/study.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Initializing database at:', dbPath);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

try {
  // Create notifications table with email-specific fields
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      email TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL,
      email_subject TEXT,
      email_body TEXT,
      data TEXT
    )
  `);
  console.log('Notifications table created/verified');

  // Create participants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      name TEXT,
      age REAL,
      pre_screen_data TEXT,
      created_at TEXT NOT NULL,
      booking_time TEXT,
      cancel_link TEXT,
      reschedule_link TEXT,
      survey_link TEXT
    )
  `);
  console.log('Participants table created/verified');

  // Debug: List all notifications
  const notifications = db.prepare('SELECT * FROM notifications').all();
  console.log('Current notifications in database:', notifications);

} catch (error) {
  console.error('Error setting up database:', error);
  throw error;
}

export default db; 