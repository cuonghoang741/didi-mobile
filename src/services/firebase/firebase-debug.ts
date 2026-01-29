import analytics from '@react-native-firebase/analytics';
import '@react-native-firebase/app';
import { getApp } from '@react-native-firebase/app';

// Store original logEvent method lazily to avoid accessing analytics before app is initialized
let originalLogEvent:
  | ((eventName: string, parameters?: Record<string, any>) => Promise<void>)
  | null = null;

/**
 * Enable Firebase Analytics debug mode
 * This should only be used in development
 */
export const enableFirebaseAnalyticsDebug = async (): Promise<void> => {
  try {
    // Ensure default app is initialized
    try {
      getApp();
    } catch {
      console.warn('Firebase default app is not initialized yet; skipping analytics debug enable.');
      return;
    }
    const instance = analytics();
    // Enable analytics collection
    await instance.setAnalyticsCollectionEnabled(true);

    // Override logEvent to add console logging
    if (!originalLogEvent) {
      originalLogEvent = instance.logEvent.bind(instance);
    }

    instance.logEvent = async (eventName: string, parameters?: Record<string, any>) => {
      // Log to console for debugging
      console.log(`🔥 Firebase Analytics Event: ${eventName}`);
      console.log('📊 Parameters:', parameters || {});
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.log('---');

      // Call original method
      return originalLogEvent ? originalLogEvent(eventName, parameters) : Promise.resolve();
    };

    console.log('🔥 Firebase Analytics Debug Mode ENABLED');
    console.log('📊 Events will now appear in Firebase Debug View');
    console.log(
      '🔗 Debug View: https://console.firebase.google.com/project/[PROJECT_ID]/analytics/debugview',
    );
    console.log('ℹ️  Note: Debug mode is now controlled via Firebase Console settings');
    console.log('📝 All events will be logged to console for debugging');
  } catch (error) {
    console.error('❌ Failed to enable Firebase Analytics debug mode:', error);
  }
};

/**
 * Disable Firebase Analytics debug mode
 */
export const disableFirebaseAnalyticsDebug = async (): Promise<void> => {
  try {
    const instance = analytics();
    // Restore original logEvent method if it was overridden
    if (originalLogEvent) {
      instance.logEvent = originalLogEvent as any;
      originalLogEvent = null;
    }

    // Note: setDebugModeEnabled is deprecated in newer versions
    // Debug mode is now controlled via Firebase Console or build configuration
    // For development, you can disable analytics collection instead

    await instance.setAnalyticsCollectionEnabled(false);
    console.log('🔥 Firebase Analytics Debug Mode DISABLED');
    console.log('ℹ️  Note: Debug mode is now controlled via Firebase Console settings');
  } catch (error) {
    console.error('❌ Failed to disable Firebase Analytics debug mode:', error);
  }
};

/**
 * Test Firebase Analytics with a sample event
 */
export const testFirebaseAnalytics = async (): Promise<void> => {
  try {
    // Ensure default app is initialized
    try {
      getApp();
    } catch {
      console.warn('Firebase default app is not initialized; skipping test event.');
      return;
    }
    const eventData = {
      test_param: 'debug_mode_test',
      timestamp: new Date().toISOString(),
      platform: 'react-native',
    };

    await analytics().logEvent('test_analytics', eventData);

    console.log('✅ Test event sent to Firebase Analytics');
    console.log('📊 Event data:', eventData);
    console.log('🔍 Check Firebase Debug View to see the event');
  } catch (error) {
    console.error('❌ Failed to send test event:', error);
  }
};

/**
 * Log Firebase Analytics event with detailed information
 */
export const logAnalyticsEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  console.log(`🔥 Firebase Analytics Event: ${eventName}`);
  console.log('📊 Parameters:', parameters);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('---');
};
