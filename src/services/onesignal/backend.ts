import * as Device from 'expo-device';
import Constants from 'expo-constants';
import authApi from '@/services/config/authApi.config';

type RegisterPushTokenPayload = {
  oneSignalPlayerId: string;
  platform: string | null;
  deviceModel: string | null;
  osVersion: string | null;
  appVersion: string | null;
};

export const registerPushToken = async (oneSignalPlayerId: string) => {
  const payload: RegisterPushTokenPayload = {
    oneSignalPlayerId,
    platform: Device.osName ?? null,
    deviceModel: Device.modelName ?? null,
    osVersion: Device.osVersion ?? null,
    appVersion:
      (Constants?.expoConfig?.version as string | undefined) ??
      (Constants?.nativeAppVersion as string | undefined) ??
      null,
  };

  return authApi.post('/notifications/register-token', payload);
};


