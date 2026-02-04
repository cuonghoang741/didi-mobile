import type { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Alert } from 'react-native';

import { supabase } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  APP_SCHEME,
  AUTH_REDIRECT_PATH,
  LINE_CHANNEL_ID,
  PersistKeys,
  SUPABASE_URL,
} from '../config/auth.config';
import { oneSignalService } from '../onesignal/OneSignalService';

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
      // Unregister user from OneSignal (remove tags and external ID)
      await oneSignalService.unregisterUser();

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
   * Map Supabase phone auth errors to user-friendly Vietnamese messages
   */
  private getPhoneAuthErrorMessage(error: any): string {
    const errorCode = error?.code || error?.error_code || '';
    const errorMessage = error?.message || '';
    const status = error?.status || 0;

    // Log detailed error for debugging
    console.error('[AuthManager] signInWithPhone error details:', {
      code: errorCode,
      status: status,
      message: errorMessage,
      fullError: JSON.stringify(error, null, 2),
    });

    // Rate limiting errors
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      status === 429
    ) {
      return 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi vài phút rồi thử lại.';
    }

    // Phone format errors
    if (
      errorMessage.includes('Invalid phone') ||
      errorMessage.includes('phone number') ||
      errorMessage.includes('Phone number is invalid')
    ) {
      return 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.';
    }

    // Provider not enabled
    if (
      errorMessage.includes('Phone provider is not enabled') ||
      errorMessage.includes('provider is not enabled')
    ) {
      return 'Tính năng đăng nhập bằng số điện thoại chưa được kích hoạt. Vui lòng liên hệ hỗ trợ.';
    }

    // SMS sending errors
    if (
      errorMessage.includes('failed to send') ||
      errorMessage.includes('SMS') ||
      errorMessage.includes('Unable to validate')
    ) {
      return 'Không thể gửi tin nhắn OTP. Vui lòng kiểm tra số điện thoại và thử lại.';
    }

    // Database error - check before generic 500 error
    if (errorMessage.includes('database') || errorMessage.includes('Database')) {
      return 'Có lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
    }

    // Network/server errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      status >= 500
    ) {
      return 'Lỗi kết nối. Vui lòng kiểm tra mạng Internet và thử lại.';
    }

    // Email signup disabled (wrong config)
    if (errorMessage.includes('Email signups are disabled')) {
      return 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.';
    }

    // Validation error
    if (errorMessage.includes('validation') || status === 422) {
      return 'Thông tin không hợp lệ. Vui lòng kiểm tra số điện thoại.';
    }

    // Default fallback with original message for debugging
    console.warn('[AuthManager] Unhandled phone auth error:', errorMessage);
    return `Không thể gửi mã xác thực. ${errorMessage || 'Vui lòng thử lại.'}`;
  }

  /**
   * Check if phone number already exists in the system
   */
  async checkPhoneExists(phone: string): Promise<{ exists: boolean; hasPassword: boolean }> {
    try {
      const { data, error } = await (supabase.rpc as any)('check_phone_exists', {
        phone_number: phone,
      });

      if (error) {
        console.error('[AuthManager] checkPhoneExists error:', error);
        return { exists: false, hasPassword: false };
      }

      return {
        exists: data?.exists || false,
        hasPassword: data?.has_password || false,
      };
    } catch (error) {
      console.error('[AuthManager] checkPhoneExists exception:', error);
      return { exists: false, hasPassword: false };
    }
  }

  /**
   * Sign in with Phone and Password
   */
  async signInWithPhonePassword(
    phone: string,
    password: string,
  ): Promise<{ session: Session; user: User } | null> {
    this.setState({ isLoading: true, errorMessage: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) {
        this.setState({
          errorMessage: 'Số điện thoại hoặc mật khẩu không đúng',
          isLoading: false,
        });
        return null;
      }

      if (data.session && data.user) {
        await oneSignalService.registerUser(data.user.id, 'customer');

        this.setState({
          session: data.session,
          user: data.user,
          isLoading: false,
        });
        return { session: data.session, user: data.user };
      }

      this.setState({
        isLoading: false,
        errorMessage: 'Đăng nhập thất bại',
      });
      return null;
    } catch (error: any) {
      console.error('[AuthManager] signInWithPhonePassword exception:', error);
      this.setState({
        isLoading: false,
        errorMessage: error.message || 'Đăng nhập thất bại',
      });
      return null;
    }
  }

  /**
   * Set password for user after OTP verification
   */
  async setPasswordAfterOtp(password: string): Promise<{ success: boolean; message: string }> {
    this.setState({ isLoading: true, errorMessage: null });

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        this.setState({
          errorMessage: 'Không thể thiết lập mật khẩu',
          isLoading: false,
        });
        return { success: false, message: 'Không thể thiết lập mật khẩu' };
      }

      this.setState({ isLoading: false });
      return { success: true, message: 'Thiết lập mật khẩu thành công' };
    } catch (error: any) {
      console.error('[AuthManager] setPasswordAfterOtp exception:', error);
      this.setState({
        isLoading: false,
        errorMessage: error.message || 'Không thể thiết lập mật khẩu',
      });
      return { success: false, message: error.message || 'Không thể thiết lập mật khẩu' };
    }
  }

  /**
   * Sign in with Phone (OTP)
   */
  async signInWithPhone(phone: string): Promise<{ success: boolean; message: string }> {
    this.setState({ isLoading: true, errorMessage: null });

    console.log('[AuthManager] signInWithPhone called with:', phone);

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
      });

      console.log('[AuthManager] signInWithOtp response:', {
        hasData: !!data,
        hasError: !!error,
        data: data,
      });

      if (error) {
        const friendlyMessage = this.getPhoneAuthErrorMessage(error);
        this.setState({ errorMessage: friendlyMessage, isLoading: false });
        return { success: false, message: friendlyMessage };
      }

      console.log('[AuthManager] OTP sent successfully to:', phone);
      this.setState({ isLoading: false });
      return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
      console.error('[AuthManager] signInWithPhone exception:', error);
      const friendlyMessage = this.getPhoneAuthErrorMessage(error);
      this.setState({
        isLoading: false,
        errorMessage: friendlyMessage,
      });
      return { success: false, message: friendlyMessage };
    }
  }

  /**
   * Map OTP verification errors to user-friendly Vietnamese messages
   */
  private getOtpVerifyErrorMessage(error: any): string {
    const errorCode = error?.code || error?.error_code || '';
    const errorMessage = error?.message || '';
    const status = error?.status || 0;

    // Log detailed error for debugging
    console.error('[AuthManager] verifyPhoneOtp error details:', {
      code: errorCode,
      status: status,
      message: errorMessage,
      fullError: JSON.stringify(error, null, 2),
    });

    // Invalid/expired OTP
    if (
      errorMessage.includes('Token has expired') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('Expired')
    ) {
      return 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.';
    }

    // Wrong OTP code
    if (
      errorMessage.includes('Invalid token') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('incorrect') ||
      errorMessage.includes('Token has not been')
    ) {
      return 'Mã xác thực không đúng. Vui lòng kiểm tra lại.';
    }

    // Rate limiting
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many') ||
      status === 429
    ) {
      return 'Bạn đã thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.';
    }

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      status >= 500
    ) {
      return 'Lỗi kết nối. Vui lòng kiểm tra mạng Internet và thử lại.';
    }

    // Default fallback
    console.warn('[AuthManager] Unhandled OTP verify error:', errorMessage);
    return `Xác thực thất bại. ${errorMessage || 'Vui lòng thử lại.'}`;
  }

  /**
   * Verify Phone OTP
   */
  async verifyPhoneOtp(
    phone: string,
    token: string,
  ): Promise<{ session: Session; user: User } | null> {
    this.setState({ isLoading: true, errorMessage: null });

    console.log('[AuthManager] verifyPhoneOtp called:', { phone, tokenLength: token.length });

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      console.log('[AuthManager] verifyOtp response:', {
        hasData: !!data,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        hasError: !!error,
      });

      if (error) {
        const friendlyMessage = this.getOtpVerifyErrorMessage(error);
        this.setState({ errorMessage: friendlyMessage, isLoading: false });
        return null;
      }

      if (data.session && data.user) {
        console.log('[AuthManager] OTP verified successfully, user:', data.user.id);

        // Register user with OneSignal (set external ID and tags)
        await oneSignalService.registerUser(data.user.id, 'customer');

        this.setState({
          session: data.session,
          user: data.user,
          isLoading: false,
        });
        return { session: data.session, user: data.user };
      }

      console.warn('[AuthManager] verifyOtp returned no session/user');
      this.setState({
        isLoading: false,
        errorMessage: 'Xác thực thất bại. Vui lòng thử lại.',
      });
      return null;
    } catch (error: any) {
      console.error('[AuthManager] verifyPhoneOtp exception:', error);
      const friendlyMessage = this.getOtpVerifyErrorMessage(error);
      this.setState({
        isLoading: false,
        errorMessage: friendlyMessage,
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

      // Register user with OneSignal after Apple sign in
      if (data.user) {
        await oneSignalService.registerUser(data.user.id, 'customer');
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
      console.log('[AuthManager] Google OAuth redirect URI:', redirectUri);

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

        // Register user with OneSignal after Google sign in (code flow)
        if (sessionData.user) {
          await oneSignalService.registerUser(sessionData.user.id, 'customer');
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

        // Register user with OneSignal after Google sign in (token flow)
        if (sessionData.user) {
          await oneSignalService.registerUser(sessionData.user.id, 'customer');
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
      // LINE callback URL must be HTTPS - use edge function as intermediary
      // The edge function will redirect back to the app with the code
      const lineCallbackUrl = `${SUPABASE_URL}/functions/v1/line-callback`;
      const appRedirectUri = this.buildRedirectUri(); // didi://auth/callback
      const state = Math.random().toString(36).substring(7);
      const scope = 'profile openid';

      console.log('[AuthManager] LINE Login - Step 1: Building auth URL', {
        lineCallbackUrl,
        appRedirectUri,
        state,
        scope,
        LINE_CHANNEL_ID,
      });

      // Construct LINE auth URL with HTTPS callback
      const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(
        lineCallbackUrl,
      )}&state=${state}&scope=${encodeURIComponent(scope)}`;

      console.log('[AuthManager] LINE Login - Step 2: Opening browser with URL:', authUrl);

      // Open browser - LINE will redirect to edge function, which redirects to app
      const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);

      console.log('[AuthManager] LINE Login - Step 3: Browser result:', {
        type: result.type,
        url: result.type === 'success' ? result.url : 'N/A',
      });

      if (result.type !== 'success' || !result.url) {
        console.log(`[AuthManager] LINE login aborted with result type: ${result.type}`);
        this.setState({ errorMessage: null, isLoading: false });
        return;
      }

      const { authCode } = this.extractAuthPayloadFromUrl(result.url);

      console.log('[AuthManager] LINE Login - Step 4: Extracted auth code:', {
        authCode: authCode ? `${authCode.substring(0, 10)}...` : 'null',
        fullUrl: result.url,
      });

      if (!authCode) {
        const errorMsg = `No authorization code found in URL: ${result.url}`;
        console.error('[AuthManager]', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[AuthManager] LINE Login - Step 5: Calling line-login edge function');

      // Call Supabase Edge Function to exchange code for session
      const { data, error: fnError } = await supabase.functions.invoke('line-login', {
        body: {
          code: authCode,
          redirectUri: lineCallbackUrl, // Must match what was sent to LINE
        },
      });

      console.log('[AuthManager] LINE Login - Step 6: Edge function response:', {
        hasData: !!data,
        hasError: !!fnError,
        errorMessage: fnError?.message,
        dataKeys: data ? Object.keys(data) : [],
      });

      if (fnError) {
        console.error('[AuthManager] LINE Login - Edge function error:', {
          message: fnError.message,
          name: fnError.name,
          context: fnError.context,
          details: fnError,
        });
        throw fnError;
      }

      if (!data?.session) {
        const errorMsg = `Invalid response from server. Data: ${JSON.stringify(data)}`;
        console.error('[AuthManager]', errorMsg);
        throw new Error(errorMsg);
      }

      const { access_token, refresh_token, user } = data.session;

      console.log('[AuthManager] LINE Login - Step 7: Setting session', {
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token,
        hasUser: !!user,
        userId: user?.id,
      });

      // Set session to Supabase client
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || '',
      });

      if (setSessionError) {
        console.error('[AuthManager] LINE Login - Set session error:', setSessionError);
        throw setSessionError;
      }

      console.log('[AuthManager] LINE Login - Step 8: Registering user with OneSignal');

      // Register user with OneSignal after LINE sign in
      if (user) {
        await oneSignalService.registerUser(user.id, 'customer');
      }

      console.log('[AuthManager] LINE Login - Step 9: Success! ✅');

      // Success
      this.setState({
        session: { ...data.session, user }, // Ensure structure matches
        user: user,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('[AuthManager] signInWithLINE failed', err);

      // Build detailed error message for debugging
      const errorDetails = {
        message: err.message || 'Unknown error',
        name: err.name,
        code: err.code || err.error_code,
        status: err.status,
        details: err.details,
        hint: err.hint,
        fullError: JSON.stringify(err, null, 2),
      };

      const debugMessage = `
🔴 LINE Login Error Debug Info:

Message: ${errorDetails.message}
Name: ${errorDetails.name || 'N/A'}
Code: ${errorDetails.code || 'N/A'}
Status: ${errorDetails.status || 'N/A'}
Details: ${errorDetails.details || 'N/A'}
Hint: ${errorDetails.hint || 'N/A'}

Full Error:
${errorDetails.fullError}
      `.trim();

      console.error(debugMessage);

      // Show alert with detailed error
      Alert.alert(
        'LINE Login Error',
        debugMessage,
        [{ text: 'OK', style: 'cancel' }]
      );

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
      meta?.full_name || meta?.display_name || meta?.name || this._state.user?.email || 'Member'
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
   * Get user avatar URL - returns DiceBear avatar as default
   */
  getAvatarUrl(): string {
    const avatarUrl = this._state.user?.user_metadata?.avatar_url;
    if (avatarUrl) return avatarUrl;

    // Generate default avatar using DiceBear API with user's display name as seed
    const seed = encodeURIComponent(this.getDisplayName());
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}`;
  }
}

// Export singleton instance
export const authManager = AuthManager.shared;
