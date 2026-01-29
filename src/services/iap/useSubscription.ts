import { iapApi } from '@/services/iap/apis/iapApi';
import { getRevenueCatStatus, initializeRevenueCat, resetRevenueCatConfiguration } from '@/services/iap/configs/revenueCatConfig';
import { Product, Purchase, UserSubscription } from '@/services/iap/types/subscription';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { STORAGE_KEYS } from '@/constants/storage-key';
import * as SecureStore from 'expo-secure-store';
import { PurchaseStatus } from '@/services/iap/types/subscription';
import { firebaseService } from '@/services/firebase/FirebaseService';

let firestoreModule: (() => any) | null = null;
const getFirestoreModule = () => {
  if (!firestoreModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      firestoreModule = require('@react-native-firebase/firestore').default;
    } catch (err) {
      console.warn('Firestore module not available:', err);
    }
  }
  return firestoreModule;
};

export const currencyCodeToSymbol = (currencyCode: string) => {
  switch (currencyCode) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'AUD':
      return '$';
    case 'CAD':
      return '$';
    case 'CHF':
      return 'Fr';
    case 'CNY':
      return '¥';
    case 'JPY':
      return '¥';
    case 'KRW':
      return '₩';
    case 'MXN':
      return '₱';
    case 'NZD':
      return '$';
    case 'RUB':
      return '₽';
    case 'SEK':
      return 'kr';
    case 'SGD':
      return '$';
    case 'VND':
      return '₫';
  }
  return currencyCode;
};

