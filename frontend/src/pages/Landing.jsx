import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import { useTheme } from '@mui/material/styles';
import GlassCard from '../components/ui/GlassCard';
import GradientText from '../components/ui/GradientText';
import ThemeToggle from '../components/ui/ThemeToggle';
import OrbitalDecor from '../components/ui/OrbitalDecor';



const FEATURES = [
  {
    icon: <VideocamIcon sx={{ fontSize: 28, color: '#60A5FA' }} />,
    iconBg: 'rgba(37,99,235,0.15)',
    title: 'HD Video Calls',
    body: 'Crystal-clear peer-to-peer video streams powered by WebRTC with encrypted signaling for maximum privacy.',
  },
  {
    icon: <ScreenShareIcon sx={{ fontSize: 28, color: '#A78BFA' }} />,
    iconBg: 'rgba(124,58,237,0.15)',
    title: 'Screen Sharing',
    body: 'Share your entire screen or a single window with all participants in real-time with one click.',
  },
  {
    icon: <ChatIcon sx={{ fontSize: 28, color: '#34D399' }} />,
    iconBg: 'rgba(5,150,105,0.15)',
    title: 'Real-time Chat',
    body: 'Send messages and share updates during live meetings. Chat history is preserved for the session.',
  },
];

const STATS = [
  { value: '10K+', label: 'Meetings Hosted' },
  { value: '99.9%', label: 'Uptime' },
  { value: '256-bit', label: 'Encrypted' },
];

export default function LandingPage() {
  const router = useNavigate();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ minHeight: '100vh' }}>

      {/* ── NAVBAR ───────────────────────────────────────────────────── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: isDark ? 'rgba(5,8,16,0.85)' : 'rgba(240,242,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          {/* Logo */}
          <Stack direction="row" alignItems="center" spacing={1} component={Link} to="/" sx={{ textDecoration: 'none' }}>
            <Typography sx={{ fontSize: '22px', lineHeight: 1, color: theme.palette.primary.light }}>⬡</Typography>
            <GradientText variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>
              Conectify
            </GradientText>
          </Stack>



          {/* Right actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ThemeToggle />
            <Button 
              variant="outlined" 
              sx={{ 
                display: { xs: 'none', sm: 'flex' }, 
                fontWeight: 600,
                borderRadius: '12px',
                px: 2.5,
                textTransform: 'none',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }
              }} 
              onClick={() => router('/auth')}
            >
              Sign In
            </Button>
            <Button 
              variant="contained" 
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                fontWeight: 600,
                borderRadius: '12px',
                px: 3,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.23)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }} 
              onClick={() => router('/auth')}
            >
              Get Started
            </Button>
            <IconButton sx={{ display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: isDark ? 'rgba(5,8,16,0.96)' : 'rgba(240,242,255,0.96)',
            backdropFilter: 'blur(24px)',
            p: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton onClick={() => setMobileOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <List>

          <ListItemButton onClick={() => { setMobileOpen(false); router('/auth'); }} sx={{ borderRadius: 2, mb: 0.5 }}>
            <ListItemText primary="Sign In" />
          </ListItemButton>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" fullWidth onClick={() => { setMobileOpen(false); router('/auth'); }}>
              Get Started
            </Button>
          </Box>
        </List>
      </Drawer>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          px: 2,
          pt: { xs: 6, md: 0 },
        }}
      >
        {/* Orbital background decoration */}
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, opacity: 0.6 }}>
          <OrbitalDecor size="lg" />
        </Box>

        {/* Hero content */}
        <Box sx={{ zIndex: 1, textAlign: 'center', maxWidth: 800 }}>
          <Chip
            label="✦  WebRTC Powered Platform"
            sx={{ mb: 4, animation: 'fadeInUp 0.5s ease both', animationDelay: '0s', fontSize: '0.8rem' }}
          />

          <GradientText
            variant="h1"
            sx={{
              fontSize: { xs: '2.4rem', sm: '3.5rem', md: '5.5rem', lg: '6.5rem' },
              lineHeight: 1.05,
              mb: 3,
              animation: 'fadeInUp 0.5s ease both',
              animationDelay: '0.15s',
            }}
          >
            Meet Beyond{'\n'}Boundaries
          </GradientText>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              mb: 5,
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.2rem' },
              animation: 'fadeInUp 0.5s ease both',
              animationDelay: '0.3s',
            }}
          >
            Crystal-clear video · Screen sharing · Real-time chat
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ animation: 'fadeInUp 0.5s ease both', animationDelay: '0.45s' }}
          >
            <Button variant="contained" color="primary" size="large" onClick={() => router('/auth')}>
              Start a Meeting
            </Button>
            <Button variant="outlined" color="primary" size="large" onClick={() => router('/auth')}>
              Join a Room
            </Button>
          </Stack>

          {/* Scroll indicator */}
          <Box sx={{ mt: 8, animation: 'levitate 2s ease-in-out infinite', opacity: 0.4 }}>
            <KeyboardArrowDownIcon sx={{ fontSize: 32 }} />
          </Box>
        </Box>
      </Box>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <Box sx={{ py: 12, px: { xs: 2, md: 6 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip label="Features" sx={{ mb: 3 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Everything you need
          </Typography>
        </Box>
        <Grid container spacing={3} justifyContent="center" maxWidth={1100} mx="auto">
          {FEATURES.map((feat, i) => (
            <Grid item xs={12} sm={6} md={4} key={feat.title}>
              <GlassCard float floatDelay={`${i * 0.3}s`} sx={{ height: '100%' }}>
                <Box
                  sx={{
                    width: 56, height: 56, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: feat.iconBg, mb: 2,
                  }}
                >
                  {feat.icon}
                </Box>
                <Typography variant="h6" fontWeight={600} mb={1}>{feat.title}</Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{feat.body}</Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <Box sx={{ py: 8, px: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" flexWrap="wrap">
          {STATS.map((s, i) => (
            <GlassCard key={s.label} float floatDelay={`${i * 0.2}s`} sx={{ textAlign: 'center', minWidth: 180 }}>
              <GradientText variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>{s.value}</GradientText>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {s.label}
              </Typography>
            </GlassCard>
          ))}
        </Stack>
      </Box>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <Box sx={{ py: 10, px: { xs: 2, md: 6 }, maxWidth: 700, mx: 'auto' }}>
        <GlassCard sx={{ textAlign: 'center', py: 6, px: 4 }}>
          <GradientText variant="h4" sx={{ mb: 2 }}>Ready to connect?</GradientText>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Join thousands of teams who use Conectify for seamless video meetings.
          </Typography>
          <Button variant="contained" color="primary" size="large" onClick={() => router('/auth')}>
            Get Started Free
          </Button>
        </GlassCard>
      </Box>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <Box
        component="footer"
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={2}>
          <IconButton
            component="a"
            href="https://github.com/sarthak-shastrakar"
            target="_blank"
            rel="noreferrer"
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
          >
            <GitHubIcon />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.linkedin.com/in/sarthak-fullstack-developer/"
            target="_blank"
            rel="noreferrer"
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
          >
            <LinkedInIcon />
          </IconButton>
          <IconButton
            component="a"
            href="https://sarthak-shastrakar.github.io/Portfolio/"
            target="_blank"
            rel="noreferrer"
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
          >
            <LanguageIcon />
          </IconButton>
        </Stack>
      </Box>

    </Box>
  );
}
