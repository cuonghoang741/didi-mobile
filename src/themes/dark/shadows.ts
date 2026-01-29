import palette from '../palette';

export const shadowsDark = {
  xs: {
    shadowColor: palette.grayDark[50],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: palette.grayDark[50],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: palette.grayDark[50],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: palette.grayDark[50],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  xl: {
    shadowColor: palette.grayDark[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 10,
  },
  '2xl': {
    shadowColor: palette.grayDark[900],
    shadowOffset: {
      width: 0,
      height: 24,
    },
    shadowOpacity: 0.18,
    shadowRadius: 48,
    elevation: 24,
  },
};
