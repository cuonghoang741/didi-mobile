import React, { createContext, useContext, useMemo } from 'react';


import { themes } from '@/themes';

type ThemeType = typeof themes.light;

const ThemeContext = createContext<ThemeType>(themes.light);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {


  const theme = useMemo<ThemeType>(() => themes.light, []);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
