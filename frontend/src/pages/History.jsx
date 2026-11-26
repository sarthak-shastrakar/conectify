import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import {
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from './Navbar';
import GlassCard from '../components/ui/GlassCard';
import GradientText from '../components/ui/GradientText';

const MeetingCard = ({ meeting, isDark, onDelete, onViewDetails }) => {
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: isDark ? 'rgba(10, 15, 30, 0.45)' : 'rgba(255, 255, 255, 0.45)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: isDark 
          ? '0 12px 36px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' 
          : '0 12px 36px rgba(100,80,200,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        p: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          borderColor: 'rgba(124,58,237,0.35)',
          boxShadow: isDark ? '0 20px 48px rgba(124,58,237,0.18)' : '0 20px 48px rgba(124,58,237,0.22)'
        }
      }}
    >
      <Box>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Box sx={{ width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)'}` }}>
            <VideocamOffIcon sx={{ fontSize: 22, color: '#A78BFA' }} />
          </Box>
          <Tooltip title="Delete History">
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); onDelete(meeting.meetingCode); }}
              sx={{ 
                color: 'error.main', 
                background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                '&:hover': { background: 'rgba(239,68,68,0.2)', color: 'error.light' }
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Meeting Code */}
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Typography variant="h6" fontWeight={850} sx={{ letterSpacing: 0.5, fontFamily: 'monospace', fontSize: '1.1rem' }}>
            {meeting.meetingCode}
          </Typography>
        </Stack>

        {/* Meeting Date */}
        <Stack direction="row" alignItems="center" spacing={1} color="text.secondary" mb={2}>
          <CalendarTodayIcon sx={{ fontSize: 13, color: '#7C3AED' }} />
          <Typography variant="caption" fontWeight={650}>{formatDate(meeting.date)}</Typography>
        </Stack>
      </Box>

      {/* Card bottom section */}
      <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '11px', border: `2px solid ${isDark ? 'rgba(10, 15, 30, 0.9)' : '#fff'}` } }}>
            {meeting.participants?.map((p) => (
              <Tooltip key={p.username} title={p.name}>
                <Avatar src={p.avatar} sx={{ bgcolor: stringToColor(p.username) }}>{!p.avatar && p.name?.charAt(0).toUpperCase()}</Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
          {formatDuration(meeting.duration) && (
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />}
              label={formatDuration(meeting.duration)}
              size="small"
              sx={{ 
                background: 'rgba(124,58,237,0.1)',
                color: '#A78BFA',
                fontWeight: 750,
                fontSize: '0.68rem',
                border: '1px solid rgba(124,58,237,0.2)'
              }}
            />
          )}
        </Stack>

        <Button 
          variant="outlined" 
          size="small" 
          fullWidth 
          onClick={() => onViewDetails(meeting)}
          sx={{ 
            mt: 2.2,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 750,
            fontSize: '0.78rem',
            py: 0.8,
            borderColor: 'rgba(124,58,237,0.25)',
            '&:hover': {
              borderColor: '#7C3AED',
              background: 'rgba(124,58,237,0.05)'
            }
          }}
        >
          View Details
        </Button>
      </Box>
    </GlassCard>
  );
};

