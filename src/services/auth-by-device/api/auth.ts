import publicApi from '@/services/config/publicApi.config';
import { User } from '../model/auth-user';

export interface LoginWithDeviceIdRequest {
  deviceId: string;
}

export const authApi = {
  loginWithDeviceId: async (
    data: LoginWithDeviceIdRequest,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    user: User;
  }> => {
    console.log('(📍 authApi) loginWithDeviceId', data);
    return await publicApi.post('/auth/device-login', data);
  },
  getMyInfo: async (): Promise<User> => {
    console.log('(📍 authApi) getMyInfo');
    return await publicApi.get('/auth/me');
  },
};
