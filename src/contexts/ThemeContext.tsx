import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { themes } from '@/themes';

type ThemeType = typeof themes.light;

const ThemeContext = createContext<ThemeType>(themes.light);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scheme = useColorScheme();

  const theme = useMemo<ThemeType>(
    () => (scheme === 'dark' ? themes.dark : themes.light) as ThemeType,
    [scheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
