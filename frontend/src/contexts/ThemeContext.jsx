import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../theme/theme';

/** Context providing the current color mode and a toggle function. */
const ThemeCtx = createContext({ mode: 'dark', toggleMode: () => {} });

/** Hook to consume the theme mode context anywhere in the app. */
export const useThemeMode = () => useContext(ThemeCtx);

/**
 * AppThemeProvider wraps the app with the Anti-Gravity MUI theme.
 * Persists user preference in localStorage under key 'colorMode'.
 * @param {{ children: React.ReactNode }} props
 */
export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() =>
    localStorage.getItem('colorMode') || 'dark'
  );

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('colorMode', next);
  };

  // Re-create theme only when mode changes
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
