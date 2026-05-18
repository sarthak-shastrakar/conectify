import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import HomeIcon from '@mui/icons-material/Home';
import VideocamIcon from '@mui/icons-material/Videocam';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import GradientText from '../components/ui/GradientText';
import ThemeToggle from '../components/ui/ThemeToggle';

const NAV_ITEMS = [
  { label: 'Home', icon: <HomeIcon />, path: '/home' },
  { label: 'History', icon: <HistoryIcon />, path: '/history' },
  { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
];

/**
 * AppSidebar — collapsible sidebar nav for dashboard pages.
 * Collapses to 72px (icon-only) on desktop, hidden on mobile.
 */
export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { userData, logout } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);
  const isDark = theme.palette.mode === 'dark';

  const initials = userData?.name
    ? userData.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <Box
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        width: expanded ? 240 : 72,
        transition: 'width 0.3s ease',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
        flexShrink: 0,
        background: isDark ? 'rgba(5,8,16,0.92)' : 'rgba(240,242,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: `1px solid ${theme.palette.divider}`,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 2, py: 2.5, minHeight: 64, overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => navigate('/home')}
      >
        <Typography sx={{ fontSize: '24px', color: theme.palette.primary.light, flexShrink: 0 }}>⬡</Typography>
        {expanded && (
          <GradientText variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Conectify
          </GradientText>
        )}
      </Stack>

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1, pt: 1 }}>
        {NAV_ITEMS.map(({ label, icon, path }) => {
          const active = location.pathname === path;
          return (
            <Tooltip key={path} title={!expanded ? label : ''} placement="right">
              <ListItemButton
                onClick={() => navigate(path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  minHeight: 48,
                  px: expanded ? 2 : 1.5,
                  justifyContent: expanded ? 'flex-start' : 'center',
                  background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                  borderLeft: active ? '3px solid #7C3AED' : '3px solid transparent',
                  color: active ? 'primary.light' : 'text.secondary',
                  '&:hover': {
                    background: 'rgba(124,58,237,0.08)',
                    transform: 'translateX(2px)',
                    color: 'primary.light',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: expanded ? 40 : 0 }}>{icon}</ListItemIcon>
                {expanded && <ListItemText primary={label} primaryTypographyProps={{ fontWeight: active ? 600 : 400, fontSize: '0.9rem' }} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Bottom section */}
      <Box sx={{ px: 1, pb: 2 }}>
        {/* Theme toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <ThemeToggle />
        </Box>

        {/* Logout */}
        <Tooltip title={!expanded ? 'Logout' : ''} placement="right">
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: 2, minHeight: 44,
              px: expanded ? 2 : 1.5,
              justifyContent: expanded ? 'flex-start' : 'center',
              color: 'error.light',
              '&:hover': { background: 'rgba(220,38,38,0.08)' },
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: expanded ? 40 : 0 }}><LogoutIcon /></ListItemIcon>
            {expanded && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem' }} />}
          </ListItemButton>
        </Tooltip>

        {/* User avatar */}
        {userData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
            <Tooltip title={expanded ? '' : userData.name || 'Profile'} placement="right">
              <Box
                sx={{
                  width: 44, height: 44, borderRadius: '50%', p: '2px',
                  background: userData.avatar ? 'transparent' : 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                }}
                onClick={() => navigate('/profile')}
              >
                <Avatar src={userData.avatar} sx={{ width: 40, height: 40, background: userData.avatar ? 'transparent' : 'rgba(255,255,255,0.2)', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                  {!userData.avatar && initials}
                </Avatar>
              </Box>
            </Tooltip>
            {expanded && (
              <Box sx={{ ml: 1.5, overflow: 'hidden' }}>
                <Typography variant="body2" fontWeight={600} noWrap>{userData.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>@{userData.username}</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
