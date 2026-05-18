import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Grid from '@mui/material/Grid';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import {
  Tooltip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { useTheme } from '@mui/material/styles';
import AppSidebar from './Navbar';
import GlassCard from '../components/ui/GlassCard';
import GradientText from '../components/ui/GradientText';
import ThemeToggle from '../components/ui/ThemeToggle';

const MeetingCard = ({ meeting, isDark, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (d) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 1) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Add colors based on username character to make avatars look distinct
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  return (
    <GlassCard
      sx={{
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        '&:hover': {
          borderColor: 'rgba(124,58,237,0.3)',
          boxShadow: isDark ? '0 8px 24px rgba(124,58,237,0.1)' : '0 8px 24px rgba(124,58,237,0.2)'
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 48, height: 48, borderRadius: '16px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VideocamOffIcon sx={{ fontSize: 24, color: '#A78BFA' }} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.5 }}>{meeting.meetingCode}</Typography>
                <Tooltip title="Copy Code">
                  <IconButton size="small" onClick={() => navigator.clipboard.writeText(meeting.meetingCode)}>
                    <ContentCopyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                <CalendarTodayIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption">{formatDate(meeting.date)}</Typography>
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Delete History">
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); onDelete(meeting.meetingCode); }}
                sx={{ 
                  color: 'error.main', 
                  background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                  '&:hover': { background: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)' }
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Duration + Participants Summary */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3, pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '14px', borderColor: isDark ? '#111' : '#fff' } }}>
              {meeting.participants?.map((p) => (
                <Tooltip key={p.username} title={p.name}>
                  <Avatar src={p.avatar} sx={{ bgcolor: stringToColor(p.username) }}>{!p.avatar && p.name?.charAt(0).toUpperCase()}</Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {meeting.participants?.length || 1} Participant{(meeting.participants?.length || 1) > 1 ? 's' : ''}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            {formatDuration(meeting.duration) && (
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: '14px !important' }} />}
                label={formatDuration(meeting.duration)}
                size="small"
                sx={{ 
                  background: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff',
                  color: '#6366f1',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(99,102,241,0.2)'
                }}
              />
            )}
            <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Expanded Participants List */}
      <Collapse in={expanded}>
        <Box sx={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', p: { xs: 2, sm: 3 }, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
          
          {/* Host Section */}
          <Box mb={4}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Typography variant="subtitle2" color="primary.main" fontWeight={700} textTransform="uppercase" letterSpacing={1}>Meeting Host</Typography>
            </Stack>
            <Grid container spacing={2}>
              {meeting.participants?.filter(p => p.role === 'Host').map((p) => (
                <Grid item xs={12} sm={6} md={4} key={p.username}>
                  <Box
                    sx={{
                      p: 2,
                      background: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)',
                      border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)'}`,
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#7C3AED', color: '#fff', fontWeight: 'bold' }}>
                      {p.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={700}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">@{p.username}</Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Participants Section */}
          {meeting.participants?.filter(p => p.role !== 'Host').length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <PeopleAltIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Joined Participants</Typography>
              </Stack>
              <Grid container spacing={2}>
                {meeting.participants?.filter(p => p.role !== 'Host').map((p) => (
                  <Grid item xs={12} sm={6} md={4} key={p.username}>
                    <Box
                      sx={{
                        p: 2,
                        background: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                        borderRadius: '16px',
                        boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <Avatar sx={{ width: 40, height: 40, bgcolor: stringToColor(p.username), fontSize: '16px' }}>
                        {p.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">@{p.username}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Collapse>
    </GlassCard>
  );
};

export default function History() {
  const { getHistoryOfUser, deleteFromUserHistory } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const fetchHistory = () => {
    getHistoryOfUser().then(setMeetings).catch(() => {});
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteClick = (meetingCode) => {
    setMeetingToDelete(meetingCode);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (meetingToDelete) {
      try {
        await deleteFromUserHistory(meetingToDelete);
        fetchHistory(); // Refresh the list
      } catch (err) {
        console.error("Failed to delete", err);
      }
    }
    setDeleteDialogOpen(false);
    setMeetingToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setMeetingToDelete(null);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
      <AppSidebar />

      {/* Mobile AppBar */}
      <AppBar position="fixed" elevation={0}
        sx={{ display: { md: 'none' }, background: isDark ? 'rgba(5,8,16,0.9)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${theme.palette.divider}`, color: 'text.primary' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: '20px', color: theme.palette.primary.light }}>⬡</Typography>
            <GradientText variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>History</GradientText>
          </Stack>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 4, md: 5 }, overflowY: 'auto', pt: { xs: 10, md: 5 }, pb: { xs: 10, md: 5 } }}>
        <Box sx={{ maxWidth: '1000px', mx: 'auto', width: '100%', animation: 'fadeInUp 0.5s ease both' }}>
          
          {/* Header */}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={5} spacing={2}>
            <Box>
              <GradientText variant="h3" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 800, mb: 1 }}>Meeting Log</GradientText>
              <Typography variant="body1" color="text.secondary">Review your past connections and attendees.</Typography>
            </Box>
            
            <GlassCard sx={{ py: 1.5, px: 3, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={800} color="primary.main">{meetings.length}</Typography>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Total</Typography>
              </Box>
              <Box sx={{ width: 1, height: 40, background: 'rgba(124,58,237,0.2)' }} />
              <Box>
                <Typography variant="h5" fontWeight={800} color="secondary.main">
                  {meetings.reduce((acc, m) => acc + (m.participants?.length || 1), 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Interactions</Typography>
              </Box>
            </GlassCard>
          </Stack>

          {/* History list */}
          {meetings.length > 0 ? (
            <Stack spacing={3}>
              {meetings.map((m, i) => (
                <Box key={i} sx={{ animation: `fadeInUp 0.5s ease ${i * 0.1}s both` }}>
                  <MeetingCard meeting={m} isDark={isDark} onDelete={handleDeleteClick} />
                </Box>
              ))}
            </Stack>
          ) : (
            <GlassCard sx={{ textAlign: 'center', py: 10, borderRadius: '24px', borderStyle: 'dashed', borderWidth: '2px', background: 'transparent' }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                <VideocamOffIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
              </Box>
              <Typography variant="h5" fontWeight={700} mb={1}>No meetings yet</Typography>
              <Typography variant="body1" color="text.secondary" mb={4}>When you start or join a meeting, it will be securely logged here.</Typography>
              <Button variant="contained" size="large" color="primary" onClick={() => navigate('/home')} sx={{ borderRadius: '12px', fontWeight: 700, px: 4 }}>
                Back to Dashboard
              </Button>
            </GlassCard>
          )}
        </Box>
      </Box>

      {/* Mobile bottom nav */}
      <BottomNavigation value={1} onChange={(_, v) => navigate(['/home', '/history', '/profile'][v])} showLabels
        sx={{ display: { md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0, background: isDark ? 'rgba(5,8,16,0.92)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${theme.palette.divider}`, zIndex: 1200, height: 64, '& .MuiBottomNavigationAction-root': { color: 'text.secondary', '&.Mui-selected': { color: theme.palette.primary.main } } }}
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="History" icon={<HistoryIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Box>
  );
}
