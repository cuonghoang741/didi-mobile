import Constants from 'expo-constants';
import { Platform } from 'react-native';

const ONESIGNAL_APP_ID = '1278242a-b7fa-44b4-80a9-1e4e4fbf0500';

// Dynamic import for OneSignal to handle platform-specific loading
let OneSignalNamespace: any = null;

function getOneSignal(): any | null {
  // Only attempt on native platforms
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }

  const appOwnership = Constants?.appOwnership;
  if (appOwnership === 'expo') {
    console.warn('OneSignal native module is not available in Expo Go. Skipping.');
    return null;
  }

  // Return cached namespace if already loaded
  if (OneSignalNamespace !== null) {
    return OneSignalNamespace;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-onesignal');

    if (!mod) {
      console.warn('OneSignal module is null or undefined');
      return null;
    }

    // react-native-onesignal v5.x exports a namespace called OneSignal
    // Check for named export OneSignal
    if (mod.OneSignal && typeof mod.OneSignal.initialize === 'function') {
      OneSignalNamespace = mod.OneSignal;
      return OneSignalNamespace;
    }

    // Fallback: check if it's a default export that contains OneSignal
    if (mod.default) {
      if (mod.default.OneSignal && typeof mod.default.OneSignal.initialize === 'function') {
        OneSignalNamespace = mod.default.OneSignal;
        return OneSignalNamespace;
      }
      // Sometimes the default itself is the namespace
      if (typeof mod.default.initialize === 'function') {
        OneSignalNamespace = mod.default;
        return OneSignalNamespace;
      }
    }

    console.warn('OneSignal namespace not found in module. Available exports:', Object.keys(mod));
    return null;
  } catch (error) {
    console.warn('Failed to load OneSignal:', error);
    return null;
  }
}

class OneSignalService {
  private static instance: OneSignalService;
  private initialized = false;

  public static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    const OneSignal = getOneSignal();
    if (!OneSignal) {
      console.warn('OneSignal module not available');
      return;
    }

    if (typeof OneSignal.initialize !== 'function') {
      console.error(
        'OneSignal.initialize is not a function. Available methods:',
        Object.keys(OneSignal),
      );
      return;
    }

    try {
      OneSignal.initialize(ONESIGNAL_APP_ID);
      console.log('OneSignal initialized successfully');
    } catch (error: any) {
      if (error?.message?.toLowerCase?.().includes('native module not loaded')) {
        console.warn(
          'OneSignal native module not loaded. Skipping initialization. Use a custom dev client or production build.',
        );
        return;
      }
      console.error('OneSignal initialization error:', error);
      throw error;
    }

    // Wait a bit to ensure OneSignal is fully ready before requesting permission
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (OneSignal?.Notifications) {
      try {
        // Check current permission status first
        const hasPermission = await OneSignal.Notifications.hasPermission();
        console.log('OneSignal current permission status:', hasPermission);

        // Only request if we don't have permission yet
        if (!hasPermission) {
          // Request permission without forcing (let OneSignal handle the prompt)
          const permission = await OneSignal.Notifications.requestPermission();
          console.log('OneSignal permission request result:', permission);
        } else {
          console.log('OneSignal already has permission');
        }
      } catch (error) {
        console.warn('OneSignal permission request error:', error);
        // Don't throw - continue initialization even if permission fails
      }

      // Handle foreground notifications
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
        console.log('OneSignal foreground notification received');
        event.getNotification().display();
      });

      // Handle notification click
      OneSignal.Notifications.addEventListener('click', (event: any) => {
        console.log('OneSignal notification clicked:', event);
      });

      // Listen for permission changes
      OneSignal.Notifications.addEventListener('permissionChanged', (event: any) => {
        console.log('OneSignal permission changed:', event);
      });
    }

    this.initialized = true;
    console.log('OneSignal service initialized and ready');
  }

  public async getPlayerId(): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    const OneSignal = getOneSignal();
    if (!OneSignal) return null;

    try {
      const id = await OneSignal.User.getOnesignalId();
      console.log('OneSignal player ID:', id);
      return id ?? null;
    } catch (error) {
      console.error('Error getting OneSignal player ID:', error);
      return null;
    }
  }

  // Get subscription status
  public async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    hasPermission: boolean;
    playerId: string | null;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }
    const OneSignal = getOneSignal();
    if (!OneSignal) {
      return {
        isSubscribed: false,
        hasPermission: false,
        playerId: null,
      };
    }

    try {
      const playerId = await this.getPlayerId();
      const hasPermission = await OneSignal.Notifications.hasPermission();
      const isSubscribed = hasPermission && playerId !== null;

      return {
        isSubscribed,
        hasPermission,
        playerId,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        isSubscribed: false,
        hasPermission: false,
        playerId: null,
      };
    }
  }

  // Subscribe to push notifications
  public async subscribe(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    const OneSignal = getOneSignal();
    if (!OneSignal) {
      console.warn('OneSignal module not available for subscription');
      return false;
    }

    try {
      // Opt in first (in case user previously opted out)
      if (OneSignal.User?.pushSubscription) {
        await OneSignal.User.pushSubscription.optIn();
        console.log('OneSignal opted in to push subscription');
      }

      // Request permission if not already granted
      const hasPermission = await OneSignal.Notifications.hasPermission();
      if (!hasPermission) {
        const permission = await OneSignal.Notifications.requestPermission();
        console.log('OneSignal subscription permission result:', permission);
        if (!permission) {
          return false;
        }
      }

      // Get player ID to ensure subscription
      const playerId = await this.getPlayerId();
      if (playerId) {
        console.log('OneSignal subscribed successfully with player ID:', playerId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error subscribing to OneSignal:', error);
      return false;
    }
  }

  // Unsubscribe from push notifications (opt out)
  public async unsubscribe(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    const OneSignal = getOneSignal();
    if (!OneSignal) {
      console.warn('OneSignal module not available for unsubscription');
      return false;
    }

    try {
      // Opt out from push notifications
      if (OneSignal.User?.pushSubscription) {
        await OneSignal.User.pushSubscription.optOut();
        console.log('OneSignal unsubscribed successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from OneSignal:', error);
      return false;
    }
  }

  // Toggle subscription
  public async toggleSubscription(enable: boolean): Promise<boolean> {
    if (enable) {
      return await this.subscribe();
    } else {
      return await this.unsubscribe();
    }
  }
}

export const oneSignalService = OneSignalService.getInstance();
