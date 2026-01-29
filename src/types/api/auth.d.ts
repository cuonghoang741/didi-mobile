import { User } from '@/models/user';

export interface LoginRequest {
  account: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpRequest {
  // email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
  otp: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface LoginWithGoogleRequest {
  email: string;
  name: string;
  avatar: string;
  googleId: string;
}

export interface LoginWithGoogleResponse {
  success: boolean;
  message: string;
}

export interface LogoutWithAppleRequest {
  email: string;
  name: string;
  avatar: string;
  appleId: string;
}

export interface LogoutWithAppleResponse {
  success: boolean;
  message: string;
}
