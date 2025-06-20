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
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  Link
} from '@mui/material';
import { Menu as MenuIcon, Settings as SettingsIcon, Logout as LogoutIcon } from '@mui/icons-material';
import EmailReceivedTable from './pages/EmailReceivedTable';
import PreScreenCompletedTable from './pages/PreScreenCompletedTable';
import EligibleParticipantsTable from './pages/EligibleParticipantsTable';
import BookingScheduledTable from './pages/BookingScheduledTable';
import BookingsTable from './pages/BookingsTable';
import SettingsPage from './pages/SettingsPage';
import { useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

const navLinks = [
  { text: 'Emails', path: '/email-received' },
  { text: 'Surveys', path: '/pre-screen-completed' },
  { text: 'Awaiting Booking', path: '/eligibility-confirmed' },
  { text: 'Approve Bookings', path: '/booking-scheduled' },
  { text: 'Bookings', path: '/bookings' },
  { text: 'Settings', path: '/settings' },
];

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Menu
      </Typography>
      <List>
        {navLinks.map((link) => (
          <ListItem button component={RouterLink} to={link.path} key={link.text}>
            <ListItemText primary={link.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
              {navLinks.map((link) => (
                <Link
                  component={RouterLink}
                  to={link.path}
                  key={link.text}
                  sx={{
                    textDecoration: 'none',
                    color: 'inherit',
                    mr: 4,
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {link.text}
                </Link>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />

          <IconButton
            color="inherit"
            component={RouterLink}
            to="/settings"
            aria-label="settings"
          >
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout} aria-label="logout">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <Routes>
                        <Route path="/" element={<Navigate to="/email-received" replace />} />
                        <Route path="/email-received" element={<EmailReceivedTable />} />
                        <Route path="/pre-screen-completed" element={<PreScreenCompletedTable />} />
                        <Route path="/eligibility-confirmed" element={<EligibleParticipantsTable />} />
                        <Route path="/booking-scheduled" element={<BookingScheduledTable />} />
                        <Route path="/bookings" element={<BookingsTable />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/email-received" replace />} />
                      </Routes>
                    </Box>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Box>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;