export const APP_SCHEME = 'didi';
export const AUTH_REDIRECT_PATH = 'auth/callback';

export const LINE_CHANNEL_ID = '2009005123';

export const PersistKeys = {
  ageVerified18: 'persist.ageVerified18',
  hasCompletedOnboarding: 'persist.hasCompletedOnboarding',
  accessToken: 'persist.accessToken',
  refreshToken: 'persist.refreshToken',
  user: 'persist.user',
} as const;

// Supabase URL from env
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://brsigfliyzwlomomoxqu.supabase.co";
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "sb_publishable_yTnYgR3r8pmTlhOlt1zRHQ_IQO54sBe";;
