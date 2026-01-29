import { Button, Typography } from '@/components/ui';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import {
  getRevenueCatStatus,
  initializeRevenueCat,
  testRevenueCatConnection,
  resetRevenueCatConfiguration,
} from '../configs/revenueCatConfig';

function MyStore() {
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const productIds = [
    'com.loria.pro.weekly',
    'com.loria.pro.monthly',
    'com.loria.pro.yearly',
    'lor',
  ];

  useEffect(() => {
    initializeRevenueCatComponent();
  }, []);

  const initializeRevenueCatComponent = async () => {
    try {
      setIsLoading(true);

      // Initialize RevenueCat using the config helper
      const success = await initializeRevenueCat();

      if (!success) {
        throw new Error('Failed to initialize RevenueCat');
      }

      setIsConnected(true);

      // Get RevenueCat status for debugging
      const status = await getRevenueCatStatus();

      console.log('RevenueCat status:', status);

      // Try to fetch offerings, but don't fail if not available
      try {
        const offerings = await Purchases.getOfferings();

        console.log('RevenueCat offerings:', offerings);

        if (offerings.current) {
          setOfferings([offerings.current]);
        } else {
          console.log('No current offering available (normal during development)');
        }
      } catch (offeringsError) {
        console.warn(
          'RevenueCat offerings not available (normal during development):',
          offeringsError,
        );
        setOfferings([]);
      }
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
      setIsConnected(false);
      Alert.alert(
        'RevenueCat Error',
        error instanceof Error
          ? error.message
          : 'Failed to initialize RevenueCat. This is normal in development without proper configuration.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      setIsLoading(true);

      // Check if RevenueCat is configured
      const isConfigured = await Purchases.isConfigured();

      if (!isConfigured) {
        throw new Error('RevenueCat is not configured');
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

      console.log('Purchase successful:', customerInfo);

      Alert.alert(
        'Purchase Successful',
        `Successfully purchased ${packageToPurchase.product.title}!`,
        [{ text: 'OK' }],
      );
    } catch (error: any) {
      console.error('Purchase error:', error);

      if (error.userCancelled) {
        console.log('User cancelled purchase');

        return;
      }

      Alert.alert('Purchase Failed', error.message || 'Purchase failed. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);

      // Check if RevenueCat is configured
      const isConfigured = await Purchases.isConfigured();

      if (!isConfigured) {
        throw new Error('RevenueCat is not configured');
      }

      const customerInfo = await Purchases.restorePurchases();

      console.log('Restored purchases:', customerInfo);

      Alert.alert(
        'Purchases Restored',
        'Your previous purchases have been restored successfully.',
        [{ text: 'OK' }],
      );
    } catch (error: any) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        error.message || 'Failed to restore purchases. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Typography>RevenueCat Status: {isConnected ? 'Connected' : 'Connecting...'}</Typography>

      {isLoading && <Typography>Loading...</Typography>}

      {!isConnected && !isLoading && (
        <View
          style={{
            backgroundColor: '#fff3cd',
            padding: 15,
            borderRadius: 5,
            marginVertical: 10,
            borderWidth: 1,
            borderColor: '#ffeaa7',
          }}
        >
          <Typography style={{ color: '#856404', fontWeight: 'bold' }}>
            RevenueCat Not Configured
          </Typography>
          <Typography style={{ color: '#856404', marginTop: 5 }}>
            To test purchases, you need to configure RevenueCat with a valid API key.
          </Typography>
        </View>
      )}

      {offerings.length === 0 && isConnected && !isLoading && (
        <View
          style={{
            backgroundColor: '#d1ecf1',
            padding: 15,
            borderRadius: 5,
            marginVertical: 10,
            borderWidth: 1,
            borderColor: '#bee5eb',
          }}
        >
          <Typography style={{ color: '#0c5460', fontWeight: 'bold' }}>
            No Offerings Available
          </Typography>
          <Typography style={{ color: '#0c5460', marginTop: 5 }}>
            No subscription offerings are currently available. Check your RevenueCat configuration.
          </Typography>
        </View>
      )}

      {offerings.map((offering) => (
        <View key={offering.identifier} style={{ marginVertical: 10 }}>
          <Typography style={{ fontWeight: 'bold', marginBottom: 10 }}>
            {offering.identifier}
          </Typography>

          {offering.availablePackages.map((packageToPurchase) => (
            <View
              key={packageToPurchase.identifier}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 10,
                marginVertical: 5,
                borderRadius: 5,
              }}
            >
              <Typography style={{ fontWeight: 'bold' }}>
                {packageToPurchase.product.title}
              </Typography>
              <Typography>{packageToPurchase.product.description}</Typography>
              <Typography style={{ color: 'green', fontWeight: 'bold' }}>
                {packageToPurchase.product.priceString}
              </Typography>
              <Typography>Package Type: {packageToPurchase.packageType}</Typography>
              <Button
                onPress={() => handlePurchase(packageToPurchase)}
                disabled={isLoading || !isConnected}
                style={{ marginTop: 10 }}
              >
                Buy Now
              </Button>
            </View>
          ))}
        </View>
      ))}

      <Button
        onPress={handleRestorePurchases}
        disabled={isLoading || !isConnected}
        style={{ marginTop: 20 }}
      >
        Restore Purchases
      </Button>

      <Button
        onPress={async () => {
          const status = await getRevenueCatStatus();

          Alert.alert('RevenueCat Status', JSON.stringify(status, null, 2), [{ text: 'OK' }]);
        }}
        style={{ marginTop: 10 }}
      >
        Check RevenueCat Status
      </Button>

      <Button
        onPress={async () => {
          const connectionTest = await testRevenueCatConnection();

          Alert.alert('RevenueCat Connection Test', JSON.stringify(connectionTest, null, 2), [
            { text: 'OK' },
          ]);
        }}
        style={{ marginTop: 10 }}
      >
        Test RevenueCat Connection
      </Button>

      <Button
        onPress={async () => {
          try {
            setIsLoading(true);
            const result = await resetRevenueCatConfiguration();
            Alert.alert('Reset RevenueCat', JSON.stringify(result, null, 2), [{ text: 'OK' }]);
            // Reinitialize after reset
            await initializeRevenueCatComponent();
          } catch (error) {
            Alert.alert('Reset Failed', error instanceof Error ? error.message : 'Unknown error', [
              { text: 'OK' },
            ]);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
        style={{ marginTop: 10 }}
      >
        Reset & Reconfigure RevenueCat
      </Button>

      {__DEV__ && (
        <Typography style={{ marginTop: 20, fontSize: 12 }}>
          Debug - All offerings: {JSON.stringify(offerings, null, 2)}
        </Typography>
      )}
    </View>
  );
}

export default MyStore;
