import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import { CloudUpload, Storage, Info, CheckCircle, Error } from '@mui/icons-material';
import { fetchWithAuth, API_BASE_URL } from '../utils/api';

interface DatabaseInfo {
  exists: boolean;
  fileName?: string;
  fileSize?: number;
  lastModified?: string;
  tables?: Array<{
    name: string;
    rowCount: number;
  }>;
  message?: string;
}

const SettingsPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch database info on component mount
  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/settings/database-info');
      
      if (response.ok) {
        const data = await response.json();
        setDatabaseInfo(data);
      } else {
        console.error('Failed to fetch database info');
        setMessage({ type: 'error', text: 'Failed to fetch database info.' });
      }
    } catch (error) {
      console.error('Error fetching database info:', error);
      setMessage({ type: 'error', text: 'An error occurred while fetching database info.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.db')) {
        setSelectedFile(file);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: 'Please select a .db file' });
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('database', selectedFile);

      // We need to use fetchWithAuth but it defaults to 'application/json'
      // so we create a custom fetch for multipart/form-data
      const token = await (await import('../config/firebase')).auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/settings/upload-database`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type' is set automatically by the browser for FormData
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setSelectedFile(null);
        // Refresh database info
        await fetchDatabaseInfo();
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Database Upload Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Storage sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Database Upload
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload a new SQLite database file (.db) to replace the current database. 
                A backup of the existing database will be created automatically.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <input
                  accept=".db"
                  style={{ display: 'none' }}
                  id="database-file-input"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="database-file-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Select Database File
                  </Button>
                </label>

                {selectedFile && (
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" fontWeight={500}>
                      Selected: {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Size: {formatFileSize(selectedFile.size)}
                    </Typography>
                  </Paper>
                )}
              </Box>

              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                fullWidth
                sx={{ mb: 2 }}
              >
                {uploading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Uploading...
                  </>
                ) : (
                  'Upload & Save Changes'
                )}
              </Button>

              {message && (
                <Alert 
                  severity={message.type} 
                  sx={{ mt: 2 }}
                  icon={message.type === 'success' ? <CheckCircle /> : <Error />}
                >
                  {message.text}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Database Info Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Info sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Current Database
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : databaseInfo?.exists ? (
                <Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      File Name
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {databaseInfo.fileName}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      File Size
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatFileSize(databaseInfo.fileSize || 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Last Modified
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(databaseInfo.lastModified || '')}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tables & Records
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Table</TableCell>
                          <TableCell align="right">Records</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {databaseInfo.tables?.map((table) => (
                          <TableRow key={table.name}>
                            <TableCell>
                              <Chip 
                                label={table.name} 
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={500}>
                                {table.rowCount.toLocaleString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Alert severity="warning">
                  {databaseInfo?.message || 'No database file found'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage; 