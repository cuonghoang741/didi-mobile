import StorageService from '@/services/auth-by-device/storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, LoginWithDeviceIdRequest } from './api/auth';
import { User } from './model/auth-user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  loginWithDeviceId: (
    data: LoginWithDeviceIdRequest,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!user;

  // Helper function to save login response
  const saveLoginResponse = useCallback(async (response: {
    accessToken: string;
    refreshToken?: string;
    user: User;
  }) => {
    await StorageService.saveLoginData(
      response.accessToken,
      response?.refreshToken || response.accessToken,
      response.user
    );
    setUser(response.user);
  }, []);

  // Get user info from API and update state
  // If fails, automatically logout (clear auth data)
  const getMyInfo = useCallback(async (): Promise<User | null> => {
    try {
      const responseMyInfo = await authApi.getMyInfo();
      setUser(responseMyInfo);
      return responseMyInfo;
    } catch (error) {
      console.error('Error getting user info:', error);
      // If getMyInfo fails, logout (clear auth data)
      await StorageService.clearAuthData();
      setUser(null);
      return null;
    }
  }, []);

  // Auto login with device ID (only when user is not logged in)
  const autoLoginWithDeviceId = useCallback(async () => {
    try {
      // Get device ID from storage (auto generates/persists via storage if missing)
      const deviceId = await StorageService.getDeviceId();

      if (!deviceId) {
        console.error('Failed to get or generate device ID');
        setUser(null);
        return;
      }

      // Attempt login with device ID
      const result = await authApi.loginWithDeviceId({ deviceId });

      if (result) {
        await saveLoginResponse(result);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auto login with device ID error:', error);
      setUser(null);
    }
  }, [saveLoginResponse]);

  // Check authentication status on app start
  // Always calls getMyInfo if user is logged in, and logout if it fails
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const isLoggedIn = await StorageService.isLoggedIn();

      if (isLoggedIn) {
        // User is already logged in, always get fresh user info from API
        // If getMyInfo fails, it will automatically logout (clear auth data)
        await getMyInfo();
      } else {
        // User is not logged in, attempt auto login with device ID
        await autoLoginWithDeviceId();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getMyInfo, autoLoginWithDeviceId]);

  // Login with device ID
  const handleLoginWithDeviceId = useCallback(async (
    data: LoginWithDeviceIdRequest
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      const response = await authApi.loginWithDeviceId(data);

      if (response) {
        await saveLoginResponse(response);
        return { success: true, message: 'Login successful' };
      } else {
        return { success: false, message: 'Login failed' };
      }
    } catch (error) {
      console.error('Device ID login error:', error);
      return { success: false, message: 'Device ID login failed' };
    } finally {
      setIsLoading(false);
    }
  }, [saveLoginResponse]);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      await StorageService.clearAuthData();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggedIn,
    loginWithDeviceId: handleLoginWithDeviceId,
    logout: handleLogout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
