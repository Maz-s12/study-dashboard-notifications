# Database Upload Functionality Setup

This guide explains the database upload functionality for the research study dashboard.

## ✅ Features Implemented

1. **Settings Page**: A new settings page accessible from the navigation
2. **Database Info Display**: Shows current database statistics including:
   - File size and last modified date
   - Table names and record counts
3. **Database Upload**: Upload and replace the current database with a new .db file
4. **Automatic Backup**: Creates a backup of the existing database before replacement

## 🚀 Ready to Use

The database upload functionality is now fully implemented and ready to use! You can:

1. Navigate to the Settings page via the "Settings" link in the navigation
2. Upload your own .db files to replace the current database
3. View real-time database statistics
4. Automatic backups are created before any database replacement

## Backend Implementation

The backend includes:
- `src/api/routes/settings.ts` - Settings routes for database operations
- Database upload endpoint: `POST /api/settings/upload-database`
- Database info endpoint: `GET /api/settings/database-info`
- Full multer integration for file uploads

## Frontend Implementation

The frontend includes:
- `client/src/pages/SettingsPage.tsx` - Settings page component
- Modern UI with Material-UI components
- File upload interface with validation
- Real-time database statistics display

## Security Features

- File type validation (only .db files allowed)
- File size limit (50MB)
- SQLite database validation before replacement
- Automatic backup creation
- Authentication required for all operations

## File Structure

```
src/
├── api/routes/
│   ├── settings.ts          # Database upload routes with multer
│   └── index.ts             # Updated to include settings routes
client/src/
├── pages/
│   └── SettingsPage.tsx     # Settings page component
└── App.tsx                  # Updated with settings route
```

## Railway Deployment

The upload functionality is designed to work with Railway's persistent storage:
- Production uploads go to `/data/uploads`
- Database files are stored in `/data/study.db`
- Backups are created in `/data/` with timestamps

## Usage Instructions

1. Navigate to the Settings page
2. Click "Select Database File" to choose a .db file
3. Click "Upload & Save Changes" to replace the current database
4. A backup of the existing database will be created automatically
5. The page will refresh to show updated database statistics

## Troubleshooting

If you encounter issues:

1. Check that the uploaded file is a valid SQLite database
2. Verify the `/data` directory has write permissions
3. Check the server logs for detailed error messages
4. Ensure the file size is under 50MB 