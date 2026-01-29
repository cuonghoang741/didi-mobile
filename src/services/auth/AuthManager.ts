import type { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  APP_SCHEME,
  AUTH_REDIRECT_PATH,
  LINE_CHANNEL_ID,
  PersistKeys,
} from '../config/auth.config';

WebBrowser.maybeCompleteAuthSession();

type AuthManagerState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  errorMessage: string | null;
  hasRestoredSession: boolean;
};

/**
 * AuthManager - Singleton class for managing authentication
 * Supports: Phone, Apple, Google, LINE
 */
export class AuthManager {
  private static instance: AuthManager;

  // State properties
  private _state: AuthManagerState = {
    session: null,
    user: null,
    isLoading: false,
    errorMessage: null,
    hasRestoredSession: false,
  };

  // Keep legacy private vars for now if needed, or rely on _state
  // To minimize changes and risk, I will map getters to _state

  // Listeners for state changes
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.restoreSession();
  }

  private buildRedirectUri(): string {
    return AuthSession.makeRedirectUri({
      scheme: APP_SCHEME,
      path: AUTH_REDIRECT_PATH,
    });
  }

  private async refreshSessionFromClient(): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    this.setState({
      session: session ?? null,
      user: user ?? null,
    });
  }

  static get shared(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Getters
  get session(): Session | null {
    return this._state.session;
  }

  get user(): User | null {
    return this._state.user;
  }

  get isLoading(): boolean {
    return this._state.isLoading;
  }

  get errorMessage(): string | null {
    return this._state.errorMessage;
  }

  get hasRestoredSession(): boolean {
    return this._state.hasRestoredSession;
  }

  get isLoggedIn(): boolean {
    return !!this._state.session && !!this._state.user;
  }

  getSnapshot = (): AuthManagerState => {
    return this._state;
  };

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  private setState(partial: Partial<AuthManagerState>): void {
    const nextState = { ...this._state, ...partial };

    // Check for actual changes to avoid unnecessary updates
    const hasChanged =
      nextState.session !== this._state.session ||
      nextState.user !== this._state.user ||
      nextState.isLoading !== this._state.isLoading ||
      nextState.errorMessage !== this._state.errorMessage ||
      nextState.hasRestoredSession !== this._state.hasRestoredSession;

    if (hasChanged) {
      this._state = nextState;
      this.notifyListeners();
    }
  }

  /**
   * Restore session from storage
   */
  /**
   * Restore session from storage
   */
  private async restoreSession(): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      this.setState({
        session,
        user,
        hasRestoredSession: true,
      });
    } catch (error) {
      console.error('Error restoring session:', error);
      this.setState({
        hasRestoredSession: true,
      });
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    this.setState({ session });
    return session;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    this.setState({ user });
    return user;
  }

  /**
   * Sign out
   */
  async logout(): Promise<void> {
    this.setState({ isLoading: true, errorMessage: null });

    try {
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove([
        PersistKeys.accessToken,
        PersistKeys.refreshToken,
        PersistKeys.user,
      ]);
      this.setState({ session: null, user: null });
    } catch (error: any) {
      this.setState({ errorMessage: error.message || 'Failed to sign out' });
      throw error;
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Sign in with Phone (OTP)
   */
  async signInWithPhone(phone: string): Promise<{ success: boolean; message: string }> {
    this.setState({ isLoading: true, errorMessage: null });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        this.setState({ errorMessage: error.message });
        return { success: false, message: error.message };
      }

      this.setState({ isLoading: false });
      return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
      this.setState({
        isLoading: false,
        errorMessage: error.message || 'Failed to send OTP',
      });
      return { success: false, message: error.message || 'Failed to send OTP' };
    }
  }

  /**
   * Verify Phone OTP
   */
  async verifyPhoneOtp(
    phone: string,
    token: string,
  ): Promise<{ session: Session; user: User } | null> {
    this.setState({ isLoading: true, errorMessage: null });

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        this.setState({ errorMessage: error.message, isLoading: false });
        return null;
      }

      if (data.session && data.user) {
        this.setState({
          session: data.session,
          user: data.user,
          isLoading: false,
        });
        return { session: data.session, user: data.user };
      }

      this.setState({ isLoading: false });
      return null;
    } catch (error: any) {
      this.setState({
        isLoading: false,
        errorMessage: error.message || 'Failed to verify OTP',
      });
      return null;
    }
  }

  /**
   * Sign in with Apple (iOS only)
   */
  async signInWithApple(): Promise<void> {
    if (Platform.OS !== 'ios') {
      this.setState({
        errorMessage: 'Sign in with Apple is only available on iOS',
      });
      return;
    }

    this.setState({ isLoading: true, errorMessage: null });

    try {
      const nonce =
        typeof Crypto.randomUUID === 'function'
          ? Crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('Could not get Apple identity token');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce,
      });

      if (error) {
        throw error;
      }

      this.setState({
        session: data.session ?? null,
        user: data.user ?? null,
      });
    } catch (error: any) {
      if (error?.code === 'ERR_CANCELED') {
        console.log('[AuthManager] User cancelled Sign in with Apple');
        this.setState({ errorMessage: null });
        return;
      }
      console.error('[AuthManager] Sign in with Apple failed', error);
      this.setState({
        errorMessage: error?.message || 'Failed to sign in with Apple',
      });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Sign in with Google using Supabase OAuth
   */
  async signInWithGoogle(): Promise<void> {
    this.setState({ isLoading: true, errorMessage: null });

    try {
      const redirectUri = this.buildRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Failed to get OAuth URL from Supabase');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type !== 'success' || !result.url) {
        console.log(`[AuthManager] Google login aborted with result type: ${result.type}`);
        this.setState({ errorMessage: null });
        return;
      }

      const authPayload = this.extractAuthPayloadFromUrl(result.url);

      if (authPayload.authCode) {
        const { data: sessionData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(authPayload.authCode);

        if (exchangeError) {
          throw exchangeError;
        }

        this.setState({
          session: sessionData.session ?? null,
          user: sessionData.user ?? null,
        });
        return;
      }

      if (authPayload.accessToken && authPayload.refreshToken) {
        const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
          access_token: authPayload.accessToken,
          refresh_token: authPayload.refreshToken,
        });

        if (setSessionError) {
          throw setSessionError;
        }

        this.setState({
          session: sessionData.session ?? null,
          user: sessionData.user ?? null,
        });
        return;
      }

      throw new Error('Could not find auth code from Google');
    } catch (err: any) {
      console.error('[AuthManager] signInWithGoogle failed', err);
      this.setState({ errorMessage: err.message || 'Failed to sign in' });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Sign in with LINE using Supabase Custom OIDC Provider
   * Note: LINE must be configured as a custom OIDC provider in Supabase Dashboard
   * Go to: Supabase Dashboard > Authentication > Providers > Add custom provider
   * - Name: line
   * - Client ID: Your LINE Channel ID
   * - Client Secret: Your LINE Channel Secret
   * - Issuer URL: https://access.line.me
   * - Authorization URL: https://access.line.me/oauth2/v2.1/authorize
   * - Token URL: https://api.line.me/oauth2/v2.1/token
   * - Userinfo URL: https://api.line.me/v2/profile
   */
  async signInWithLINE(): Promise<void> {
    this.setState({ isLoading: true, errorMessage: null });

    try {
      const redirectUri = this.buildRedirectUri();
      const state = Math.random().toString(36).substring(7);
      const scope = 'profile openid email';

      // Construct logic URL manually
      const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&state=${state}&scope=${encodeURIComponent(scope)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success' || !result.url) {
        console.log(`[AuthManager] LINE login aborted with result type: ${result.type}`);
        this.setState({ errorMessage: null, isLoading: false });
        return;
      }

      const { authCode } = this.extractAuthPayloadFromUrl(result.url);

      if (!authCode) {
        throw new Error('No authorization code found');
      }

      // Call Supabase Edge Function to exchange code
      const { data, error: fnError } = await supabase.functions.invoke('line-login', {
        body: {
          code: authCode,
          redirectUri: redirectUri,
        },
      });

      if (fnError) throw fnError;
      if (!data?.session) throw new Error('Invalid response from server');

      const { access_token, refresh_token, user } = data.session;

      // Set session to Supabase client
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || '',
      });

      if (setSessionError) throw setSessionError;

      // Success
      this.setState({
        session: { ...data.session, user }, // Ensure structure matches
        user: user,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('[AuthManager] signInWithLINE failed', err);
      this.setState({
        errorMessage: err.message || 'Failed to sign in with LINE',
        isLoading: false,
      });
    }
  }

  private extractAuthPayloadFromUrl(url: string) {
    const parsedUrl = new URL(url);
    const queryParams = parsedUrl.searchParams;
    const fragment = parsedUrl.hash?.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash;
    const fragmentParams = fragment ? new URLSearchParams(fragment) : null;

    const authCode =
      queryParams.get('code') || fragmentParams?.get('code') || fragmentParams?.get('auth_code');
    const accessToken = queryParams.get('access_token') || fragmentParams?.get('access_token');
    const refreshToken = queryParams.get('refresh_token') || fragmentParams?.get('refresh_token');

    const errorDescription =
      queryParams.get('error_description') || fragmentParams?.get('error_description');
    const error = queryParams.get('error') || fragmentParams?.get('error');

    if (error || errorDescription) {
      throw new Error(errorDescription || error || 'Sign-in returned an error');
    }

    return { authCode, accessToken, refreshToken };
  }

  /**
   * Get user ID (lowercase)
   */
  getUserId(): string | null {
    return this._state.user?.id?.toLowerCase() || null;
  }

  /**
   * Get user display name
   */
  getDisplayName(): string {
    const meta = this._state.user?.user_metadata;
    return (
      meta?.full_name || meta?.display_name || meta?.name || this._state.user?.email || 'Guest'
    );
  }

  /**
   * Get user email
   */
  getEmail(): string | null {
    return this._state.user?.email || null;
  }

  /**
   * Get user phone
   */
  getPhone(): string | null {
    return this._state.user?.phone || null;
  }

  /**
   * Get user avatar URL
   */
  getAvatarUrl(): string | null {
    return this._state.user?.user_metadata?.avatar_url || null;
  }
}

// Export singleton instance
export const authManager = AuthManager.shared;
