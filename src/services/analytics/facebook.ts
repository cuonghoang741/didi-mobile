import { Platform } from 'react-native';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import { requestTrackingPermission, getTrackingStatus } from 'react-native-tracking-transparency';

export async function initializeFacebookSDK(): Promise<void> {
  console.log('🔥 Initializing Facebook SDK');

  // Request tracking permission for iOS 14.5+
  if (Platform.OS === 'ios') {
    try {
      // Check current status first
      const currentStatus = await getTrackingStatus();

      console.log('🔥 Current tracking status:', currentStatus);

      // Only request if not determined yet
      let status = currentStatus;

      if (currentStatus === 'not-determined') {
        console.log('🔥 Requesting tracking permission (first time)');
        status = await requestTrackingPermission();
      } else if (currentStatus === 'denied') {
        // Optional: Ask again after some time or in specific contexts
        // For now, we respect the user's decision
        console.log('🔥 Tracking permission was denied, respecting user choice');
        status = currentStatus;
      } else {
        console.log('🔥 Tracking permission already determined, no popup shown');
      }

      console.log('🔥 Final tracking permission status:', status);

      if (status === 'authorized') {
        Settings.setAdvertiserTrackingEnabled(true);
        console.log('🔥 Facebook tracking enabled');
      } else {
        Settings.setAdvertiserTrackingEnabled(false);
        console.log('🔥 Facebook tracking disabled');
      }
    } catch (error) {
      console.error('🔥 Failed to handle tracking permission:', error);
      Settings.setAdvertiserTrackingEnabled(false);
    }
  }

  // Enable/disable auto logging as needed (Info.plist/Manifest already set to true)
  Settings.setAutoLogAppEventsEnabled(true);
}

export function logFacebookEvent(eventName: string, parameters?: Record<string, any>): void {
  // Log to console for the in-app analytics logger
  // This mirrors the Firebase debug component pattern
  // eslint-disable-next-line no-console
  console.log('🔥 Facebook App Event:', eventName, parameters || {});

  try {
    if (parameters) {
      AppEventsLogger.logEvent(eventName, parameters);
    } else {
      AppEventsLogger.logEvent(eventName);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to log Facebook event', error);
  }
}

export function logFacebookPurchase(
  amount: number,
  currency: string,
  parameters?: Record<string, any>,
): void {
  // eslint-disable-next-line no-console
  console.log('🔥 Facebook Purchase Event:', { amount, currency, ...(parameters || {}) });
  try {
    AppEventsLogger.logPurchase(amount, currency, parameters);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to log Facebook purchase event', error);
  }
}

export function logAppOpened(): void {
  // eslint-disable-next-line no-console
  console.log('🔥 Facebook App Event:', 'fb_mobile_activate_app', {});
  try {
    AppEventsLogger.logEvent('fb_mobile_activate_app');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to log Facebook app open event', error);
  }
}
