import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider, createTheme, Button } from '@mui/material';
import EmailReceivedTable from './pages/EmailReceivedTable';
import PreScreenCompletedTable from './pages/PreScreenCompletedTable';
import EligibilityConfirmedTable from './pages/EligibilityConfirmedTable';
import BookingScheduledTable from './pages/BookingScheduledTable';
import { useAuth } from './contexts/AuthContext';

const theme = createTheme();

// Navbar component
const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav style={{
      display: 'flex',
      gap: 24,
      padding: '16px 32px',
      background: '#f3f4f6',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: 32,
      alignItems: 'center',
    }}>
      <Link to="/email-received" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 600 }}>Email Received</Link>
      <Link to="/pre-screen-completed" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 600 }}>Pre-Screen Completed</Link>
      <Link to="/eligibility-confirmed" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 600 }}>Eligibility Confirmed</Link>
      <Link to="/booking-scheduled" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 600 }}>Booking Scheduled</Link>
      <div style={{ marginLeft: 'auto' }}>
        <Button variant="outlined" color="primary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </nav>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/email-received" replace />} />
            
            <Route
              path="/email-received"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <EmailReceivedTable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pre-screen-completed"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <PreScreenCompletedTable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eligibility-confirmed"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <EligibilityConfirmedTable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-scheduled"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <BookingScheduledTable />
                </ProtectedRoute>
              }
            />

            {/* Catch all route - redirect to email-received */}
            <Route path="*" element={<Navigate to="/email-received" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;