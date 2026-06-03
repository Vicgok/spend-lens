import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { colors, ThemeMode, ThemeColors } from '../theme/colors';
import { useSettingsStore } from '../stores/settings-store';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, setThemeMode } = useSettingsStore();

  const theme = useMemo(() => colors[themeMode], [themeMode]);
  const isDark = themeMode === 'dark';

  const toggleTheme = useCallback(() => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  }, [themeMode, setThemeMode]);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setThemeMode(newMode);
  }, [setThemeMode]);

  const value = useMemo(
    () => ({ mode: themeMode, theme, toggleTheme, setTheme, isDark }),
    [themeMode, theme, toggleTheme, setTheme, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
