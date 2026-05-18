import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import { useTheme } from '@mui/material/styles';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CircularProgress from '@mui/material/CircularProgress';
import { AuthContext } from '../contexts/AuthContext';
import AppSidebar from './Navbar';
import GlassCard from '../components/ui/GlassCard';
import GradientText from '../components/ui/GradientText';
import ThemeToggle from '../components/ui/ThemeToggle';
import api from '../utils/api';

export default function Profile() {
  const { userData, setUserData, getProfile } = useContext(AuthContext);
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const fileInputRef = React.useRef(null);
  const [isUploading, setIsUploading] = React.useState(false);

  useEffect(() => { getProfile(); }, []);

  const initials = userData?.name
    ? userData.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      try {
        setIsUploading(true);
        await api.post("/upload_avatar", { 
          token: localStorage.getItem("token"), 
          avatar: base64 
        });
        setUserData((prev) => ({ ...prev, avatar: base64 }));
      } catch (err) {
        alert("Failed to upload avatar");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', animation: 'fadeInUp 0.4s ease both' }}>
      <AppSidebar />

      {/* Mobile AppBar */}
      <AppBar position="fixed" elevation={0}
        sx={{ display: { md: 'none' }, background: isDark ? 'rgba(5,8,16,0.9)' : 'rgba(240,242,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${theme.palette.divider}`, color: 'text.primary' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '20px', color: theme.palette.primary.light }}>⬡</Typography>
          <GradientText variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile</GradientText>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 }, pt: { xs: 10, md: 8 }, pb: { xs: 10, md: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Title positioned like screenshot */}
        <Box sx={{ width: '100%', maxWidth: 480, mb: 4, pl: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#60a5fa' }}>Profile</Typography>
        </Box>

        {userData ? (
          <GlassCard float floatDelay="0s" sx={{ maxWidth: 480, width: '100%', borderRadius: '40px', background: isDark ? 'rgba(5,8,16,0.8)' : '#ffffff', boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.05)', p: { xs: 4, md: 5 } }}>
            {/* Hidden file input */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />

            {/* Avatar header */}
            <Stack alignItems="center" spacing={1.5} mb={3}>
              <Box 
                onClick={handleAvatarClick}
                sx={{ 
                  position: 'relative', 
                  cursor: 'pointer',
                  '&:hover .avatar-overlay': { opacity: 1 }
                }}
              >
                <Avatar 
                  src={userData.avatar}
                  sx={{ 
                    width: 88, 
                    height: 88, 
                    background: userData.avatar ? 'transparent' : 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)', 
                    fontSize: '2rem', 
                    fontWeight: 600,
                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
                    transition: 'opacity 0.2s',
                    opacity: isUploading ? 0.5 : 1
                  }}
                >
                  {!userData.avatar && initials}
                </Avatar>
                
                {/* Upload Indicator Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '2px solid #f8fafc',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    color: '#6366f1',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  {isUploading ? <CircularProgress size={16} sx={{ color: '#6366f1' }} /> : <CameraAltIcon sx={{ fontSize: 18 }} />}
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#60a5fa', mt: 1 }}>{userData.name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>@{userData.username}</Typography>
            </Stack>

            <Divider sx={{ mb: 3, opacity: 0.5 }} />

            {/* Profile info rows */}
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" spacing={2.5}>
                <Box sx={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(124,58,237,0.1)' : '#f3e8ff' }}>
                  <BadgeIcon sx={{ fontSize: 20, color: '#a855f7' }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>FULL NAME</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.2 }}>{userData.name}</Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2.5}>
                <Box sx={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(37,99,235,0.1)' : '#dbeafe' }}>
                  <PersonIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>USERNAME</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.2 }}>@{userData.username}</Typography>
                </Box>
              </Stack>

              {userData.email && (
                <Stack direction="row" alignItems="center" spacing={2.5}>
                  <Box sx={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(16,185,129,0.1)' : '#d1fae5' }}>
                    <EmailIcon sx={{ fontSize: 20, color: '#10b981' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>EMAIL ADDRESS</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.2 }}>{userData.email}</Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </GlassCard>
        ) : (
          <GlassCard sx={{ textAlign: 'center', py: 6, maxWidth: 480, width: '100%' }}>
            <Typography variant="body1" color="text.secondary">Loading profile...</Typography>
          </GlassCard>
        )}
      </Box>

      {/* Mobile bottom nav */}
      <BottomNavigation value={2} onChange={(_, v) => navigate(['/home', '/history', '/profile'][v])}
        sx={{ display: { md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0, background: isDark ? 'rgba(5,8,16,0.92)' : 'rgba(240,242,255,0.92)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${theme.palette.divider}`, zIndex: 1200, height: 64 }}
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="History" icon={<HistoryIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Box>
  );
}
