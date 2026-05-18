import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import VideocamIcon from '@mui/icons-material/Videocam';
import LinkIcon from '@mui/icons-material/Link';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PeopleIcon from '@mui/icons-material/People';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import AppSidebar from './Navbar';
import GlassCard from '../components/ui/GlassCard';
import GradientText from '../components/ui/GradientText';
import ThemeToggle from '../components/ui/ThemeToggle';
import withAuth from '../utils/withAuth';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = (d) =>
  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const formatDuration = (seconds) => {
  if (!seconds || seconds < 1) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

function Home() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { userData, getHistoryOfUser } = useContext(AuthContext);
  const isDark = theme.palette.mode === 'dark';

  const [meetingCode, setMeetingCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [bottomNav, setBottomNav] = useState(0);
  const [recentMeetings, setRecentMeetings] = React.useState([]);

  React.useEffect(() => {
    getHistoryOfUser().then(setRecentMeetings).catch(() => {});
  }, []);

  const handleJoin = () => {
    if (!meetingCode.trim()) { setCodeError('Meeting code is required'); return; }
    setCodeError('');
    navigate(`/${meetingCode.trim()}`);
  };

  const handleNewMeeting = () => {
    const code = Math.random().toString(36).substring(2, 9);
    navigate(`/${code}`);
  };

  const thisWeekCount = recentMeetings.filter(m => (new Date() - new Date(m.date)) / (1000 * 60 * 60 * 24) <= 7).length;

  const stringToColor = (str = '') => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
      <AppSidebar />

      {/* Mobile AppBar */}
      <AppBar position="fixed" elevation={0}
        sx={{ display: { md: 'none' }, background: isDark ? 'rgba(5,8,16,0.9)' : 'rgba(240,242,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${theme.palette.divider}`, color: 'text.primary' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: '20px', color: theme.palette.primary.light }}>⬡</Typography>
            <GradientText variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Conectify</GradientText>
          </Stack>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, md: 5 }, overflowY: 'auto', pt: { xs: 10, md: 5 }, pb: { xs: 10, md: 5 } }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto', width: '100%', animation: 'fadeInUp 0.6s ease both' }}>

          {/* Header */}
          <Box mb={5}>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
              {getGreeting()},{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #6366f1, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {userData?.name?.split(' ')[0] || 'User'}
              </Box>{' '}👋
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.7 }}>
              {formatDate(new Date())}
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, md: 4 }}>

            {/* LEFT COLUMN */}
            <Grid item xs={12} lg={8}>

              {/* ACTION CARDS */}
              <Grid container spacing={{ xs: 2, md: 3 }} mb={5}>

                {/* Start Meeting Card */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{
                    position: 'relative', overflow: 'hidden',
                    borderRadius: '28px', p: { xs: 3, md: 4 }, height: '100%', minHeight: 260,
                    background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                    color: '#fff',
                    boxShadow: '0 20px 48px rgba(99,102,241,0.35)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 28px 56px rgba(99,102,241,0.45)' },
                  }}>
                    {/* BG glow blobs */}
                    <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
                    <Box sx={{ position: 'absolute', bottom: -30, left: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }} />

                    <Box sx={{ width: 60, height: 60, borderRadius: '18px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                      <VideocamIcon sx={{ fontSize: 32, color: '#fff' }} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} mb={1}>New Meeting</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, mb: 'auto', lineHeight: 1.7 }}>
                      Start an instant, secure, high-quality video call with a single click.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleNewMeeting}
                      sx={{
                        mt: 3, background: '#fff', color: '#6366f1', borderRadius: '14px',
                        fontWeight: 700, py: 1.4, textTransform: 'none', fontSize: '0.95rem',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                        '&:hover': { background: 'rgba(255,255,255,0.92)' }
                      }}
                      disableElevation
                    >
                      Start Now
                    </Button>
                  </Box>
                </Grid>

                {/* Join Meeting Card */}
                <Grid item xs={12} sm={6}>
                  <GlassCard sx={{
                    p: { xs: 3, md: 4 }, height: '100%', minHeight: 260, borderRadius: '28px',
                    display: 'flex', flexDirection: 'column',
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    boxShadow: isDark ? 'none' : '0 8px 32px rgba(0,0,0,0.05)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}>
                    <Box sx={{ width: 60, height: 60, borderRadius: '18px', background: isDark ? 'rgba(99,102,241,0.12)' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                      <LinkIcon sx={{ fontSize: 32, color: '#6366f1' }} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} mb={1}>Join Meeting</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 'auto', lineHeight: 1.7 }}>
                      Enter your meeting code or paste the link to join an ongoing call.
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <TextField
                        placeholder="Enter meeting code..."
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        error={Boolean(codeError)}
                        helperText={codeError}
                        fullWidth
                        InputProps={{
                          sx: {
                            borderRadius: '12px',
                            background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                            '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                          }
                        }}
                        sx={{ mb: 2 }}
                      />
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleJoin}
                        sx={{
                          borderRadius: '12px', fontWeight: 700, py: 1.4,
                          textTransform: 'none', fontSize: '0.95rem',
                          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                          boxShadow: '0 6px 16px rgba(99,102,241,0.3)',
                          '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)' }
                        }}
                        disableElevation
                      >
                        Join Call
                      </Button>
                    </Box>
                  </GlassCard>
                </Grid>
              </Grid>

              {/* RECENT ACTIVITY */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight={700}>Recent Activity</Typography>
                  <Button
                    size="small"
                    endIcon={<KeyboardArrowRightIcon />}
                    onClick={() => navigate('/history')}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#6366f1' }}
                  >
                    View all
                  </Button>
                </Stack>

                {recentMeetings.length > 0 ? (
                  <Stack spacing={2}>
                    {recentMeetings.slice(0, 4).map((m, i) => (
                      <GlassCard
                        key={i}
                        sx={{
                          p: { xs: 2, sm: 2.5 }, borderRadius: '18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          flexWrap: 'wrap', gap: 1.5,
                          background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                          boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
                          transition: 'all 0.2s',
                          '&:hover': { transform: 'translateX(4px)', borderColor: 'rgba(99,102,241,0.25)' }
                        }}
                      >
                        {/* Left: Icon + Info */}
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ width: 44, height: 44, borderRadius: '14px', background: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CalendarTodayIcon sx={{ fontSize: 20, color: '#6366f1' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ letterSpacing: 0.5 }}>{m.meetingCode}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(m.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Right: Duration + Participants */}
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          {m.participants?.length > 0 && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              {m.participants.slice(0, 3).map((p, pi) => (
                                <Avatar key={pi} src={p.avatar} sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: stringToColor(p.username), border: `2px solid ${isDark ? '#0a0f1e' : '#fff'}` }}>
                                  {!p.avatar && p.name?.charAt(0).toUpperCase()}
                                </Avatar>
                              ))}
                              {m.participants.length > 3 && (
                                <Typography variant="caption" color="text.secondary">+{m.participants.length - 3}</Typography>
                              )}
                            </Stack>
                          )}
                          {formatDuration(m.duration) && (
                            <Chip
                              icon={<AccessTimeIcon sx={{ fontSize: '14px !important' }} />}
                              label={formatDuration(m.duration)}
                              size="small"
                              sx={{ background: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff', color: '#6366f1', fontWeight: 600, fontSize: '0.7rem', border: '1px solid rgba(99,102,241,0.2)' }}
                            />
                          )}
                        </Stack>
                      </GlassCard>
                    ))}
                  </Stack>
                ) : (
                  <GlassCard sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: '24px', border: `2px dashed ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, background: 'transparent' }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: isDark ? 'rgba(99,102,241,0.08)' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                      <HistoryIcon sx={{ fontSize: 28, color: '#6366f1', opacity: 0.7 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={600} mb={1}>No history yet</Typography>
                    <Typography variant="body2" color="text.secondary">Complete meetings will appear here.</Typography>
                  </GlassCard>
                )}
              </Box>
            </Grid>

            {/* RIGHT COLUMN: Stats */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>

                {/* Total Meetings */}
                <GlassCard sx={{ p: 3, borderRadius: '24px', position: 'relative', overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`, boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.04)' }}>
                  <Box sx={{ position: 'absolute', top: -10, right: -10, fontSize: '80px', opacity: 0.06, pointerEvents: 'none' }}>🚀</Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1}>Total Meetings</Typography>
                  <Typography variant="h2" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #6366f1, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mt: 1 }}>
                    {recentMeetings.length}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                    <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {recentMeetings.reduce((acc, m) => acc + (m.participants?.length || 0), 0)} total participants
                    </Typography>
                  </Stack>
                </GlassCard>

                {/* This Week */}
                <GlassCard sx={{ p: 3, borderRadius: '24px', position: 'relative', overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`, boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.04)' }}>
                  <Box sx={{ position: 'absolute', top: -10, right: -10, fontSize: '80px', opacity: 0.06, pointerEvents: 'none' }}>🔥</Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1}>This Week</Typography>
                  <Typography variant="h2" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mt: 1 }}>
                    {thisWeekCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">meetings in the last 7 days</Typography>
                </GlassCard>

                {/* System Status */}
                <GlassCard sx={{ p: 3, borderRadius: '24px', background: isDark ? 'rgba(16,185,129,0.04)' : '#f0fdf4', border: `1px solid ${isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)'}` }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
                    <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }`}</style>
                    <Typography variant="body2" fontWeight={700} color="#10b981">System Online</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    All services are running smoothly. Your connection is secured with end-to-end encryption.
                  </Typography>
                </GlassCard>

              </Stack>
            </Grid>

          </Grid>
        </Box>
      </Box>

      {/* Mobile bottom nav */}
      <BottomNavigation
        value={bottomNav}
        onChange={(_, v) => { setBottomNav(v); navigate(['/home', '/history', '/profile'][v]); }}
        showLabels
        sx={{
          display: { md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0,
          background: isDark ? 'rgba(5,8,16,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)', borderTop: `1px solid ${theme.palette.divider}`, zIndex: 1200, height: 64,
          '& .MuiBottomNavigationAction-root': { color: 'text.secondary', '&.Mui-selected': { color: theme.palette.primary.main } }
        }}
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="History" icon={<HistoryIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Box>
  );
}

export default withAuth(Home);
