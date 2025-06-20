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
import { CloudUpload, Storage, Info, CheckCircle, Error, Code, Terminal } from '@mui/icons-material';
import { fetchWithAuth } from '../utils/api';

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
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

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
        setMessage({ type: 'error', text: 'Could not load database information. Please try again.' });
      }
    } catch (error) {
      console.error('Error fetching database info:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
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

      const response = await fetchWithAuth('/api/settings/upload-database', {
        method: 'POST',
        body: formData,
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

  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) {
      setMessage({ type: 'error', text: 'Query cannot be empty.' });
      return;
    }
    setIsExecuting(true);
    setSqlResult(null);
    setMessage(null);
    try {
      const response = await fetchWithAuth('/api/settings/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await response.json();
      if (response.ok) {
        setSqlResult(data.results);
        setMessage({ type: 'success', text: 'Query executed successfully.' });
      } else {
        setSqlResult({ error: data.error });
        setMessage({ type: 'error', text: 'Query failed.' });
      }
    } catch (error) {
      console.error('SQL execution error:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsExecuting(false);
    }
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
      
      {/* SQL Runner Section */}
      <Card elevation={2} sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Terminal sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              SQL Query Runner
            </Typography>
          </Box>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Warning:</strong> Executing queries directly can have unintended consequences. Use with caution.
          </Alert>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            style={{
              width: '100%',
              minHeight: '150px',
              fontFamily: 'monospace',
              fontSize: '14px',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
          <Button
            variant="contained"
            onClick={handleExecuteSql}
            disabled={isExecuting}
            fullWidth
            sx={{ mt: 2 }}
          >
            {isExecuting ? <CircularProgress size={24} /> : 'Execute Query'}
          </Button>

          {sqlResult && (
            <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100', maxHeight: '400px', overflowY: 'auto' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <Code sx={{ mr: 1, fontSize: '16px' }} />
                Results
              </Typography>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(sqlResult, null, 2)}
              </pre>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage; 