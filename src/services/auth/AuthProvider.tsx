import type { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';

import { authManager } from './AuthManager';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  errorMessage: string | null;
  hasRestoredSession: boolean;
  // Actions
  checkPhoneExists: (phone: string) => Promise<{ exists: boolean; hasPassword: boolean }>;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; message: string }>;
  signInWithPhonePassword: (
    phone: string,
    password: string,
  ) => Promise<{ session: Session; user: User } | null>;
  verifyPhoneOtp: (
    phone: string,
    token: string,
  ) => Promise<{ session: Session; user: User } | null>;
  setPasswordAfterOtp: (password: string) => Promise<{ success: boolean; message: string }>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithLINE: () => Promise<void>;
  logout: () => Promise<void>;
  // Helpers
  getUserId: () => string | null;
  getDisplayName: () => string;
  getEmail: () => string | null;
  getPhone: () => string | null;
  getAvatarUrl: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Stable snapshot reference
const getSnapshot = authManager.getSnapshot;
const subscribe = (callback: () => void) => authManager.subscribe(callback);

/**
 * AuthProvider - React context provider for AuthManager
 * Uses useSyncExternalStore for efficient state synchronization
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Subscribe to AuthManager state changes
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isLoggedIn = !!state.session && !!state.user;

  // Memoize action functions
  const checkPhoneExists = useCallback((phone: string) => authManager.checkPhoneExists(phone), []);
  const signInWithPhone = useCallback((phone: string) => authManager.signInWithPhone(phone), []);
  const signInWithPhonePassword = useCallback(
    (phone: string, password: string) => authManager.signInWithPhonePassword(phone, password),
    [],
  );
  const verifyPhoneOtp = useCallback(
    (phone: string, token: string) => authManager.verifyPhoneOtp(phone, token),
    [],
  );
  const setPasswordAfterOtp = useCallback(
    (password: string) => authManager.setPasswordAfterOtp(password),
    [],
  );
  const signInWithApple = useCallback(() => authManager.signInWithApple(), []);
  const signInWithGoogle = useCallback(() => authManager.signInWithGoogle(), []);
  const signInWithLINE = useCallback(() => authManager.signInWithLINE(), []);
  const logout = useCallback(() => authManager.logout(), []);

  // Memoize helper functions
  const getUserId = useCallback(() => authManager.getUserId(), []);
  const getDisplayName = useCallback(() => authManager.getDisplayName(), []);
  const getEmail = useCallback(() => authManager.getEmail(), []);
  const getPhone = useCallback(() => authManager.getPhone(), []);
  const getAvatarUrl = useCallback(() => authManager.getAvatarUrl(), []);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      isLoggedIn,
      checkPhoneExists,
      signInWithPhone,
      signInWithPhonePassword,
      verifyPhoneOtp,
      setPasswordAfterOtp,
      signInWithApple,
      signInWithGoogle,
      signInWithLINE,
      logout,
      getUserId,
      getDisplayName,
      getEmail,
      getPhone,
      getAvatarUrl,
    }),
    [
      state,
      isLoggedIn,
      checkPhoneExists,
      signInWithPhone,
      signInWithPhonePassword,
      verifyPhoneOtp,
      setPasswordAfterOtp,
      signInWithApple,
      signInWithGoogle,
      signInWithLINE,
      logout,
      getUserId,
      getDisplayName,
      getEmail,
      getPhone,
      getAvatarUrl,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth hook - Access auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
