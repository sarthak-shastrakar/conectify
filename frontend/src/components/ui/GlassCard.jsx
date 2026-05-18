import React from 'react';
import Paper from '@mui/material/Paper';

/**
 * GlassCard — glassmorphism container with optional levitating animation.
 * @param {{ children: React.ReactNode, float: boolean, floatDelay: string, sx: object }} props
 */
export default function GlassCard({ children, float = false, floatDelay = '0s', sx = {}, ...rest }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        p: 3,
        animation: float ? `levitate 5s ease-in-out ${floatDelay} infinite` : 'none',
        willChange: float ? 'transform' : 'auto',
        '&:hover': {
          transform: float ? undefined : 'translateY(-4px)',
          borderColor: 'rgba(124,58,237,0.25)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 16px 40px rgba(100,80,200,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
        },
        transition: 'all 0.3s ease',
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
}
