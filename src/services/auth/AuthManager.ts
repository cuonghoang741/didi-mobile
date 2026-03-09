import type { Session, User } from '@supabase/supabase-js';
import type { User as UserProfile } from '@/models/customer';
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
  profile: UserProfile | null;
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
    profile: null,
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

  private async _fetchProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      return data as UserProfile;
    } catch (error) {
      console.warn('Error fetching profile:', error);
      return null;
    }
  }

  private async refreshSessionFromClient(): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profile: UserProfile | null = null;
    if (user) {
      profile = await this._fetchProfile(user.id);
    }

    this.setState({
      session: session ?? null,
      user: user ?? null,
      profile,
    });
  }

  async refreshProfile(): Promise<void> {
    if (this._state.user) {
      const profile = await this._fetchProfile(this._state.user.id);
      this.setState({ profile });
    }
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

  get profile(): UserProfile | null {
    return this._state.profile;
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
      nextState.profile !== this._state.profile ||
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

      let profile: UserProfile | null = null;
      if (user) {
        profile = await this._fetchProfile(user.id);
      }

      this.setState({
        session,
        user,
        profile,
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
      this.setState({ session: null, user: null, profile: null });
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

        // Fetch profile
        const profileData = await this._fetchProfile(data.user.id);

        await this.notifyNewUserIfApplicable(data.user);

        this.setState({
          session: data.session,
          user: data.user,
          profile: profileData as UserProfile,
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

  private async notifyNewUserIfApplicable(user: User): Promise<void> {
    try {
      const createdAt = new Date(user.created_at).getTime();
      const lastSignInAt = user.last_sign_in_at
        ? new Date(user.last_sign_in_at).getTime()
        : Date.now();
      if (Math.abs(lastSignInAt - createdAt) < 30000) {
        const customerName =
          user.user_metadata?.full_name || user.phone || user.email || 'Khách hàng';
        await supabase.functions.invoke('notify-admin-action', {
          body: {
            action: 'new_user',
            title: 'Khách hàng mới! 🎉',
            message: `Tài khoản ${customerName} vừa đăng ký vào hệ thống.`,
            data: { user_id: user.id },
          },
        });
      }
    } catch (e) {
      console.error('Failed to notify new user:', e);
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

        // Fetch profile
        const profileData = await this._fetchProfile(data.user.id);

        // Notify if new user
        await this.notifyNewUserIfApplicable(data.user);

        this.setState({
          session: data.session,
          user: data.user,
          profile: profileData as UserProfile,
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

      let profile: UserProfile | null = null;
      if (data.user) {
        profile = await this._fetchProfile(data.user.id);
        await this.notifyNewUserIfApplicable(data.user);
      }

      this.setState({
        session: data.session ?? null,
        user: data.user ?? null,
        profile,
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

        let profile: UserProfile | null = null;
        if (sessionData.user) {
          profile = await this._fetchProfile(sessionData.user.id);
          await this.notifyNewUserIfApplicable(sessionData.user);
        }

        this.setState({
          session: sessionData.session ?? null,
          user: sessionData.user ?? null,
          profile,
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

        let profile: UserProfile | null = null;
        if (sessionData.user) {
          profile = await this._fetchProfile(sessionData.user.id);
          await this.notifyNewUserIfApplicable(sessionData.user);
        }

        this.setState({
          session: sessionData.session ?? null,
          user: sessionData.user ?? null,
          profile,
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
   * Sign in with LINE using Edge Functions
   * Flow:
   * 1. App mở browser đến LINE với redirect_uri = Edge Function (HTTPS)
   * 2. Sau khi user đăng nhập, LINE redirect về Edge Function với code
   * 3. Edge Function redirect về App với code
   * 4. App gọi line-login Edge Function để đổi code lấy session
   *
   * SETUP REQUIRED:
   * 1. LINE Developer Console > LINE Login > Callback URL: https://[project].supabase.co/functions/v1/line-callback
   * 2. Supabase Dashboard > Edge Functions > line-callback: TẮT "Enforce JWT Verification"
   * 3. Supabase Secrets: LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, SUPABASE_SERVICE_ROLE_KEY
   */
  async signInWithLINE(): Promise<void> {
    this.setState({ isLoading: true, errorMessage: null });

    try {
      // LINE callback URL phải là HTTPS - dùng Edge Function làm trung gian
      const lineCallbackUrl = `${SUPABASE_URL}/functions/v1/line-callback`;
      const appRedirectUri = this.buildRedirectUri(); // exp://... hoặc didi://...

      // Tạo state chứa redirect URI để Edge Function biết redirect về đâu
      const stateData = {
        nonce: Math.random().toString(36).substring(7),
        redirectTo: appRedirectUri,
      };
      const state = encodeURIComponent(JSON.stringify(stateData));
      const scope = 'profile openid';

      console.log('[AuthManager] LINE Login - Bước 1: Tạo auth URL', {
        lineCallbackUrl,
        appRedirectUri,
        LINE_CHANNEL_ID,
      });

      // Tạo LINE auth URL
      const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(lineCallbackUrl)}&state=${state}&scope=${encodeURIComponent(scope)}`;

      console.log('[AuthManager] LINE Login - Bước 2: Mở browser');

      // Mở browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);

      console.log('[AuthManager] LINE Login - Bước 3: Kết quả browser:', {
        type: result.type,
        url: result.type === 'success' ? result.url : 'N/A',
      });

      if (result.type !== 'success' || !result.url) {
        console.log(`[AuthManager] LINE login bị hủy: ${result.type}`);
        this.setState({ errorMessage: null, isLoading: false });
        return;
      }

      // Lấy code từ URL
      const { authCode } = this.extractAuthPayloadFromUrl(result.url);

      console.log('[AuthManager] LINE Login - Bước 4: Lấy được code:', authCode ? 'Có' : 'Không');

      if (!authCode) {
        throw new Error(`Không tìm thấy authorization code trong URL: ${result.url}`);
      }

      console.log('[AuthManager] LINE Login - Bước 5: Gọi line-login Edge Function');

      // Gọi Edge Function để đổi code lấy session
      const { data, error: fnError } = await supabase.functions.invoke('line-login', {
        body: {
          code: authCode,
          redirectUri: lineCallbackUrl, // Phải khớp với redirect_uri ban đầu
        },
      });

      console.log('[AuthManager] LINE Login - Bước 6: Kết quả Edge Function:', {
        hasData: !!data,
        hasError: !!fnError,
        errorMessage: fnError?.message,
      });

      if (fnError) {
        throw new Error(fnError.message || 'Edge Function lỗi');
      }

      if (!data?.session) {
        throw new Error(`Server trả về không hợp lệ: ${JSON.stringify(data)}`);
      }

      const { access_token, refresh_token, user } = data.session;

      // Set session vào Supabase client
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || '',
      });

      if (setSessionError) {
        throw setSessionError;
      }

      // Đăng ký OneSignal
      if (user) {
        await oneSignalService.registerUser(user.id, 'customer');
        await this.notifyNewUserIfApplicable(user);
      }

      console.log('[AuthManager] LINE Login - Thành công! ✅');

      this.setState({
        session: { ...data.session, user },
        user: user,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('[AuthManager] signInWithLINE thất bại:', err);

      Alert.alert('Lỗi đăng nhập LINE', err.message || 'Đã có lỗi xảy ra', [{ text: 'OK' }]);

      this.setState({
        errorMessage: err.message || 'Đăng nhập LINE thất bại',
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
