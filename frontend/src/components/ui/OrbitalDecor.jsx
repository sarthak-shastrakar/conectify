import React from 'react';
import Box from '@mui/material/Box';
import { useThemeMode } from '../../contexts/ThemeContext';

const SIZES = { sm: 200, md: 400, lg: 700 };

/**
 * OrbitalDecor — pure CSS decorative rings with spinning animation and central pulsing orb.
 * Uses no SVG or images — only CSS keyframes (defined in CssBaseline theme override).
 * @param {{ size: 'sm' | 'md' | 'lg' }} props
 */
export default function OrbitalDecor({ size = 'md' }) {
  const { mode } = useThemeMode();
  const px = SIZES[size] || SIZES.md;
  const borderColor = mode === 'dark'
    ? 'rgba(124,58,237,0.15)'
    : 'rgba(124,58,237,0.22)';

  const ring = (diameter, anim) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: diameter,
    height: diameter,
    borderRadius: '50%',
    border: `1px solid ${borderColor}`,
    transform: 'translate(-50%, -50%)',
    animation: anim,
    pointerEvents: 'none',
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width: px,
        height: px,
        flexShrink: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Innermost ring */}
      <Box sx={ring(px * 0.4, 'spinRing 40s linear infinite')} />
      {/* Middle ring — reverse */}
      <Box sx={ring(px * 0.7, 'spinRingReverse 70s linear infinite')} />
      {/* Outer ring */}
      <Box sx={ring(px * 1.0, 'spinRing 100s linear infinite')} />

      {/* Central pulsing orb */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: px * 0.12,
          height: px * 0.12,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.8), rgba(37,99,235,0.4))',
          boxShadow: '0 0 30px rgba(124,58,237,0.5)',
          animation: 'pulseGlow 3s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}
