import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { 
  ThemeProvider, 
  createTheme, 
  Button,
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  Link
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import EmailReceivedTable from './pages/EmailReceivedTable';
import PreScreenCompletedTable from './pages/PreScreenCompletedTable';
import EligibleParticipantsTable from './pages/EligibleParticipantsTable';
import BookingScheduledTable from './pages/BookingScheduledTable';
import BookingsTable from './pages/BookingsTable';
import SettingsPage from './pages/SettingsPage';
import { useAuth } from './contexts/AuthContext';

const theme = createTheme();

// Navbar component
const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navLinks = [
    { name: 'Emails', path: '/email-received' },
    { name: 'Surveys', path: '/pre-screen-completed' },
    { name: 'Awaiting Booking', path: '/eligibility-confirmed' },
    { name: 'Approve Bookings', path: '/booking-scheduled' },
    { name: 'Bookings', path: '/bookings' },
  ];

  return (
    <AppBar position="static" color="default" elevation={1} sx={{ backgroundColor: 'white', mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
          Research Dashboard
        </Typography>

        {isMobile ? (
          <>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {navLinks.map((link) => (
                <MenuItem key={link.name} onClick={() => handleNavigate(link.path)}>
                  {link.name}
                </MenuItem>
              ))}
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                component={RouterLink}
                to={link.path}
                variant="button"
                sx={{
                  color: 'text.primary',
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {link.name}
              </Link>
            ))}
          </Box>
        )}

        <Box sx={{ flexGrow: isMobile ? 0 : 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" onClick={() => navigate('/settings')}>
            <SettingsIcon />
          </IconButton>
          <Button variant="outlined" color="primary" onClick={handleLogout} sx={{ ml: 1 }}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
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
                  <EligibleParticipantsTable />
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
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <BookingsTable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <SettingsPage />
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