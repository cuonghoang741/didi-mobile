import { Platform } from 'react-native';

export interface AnalyticsEventParams {
  [key: string]: string | number | boolean;
}

// Lazy getter to avoid importing RNFB analytics where the native module is unavailable
function getAnalytics():
  | null
  | {
      (): any;
    } {
  // Only attempt on native platforms
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-firebase/analytics');
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

export class FirebaseService {
  private static instance: FirebaseService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase Analytics
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const analytics = getAnalytics();
      if (!analytics) {
        // Skip initialization silently when analytics is not available (e.g., Expo Go / web)
        return;
      }
      // Enable analytics collection
      await analytics().setAnalyticsCollectionEnabled(true);

      // Set default event parameters if needed
      await analytics().setDefaultEventParameters({
        platform: Platform.OS,
        platform_version: Platform.Version.toString(),
      });

      this.isInitialized = true;
      console.log('Firebase Analytics initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Analytics:', error);
    }
  }

  /**
   * Log a custom event
   */
  public async logEvent(eventName: string, params?: AnalyticsEventParams): Promise<void> {
    try {
      const analytics = getAnalytics();
      if (!analytics) {
        return;
      }
      if (!this.isInitialized) {
        await this.initialize();
      }

      await analytics().logEvent(eventName, params);
      console.log(`Firebase event logged: ${eventName}`, params);
    } catch (error) {
      console.error(`Error logging event ${eventName}:`, error);
    }
  }

  /**
   * Set user properties
   */
  public async setUserProperty(name: string, value: string): Promise<void> {
    try {
      const analytics = getAnalytics();
      if (!analytics) {
        return;
      }
      if (!this.isInitialized) {
        await this.initialize();
      }

      await analytics().setUserProperty(name, value);
      console.log(`User property set: ${name} = ${value}`);
    } catch (error) {
      console.error(`Error setting user property ${name}:`, error);
    }
  }

  /**
   * Set user ID
   */
  public async setUserId(userId: string | null): Promise<void> {
    try {
      const analytics = getAnalytics();
      if (!analytics) {
        return;
      }
      if (!this.isInitialized) {
        await this.initialize();
      }

      await analytics().setUserId(userId);
      console.log(`User ID set: ${userId}`);
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  /**
   * Log screen view
   */
  public async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      const analytics = getAnalytics();
      if (!analytics) {
        return;
      }
      if (!this.isInitialized) {
        await this.initialize();
      }

      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      console.log(`Screen view logged: ${screenName}`);
    } catch (error) {
      console.error(`Error logging screen view ${screenName}:`, error);
    }
  }

  /**
   * Log purchase event
   */
  public async logPurchase(
    value: number,
    currency: string,
    items?: Array<{
      item_id: string;
      item_name: string;
      item_category?: string;
      price?: number;
      quantity?: number;
    }>,
  ): Promise<void> {
    try {
      const analytics = getAnalytics();
      if (!analytics) {
        return;
      }
      if (!this.isInitialized) {
        await this.initialize();
      }

      await analytics().logPurchase({
        value,
        currency,
        items: items || [],
      });
      console.log('Purchase event logged:', { value, currency, items });
    } catch (error) {
      console.error('Error logging purchase event:', error);
    }
  }

  /**
   * Log custom business events
   */
  public async logCreateTask(brandName: string, taskType: string): Promise<void> {
    await this.logEvent('create_task', {
      brand_name: brandName,
      task_type: taskType,
    });
  }

  public async logBrandNameEntered(brandName: string): Promise<void> {
    await this.logEvent('brand_name_entered', {
      brand_name: brandName,
      brand_name_length: brandName.length,
    });
  }

  public async logStepCompleted(step: number, totalSteps: number, stepName: string): Promise<void> {
    await this.logEvent('step_completed', {
      step_number: step,
      total_steps: totalSteps,
      step_name: stepName,
    });
  }

  /**
   * Reset analytics data (useful for testing or logout)
   */
  public async resetAnalyticsData(): Promise<void> {
    try {
      const analytics = getAnalytics();
      if (!analytics) {
        return;
      }
      await analytics().resetAnalyticsData();
      console.log('Analytics data reset');
    } catch (error) {
      console.error('Error resetting analytics data:', error);
    }
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();
