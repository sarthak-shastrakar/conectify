import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Drawer from '@mui/material/Drawer';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import GradientText from '../components/ui/GradientText';
import ThemeToggle from '../components/ui/ThemeToggle';

const NAV_ITEMS = [
  { label: 'Home', icon: <HomeIcon />, path: '/home' },
  { label: 'AI Companion', icon: <SmartToyIcon />, path: '/ai-assistant' },
  { label: 'History', icon: <HistoryIcon />, path: '/history' },
  { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { userData, logout } = useContext(AuthContext);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isDark = theme.palette.mode === 'dark';

  const initials = userData?.name
    ? userData.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: isDark ? 'rgba(5, 8, 16, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '70px', px: { xs: 2, md: 4 } }}>
        
        {/* Left: Brand Logo & Title */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          onClick={() => navigate('/home')}
          sx={{ cursor: 'pointer' }}
        >
          <Typography sx={{ fontSize: '24px', color: theme.palette.primary.light }}>⬡</Typography>
          <GradientText variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>
            Conectify
          </GradientText>
        </Stack>

        {/* Center: Desktop Navigation Items */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
        >
          {NAV_ITEMS.map(({ label, icon, path }) => {
            const active = location.pathname === path;
            return (
              <Button
                key={path}
                onClick={() => navigate(path)}
                startIcon={icon}
                sx={{
                  textTransform: 'none',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.925rem',
                  color: active ? 'primary.light' : 'text.secondary',
                  borderRadius: '12px',
                  px: 2.5,
                  py: 1,
                  background: active ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  border: active ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid transparent',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.05)',
                    color: 'primary.light',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </Button>
            );
          })}
        </Stack>

        {/* Right: Theme Toggle + User Avatar */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          <ThemeToggle />
          
          {userData && (
            <>
              <Tooltip title={userData.name || 'Account'}>
                <Box
                  onClick={handleOpenMenu}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    p: '2px',
                    background: userData.avatar ? 'transparent' : 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <Avatar
                    src={userData.avatar}
                    sx={{
                      width: 40,
                      height: 40,
                      background: userData.avatar ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {!userData.avatar && initials}
                  </Avatar>
                </Box>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                onClick={handleCloseMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: '16px',
                    minWidth: 220,
                    p: 1,
                    boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.5)' : '0 16px 40px rgba(99,102,241,0.06)',
                    background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}`,
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{userData.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>@{userData.username}</Typography>
                </Box>
                <Divider sx={{ my: 1, opacity: 0.5 }} />
                <MenuItem onClick={() => navigate('/profile')} sx={{ borderRadius: '8px', py: 1 }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={logout} sx={{ color: 'error.light', borderRadius: '8px', py: 1 }}>
                  <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.light' }} /></ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Stack>

        {/* Mobile: Hamburger Menu Button */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
          <ThemeToggle />
          <IconButton
            onClick={toggleDrawer(true)}
            sx={{
              ml: 1.5,
              color: 'text.primary',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: '10px',
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

      </Toolbar>

      {/* Mobile Drawer (Slide-out menu) */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: isDark ? 'rgba(10, 15, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            p: 2,
            boxShadow: '-10px 0px 30px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: '20px', color: theme.palette.primary.light }}>⬡</Typography>
            <GradientText variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 800 }}>Conectify</GradientText>
          </Stack>
          <IconButton onClick={toggleDrawer(false)} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* User Info (Mobile) */}
        {userData && (
          <Box
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: '20px',
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Avatar
              src={userData.avatar}
              sx={{
                width: 48,
                height: 48,
                background: userData.avatar ? 'transparent' : 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {!userData.avatar && initials}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight={700} noWrap>{userData.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>@{userData.username}</Typography>
            </Box>
          </Box>
        )}

        {/* Mobile Navigation Links */}
        <List sx={{ mb: 'auto' }}>
          {NAV_ITEMS.map(({ label, icon, path }) => {
            const active = location.pathname === path;
            return (
              <ListItemButton
                key={path}
                onClick={() => {
                  navigate(path);
                  setDrawerOpen(false);
                }}
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  py: 1.5,
                  background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: active ? 'primary.light' : 'text.secondary',
                  borderLeft: active ? '4px solid #7C3AED' : '4px solid transparent',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.05)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{icon}</ListItemIcon>
                <ListItemText primary={label} primaryTypographyProps={{ fontWeight: active ? 700 : 500 }} />
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ my: 2, opacity: 0.5 }} />

        {/* Mobile Logout Button */}
        {userData && (
          <ListItemButton
            onClick={() => {
              setDrawerOpen(false);
              logout();
            }}
            sx={{
              borderRadius: '12px',
              py: 1.5,
              color: 'error.light',
              background: 'rgba(239, 68, 68, 0.05)',
              '&:hover': {
                background: 'rgba(239, 68, 68, 0.1)',
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        )}
      </Drawer>
    </AppBar>
  );
}
