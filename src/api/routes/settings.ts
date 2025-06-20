import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? '/data/uploads' 
      : path.resolve(__dirname, '../../../data/uploads');
    
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    cb(null, `${nameWithoutExt}_${timestamp}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only allow .db files
    if (file.mimetype === 'application/octet-stream' || path.extname(file.originalname).toLowerCase() === '.db') {
      cb(null, true);
    } else {
      cb(new Error('Only .db files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Endpoint to upload and persist .db file
router.post('/upload-database', upload.single('database'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFilePath = req.file.path;
    const originalFileName = req.file.originalname;

    // Validate that it's a valid SQLite database
    try {
      const testDb = new Database(uploadedFilePath);
      // Try to access the database to verify it's valid
      testDb.prepare('SELECT name FROM sqlite_master WHERE type="table"').all();
      testDb.close();
    } catch (dbError) {
      // Clean up invalid file
      fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({ error: 'Invalid SQLite database file' });
    }

    // Define the target database path
    const dataDir = process.env.NODE_ENV === 'production' 
      ? '/data' 
      : path.resolve(__dirname, '../../../data');
    const targetDbPath = path.join(dataDir, 'study.db');

    // Backup existing database if it exists
    if (fs.existsSync(targetDbPath)) {
      const backupPath = path.join(dataDir, `study_backup_${Date.now()}.db`);
      fs.copyFileSync(targetDbPath, backupPath);
      console.log(`Backup created at: ${backupPath}`);
    }

    // Replace the current database with the uploaded one
    fs.copyFileSync(uploadedFilePath, targetDbPath);
    
    // Clean up the uploaded file
    fs.unlinkSync(uploadedFilePath);

    res.json({ 
      success: true, 
      message: 'Database uploaded and persisted successfully',
      originalFileName,
      backupCreated: fs.existsSync(targetDbPath)
    });

  } catch (error) {
    console.error('Error uploading database:', error);
    res.status(500).json({ error: 'Failed to upload database' });
  }
});

// Endpoint to get current database info
router.get('/database-info', (req: Request, res: Response) => {
  try {
    const dataDir = process.env.NODE_ENV === 'production' 
      ? '/data' 
      : path.resolve(__dirname, '../../../data');
    const dbPath = path.join(dataDir, 'study.db');

    if (!fs.existsSync(dbPath)) {
      return res.json({ 
        exists: false, 
        message: 'No database file found' 
      });
    }

    const stats = fs.statSync(dbPath);
    const db = new Database(dbPath);
    
    // Get table information
    const tables = db.prepare('SELECT name FROM sqlite_master WHERE type="table"').all();
    
    // Get row counts for each table
    const tableStats = tables.map((table: any) => {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
      return {
        name: table.name,
        rowCount: count.count
      };
    });

    db.close();

    res.json({
      exists: true,
      fileName: 'study.db',
      fileSize: stats.size,
      lastModified: stats.mtime,
      tables: tableStats
    });

  } catch (error) {
    console.error('Error getting database info:', error);
    res.status(500).json({ error: 'Failed to get database info' });
  }
});

export default router; 