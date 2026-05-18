import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeMode } from '../../contexts/ThemeContext';

/**
 * ThemeToggle — glass pill icon button that switches between dark and light mode.
 * Shows sun icon in dark mode, moon icon in light mode.
 */
export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        onClick={toggleMode}
        size="small"
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: mode === 'dark'
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.06)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: mode === 'dark'
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(0,0,0,0.1)',
            transform: 'scale(1.1) rotate(15deg)',
            boxShadow: mode === 'dark'
              ? '0 0 16px rgba(251,191,36,0.3)'
              : '0 0 16px rgba(124,58,237,0.3)',
          },
        }}
      >
        {mode === 'dark' ? (
          <WbSunnyIcon sx={{ fontSize: 18, color: '#FCD34D' }} />
        ) : (
          <DarkModeIcon sx={{ fontSize: 18, color: '#7C3AED' }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
