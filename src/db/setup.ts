import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Define the database path based on the environment
const dataDir = process.env.NODE_ENV === 'production' 
  ? '/data' 
  : path.resolve(__dirname, '../../data');

const dbPath = path.join(dataDir, 'study.db');

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Initializing database at:', dbPath);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

try {
  // Create emails table with email-specific fields
  db.exec(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      email_address TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL,
      email_subject TEXT,
      email_body TEXT
    )
  `);
  console.log('Emails table created/verified');

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
      survey_link TEXT,
      prescreen_approval_date TEXT
    )
  `);
  console.log('Participants table created/verified');

  // Create bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      booking_time TEXT NOT NULL,
      booking_time_est TEXT,
      cancel_link TEXT,
      reschedule_link TEXT,
      survey_link TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (participant_id) REFERENCES participants (id)
    )
  `);
  console.log('Bookings table created/verified');

  // Debug: List all emails
  const emails = db.prepare('SELECT * FROM emails').all();
  console.log('Current emails in database:', emails);

} catch (error) {
  console.error('Error setting up database:', error);
  throw error;
}

export default db; 