export const addDotToPrice = (price: number) => {
  // max 2 character after the dot
  return price?.toFixed(2)?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export interface UseSubscriptionReturn {
  // State
  isConnected: boolean;
  products: Product[];
  availablePackages: Record<string, any>;
  activeSubscription: UserSubscription | null;
  activePurchases: Purchase[];
  hasActiveSubscription: boolean;
  subscriptionExpiresAt?: string;
  isLoading: boolean;
  error: string | null;
  purchaseStatus: 'idle' | 'preparing' | 'fetching_offerings' | 'purchasing' | 'syncing' | 'restoring';
  isPreloaded: boolean;

  // Actions
  initialize: () => Promise<void>;
  purchaseSubscription: (productId: string) => Promise<void>;
  openPaywallSubscription: (userId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshUserProducts: () => Promise<void>;
  preloadData: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [availablePackages, setAvailablePackages] = useState<PurchasesPackage[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [activePurchases, setActivePurchases] = useState<Purchase[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<
    'idle' | 'preparing' | 'fetching_offerings' | 'purchasing' | 'syncing' | 'restoring'
  >('idle');
  const [isPreloaded, setIsPreloaded] = useState(false);

  // Initialize subscription service
  const initialize = useCallback(async (retry: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      await resetRevenueCatConfiguration();

      const { success, error, key } = await initializeRevenueCat();
      console.log('📡 RevenueCat connection status:', success, error, key);

      if (error) {
        setError(error);
        Alert.alert('Failed to connect to RevenueCat key: ' + key);
        return;
      }

      if (!success) {
        throw new Error('Failed to connect to RevenueCat');
      }

      // Load products from backend and RevenueCat offerings in parallel
      await Promise.all([
        refreshProducts(retry),
        refreshUserProducts()
      ]);

      setIsConnected(true);
      setIsPreloaded(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize subscriptions';

      setError(errorMessage);
      console.error('Subscription initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Normalize product identifiers coming from backend/RC to avoid hidden chars issues
  const normalizeProductId = useCallback((id: string | undefined | null) => {
    if (!id) return '';

    return id.replace(/[\r\n]/g, '').trim();
  }, []);

  // Refresh products from backend
  const refreshProducts = useCallback(async (retry: boolean = false) => {
    try {
      // Load backend products and RevenueCat offerings in parallel for faster loading
      const [productsResponse, offeringsRes] = await Promise.allSettled([
        iapApi.getProductsForCurrentPlatform(),
        Purchases.getOfferings()
      ]);

      console.log('productsResponse', productsResponse);
      console.log('offeringsRes', offeringsRes);

      const response = productsResponse.status === 'fulfilled' ? productsResponse.value : [];

      // Process backend products
      const normalized = Array.isArray(response)
        ? response.map((p: Product) => ({
          ...p,
          productId: normalizeProductId(p.productId),
        }))
        : [];

      setProducts(normalized);

      // Process RevenueCat offerings
      if (offeringsRes.status === 'fulfilled') {
        const offerings = offeringsRes.value;
        const currentOffering = offerings.current;
        const availablePackages = currentOffering?.availablePackages;
        console.log('availablePackages', availablePackages);
        setAvailablePackages(availablePackages || []);
        // if ((!availablePackages || availablePackages?.length === 0) && retry) {
        //   await resetRevenueCatConfiguration();
        //   await initialize(false);
        // }
      } else {
        // if (retry) {
        //   await resetRevenueCatConfiguration();
        //   await initialize(false);
        // }
        console.warn(
          'RevenueCat offerings not available (normal during development):',
          offeringsRes.reason,
        );
        setAvailablePackages([]);
      }
    } catch (err) {
      // if (retry) {
      //   await resetRevenueCatConfiguration();
      //   await initialize(false);
      // }
      console.error('Error loading products:', err);
      setProducts([]);
      setAvailablePackages([]);
    }
  }, []);

  // Refresh user's active products
  const refreshUserProducts = useCallback(async () => {
    try {
      const status = await getRevenueCatStatus();

      setHasActiveSubscription(status.hasActiveSubscription);

      // Fetch active subscription details from backend if user has active subscription
      if (status.hasActiveSubscription) {
        try {
          const activeSubscriptions = await iapApi.getUserActiveProducts();
          console.log('Active subscriptions from backend:', activeSubscriptions);

          // Get the first active subscription (assuming one active subscription at a time)
          if (activeSubscriptions && activeSubscriptions.subscriptions && activeSubscriptions.subscriptions.length > 0) {
            const activeSub = activeSubscriptions.subscriptions[0];
            setActiveSubscription(activeSub);

            // Set expiration date if available
            if (activeSub.endDate) {
              setSubscriptionExpiresAt(activeSub.endDate);
            }
          } else {
            setActiveSubscription(null);
            setSubscriptionExpiresAt(undefined);
          }
        } catch (apiErr) {
          console.warn('Failed to fetch active subscription from backend:', apiErr);
          // Keep RevenueCat status but don't have detailed subscription info
          setActiveSubscription(null);
          setSubscriptionExpiresAt(undefined);
        }
      } else {
        // No active subscription
        setActiveSubscription(null);
        setSubscriptionExpiresAt(undefined);
      }

      // We don't have detailed purchases via RC status; keep minimal mapping
      setActivePurchases([]);
    } catch (err) {
      console.error('Error refreshing user products:', err);
      // Reset state on error
      setActivePurchases([]);
      setActiveSubscription(null);
      setHasActiveSubscription(false);
      setSubscriptionExpiresAt(undefined);
    }
  }, []);

  // Purchase subscription
  const purchaseSubscription = useCallback(
    async (productId: string) => {
      console.log('🚀 Purchase initiated with productId:', productId);
      try {
        setIsLoading(true);
        setError(null);
        setPurchaseStatus('preparing');

        const normalizedTargetId = normalizeProductId(productId);

        console.log('🔍 Starting purchase process for productId:', normalizedTargetId);
        console.log(
          '📦 Available products from backend:',
          products.map((p) => ({ id: p.id, productId: p.productId, name: p.name })),
        );
        console.log(
          '📱 Available RevenueCat packages:',
          availablePackages.map((p) => ({
            identifier: p.product.identifier,
            packageType: p.packageType,
          })),
        );

        // Find the backend product
        const backendProduct = products.find(
          (p) => normalizeProductId(p.productId) === normalizedTargetId,
        );

        if (!backendProduct) {
          const availableProductIds = products.map((p) => p.productId).join(', ');

          Alert.alert(
            'Error',
            `Backend product not found for productId: ${normalizedTargetId}`,
            [{ text: 'OK' }],
          );

          throw new Error(
            `Backend product not found for productId: ${normalizedTargetId}. Available products: ${JSON.stringify(availableProductIds)}. available revenuecat packages: ${JSON.stringify(availablePackages)}`,
          );
        }

        console.log('✅ Backend product found:', backendProduct);

        // Check if we have RevenueCat packages available
        if (availablePackages.length === 0) {
          console.warn('⚠️ No preloaded RevenueCat packages found, attempting to fetch...');
          setPurchaseStatus('fetching_offerings');

          // Try to fetch offerings again as fallback
          try {
            const offerings = await Purchases.getOfferings();

            if (offerings.current && offerings.current.availablePackages.length > 0) {
              const filteredPackages = offerings.current.availablePackages.filter(
                (p: PurchasesPackage) =>
                  products.find(
                    (rp: Product) =>
                      normalizeProductId(rp.productId) === normalizeProductId(p.product.identifier),
                  ),
              );

              setAvailablePackages(filteredPackages);
              console.log('✅ Fetched packages on-demand:', filteredPackages.length);
            }
          } catch (offeringsError) {
            console.warn('❌ Failed to fetch offerings on-demand:', offeringsError);
          }
        }

        // Use mapped RevenueCat package; refetch offerings if missing
        let targetPackage = availablePackages.find(
          (p: PurchasesPackage) => normalizeProductId(p.product.identifier) === normalizedTargetId,
        );

        if (!targetPackage) {
          const availablePackageIds = availablePackages.map((p) => p.product.identifier).join(', ');
          console.error('❌ Target package not found:', {
            targetId: normalizedTargetId,
            availablePackages: availablePackageIds,
            availablePackagesCount: availablePackages.length
          });

          throw new Error(
            `Target package not found for productId: ${normalizedTargetId}. Available packages: ${availablePackageIds}`,
          );
        }

        console.log('🎯 Target package found:', {
          identifier: targetPackage.product.identifier,
          packageType: targetPackage.packageType,
          price: targetPackage.product.price,
          currencyCode: targetPackage.product.currencyCode,
        });

        console.log('💳 Starting purchase...');
        setPurchaseStatus('purchasing');
        const purchaseResult = await Purchases.purchasePackage(targetPackage);

        console.log('✅ Purchase completed:', purchaseResult);

        // Sync with backend: persist transaction
        try {
          setPurchaseStatus('syncing');
          const tx = (purchaseResult as any)?.transaction;
          const transactionId = tx?.transactionIdentifier || tx?.revenueCatId || '';
          const purchaseDate = tx?.purchaseDate;

          // Map product identifier to backend product ID
          const matchedProduct = products.find(
            (p) => normalizeProductId(p.productId) === normalizedTargetId,
          );

          if (matchedProduct && transactionId) {
            // RevenueCat SDK may not expose raw receipt; send placeholder when unavailable
            const receiptData = '';
            // Prepare raw metadata from RC result
            const transactionMetadata = {
              customerInfo: (purchaseResult as any)?.customerInfo,
              transaction: tx,
              productIdentifier: (purchaseResult as any)?.productIdentifier,
            };

            // Step 1: Create purchase record (userId and status will be handled by backend)
            const createdPurchase = await iapApi.createPurchaseFromStore({
              productId: normalizedTargetId,
              transactionId,
              receiptData,
              purchaseDate,
              transactionMetadata,
            });

            console.log('🔐 Backend purchase created and auto verify:', createdPurchase);

            await refreshUserProducts();
          } else {
            console.warn('Skipping backend record: missing matched product or transactionId');
          }
        } catch (syncErr) {
          console.warn('Failed to record purchase to backend:', syncErr);
        }
      } catch (err) {
        console.error('❌ Purchase failed:', err);
        console.error('❌ Purchase error details:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          productId: productId
        });

        let errorMessage = 'Purchase failed';
        let userFriendlyMessage = 'Purchase failed';

        if (err instanceof Error) {
          errorMessage = err.message;

          // Record cancelled/failed purchase for tracking
          try {
            await iapApi.createPurchaseFromStore({
              productId,
              transactionId: '',
              receiptData: '',
              transactionMetadata: { error: err.message, timestamp: new Date().toISOString() },
            });
            console.log('📝 Cancelled purchase recorded for tracking');
          } catch (recordErr) {
            console.warn('Failed to record cancelled purchase:', recordErr);
          }

          // Provide user-friendly error messages
          if (err.message.includes('cancelled') || err.message.includes('canceled')) {
            userFriendlyMessage =
              'Purchase was cancelled. Please try again if you want to complete the purchase.';
            // Attempt to record cancelled transaction if we have some identifiers
          } else if (
            err.message.includes('Authentication Failed') ||
            err.message.includes('Password reuse not available')
          ) {
            userFriendlyMessage =
              'Sandbox authentication failed. Please:\n1. Sign out of all Apple IDs on your device\n2. Create a NEW sandbox account in App Store Connect\n3. Use the NEW account for testing';
          } else if (err.message.includes('not found')) {
            userFriendlyMessage =
              'Product not available. Please check your internet connection and try again.';
          } else if (err.message.includes('network') || err.message.includes('connection')) {
            userFriendlyMessage =
              'Network error. Please check your internet connection and try again.';
          } else {
            userFriendlyMessage = `Purchase failed: ${err.message}`;
          }
        }

        setError(errorMessage);

        console.log('errorMessage', errorMessage);

        // Re-throw the error so the calling component can handle it
        throw err;
      } finally {
        setIsLoading(false);
        setPurchaseStatus('idle');
      }
    },
    [products, availablePackages],
  );

  const openPaywallSubscription = useCallback(
    async (userId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        setPurchaseStatus('preparing');

        await firebaseService.logEvent('paywall_opened', { user_id: userId });

        setPurchaseStatus('purchasing');
        const presentPaywall = (Purchases as any)?.presentPaywall;

        if (typeof presentPaywall !== 'function') {
          throw new Error('presentPaywall is not available in the current Purchases SDK version.');
        }

        const { customerInfo, cancelled, transaction, productIdentifier, packageIdentifier } =
          await presentPaywall();

        if (cancelled) {
          await firebaseService.logEvent('subscription_cancelled_before_payment', {
            user_id: userId,
          });
          return;
        }

        const entitlements = customerInfo?.entitlements?.active ?? {};
        const activeEntitlement = Object.keys(entitlements)[0];

        if (activeEntitlement) {
          await firebaseService.logEvent('subscription_success', {
            user_id: userId,
            entitlement_id: activeEntitlement,
          });

          const firestoreClient = getFirestoreModule();

          if (firestoreClient) {
            await firestoreClient()
              .collection('subscriptions')
              .doc(userId)
              .set(
                {
                  entitlement: activeEntitlement,
                  updatedAt: new Date().toISOString(),
                  rcUserId: customerInfo.appUserID,
                },
                { merge: true },
              );
          }

          try {
            setPurchaseStatus('syncing');
            const transactionId =
              transaction?.transactionIdentifier || transaction?.revenueCatId || '';
            const entitlementInfo = entitlements[activeEntitlement] as any;
            const entitlementProductId =
              entitlementInfo?.productIdentifier || productIdentifier || packageIdentifier || '';
            const normalizedProductId = normalizeProductId(entitlementProductId);
            const purchaseDate =
              entitlementInfo?.purchaseDate ||
              entitlementInfo?.latestPurchaseDate ||
              transaction?.purchaseDate ||
              new Date().toISOString();
            const expirationDate =
              entitlementInfo?.expirationDate ||
              entitlementInfo?.expiresDate ||
              entitlementInfo?.latestExpirationDate ||
              undefined;

            if (normalizedProductId && transactionId) {
              await iapApi.createPurchaseFromStore({
                productId: normalizedProductId,
                transactionId,
                receiptData: '',
                purchaseDate,
                expirationDate,
                transactionMetadata: {
                  customerInfo,
                  transaction,
                  productIdentifier,
                  packageIdentifier,
                  entitlementId: activeEntitlement,
                },
              });
            } else {
              console.warn('Missing productId or transactionId for backend subscription sync', {
                normalizedProductId,
                transactionId,
              });
            }
          } catch (syncError) {
            console.warn('Failed to sync paywall purchase to backend', syncError);
          }

          Alert.alert('Payment Successful', 'Thank you for subscribing.');
          await refreshUserProducts();
        }
      } catch (err) {
        console.error('Paywall error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Paywall purchase failed';
        setError(errorMessage);

        await firebaseService.logEvent('subscription_error', {
          user_id: userId,
          error_message: errorMessage,
        });
      } finally {
        setIsLoading(false);
        setPurchaseStatus('idle');
      }
    },
    [refreshUserProducts],
  );

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPurchaseStatus('restoring');

      const info = await Purchases.restorePurchases();

      console.log('Restored purchases (RevenueCat):', info);

      await refreshUserProducts();

      if (hasActiveSubscription) {
        Alert.alert(
          'Purchases Restored',
          'Your previous purchases have been restored successfully.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.', [
          { text: 'OK' },
        ]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore purchases';

      setError(errorMessage);

      Alert.alert('Restore Failed', errorMessage, [{ text: 'OK' }]);

      console.error('Restore purchases error:', err);
    } finally {
      setIsLoading(false);
      setPurchaseStatus('idle');
    }
  }, [hasActiveSubscription]);

  // Preload data function for early loading
  const preloadData = useCallback(async () => {
    if (isPreloaded) return;

    try {
      console.log('🚀 Preloading IAP data...');
      await refreshProducts();
      setIsPreloaded(true);
      console.log('✅ IAP data preloaded successfully');
    } catch (err) {
      console.warn('⚠️ Failed to preload IAP data:', err);
    }
  }, [isPreloaded, refreshProducts]);

  // Initialize on mount
  useEffect(() => {
    initialize(true);
  }, [initialize]);

  // No extra effect for offerings; handled in refreshProducts

  return {
    // State
    isConnected,
    products,
    availablePackages,
    activeSubscription,
    activePurchases,
    hasActiveSubscription: hasActiveSubscription && !!activeSubscription,
    subscriptionExpiresAt,
    isLoading,
    error,
    purchaseStatus,
    isPreloaded,

    // Actions
    initialize,
    purchaseSubscription,
    openPaywallSubscription,
    restorePurchases,
    refreshProducts,
    refreshUserProducts,
    preloadData,
  };
};

export default useSubscription;
