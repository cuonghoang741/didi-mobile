import breakpoints from './breakpoints';
import darkColors from './dark/colors';
import { shadowsDark } from './dark/shadows';
import lightColors from './light/colors';
import { shadowsLight } from './light/shadows';
import palette from './palette';
import { radius, spacing } from './shape';
import { fontFamily, typography } from './typography';

export interface Themes {
  light: typeof baseTheme & {
    colors: typeof lightColors;
    shadows: typeof shadowsLight;
  };
  dark: typeof baseTheme & {
    colors: typeof darkColors;
    shadows: typeof shadowsDark;
  };
}

const baseTheme = {
  radius,
  spacing,
  palette,
  typography,
  fontFamily,
  breakpoints,
};

export const themes: Themes = {
  light: {
    ...baseTheme,
    colors: lightColors,
    shadows: shadowsLight,
  },
  dark: {
    ...baseTheme,
    colors: darkColors,
    shadows: shadowsDark,
  },
};
