const Database = require('better-sqlite3');
const db = new Database('./data/study.db'); // Adjust path if needed

// 1. Create table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    name TEXT,
    age INTEGER,
    pre_screen_data TEXT,
    created_at TEXT NOT NULL
  )
`).run();

// 2. Add missing columns if they don't exist
const requiredColumns = [
  { name: 'booking_time', type: 'TEXT' },
  { name: 'cancel_link', type: 'TEXT' },
  { name: 'reschedule_link', type: 'TEXT' },
  { name: 'survey_link', type: 'TEXT' }
];

const pragma = db.prepare("PRAGMA table_info(participants)").all();
const existingColumns = pragma.map(col => col.name);

for (const col of requiredColumns) {
  if (!existingColumns.includes(col.name)) {
    db.prepare(`ALTER TABLE participants ADD COLUMN ${col.name} ${col.type}`).run();
    console.log(`Added column: ${col.name}`);
  }
}

console.log('Migration complete!');
db.close();