import React from 'react';
import Typography from '@mui/material/Typography';

/**
 * GradientText — animated multi-color gradient text using the Anti-Gravity palette.
 * @param {{ children: React.ReactNode, variant: string, component: string, sx: object }} props
 */
export default function GradientText({ children, variant = 'h2', component, sx = {}, ...rest }) {
  return (
    <Typography
      variant={variant}
      component={component || variant}
      sx={{
        background: 'linear-gradient(135deg, #A78BFA 0%, #60A5FA 50%, #34D399 100%)',
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'gradientShift 4s ease infinite',
        display: 'inline-block',
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Typography>
  );
}