export default function History() {
  const { getHistoryOfUser, deleteFromUserHistory } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  
  // Details Modal states
  const [selectedMeetingDetails, setSelectedMeetingDetails] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const handleViewDetails = (meeting) => {
    setSelectedMeetingDetails(meeting);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedMeetingDetails(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: theme.palette.background.default, position: 'relative', overflow: 'hidden' }}>
      <AppSidebar />

      {/* Decorative Glowing Blur Circles behind the cards */}
      <Box sx={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        filter: 'blur(70px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <Box component="main" sx={{ flex: 1, p: { xs: 2.2, sm: 4, md: 5 }, overflowY: 'auto', pt: { xs: 12, md: 14 }, pb: { xs: 5, md: 5 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto', width: '100%', animation: 'fadeInUp 0.5s ease both' }}>
          
          {/* Header */}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={5} spacing={3}>
            <Box>
              <GradientText variant="h3" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 900, mb: 1, fontFamily: '"Space Grotesk", sans-serif' }}>Meeting Log</GradientText>
              <Typography variant="body1" color="text.secondary" fontWeight={500}>Review your past connections and attendees.</Typography>
            </Box>
            
            <GlassCard 
              sx={{ 
                py: 1.8, 
                px: 3, 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2.5,
                background: isDark ? 'rgba(10, 15, 30, 0.45)' : 'rgba(255, 255, 255, 0.55)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isDark 
                  ? '0 8px 28px rgba(0,0,0,0.4)' 
                  : '0 8px 28px rgba(100,80,200,0.03)',
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={900} color="primary.light" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>{meetings.length}</Typography>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={750} sx={{ letterSpacing: 0.5 }}>Total</Typography>
              </Box>
              <Box sx={{ width: 1, height: 40, background: 'rgba(124,58,237,0.2)' }} />
              <Box>
                <Typography variant="h5" fontWeight={900} color="secondary.light" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  {meetings.reduce((acc, m) => acc + (m.participants?.length || 1), 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={750} sx={{ letterSpacing: 0.5 }}>Interactions</Typography>
              </Box>
            </GlassCard>
          </Stack>

          {/* Card-based grid with Framer Motion and layout transitions */}
          {meetings.length > 0 ? (
            <Grid container spacing={3}>
              <AnimatePresence initial={false}>
                {meetings.map((m, i) => (
                  <Grid item xs={12} sm={6} md={4} key={m.meetingCode || i}>
                    <motion.div
                      initial={{ opacity: 0, y: 32, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94, y: -20 }}
                      transition={{ type: "spring", stiffness: 350, damping: 26 }}
                      style={{ height: '100%' }}
                    >
                      <MeetingCard meeting={m} isDark={isDark} onDelete={handleDeleteClick} onViewDetails={handleViewDetails} />
                    </motion.div>
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
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

      {/* Participants Detail Dialog - fully glassmorphic */}
      <Dialog
        open={detailsOpen}
        onClose={closeDetails}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            background: isDark ? 'rgba(10, 15, 30, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            p: 2,
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 900, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={900}>Meeting Details</Typography>
          <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', opacity: 0.7 }}>
            {selectedMeetingDetails?.meetingCode}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          {selectedMeetingDetails && (
            <Box>
              {/* Host Section */}
              <Box mb={4.5}>
                <Typography variant="subtitle2" color="primary.light" fontWeight={850} textTransform="uppercase" letterSpacing={1.2} mb={2} sx={{ fontSize: '0.72rem' }}>
                  Meeting Host
                </Typography>
                <Grid container spacing={2}>
                  {selectedMeetingDetails.participants?.filter(p => p.role === 'Host').map((p) => (
                    <Grid item xs={12} key={p.username}>
                      <Box
                        sx={{
                          p: 2,
                          background: isDark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.03)',
                          border: `1px solid ${isDark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.15)'}`,
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Avatar sx={{ width: 44, height: 44, bgcolor: '#7C3AED', color: '#fff', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}>
                          {p.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={800}>{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary">@{p.username}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                  {/* Fallback if no Host marked */}
                  {selectedMeetingDetails.participants?.filter(p => p.role === 'Host').length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>No host registered in this log.</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Joined Attendees Section */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <PeopleAltIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={800} textTransform="uppercase" letterSpacing={0.5} sx={{ fontSize: '0.72rem' }}>
                    Joined Attendees ({selectedMeetingDetails.participants?.filter(p => p.role !== 'Host').length || 0})
                  </Typography>
                </Stack>
                <Grid container spacing={2} sx={{ maxHeight: 240, overflowY: 'auto', pr: 0.5 }}>
                  {selectedMeetingDetails.participants?.filter(p => p.role !== 'Host').map((p) => {
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
                      <Grid item xs={12} sm={6} key={p.username}>
                        <Box
                          sx={{
                            p: 1.8,
                            background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
                            borderRadius: '16px',
                            boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}
                        >
                          <Avatar sx={{ width: 36, height: 36, bgcolor: stringToColor(p.username), fontSize: '14px', fontWeight: 'bold' }}>
                            {p.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={750}>{p.name}</Typography>
                            <Typography variant="caption" color="text.secondary">@{p.username}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                  {/* Fallback if no attendees */}
                  {selectedMeetingDetails.participants?.filter(p => p.role !== 'Host').length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Only the host was present in this meeting.</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDetails} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 750, color: 'text.secondary' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog - fully glassmorphic */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            background: isDark ? 'rgba(10, 15, 30, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            p: 1.5,
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 850, color: 'text.primary' }}>
          Delete Meeting Log?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Are you sure you want to delete the meeting log for <strong>{meetingToDelete}</strong>? This action is permanent and will remove the log from your history dashboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={cancelDelete} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 750, color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error" sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 750, px: 3, background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
