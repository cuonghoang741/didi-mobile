import { useMutation } from '@tanstack/react-query';

import { LoginRequest, VerifyOtpRequest } from '@/types';
import { login, verifyOtp, logout } from '@/services/api/auth';

const useAuthMutation = () => {
  const loginMutation = useMutation({
    mutationFn: ({ account, password }: LoginRequest) => login({ account, password }),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ otp }: VerifyOtpRequest) => verifyOtp({ otp }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
  });

  return {
    loginMutation,
    verifyOtpMutation,
    logoutMutation,
  };
};

export default useAuthMutation;
