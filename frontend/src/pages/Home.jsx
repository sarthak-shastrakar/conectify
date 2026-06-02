import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import VideocamIcon from '@mui/icons-material/Videocam';
import LinkIcon from '@mui/icons-material/Link';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PeopleIcon from '@mui/icons-material/People';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import AppSidebar from './Navbar';
import GlassCard from '../components/ui/GlassCard';
import withAuth from '../utils/withAuth';
import api from '../utils/api';
import { API_ROUTES } from '../utils/constants';

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
  const [recentMeetings, setRecentMeetings] = React.useState([]);
  const [welcomeToast, setWelcomeToast] = useState(false);

  // AI Chatbot States
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'AI', text: 'Hi! I am Conectify AI. How can I help you today? 🤖' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSendChatMessage = async () => {
    if (!chatQuery.trim()) return;
    const userMsg = { sender: 'User', text: chatQuery };
    setChatHistory((prev) => [...prev, userMsg]);
    const currentQuery = chatQuery;
    setChatQuery('');
    setAiLoading(true);

    try {
      const res = await api.post(API_ROUTES.CHATBOT, {
        message: currentQuery,
        chatHistory: chatHistory
      });
      const aiReply = { sender: 'AI', text: res.data.reply };
      setChatHistory((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error("AI chat failed:", err);
      setChatHistory((prev) => [...prev, { sender: 'AI', text: 'Sorry, I failed to connect. Please try again! ⚠️' }]);
    } finally {
      setAiLoading(false);
    }
  };

  React.useEffect(() => {
    // Page Title for SEO and automation tracking
    document.title = "Dashboard | Conectify - High Quality Video Meetings";
    
    getHistoryOfUser().then(setRecentMeetings).catch(() => {});

    // Check for welcome notification flag set on successful login
    if (sessionStorage.getItem("showWelcomeNotification") === "true") {
      setWelcomeToast(true);
      sessionStorage.removeItem("showWelcomeNotification");
    }
  }, []);

  const handleJoin = () => {
    if (!meetingCode.trim()) { 
      setCodeError('Meeting code is required'); 
      return; 
    }
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: theme.palette.background.default }}>
      
      {/* Global CSS Style Block for Custom Transitions, Ripples, and Keyframes */}
      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { opacity: 0.3; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(124, 58, 237, 0.2); box-shadow: 0 0 0 rgba(124, 58, 237, 0); }
          50% { border-color: rgba(124, 58, 237, 0.6); box-shadow: 0 0 12px rgba(124, 58, 237, 0.2); }
        }
        @keyframes shimmerEffect {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <AppSidebar />

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          p: { xs: 2, sm: 3, md: 5 }, 
          overflowY: 'auto', 
          pt: { xs: 11, sm: 12, md: 14 }, 
          pb: { xs: 5, md: 5 } 
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto', width: '100%', animation: 'fadeInUp 0.6s ease both' }}>

          {/* Header */}
          <Box mb={5} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
            <Box>
              <Typography 
                variant="h3" 
                fontWeight={800} 
                sx={{ 
                  color: 'text.primary', 
                  mb: 0.5, 
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.6rem' },
                  fontFamily: '"Space Grotesk", sans-serif',
                  letterSpacing: '-0.5px'
                }}
              >
                {getGreeting()},{' '}
                <Box 
                  component="span" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #7C3AED, #3B82F6, #8B5CF6)', 
                    backgroundSize: '200% auto',
                    animation: 'gradientShift 6s ease infinite',
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 900
                  }}
                >
                  {userData?.name?.split(' ')[0] || 'User'}
                </Box>{' '}👋
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  opacity: 0.8, 
                  fontSize: '0.92rem' 
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                {formatDate(new Date())}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={{ xs: 3, md: 4 }}>

            {/* LEFT COLUMN */}
            <Grid item xs={12} lg={8}>

              {/* ACTION CARDS */}
              <Grid container spacing={{ xs: 2, sm: 3 }} mb={5}>

                {/* Start Meeting Card */}
                <Grid item xs={12} sm={6}>
                  <Box 
                    id="btn-new-meeting-card"
                    onClick={handleNewMeeting}
                    sx={{
                      position: 'relative', 
                      overflow: 'hidden',
                      borderRadius: '28px', 
                      p: { xs: 3, sm: 3.5, md: 4 }, 
                      height: '100%', 
                      minHeight: 280,
                      background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #8B5CF6 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradientShift 8s ease infinite',
                      color: '#fff',
                      boxShadow: '0 20px 48px rgba(124, 58, 237, 0.3)',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      '&:hover': { 
                        transform: 'translateY(-6px) scale(1.01)', 
                        boxShadow: '0 28px 56px rgba(124, 58, 237, 0.4)',
                        '& .video-icon-wrapper': { transform: 'scale(1.1) rotate(8deg)' }
                      },
                    }}
                  >
                    {/* BG decorative glow elements */}
                    <Box sx={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, background: 'rgba(255,255,255,0.12)', borderRadius: '50%', filter: 'blur(35px)', pointerEvents: 'none' }} />
                    <Box sx={{ position: 'absolute', bottom: -40, left: -25, width: 140, height: 140, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(25px)', pointerEvents: 'none' }} />

                    <Box>
                      <Box 
                        className="video-icon-wrapper" 
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          borderRadius: '20px', 
                          background: 'rgba(255, 255, 255, 0.16)', 
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          mb: 3,
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                          animation: 'floatSlow 4s ease-in-out infinite'
                        }}
                      >
                        <VideocamIcon sx={{ fontSize: 34, color: '#fff' }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700} mb={1} sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>New Meeting</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.7, maxWidth: '95%', fontSize: '0.9rem' }}>
                        Start an instant, secure, high-quality video call with a single click.
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      sx={{
                        mt: 3, 
                        background: '#fff', 
                        color: '#7C3AED', 
                        borderRadius: '14px',
                        fontWeight: 700, 
                        py: 1.5, 
                        textTransform: 'none', 
                        fontSize: '0.95rem',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        width: '100%',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': { 
                          background: '#fcfcfc', 
                          boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                          transform: 'translateY(-2px)'
                        }
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
                    p: { xs: 3, sm: 3.5, md: 4 }, 
                    height: '100%', 
                    minHeight: 280, 
                    borderRadius: '28px',
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.2)' : '0 8px 32px rgba(100,80,200,0.03)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(100,80,200,0.08)'}`,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.4)' : '0 16px 40px rgba(100,80,200,0.06)',
                      borderColor: 'rgba(124,58,237,0.3)',
                      '& .link-icon-wrapper': { transform: 'scale(1.1) rotate(-8deg)' }
                    }
                  }}>
                    <Box>
                      <Box 
                        className="link-icon-wrapper" 
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          borderRadius: '20px', 
                          background: isDark ? 'rgba(124,58,237,0.15)' : '#eef2ff', 
                          border: `1px solid ${isDark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)'}`,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          mb: 3,
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                          animation: 'floatSlow 4s ease-in-out infinite',
                          animationDelay: '1s'
                        }}
                      >
                        <LinkIcon sx={{ fontSize: 32, color: '#7C3AED' }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700} mb={1} sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>Join Meeting</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
                        Enter your meeting code or paste the link to join an ongoing call.
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 3 }}>
                      <TextField
                        id="input-meeting-code"
                        placeholder="Enter meeting code..."
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        error={Boolean(codeError)}
                        helperText={codeError}
                        fullWidth
                        InputProps={{
                          sx: {
                            borderRadius: '14px',
                            background: isDark ? 'rgba(0,0,0,0.15)' : '#f8fafc',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                            transition: 'all 0.3s ease',
                            '&.Mui-focused': {
                              boxShadow: '0 0 16px rgba(124,58,237,0.2)',
                            },
                            '& fieldset': { border: 'none' }
                          }
                        }}
                        sx={{ mb: 2 }}
                      />
                      <Button
                        id="btn-join-call"
                        variant="contained"
                        fullWidth
                        onClick={handleJoin}
                        sx={{
                          borderRadius: '14px', 
                          fontWeight: 700, 
                          py: 1.5,
                          textTransform: 'none', 
                          fontSize: '0.95rem',
                          background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
                          boxShadow: '0 6px 20px rgba(124,58,237,0.3)',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          '&:hover': { 
                            background: 'linear-gradient(135deg, #6D28D9 0%, #1D4ED8 100%)',
                            boxShadow: '0 10px 28px rgba(124,58,237,0.45)',
                            transform: 'translateY(-2px)'
                          }
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
                  <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>Recent Activity</Typography>
                  <Button
                    size="small"
                    endIcon={<KeyboardArrowRightIcon />}
                    onClick={() => navigate('/history')}
                    sx={{ 
                      borderRadius: '10px', 
                      textTransform: 'none', 
                      fontWeight: 600, 
                      color: '#7C3AED',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateX(3px)', background: 'transparent' }
                    }}
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
                          p: { xs: 2, sm: 2.5 }, 
                          borderRadius: '20px',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          flexWrap: 'wrap', 
                          gap: 1.5,
                          background: isDark ? 'rgba(255,255,255,0.01)' : '#ffffff',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(100,80,200,0.05)'}`,
                          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.05)' : '0 4px 12px rgba(100,80,200,0.02)',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
                          animationDelay: `${i * 0.08}s`,
                          '&:hover': { 
                            transform: 'translateX(6px)', 
                            borderColor: 'rgba(124,58,237,0.3)',
                            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)'
                          }
                        }}
                      >
                        {/* Left: Icon + Info */}
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ 
                            width: 46, 
                            height: 46, 
                            borderRadius: '14px', 
                            background: isDark ? 'rgba(124,58,237,0.1)' : '#eef2ff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            flexShrink: 0 
                          }}>
                            <CalendarTodayIcon sx={{ fontSize: 20, color: '#7C3AED' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: 0.5, fontFamily: 'monospace' }}>
                              {m.meetingCode}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(m.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Right: Duration + Participants */}
                        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                          {m.participants?.length > 0 && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              {m.participants.slice(0, 3).map((p, pi) => (
                                <Avatar 
                                  key={pi} 
                                  src={p.avatar} 
                                  sx={{ 
                                    width: 28, 
                                    height: 28, 
                                    fontSize: '0.75rem', 
                                    bgcolor: stringToColor(p.username), 
                                    border: `2px solid ${isDark ? '#050810' : '#F0F2FF'}` 
                                  }}
                                >
                                  {!p.avatar && p.name?.charAt(0).toUpperCase()}
                                </Avatar>
                              ))}
                              {m.participants.length > 3 && (
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ pl: 0.5 }}>
                                  +{m.participants.length - 3}
                                </Typography>
                              )}
                            </Stack>
                          )}
                          {formatDuration(m.duration) && (
                            <Chip
                              icon={<AccessTimeIcon sx={{ fontSize: '14px !important' }} />}
                              label={formatDuration(m.duration)}
                              size="small"
                              sx={{ 
                                background: isDark ? 'rgba(124,58,237,0.12)' : '#eef2ff', 
                                color: '#7C3AED', 
                                fontWeight: 700, 
                                fontSize: '0.72rem', 
                                border: '1px solid rgba(124,58,237,0.2)' 
                              }}
                            />
                          )}
                        </Stack>
                      </GlassCard>
                    ))}
                  </Stack>
                ) : (
                  <GlassCard sx={{ 
                    p: { xs: 4, md: 6 }, 
                    textAlign: 'center', 
                    borderRadius: '28px', 
                    border: `2px dashed ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(100,80,200,0.1)'}`, 
                    background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <Box sx={{ 
                      width: 72, 
                      height: 72, 
                      borderRadius: '24px', 
                      background: isDark ? 'rgba(124,58,237,0.06)' : '#eef2ff', 
                      border: `1px solid ${isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)'}`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      mx: 'auto', 
                      mb: 2.5,
                      animation: 'floatSlow 5s ease-in-out infinite'
                    }}>
                      <HistoryIcon sx={{ fontSize: 32, color: '#7C3AED', opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} mb={1} sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>No history yet</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '280px', mx: 'auto', lineHeight: 1.6, fontSize: '0.88rem' }}>
                      Your completed video meetings and instant calls will appear here automatically.
                    </Typography>
                  </GlassCard>
                )}
              </Box>
            </Grid>

            {/* RIGHT COLUMN: Stats */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>

                {/* Total Meetings */}
                <GlassCard sx={{ 
                  p: 3, 
                  borderRadius: '24px', 
                  position: 'relative', 
                  overflow: 'hidden', 
                  background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', 
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(100,80,200,0.06)'}`, 
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.1)' : '0 4px 20px rgba(100,80,200,0.02)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: 'rgba(124,58,237,0.2)',
                    boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.25)' : '0 12px 28px rgba(100,80,200,0.06)',
                    '& .rocket-bg': { transform: 'translate(4px, -4px) scale(1.1)' }
                  }
                }}>
                  <Box className="rocket-bg" sx={{ 
                    position: 'absolute', top: 10, right: 10, fontSize: '64px', opacity: 0.08, 
                    pointerEvents: 'none', transition: 'all 0.3s ease' 
                  }}>🚀</Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1.2}>Total Meetings</Typography>
                    <Box sx={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '8px', px: 1, py: 0.4, fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(16,185,129,0.2)' }}>
                      +14% Growth
                    </Box>
                  </Stack>
                  <Typography variant="h2" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mt: 1.5, mb: 1.5, fontFamily: '"Space Grotesk", sans-serif', fontSize: '2.5rem' }}>
                    {recentMeetings.length}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }}>
                      <PeopleIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      <strong>{recentMeetings.reduce((acc, m) => acc + (m.participants?.length || 0), 0)}</strong> total participants
                    </Typography>
                  </Stack>
                </GlassCard>

                {/* This Week */}
                <GlassCard sx={{ 
                  p: 3, 
                  borderRadius: '24px', 
                  position: 'relative', 
                  overflow: 'hidden', 
                  background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', 
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(100,80,200,0.06)'}`, 
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.1)' : '0 4px 20px rgba(100,80,200,0.02)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: 'rgba(245,158,11,0.2)',
                    boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.25)' : '0 12px 28px rgba(100,80,200,0.06)',
                    '& .fire-bg': { transform: 'rotate(10deg) scale(1.1)' }
                  }
                }}>
                  <Box className="fire-bg" sx={{ 
                    position: 'absolute', top: 10, right: 10, fontSize: '64px', opacity: 0.08, 
                    pointerEvents: 'none', transition: 'all 0.3s ease' 
                  }}>🔥</Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1.2}>This Week</Typography>
                    <Box sx={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: '8px', px: 1, py: 0.4, fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(245,158,11,0.2)' }}>
                      Active Week
                    </Box>
                  </Stack>
                  <Typography variant="h2" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mt: 1.5, mb: 1.5, fontFamily: '"Space Grotesk", sans-serif', fontSize: '2.5rem' }}>
                    {thisWeekCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Avg. <strong>{(thisWeekCount / 7).toFixed(1)}</strong> meetings per day
                  </Typography>
                </GlassCard>

                {/* System Status */}
                <GlassCard sx={{ 
                  p: 3, 
                  borderRadius: '24px', 
                  background: isDark ? 'rgba(16,185,129,0.03)' : '#f0fdf4', 
                  border: `1px solid ${isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)'}`,
                  boxShadow: 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                    <Box sx={{ position: 'relative', width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Outer ripple layers */}
                      <Box sx={{ 
                        position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#10b981',
                        animation: 'ripple 2s cubic-bezier(0.25, 0, 0, 1) infinite' 
                      }} />
                      <Box sx={{ 
                        position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#10b981',
                        animation: 'ripple 2s cubic-bezier(0.25, 0, 0, 1) infinite', animationDelay: '0.6s' 
                      }} />
                      {/* Center dot */}
                      <Box sx={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="#10b981" letterSpacing={0.5}>System Online</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2, fontSize: '0.85rem' }}>
                    All services are running smoothly. Your connection is secured with end-to-end encryption.
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)'}`, 
                    pt: 1.5, fontSize: '10px', fontFamily: 'monospace', color: 'text.secondary', opacity: 0.8
                  }}>
                    <span>PING: 14ms</span>
                    <span>•</span>
                    <span>ENCRYPTION: E2EE</span>
                    <span>•</span>
                    <span>PORT: 587</span>
                  </Box>
                </GlassCard>

              </Stack>
            </Grid>

          </Grid>
        </Box>
      </Box>

      {/* Welcome Toast Notification */}
      <Snackbar
        open={welcomeToast}
        autoHideDuration={5000}
        onClose={() => setWelcomeToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        ContentProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(59, 130, 246, 0.95))',
            color: 'white',
            backdropFilter: 'blur(12px)',
            fontWeight: 800,
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 12px 36px rgba(99, 102, 241, 0.45)',
            fontSize: '1rem',
            px: 3,
            py: 1,
            textAlign: 'center',
            letterSpacing: 0.5
          }
        }}
        message={`Welcome back to Conectify, ${userData?.name || 'User'}! ✨`}
      />

      {/* Floating AI Chatbot Launcher */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 99,
        }}
      >
        <IconButton
          onClick={() => setChatbotOpen(!chatbotOpen)}
          sx={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              transform: 'scale(1.1) rotate(6deg)',
              boxShadow: '0 12px 40px rgba(124,58,237,0.5)',
            }
          }}
        >
          {chatbotOpen ? <CloseIcon /> : <SmartToyIcon />}
        </IconButton>
      </Box>

      {/* AI Chatbot Drawer Panel */}
      {chatbotOpen && (
        <GlassCard
          sx={{
            position: 'fixed',
            bottom: 92,
            right: 24,
            width: { xs: 'calc(100% - 48px)', sm: 360 },
            height: 480,
            zIndex: 98,
            borderRadius: '24px',
            p: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: isDark ? 'rgba(8,12,24,0.92)' : 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            animation: 'fadeInUp 0.25s ease both'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.12))',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', width: 32, height: 32 }}>
                <SmartToyIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">Conectify AI</Typography>
                <Typography variant="caption" color="success.main" fontWeight={700}>Online</Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setChatbotOpen(false)} sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Chat Messages Log */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            {chatHistory.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: msg.sender === 'User' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                }}
              >
                <Box
                  sx={{
                    background: msg.sender === 'User'
                      ? 'linear-gradient(135deg, #7C3AED, #3B82F6)'
                      : isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9',
                    color: msg.sender === 'User' ? 'white' : 'text.primary',
                    px: 1.8,
                    py: 1,
                    borderRadius: msg.sender === 'User' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    border: msg.sender === 'User' ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                    {msg.text}
                  </Typography>
                </Box>
              </Box>
            ))}

            {aiLoading && (
              <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: '#7C3AED' }} />
                <Typography variant="caption" color="text.secondary">AI is typing...</Typography>
              </Box>
            )}
          </Box>

          {/* Footer Input Area */}
          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: isDark ? 'rgba(0,0,0,0.1)' : '#f8fafc',
              display: 'flex',
              gap: 1
            }}
          >
            <TextField
              size="small"
              placeholder="Ask anything..."
              fullWidth
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendChatMessage();
              }}
              InputProps={{
                sx: {
                  borderRadius: '100px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                }
              }}
            />
            <IconButton
              onClick={handleSendChatMessage}
              disabled={aiLoading || !chatQuery.trim()}
              sx={{
                background: 'rgba(124,58,237,0.12)',
                color: '#7C3AED',
                '&:hover': {
                  background: 'rgba(124,58,237,0.2)',
                }
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </GlassCard>
      )}
    </Box>
  );
}

export default withAuth(Home);
