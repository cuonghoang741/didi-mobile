import { STORAGE_KEYS } from '@/constants/storage-key';
import * as SecureStore from 'expo-secure-store';
import { User } from './model/auth-user';

export class StorageService {
  // Token methods
  static async setAccessToken(token: string): Promise<void> {
    // Guard: skip invalid values, SecureStore only accepts strings
    if (token == null) return;
    const value = typeof token === 'string' ? token : String(token);
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN_KEY, value);
  }

  static async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN_KEY);
  }

  static async setRefreshToken(token: string): Promise<void> {
    // Guard: skip invalid values, SecureStore only accepts strings
    if (token == null || token === '') return;
    const value = typeof token === 'string' ? token : String(token);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN_KEY, value);
  }

  static async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN_KEY);
  }

  // User info methods
  static async setUserInfo(user: User): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_INFO_KEY, JSON.stringify(user));
  }

  static async getUserInfo(): Promise<User | null> {
    const userString = await SecureStore.getItemAsync(STORAGE_KEYS.USER_INFO_KEY);
    if (!userString) return null;

    try {
      return JSON.parse(userString) as User;
    } catch (error) {
      console.error('Error parsing user info from storage:', error);
      return null;
    }
  }

  // Device ID methods
  static async setDeviceId(deviceId: string): Promise<void> {
    await SecureStore.setItemAsync('device_id', deviceId);
  }

  static async getDeviceId(): Promise<string | null> {
    const existing = await SecureStore.getItemAsync('device_id');
    // check nếu length dài hơn 10 ký tự
    if (existing && existing.length > 15) return existing;

    // Generate a new UUID v4 on first launch and persist it
    try {
      const uuidV4 = (() => {
        // RFC 4122 version 4 UUID using Math.random() (sufficient for app-level ID)
        const hex = [] as string[];
        for (let i = 0; i < 256; i++) {
          hex[i] = (i + 256).toString(16).slice(1);
        }
        const rnd = () => Math.floor(Math.random() * 256);
        const b = new Array<number>(16);
        for (let i = 0; i < 16; i++) b[i] = rnd();
        b[6] = (b[6] & 0x0f) | 0x40; // version 4
        b[8] = (b[8] & 0x3f) | 0x80; // variant
        return (
          hex[b[0]] +
          hex[b[1]] +
          hex[b[2]] +
          hex[b[3]] +
          '-' +
          hex[b[4]] +
          hex[b[5]] +
          '-' +
          hex[b[6]] +
          hex[b[7]] +
          '-' +
          hex[b[8]] +
          hex[b[9]] +
          '-' +
          hex[b[10]] +
          hex[b[11]] +
          hex[b[12]] +
          hex[b[13]] +
          hex[b[14]] +
          hex[b[15]]
        );
      })();

      await SecureStore.setItemAsync('device_id', uuidV4);
      return uuidV4;
    } catch (error) {
      console.error('Failed to generate device UUID:', error);
      return null;
    }
  }

  // Clear all auth data
  static async clearAuthData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER_INFO_KEY),
      // SecureStore.deleteItemAsync('device_id'),
    ]);
  }

  // Check if user is logged in
  static async isLoggedIn(): Promise<boolean> {
    const token = await this.getAccessToken();
    const user = await this.getUserInfo();
    return !!(token && user);
  }

  // Save login data (token + user info)
  static async saveLoginData(accessToken: string, refreshToken: string | undefined | null, user: User): Promise<void> {
    const promises = [
      this.setAccessToken(accessToken),
      this.setUserInfo(user),
    ];

    // Only save refresh token if it exists and is a string
    if (refreshToken && typeof refreshToken === 'string') {
      promises.push(this.setRefreshToken(refreshToken));
    }

    await Promise.all(promises);
  }
}

export default StorageService;
