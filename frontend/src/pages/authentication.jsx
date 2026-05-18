import React, { useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { Link } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTheme } from '@mui/material/styles';
import GlassCard from '../components/ui/GlassCard';
import GradientText from '../components/ui/GradientText';
import ThemeToggle from '../components/ui/ThemeToggle';
import OrbitalDecor from '../components/ui/OrbitalDecor';

/** Computes password strength score 0–4 */
const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};
const STRENGTH_COLORS = ['#374151', '#EF4444', '#F97316', '#EAB308', '#22C55E'];

export default function Authentication() {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const strength = getStrength(password);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError('Google sign-in failed. Please try again.');
    }
  }, []);

  const handleGoogleAuth = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8002';
    window.location.href = `${apiUrl}/api/v1/users/auth/google`;
  };

  const reset = () => { setUsername(''); setPassword(''); setName(''); setEmail(''); setError(''); };

  const handleAuth = async () => {
    if (tab === 1) {
      if (!name.trim()) { setError('Full name is required.'); return; }
      if (!username.trim()) { setError('Username is required.'); return; }
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('Valid email is required.'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    } else {
      if (!email.trim()) { setError('Email is required.'); return; }
      if (!password) { setError('Password is required.'); return; }
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (tab === 0) {
        await handleLogin(email, password);
        reset();
      } else {
        const msg = await handleRegister(name, username, email, password);
        setSuccessMsg(msg || 'Registered! Please sign in.');
        reset();
        setTab(0);
      }
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        animation: 'fadeInUp 0.4s ease both',
      }}
    >
      {/* ── LEFT PANEL (desktop only) ─────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '45%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          borderRight: `1px solid ${theme.palette.divider}`,
          background: isDark ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.03)',
          px: 6,
          py: 8,
        }}
      >
        <OrbitalDecor size="sm" />

        <Stack alignItems="center" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: '28px', color: theme.palette.primary.light }}>⬡</Typography>
            <GradientText variant="h3">Conectify</GradientText>
          </Stack>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Connect. Collaborate. Create.
          </Typography>
        </Stack>

        {/* Feature pills */}
        <Stack spacing={2} alignItems="center">
          {[
            { label: '🎥 HD Video', delay: '0s' },
            { label: '🔒 Secure Auth', delay: '0.3s' },
            { label: '💬 Real-time Chat', delay: '0.6s' },
          ].map(({ label, delay }) => (
            <GlassCard key={label} float floatDelay={delay} sx={{ px: 3, py: 1.5, borderRadius: '100px' }}>
              <Typography variant="body2" fontWeight={500}>{label}</Typography>
            </GlassCard>
          ))}
        </Stack>
      </Box>

      {/* ── RIGHT PANEL ───────────────────────────────────────────── */}
      <Box
        sx={{
          width: { xs: '100%', md: '55%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: { xs: 2, md: 6 },
          position: 'relative',
        }}
      >
        {/* Theme toggle top-right */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <ThemeToggle />
        </Box>

        <GlassCard float floatDelay="0s" sx={{ maxWidth: 440, width: '100%', p: { xs: 4, md: 5 }, borderRadius: '40px', background: isDark ? 'rgba(5,8,16,0.8)' : '#ffffff', boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.05)' }}>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); reset(); }}
            centered
            sx={{
              mb: 4,
              minHeight: 40,
              '& .MuiTabs-indicator': {
                background: '#4f46e5',
                height: 2,
                borderRadius: 2,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 40,
                color: 'text.secondary',
              },
              '& .MuiTab-root.Mui-selected': { color: '#4f46e5' },
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Sign Up" />
          </Tabs>

          {/* Error alert */}
          <Collapse in={Boolean(error)}>
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{
                mb: 3,
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.3)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          </Collapse>

          {/* ── LOGIN PANEL ── */}
          {tab === 0 && (
            <Stack spacing={2.5}>
              <Box mb={2}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#60a5fa', mb: 1 }}>Welcome back 👋</Typography>
                <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
              </Box>

              <TextField 
                placeholder="Email" 
                fullWidth 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                InputProps={{ sx: { borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff' } }} 
              />

              <TextField
                placeholder="Password"
                type={showPw ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                InputProps={{
                  sx: { borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw(!showPw)} size="small">
                        {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box textAlign="right" mt={-1}>
                <Typography variant="caption" sx={{ color: '#8b5cf6', cursor: 'pointer', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                  Forgot password?
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleAuth}
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                  }
                }}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              <Divider sx={{ '& .MuiDivider-wrapper': { px: 2 }, my: 1, color: 'text.secondary', fontWeight: 400, fontSize: '0.85rem' }}>
                or
              </Divider>

              <Typography variant="body2" textAlign="center" color="text.secondary">
                Don't have an account?{' '}
                <Box component="span" sx={{ color: '#8b5cf6', cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab(1)}>
                  Sign Up
                </Box>
              </Typography>

              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleAuth}
                  startIcon={
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  }
                  sx={{
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: 'text.primary',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                    borderRadius: '12px',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.02)',
                    '&:hover': {
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    },
                  }}
                >
                  Continue with Google
                </Button>
              </Box>
            </Stack>
          )}

          {/* ── REGISTER PANEL ── */}
          {tab === 1 && (
            <Stack spacing={2.5}>
              <Box mb={2}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#60a5fa', mb: 1 }}>Create account ✨</Typography>
                <Typography variant="body2" color="text.secondary">Join thousands of teams</Typography>
              </Box>

              <TextField 
                placeholder="Full Name" 
                fullWidth 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                InputProps={{ sx: { borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff' } }} 
              />
              <TextField 
                placeholder="Username" 
                fullWidth 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                InputProps={{ sx: { borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff' } }} 
              />
              <TextField 
                placeholder="Email" 
                fullWidth 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                InputProps={{ sx: { borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff' } }} 
              />

              <TextField
                placeholder="Password"
                type={showPw ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                InputProps={{
                  sx: { borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw(!showPw)} size="small">
                        {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password strength bar */}
              {password.length > 0 && (
                <Stack direction="row" spacing={0.5}>
                  {[1, 2, 3, 4].map((s) => (
                    <Box
                      key={s}
                      sx={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: strength >= s ? STRENGTH_COLORS[strength] : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s ease',
                      }}
                    />
                  ))}
                </Stack>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleAuth}
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                  }
                }}
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>

              <Divider sx={{ '& .MuiDivider-wrapper': { px: 2 }, my: 1, color: 'text.secondary', fontWeight: 400, fontSize: '0.85rem' }}>
                or
              </Divider>

              <Typography variant="body2" textAlign="center" color="text.secondary">
                Already have an account?{' '}
                <Box component="span" sx={{ color: '#8b5cf6', cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab(0)}>
                  Sign In
                </Box>
              </Typography>

              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleAuth}
                  startIcon={
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  }
                  sx={{
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: 'text.primary',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                    borderRadius: '12px',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.02)',
                    '&:hover': {
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    },
                  }}
                >
                  Continue with Google
                </Button>
              </Box>
            </Stack>
          )}

        </GlassCard>
      </Box>

      {/* Success Snackbar */}
      <Snackbar 
        open={Boolean(successMsg)} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMsg('')} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
