import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

import { STORAGE_KEYS } from '@/constants/storage-key';

import publicApi from './publicApi.config';
import BASE_URL from './baseUrl';

const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_INFO_KEY, IS_ADMIN_KEY } = STORAGE_KEYS;

export const refreshAccessToken = async (refreshToken: string) =>
  publicApi({
    method: 'POST',
    url: '/customer/auth/refresh',
    data: { refresh_token: refreshToken },
  });

export const refreshAccessTokenAdmin = async (refreshToken: string) =>
  publicApi({
    method: 'POST',
    url: '/auth/refresh',
    data: { refresh_token: refreshToken },
  });

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  retry?: boolean;
}

const authApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    accept: '*/*',
    'Content-Type': 'application/json',
  },
});

authApi.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshSubscribers: ((_token: string) => void)[] = [];

authApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    if (error.response?.status === 401 && !originalRequest.retry) {
      if (isRefreshing)
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(authApi(originalRequest));
          });
        });

      originalRequest.retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        const isAdmin = await SecureStore.getItemAsync(IS_ADMIN_KEY);

        if (!refreshToken) {
          throw new Error('Refresh token not found');
        }

        const { data } = await (isAdmin
          ? refreshAccessTokenAdmin(refreshToken)
          : refreshAccessToken(refreshToken));

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.result;

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

        refreshSubscribers.forEach((callback) => callback(newAccessToken));
        refreshSubscribers = [];

        return await authApi(originalRequest);
      } catch (refreshError) {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_INFO_KEY);

        return await Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default authApi;
