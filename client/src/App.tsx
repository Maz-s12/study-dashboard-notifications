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
  Link,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  ListItemButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import EmailReceivedTable from './pages/EmailReceivedTable';
import PreScreenCompletedTable from './pages/PreScreenCompletedTable';
import EligibleParticipantsTable from './pages/EligibleParticipantsTable';
import BookingScheduledTable from './pages/BookingScheduledTable';
import BookingsTable from './pages/BookingsTable';
import SettingsPage from './pages/SettingsPage';
import { useAuth } from './contexts/AuthContext';

const theme = createTheme();

// Custom hook to manage dropdown menus
const useMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.currentTarget) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return { anchorEl, open, handleClick, handleClose };
};

// Navbar component
const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const mobileMenu = useMenu();
  const notificationsMenu = useMenu();
  const participantsMenu = useMenu();

  const handleNavigate = (path: string) => {
    // Always close all menus before navigating
    mobileMenu.handleClose();
    notificationsMenu.handleClose();
    participantsMenu.handleClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navStructure = [
    {
      name: 'Notifications',
      menu: notificationsMenu,
      items: [
        { name: 'Emails', path: '/email-received' },
        { name: 'Surveys', path: '/pre-screen-completed' },
        { name: 'Approve Bookings', path: '/booking-scheduled' },
      ],
    },
    {
      name: 'Participants',
      menu: participantsMenu,
      items: [
        { name: 'Awaiting Booking', path: '/eligibility-confirmed' },
      ],
    },
    {
      name: 'Bookings',
      path: '/bookings',
    },
  ];

  const renderDesktopMenu = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {navStructure.map((navItem) =>
        navItem.path ? (
          <Link
            key={navItem.name}
            component={RouterLink}
            to={navItem.path}
            variant="button"
            sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
          >
            {navItem.name}
          </Link>
        ) : navItem.menu ? (
          <React.Fragment key={navItem.name}>
            <Button
              aria-controls={`${navItem.name}-menu`}
              aria-haspopup="true"
              onClick={navItem.menu.handleClick}
              endIcon={<ArrowDropDownIcon />}
              sx={{ color: 'text.primary' }}
            >
              {navItem.name}
            </Button>
            <Menu
              id={`${navItem.name}-menu`}
              anchorEl={navItem.menu.anchorEl}
              open={Boolean(navItem.menu.anchorEl)}
              onClose={navItem.menu.handleClose}
              MenuListProps={{ 'aria-labelledby': 'basic-button' }}
            >
              {navItem.items?.map((item) => (
                <MenuItem key={item.name} onClick={() => handleNavigate(item.path)}>
                  {item.name}
                </MenuItem>
              ))}
            </Menu>
          </React.Fragment>
        ) : null
      )}
    </Box>
  );

  const renderMobileMenu = () => (
    <>
      <IconButton size="large" edge="start" color="inherit" aria-label="menu" onClick={mobileMenu.handleClick}>
        <MenuIcon />
      </IconButton>
      <Menu
        anchorEl={mobileMenu.anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(mobileMenu.anchorEl)}
        onClose={mobileMenu.handleClose}
        PaperProps={{ style: { width: '250px' } }}
      >
        <List>
          {navStructure.map((navItem) => (
            <React.Fragment key={navItem.name}>
              {navItem.path ? (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigate(navItem.path)}>
                    <ListItemText primary={navItem.name} />
                  </ListItemButton>
                </ListItem>
              ) : (
                <>
                  <ListSubheader>{navItem.name}</ListSubheader>
                  {navItem.items?.map((item) => (
                    <ListItem key={item.name} disablePadding sx={{ pl: 4 }}>
                      <ListItemButton onClick={() => handleNavigate(item.path)}>
                        <ListItemText primary={item.name} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </>
              )}
            </React.Fragment>
          ))}
        </List>
      </Menu>
    </>
  );

  return (
    <AppBar position="static" color="default" elevation={1} sx={{ backgroundColor: 'white', mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
          Research Dashboard
        </Typography>

        {isMobile ? renderMobileMenu() : renderDesktopMenu()}

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