import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { StorageService } from '@/services/auth-by-device/storage';

// RevenueCat Configuration
export const REVENUECAT_CONFIG = {
  // Use PUBLIC API keys (safe to use in client-side code)
  // iOS: starts with 'appl_'
  // Android: starts with 'goog_'
  // DO NOT use SECRET keys (start with 'sk_') in client-side code

  // Test keys for development - use proper test keys from RevenueCat
  // IMPORTANT: Use test keys for development
  TEST_KEYS: {
    iOS: 'test_dfWZjtziNpSemRzeyaflmKagOEK',
    Android: 'test_dfWZjtziNpSemRzeyaflmKagOEK', // Replace with actual test key from RevenueCat dashboard
  },

  // Production keys - replace with your actual public keys
  PRODUCTION_KEYS: {
    iOS: 'appl_eRANplJJqPDVFVSXoFbjABNEKKN',
    Android: 'goog_MwqNxjVgyYpFTaKsZmDLPXonxux',
  },
};

export const initializeRevenueCat = async (forceReconfigure: boolean = false): Promise<{ success: boolean; error: string | null; key: string }> => {
  try {
    console.log('Setting RevenueCat log level to VERBOSE');
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    // Check if already configured
    const isConfigured = await Purchases.isConfigured();

    if (isConfigured && !forceReconfigure) {
      console.log('RevenueCat already configured');

      return {
        success: true,
        error: null,
        key: '',
      };
    }

    if (isConfigured && forceReconfigure) {
      console.log('Force reconfiguring RevenueCat...');
    }

    // Determine platform and get appropriate key
    let platform: string;

    console.log('Platform detecting...');

    try {
      platform = Platform.OS;
      console.log('Platform detected:', platform);
    } catch (error) {
      console.warn('Failed to detect platform:', error);
      // Fallback: try to detect from user agent or other methods
      platform = 'unknown';
    }

    // Additional fallback detection
    if (!platform || platform === 'unknown') {
      // Try alternative detection methods
      if (typeof navigator !== 'undefined' && navigator.userAgent) {
        if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
          platform = 'ios';
        } else if (navigator.userAgent.includes('Android')) {
          platform = 'android';
        }
      }
      console.log('Fallback platform detection:', platform);
    }

    let apiKey: string;

    // Default to iOS if platform detection fails
    if (!platform || platform === 'unknown') {
      platform = 'ios';
    }

    if (__DEV__) {
      // Use test keys in development
      apiKey =
        platform === 'ios' ? REVENUECAT_CONFIG.TEST_KEYS.iOS : REVENUECAT_CONFIG.TEST_KEYS.Android;
    } else {
      // Use production keys
      apiKey =
        platform === 'ios'
          ? REVENUECAT_CONFIG.PRODUCTION_KEYS.iOS
          : REVENUECAT_CONFIG.PRODUCTION_KEYS.Android;
    }

    // Validate API key
    if (!apiKey || apiKey === 'goog_placeholder_key' || apiKey === 'test_uPEVyXTsvGxEBzqUcchgjLBFsNP') {
      const errorMessage = `Invalid RevenueCat API key for ${platform}: ${apiKey}`;
      console.error('❌', errorMessage);
      throw new Error(errorMessage);
    }

    // Get device ID to use as appUserID
    const deviceId = await StorageService.getDeviceId();
    console.log('Using device ID as appUserID:', deviceId);

    // Configure RevenueCat
    await Purchases.configure({
      apiKey: apiKey,
      appUserID: deviceId || '', // Use device ID as appUserID, fallback to empty string if not available
    });

    console.log('RevenueCat initialized successfully');

    return {
      success: true,
      error: null,
      key: apiKey,
    };
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      key: JSON.stringify(error),
    };
  }
};

export const getRevenueCatStatus = async () => {
  try {
    const isConfigured = await Purchases.isConfigured();

    if (!isConfigured) {
      return {
        isConfigured: false,
        hasActiveSubscription: false,
        activeEntitlements: [],
        hasOfferings: false,
        offeringsCount: 0,
        error: 'RevenueCat not configured',
      };
    }

    const customerInfo = await Purchases.getCustomerInfo();

    // Try to get offerings, but don't fail if there are no products configured
    let offerings = null;
    let hasOfferings = false;
    let offeringsCount = 0;

    try {
      offerings = await Purchases.getOfferings();
      hasOfferings = offerings.current !== null;
      offeringsCount = Object.keys(offerings.all).length;
    } catch (offeringsError) {
      console.warn('No offerings available (this is normal during development):', offeringsError);
      // This is expected during development if no products are configured
    }

    return {
      isConfigured,
      hasActiveSubscription: Object.keys(customerInfo.entitlements.active).length > 0,
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
      hasOfferings,
      offeringsCount,
      offerings: offerings,
    };
  } catch (error) {
    console.error('Error getting RevenueCat status:', error);

    return {
      isConfigured: false,
      hasActiveSubscription: false,
      activeEntitlements: [],
      hasOfferings: false,
      offeringsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Reset RevenueCat configuration (for debugging purposes)
export const resetRevenueCatConfiguration = async () => {
  try {
    console.log('🔄 Resetting RevenueCat configuration...');
    
    // Note: RevenueCat doesn't provide a direct reset method
    // But we can clear any cached data and force reconfiguration
    const isConfigured = await Purchases.isConfigured();
    
    if (isConfigured) {
      console.log('RevenueCat was configured, attempting to clear cache...');
      // Force reconfiguration by calling initialize with forceReconfigure = true
      return await initializeRevenueCat(true);
    } else {
      console.log('RevenueCat was not configured');
      return await initializeRevenueCat(false);
    }
  } catch (error) {
    console.error('Failed to reset RevenueCat configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Test RevenueCat configuration without requiring products
export const testRevenueCatConnection = async () => {
  try {
    const isConfigured = await Purchases.isConfigured();

    if (!isConfigured) {
      return {
        success: false,
        error: 'RevenueCat not configured',
      };
    }

    // Just test basic connection without offerings
    const customerInfo = await Purchases.getCustomerInfo();

    return {
      success: true,
      customerInfo: {
        originalAppUserId: customerInfo.originalAppUserId,
        activeSubscriptions: Object.keys(customerInfo.entitlements.active),
        allPurchaseDates: customerInfo.allPurchaseDates,
      },
    };
  } catch (error) {
    console.error('RevenueCat connection test failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
