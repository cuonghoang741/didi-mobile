export const TABS = {
  HOME: '/(tabs)',
  COOKBOOK: '/(tabs)/cookbook',
  FAVOURITE: '/(tabs)/favourite',
  PROFILE: '/(tabs)/profile',
} as const;

export const AUTH = {
  LOGIN: {
    ROOT: '/(auth)/login',
    VERIFY_OTP: '/(auth)/login/verify-otp',
  },
  REGISTER: {
    ROOT: '/(auth)/register',
    VERIFY_OTP: '/(auth)/register/verify-otp',
  },
  FORGOT_PASSWORD: {
    ROOT: '/(auth)/forgot-password',
    VERIFY_OTP: '/(auth)/forgot-password/verify-otp',
    RESET_PASSWORD: '/(auth)/forgot-password/reset-password',
  },
} as const;

export const ROUTES = {
  TABS,
  AUTH,
} as const;

export const DEFAULT_APP_ROUTE = ROUTES.TABS.HOME;
