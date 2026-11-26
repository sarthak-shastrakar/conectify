import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'dark' ? {
      background: {
        default: '#050810',
        paper: 'rgba(255,255,255,0.04)',
        card: 'rgba(255,255,255,0.04)',
      },
      primary: { main: '#7C3AED', light: '#A78BFA', dark: '#5B21B6' },
      secondary: { main: '#2563EB', light: '#60A5FA' },
      success: { main: '#059669', light: '#34D399' },
      error: { main: '#DC2626', light: '#F87171' },
      text: {
        primary: 'rgba(255,255,255,0.95)',
        secondary: 'rgba(255,255,255,0.6)',
        muted: 'rgba(255,255,255,0.35)',
      },
      divider: 'rgba(255,255,255,0.08)',
    } : {
      background: {
        default: '#F0F2FF',
        paper: 'rgba(255,255,255,0.7)',
        card: 'rgba(255,255,255,0.8)',
      },
      primary: { main: '#6D28D9', light: '#7C3AED', dark: '#4C1D95' },
      secondary: { main: '#1D4ED8', light: '#2563EB' },
      success: { main: '#047857', light: '#059669' },
      error: { main: '#B91C1C', light: '#DC2626' },
      text: {
        primary: 'rgba(10,10,30,0.95)',
        secondary: 'rgba(10,10,30,0.6)',
        muted: 'rgba(10,10,30,0.4)',
      },
      divider: 'rgba(0,0,0,0.08)',
    }),
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    h1: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, letterSpacing: '-2px' },
    h2: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, letterSpacing: '-1.5px' },
    h3: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, letterSpacing: '-1px' },
    h4: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 500 },
    h6: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 500 },
  },
  shape: { borderRadius: 16 },
});

export const getTheme = (mode) => createTheme({
  ...getDesignTokens(mode),
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => `
        body {
          background: ${theme.palette.mode === 'dark'
            ? 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.06) 0%, transparent 50%), #050810'
            : 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.04) 0%, transparent 50%), #F0F2FF'
          };
          min-height: 100vh;
          transition: background 0.4s ease, color 0.3s ease;
        }
        * { box-sizing: border-box; }
        @keyframes levitate {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes drift {
          0%   { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-7px) rotate(0.7deg); }
          66%  { transform: translateY(4px) rotate(-0.7deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulseGlow {
          0%,100% { opacity: 0.5; transform: translate(-50%,-50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%,-50%) scale(1.08); }
        }
        @keyframes spinRing {
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes spinRingReverse {
          to { transform: translate(-50%,-50%) rotate(-360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes rainbowSpin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; }
        }
      `,
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          background: theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'dark'
            ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)'
            : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(100,80,200,0.08)',
          transition: 'all 0.3s ease',
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: () => ({
          background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
          boxShadow: '0 0 20px rgba(124,58,237,0.35)',
          borderRadius: '14px',
          padding: '12px 28px',
          fontWeight: 600,
          letterSpacing: '0.3px',
          border: 'none',
          textTransform: 'none',
          '&:hover': {
            background: 'linear-gradient(135deg, #6D28D9 0%, #1D4ED8 100%)',
            boxShadow: '0 0 36px rgba(124,58,237,0.55)',
            transform: 'translateY(-2px) scale(1.02)',
          },
          '&:active': { transform: 'translateY(0) scale(0.98)' },
          transition: 'all 0.25s ease',
        }),
        outlinedPrimary: ({ theme }) => ({
          borderColor: 'rgba(124,58,237,0.4)',
          color: theme.palette.primary.light,
          background: theme.palette.mode === 'dark'
            ? 'rgba(124,58,237,0.08)'
            : 'rgba(124,58,237,0.06)',
          backdropFilter: 'blur(10px)',
          borderRadius: '14px',
          textTransform: 'none',
          fontWeight: 600,
          '&:hover': {
            borderColor: '#7C3AED',
            background: 'rgba(124,58,237,0.15)',
            boxShadow: '0 0 20px rgba(124,58,237,0.2)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.25s ease',
        }),
        text: () => ({
          textTransform: 'none',
          fontWeight: 500,
        }),
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            background: theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            '& fieldset': { borderColor: theme.palette.divider },
            '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.5)' },
            '&.Mui-focused fieldset': {
              borderColor: '#7C3AED',
              boxShadow: '0 0 0 3px rgba(124,58,237,0.15)',
            },
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: theme.palette.mode === 'dark'
            ? 'rgba(124,58,237,0.15)'
            : 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.3)',
          color: theme.palette.primary.light,
          backdropFilter: 'blur(8px)',
          fontWeight: 500,
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          background: theme.palette.mode === 'dark'
            ? 'rgba(20,20,40,0.95)'
            : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '10px',
          color: theme.palette.text.primary,
          fontSize: '13px',
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'scale(1.1)' },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.95rem',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          transition: 'all 0.2s ease',
          mx: 1,
        },
      },
    },
  },
});
