import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import AppSidebar from './Navbar';
import GradientText from '../components/ui/GradientText';
import api from '../utils/api';

// Custom cardless InfoTile component for high-end staggered display
const InfoTile = ({ icon, label, value, accentColor, bgLight, bgDark, delay, isDark }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        p: 2.5,
        borderRadius: '24px',
        background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.45)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.5)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.15)' : '0 4px 24px rgba(99, 102, 241, 0.02)',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`,
        cursor: 'default',
        '&:hover': {
          transform: 'translateX(8px) scale(1.01)',
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: accentColor,
          boxShadow: isDark 
            ? `0 12px 30px rgba(0,0,0,0.3), 0 0 20px ${accentColor}15` 
            : `0 12px 30px rgba(99,102,241,0.08), 0 0 20px ${accentColor}12`,
          '& .tile-icon-orb': {
            transform: 'scale(1.1) rotate(5deg)',
            boxShadow: `0 0 20px ${accentColor}30`,
          },
          '& .tile-accent-bar': {
            height: '60%',
            opacity: 1,
          }
        }
      }}
    >
      {/* Dynamic Left accent bar */}
      <Box
        className="tile-accent-bar"
        sx={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 4,
          height: '30%',
          borderRadius: '0 4px 4px 0',
          background: accentColor,
          opacity: 0.3,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Left Icon Orb */}
      <Box
        className="tile-icon-orb"
        sx={{
          width: 48,
          height: 48,
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark ? bgDark : bgLight,
          color: accentColor,
          mr: 2.5,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {icon}
      </Box>

      {/* Text Details */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 700,
            fontSize: '0.675rem',
            opacity: 0.8
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mt: 0.2,
            fontSize: '1rem',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

export default function Profile() {
  const { userData, setUserData, getProfile } = useContext(AuthContext);
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const fileInputRef = React.useRef(null);
  const [isUploading, setIsUploading] = React.useState(false);

  useEffect(() => { 
    getProfile(); 
  }, []);

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
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        position: 'relative',
        overflow: 'hidden',
        background: isDark 
          ? 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 60%), #050810'
          : 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.04) 0%, transparent 60%), #F0F2FF'
      }}
    >
      <AppSidebar />

      {/* Decorative Drifting Ambient Blobs */}
      <Box 
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: { xs: 200, md: 350 },
          height: { xs: 200, md: 350 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'drift 10s ease-in-out infinite',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      <Box 
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          width: { xs: 250, md: 400 },
          height: { xs: 250, md: 400 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'drift 12s ease-in-out 2s infinite reverse',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          p: { xs: 3, md: 6 }, 
          pt: { xs: 12, md: 15 }, 
          pb: { xs: 6, md: 8 }, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1
        }}
      >
        
        {userData ? (
          <Box sx={{ width: '100%', maxWidth: 960, animation: 'fadeInUp 0.5s ease both' }}>
            
            <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
              
              {/* Left Column: Avatar & Identity Cardless Area */}
              <Grid item xs={12} md={5}>
                <Stack alignItems="center" spacing={3} sx={{ textAlign: 'center' }}>
                  
                  {/* Hidden file input */}
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange} 
                  />

                  {/* Avatar wrapper with dynamic holographic orbits */}
                  <Box 
                    onClick={handleAvatarClick}
                    sx={{ 
                      position: 'relative', 
                      cursor: 'pointer',
                      width: 140,
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        transform: 'scale(1.04)',
                        '& .avatar-camera-overlay': { opacity: 1, transform: 'scale(1.05)' }
                      }
                    }}
                  >
                    {/* Animated Outer Concentric Ring */}
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: -12,
                        right: -12,
                        bottom: -12,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #10B981 100%)',
                        animation: 'rainbowSpin 10s linear infinite',
                        opacity: 0.45,
                        filter: 'blur(1px)',
                        zIndex: 0,
                      }} 
                    />

                    {/* Animated Inner Concentric Dashed Ring */}
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: -6,
                        left: -6,
                        right: -6,
                        bottom: -6,
                        borderRadius: '50%',
                        border: '2px dashed rgba(99, 102, 241, 0.35)',
                        animation: 'spinRingReverse 16s linear infinite',
                        zIndex: 0,
                      }} 
                    />

                    {/* Avatar element */}
                    <Avatar 
                      src={userData.avatar}
                      sx={{ 
                        width: 116, 
                        height: 116, 
                        background: userData.avatar ? 'transparent' : 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)', 
                        fontSize: '2.5rem', 
                        fontWeight: 700,
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)',
                        zIndex: 1,
                        transition: 'all 0.3s ease',
                        opacity: isUploading ? 0.4 : 1
                      }}
                    >
                      {!userData.avatar && initials}
                    </Avatar>
                    
                    {/* Floating Upload Indicator Badge */}
                    <Box
                      className="avatar-camera-overlay"
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isDark ? '#1e1b4b' : '#ffffff',
                        border: `2px solid ${isDark ? '#312e81' : '#f8fafc'}`,
                        boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3,
                        color: '#6366f1',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {isUploading ? (
                        <CircularProgress size={16} sx={{ color: '#6366f1' }} />
                      ) : (
                        <CameraAltIcon sx={{ fontSize: 18, color: isDark ? '#a78bfa' : '#6366f1' }} />
                      )}
                    </Box>
                  </Box>

                  {/* Name and Identity */}
                  <Stack spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <GradientText 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 800, 
                        letterSpacing: '-1px',
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        textAlign: 'center'
                      }}
                    >
                      {userData.name}
                    </GradientText>

                    {/* Glass capsule username */}
                    <Box 
                      sx={{
                        px: 2.2,
                        py: 0.6,
                        borderRadius: '20px',
                        background: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)',
                        border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.1)'}`,
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#a78bfa' : '#6366f1', fontSize: '0.875rem' }}>
                        @{userData.username}
                      </Typography>
                    </Box>

                    {/* Calling application status indicator */}
                    <Stack 
                      direction="row" 
                      alignItems="center" 
                      spacing={1} 
                      sx={{ 
                        mt: 1.5,
                        px: 1.8,
                        py: 0.5,
                        borderRadius: '20px',
                        background: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.04)',
                        border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)'}`
                      }}
                    >
                      <Box 
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 10px #10b981',
                          animation: 'pulseGlow 2s infinite'
                        }} 
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: isDark ? '#34d399' : '#059669', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          letterSpacing: 1.2,
                          fontSize: '0.675rem'
                        }}
                      >
                        Active & Connected
                      </Typography>
                    </Stack>
                  </Stack>

                </Stack>
              </Grid>

              {/* Right Column: Cardless Animated Info Tiles */}
              <Grid item xs={12} md={7}>
                <Stack spacing={2.5}>
                  
                  {/* Decorative Title */}
                  <Box sx={{ pl: { xs: 1, md: 2 }, mb: 0.5 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: 'text.primary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2
                      }}
                    >
                      Account Details
                      <VerifiedIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      Personal identification and secure credential details
                    </Typography>
                  </Box>

                  {/* Staggered Info Tiles */}
                  <InfoTile
                    icon={<BadgeIcon sx={{ fontSize: 22 }} />}
                    label="Full Name"
                    value={userData.name}
                    accentColor="#a855f7"
                    bgLight="#f3e8ff"
                    bgDark="rgba(168, 85, 247, 0.12)"
                    delay="0.1s"
                    isDark={isDark}
                  />

                  <InfoTile
                    icon={<PersonIcon sx={{ fontSize: 22 }} />}
                    label="Username"
                    value={`@${userData.username}`}
                    accentColor="#3b82f6"
                    bgLight="#dbeafe"
                    bgDark="rgba(59, 130, 246, 0.12)"
                    delay="0.2s"
                    isDark={isDark}
                  />

                  {userData.email && (
                    <InfoTile
                      icon={<EmailIcon sx={{ fontSize: 22 }} />}
                      label="Email Address"
                      value={userData.email}
                      accentColor="#10b981"
                      bgLight="#d1fae5"
                      bgDark="rgba(16, 185, 129, 0.12)"
                      delay="0.3s"
                      isDark={isDark}
                    />
                  )}

                  <InfoTile
                    icon={<SecurityIcon sx={{ fontSize: 22 }} />}
                    label="Security & Privacy"
                    value="Secured with End-to-End Peer-to-Peer Encryption"
                    accentColor="#f59e0b"
                    bgLight="#fef3c7"
                    bgDark="rgba(245, 158, 11, 0.12)"
                    delay="0.4s"
                    isDark={isDark}
                  />

                </Stack>
              </Grid>

            </Grid>

          </Box>
        ) : (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress size={44} sx={{ color: '#6366f1' }} />
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Retrieving account profile...
            </Typography>
          </Stack>
        )}
      </Box>

    </Box>
  );
}
