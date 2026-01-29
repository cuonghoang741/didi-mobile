import { type User } from '@/models/user';
import {
  LoginRequest,
  LoginResponse,
  LoginWithGoogleRequest,
  LoginWithGoogleResponse,
  LogoutResponse,
  LogoutWithAppleRequest,
  LogoutWithAppleResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/types';

import publicApi from '../config/publicApi.config';

const ACCOUNT = {
  account: 'quocquynguyen0311@gmail.com',
  password: '123456',
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  // Simulate server validation
  await new Promise((r) => setTimeout(r, 1000));

  if (data.account !== ACCOUNT.account || data.password !== ACCOUNT.password) {
    const emptyUser: User = {
      id: 0,
      name: '',
      email: '',
      avatar: null,
      phone: null,
      roleId: null,
      dob: null,
      role: null,
      address: null,
      city: null,
      state: null,
      zip: null,
      country: null,
      gender: null,
      height: null,
      weight: null,
      goal: null,
      activity: null,
      diet: null,
      sleep: null,
      stress: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    return {
      success: false,
      message: 'Invalid credentials',
      data: { token: '', user: emptyUser },
    };
  }

  const mockUser: User = {
    id: 1,
    name: 'Nguyễn Quốc Quý',
    email: data.account,
    avatar:
      'https://lh3.googleusercontent.com/a/ACg8ocJqXyXJ9o3N7EXneEQbggjkq2y9f_KhP8N0DHqGl0Dg=s96-c',
    phone: '0923488371',
    roleId: null,
    dob: null,
    role: 'user',
    address: '123 Nguyen Van Linh, Q9, TP.HCM',
    city: 'TP.HCM',
    state: 'TP.HCM',
    zip: '123456',
    country: 'VN',
    gender: 'male',
    height: 180,
    weight: 70,
    goal: 'lose weight',
    activity: 'moderate',
    diet: 'vegetarian',
    sleep: '7 hours',
    stress: 'low',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  return {
    success: true,
    message: 'Login successful',
    data: {
      token: `fake_access_token_${Date.now()}`,
      user: mockUser,
    },
  };
};

export const verifyOtp = async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  await new Promise((r) => setTimeout(r, 1000));

  if (data.otp !== '12345') {
    return {
      success: false,
      message: 'Invalid OTP',
    };
  }

  return {
    success: true,
    message: 'OTP verified',
  };
};

export const logout = async (): Promise<LogoutResponse> => {
  await new Promise((r) => setTimeout(r, 1000));

  return {
    success: true,
    message: 'Logout successful',
  };
};

export const authApi = {
  loginWithGoogle: async (data: LoginWithGoogleRequest): Promise<LoginWithGoogleResponse> => {
    const response = await publicApi.post('/auth/google', data);
    return response.data;
  },
  logoutWithApple: async (data: LogoutWithAppleRequest): Promise<LogoutWithAppleResponse> => {
    const response = await publicApi.post('/auth/apple', data);
    return response.data;
  },
};
