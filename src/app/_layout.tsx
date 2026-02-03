import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  ThemeProvider as AppThemeProvider,
  AuthProvider,
  LanguageProvider,
  CartProvider,
  useTheme,
} from '@/contexts';
import 'react-native-reanimated';
import { oneSignalService } from '@/services/onesignal/OneSignalService';
import { registerPushToken } from '@/services/onesignal/backend';
import { OTAAutoUpdate } from '@/services/OTA-update/OTAAutoUpdate';

const queryClient = new QueryClient();

const RootLayout = () => {
  const theme = useTheme();

  useEffect(() => {
    // Initialize OneSignal and register playerId to backend (no client-side push flow)
    oneSignalService
      .initialize()
      .then(() => oneSignalService.getPlayerId())
      .then((playerId: string | null) => {
        if (playerId) {
          registerPushToken(playerId).catch(() => { });
        }
      })
      .catch(() => { });
    return () => { };
  }, []);

  return (
    <View style={styles.container}>
      <ThemeProvider value={DefaultTheme}>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <LanguageProvider>
                <CartProvider>
                  <StatusBar translucent backgroundColor={theme.palette.transparent} />
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <Stack screenOptions={{ headerShown: false }} />
                  </GestureHandlerRootView>
                  <OTAAutoUpdate />
                </CartProvider>
              </LanguageProvider>
            </AuthProvider>
          </QueryClientProvider>
        </AppThemeProvider>
      </ThemeProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RootLayout;
