import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts';
import { useSubscriptionContext } from '@/services/iap/SubscriptionContext';
import { resetRevenueCatConfiguration } from '@/services/iap/configs/revenueCatConfig';

const IAPDebugPanel: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const {
    isConnected,
    products,
    availablePackages,
    hasActiveSubscription,
    isLoading,
    error,
    purchaseStatus,
    isPreloaded,
    initialize,
    refreshProducts,
    refreshUserProducts,
    purchaseSubscription,
  } = useSubscriptionContext();

  const [errorHistory, setErrorHistory] = useState<any[]>([]);
  const [revenueCatKeyInfo, setRevenueCatKeyInfo] = useState<any>({});

  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        isConnected,
        productsCount: products.length,
        availablePackagesCount: availablePackages.length,
        hasActiveSubscription,
        isLoading,
        error,
        purchaseStatus,
        isPreloaded,
        products: products.map((p: any) => ({
          id: p.id,
          productId: p.productId,
          name: p.name,
          price: p.price
        })),
        availablePackages: availablePackages.map((p: any) => ({
          identifier: p.product.identifier,
          packageType: p.packageType,
          price: p.product.price,
          currencyCode: p.product.currencyCode
        }))
      });
    };

    updateDebugInfo();
  }, [isConnected, products, availablePackages, hasActiveSubscription, isLoading, error, purchaseStatus, isPreloaded]);

  // Track error history
  useEffect(() => {
    if (error) {
      const errorEntry = {
        timestamp: new Date().toISOString(),
        error: error,
        context: {
          isConnected,
          productsCount: products.length,
          availablePackagesCount: availablePackages.length,
          purchaseStatus,
          isPreloaded
        }
      };
      setErrorHistory(prev => [errorEntry, ...prev.slice(0, 9)]); // Keep last 10 errors
    }
  }, [error, isConnected, products.length, availablePackages.length, purchaseStatus, isPreloaded]);

  const handleTestPurchase = async () => {
    try {
      console.log('🧪 Testing purchase with debug info:', debugInfo);
      await purchaseSubscription('com.geniusiq.iqresult');
    } catch (error) {
      console.error('🧪 Test purchase failed:', error);
      
      // Show detailed error information
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined,
        toString: error?.toString(),
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      };
      
      console.error('🧪 Full error details:', errorDetails);
      
      Alert.alert(
        'Test Purchase Failed', 
        `Error: ${errorDetails.message}\n\nFull Details:\n${errorDetails.fullError}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefreshProducts = async () => {
    try {
      await refreshProducts();
    } catch (error) {
      console.error('🧪 Refresh products failed:', error);
      
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      };
      
      console.error('🧪 Refresh error details:', errorDetails);
      
      Alert.alert(
        'Refresh Failed', 
        `Error: ${errorDetails.message}\n\nFull Details:\n${errorDetails.fullError}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleInitialize = async () => {
    try {
      await initialize();
    } catch (error) {
      console.error('🧪 Initialize failed:', error);
      
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      };
      
      console.error('🧪 Initialize error details:', errorDetails);
      
      Alert.alert(
        'Initialize Failed', 
        `Error: ${errorDetails.message}\n\nFull Details:\n${errorDetails.fullError}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearErrors = () => {
    setErrorHistory([]);
    console.log('🧹 Cleared error history');
  };

  const handleLogFullDebugInfo = () => {
    console.log('🔍 FULL DEBUG INFO:', {
      timestamp: new Date().toISOString(),
      debugInfo,
      errorHistory,
      revenueCatKeyInfo,
      currentError: error,
      context: {
        isConnected,
        productsCount: products.length,
        availablePackagesCount: availablePackages.length,
        hasActiveSubscription,
        isLoading,
        purchaseStatus,
        isPreloaded
      }
    });
    Alert.alert('Debug Info Logged', 'Full debug information has been logged to console');
  };

  const handleGetRevenueCatKeyInfo = async () => {
    try {
      const { testRevenueCatConnection } = require('@/services/iap/configs/revenueCatConfig');
      const connectionResult = await testRevenueCatConnection();
      
      const keyInfo = {
        environment: __DEV__ ? 'development' : 'production',
        platform: Platform.OS,
        envVars: {
          ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ? 'Set' : 'Not set',
          android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ? 'Set' : 'Not set'
        },
        connectionResult,
        timestamp: new Date().toISOString()
      };
      
      setRevenueCatKeyInfo(keyInfo);
      
      console.log('🔑 RevenueCat Key Info:', keyInfo);
      
      Alert.alert(
        'RevenueCat Key Info', 
        `Environment: ${keyInfo.environment}\nPlatform: ${keyInfo.platform}\nConnection: ${connectionResult.success ? 'Success' : 'Failed'}\n\nCheck console for full details`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Failed to get RevenueCat key info:', error);
      Alert.alert('Error', 'Failed to get RevenueCat key information');
    }
  };

  const handleResetRevenueCat = async () => {
    try {
      console.log('🔄 Starting RevenueCat reset...');
      
      const result = await resetRevenueCatConfiguration();
      
      console.log('🔄 RevenueCat reset result:', result);
      
      // Show result in alert
      Alert.alert(
        'RevenueCat Reset Complete',
        `Success: ${result.success}\nError: ${result.error || 'None'}\n\nCheck console for detailed logs including platform detection.`,
        [
          { text: 'OK' },
          { 
            text: 'Reinitialize', 
            onPress: async () => {
              try {
                await handleInitialize();
              } catch (error) {
                console.error('❌ Reinitialize failed:', error);
              }
            }
          }
        ]
      );
      
      // Update key info after reset
      await handleGetRevenueCatKeyInfo();
      
    } catch (error) {
      console.error('❌ RevenueCat reset failed:', error);
      
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      };
      
      console.error('❌ Reset error details:', errorDetails);
      
      Alert.alert(
        'Reset Failed', 
        `Error: ${errorDetails.message}\n\nFull Details:\n${errorDetails.fullError}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IAP Debug Panel</Text>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.infoText}>Connected: {isConnected ? '✅' : '❌'}</Text>
          <Text style={styles.infoText}>Preloaded: {isPreloaded ? '✅' : '❌'}</Text>
          <Text style={styles.infoText}>Loading: {isLoading ? '⏳' : '✅'}</Text>
          <Text style={styles.infoText}>Purchase Status: {purchaseStatus}</Text>
          <Text style={styles.infoText}>Has Active Subscription: {hasActiveSubscription ? '✅' : '❌'}</Text>
          {error && <Text style={styles.errorText}>Error: {error}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products ({products.length})</Text>
          {products.map((product, index) => (
            <View key={index} style={styles.productItem}>
              <Text style={styles.productText}>ID: {product.id}</Text>
              <Text style={styles.productText}>Product ID: {product.productId}</Text>
              <Text style={styles.productText}>Name: {product.name}</Text>
              <Text style={styles.productText}>Price: {product.price}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RevenueCat Packages ({availablePackages.length})</Text>
          {availablePackages.map((pkg: any, index: number) => (
            <View key={index} style={styles.packageItem}>
              <Text style={styles.packageText}>Identifier: {pkg.product.identifier}</Text>
              <Text style={styles.packageText}>Package Type: {pkg.packageType}</Text>
              <Text style={styles.packageText}>Price: {pkg.product.price}</Text>
              <Text style={styles.packageText}>Currency: {pkg.product.currencyCode}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.button} onPress={handleInitialize}>
            <Text style={styles.buttonText}>Initialize</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleRefreshProducts}>
            <Text style={styles.buttonText}>Refresh Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleTestPurchase}>
            <Text style={styles.buttonText}>Test Purchase</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleLogFullDebugInfo}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Log Full Debug Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClearErrors}>
            <Text style={[styles.buttonText, styles.clearButtonText]}>Clear Error History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.keyButton]} onPress={handleGetRevenueCatKeyInfo}>
            <Text style={[styles.buttonText, styles.keyButtonText]}>Get RevenueCat Key Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleResetRevenueCat}>
            <Text style={[styles.buttonText, styles.resetButtonText]}>🔄 Reset RevenueCat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RevenueCat Key Info</Text>
          {Object.keys(revenueCatKeyInfo).length > 0 ? (
            <View style={styles.keyInfoContainer}>
              <Text style={styles.keyInfoText}>Environment: {revenueCatKeyInfo.environment}</Text>
              <Text style={styles.keyInfoText}>Platform: {revenueCatKeyInfo.platform}</Text>
              <Text style={styles.keyInfoText}>iOS Key: {revenueCatKeyInfo.envVars?.ios}</Text>
              <Text style={styles.keyInfoText}>Android Key: {revenueCatKeyInfo.envVars?.android}</Text>
              <Text style={styles.keyInfoText}>Connection: {revenueCatKeyInfo.connectionResult?.success ? '✅ Success' : '❌ Failed'}</Text>
              {revenueCatKeyInfo.connectionResult?.error && (
                <Text style={styles.errorText}>Error: {revenueCatKeyInfo.connectionResult.error}</Text>
              )}
              <Text style={styles.keyInfoText}>Timestamp: {revenueCatKeyInfo.timestamp}</Text>
            </View>
          ) : (
            <Text style={styles.noErrorText}>No RevenueCat key info available. Click "Get RevenueCat Key Info" to fetch.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error Details</Text>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Current Error:</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <Text style={styles.noErrorText}>No current errors</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error History ({errorHistory.length})</Text>
          {errorHistory.length > 0 ? (
            errorHistory.map((errorEntry, index) => (
              <View key={index} style={styles.errorHistoryItem}>
                <Text style={styles.errorTimestamp}>
                  {new Date(errorEntry.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={styles.errorHistoryText}>{errorEntry.error}</Text>
                <Text style={styles.errorContextText}>
                  Context: {JSON.stringify(errorEntry.context, null, 2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noErrorText}>No error history</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Info</Text>
          <Text style={styles.debugText}>{JSON.stringify({
            ...debugInfo,
            revenueCatKeyInfo,
            environment: __DEV__ ? 'development' : 'production',
            platform: Platform.OS,
            envVars: {
              ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ? 'Set' : 'Not set',
              android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ? 'Set' : 'Not set'
            }
          }, null, 2)}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>, insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing(4),
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: theme.spacing(4),
      textAlign: 'center',
      color: theme.colors.text.primary,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      marginBottom: theme.spacing(4),
      padding: theme.spacing(3),
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.radius.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: theme.spacing(2),
      color: theme.colors.text.primary,
    },
    infoText: {
      fontSize: 14,
      marginBottom: theme.spacing(1),
      color: theme.colors.text.primary,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.foreground.error_primary,
      marginBottom: theme.spacing(1),
    },
    productItem: {
      marginBottom: theme.spacing(2),
      padding: theme.spacing(2),
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.radius.sm,
    },
    productText: {
      fontSize: 12,
      marginBottom: theme.spacing(1),
      color: theme.colors.text.primary,
    },
    packageItem: {
      marginBottom: theme.spacing(2),
      padding: theme.spacing(2),
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.radius.sm,
    },
    packageText: {
      fontSize: 12,
      marginBottom: theme.spacing(1),
      color: theme.colors.text.primary,
    },
    button: {
      backgroundColor: theme.colors.foreground.brand_primary,
      padding: theme.spacing(2),
      borderRadius: theme.radius.sm,
      marginBottom: theme.spacing(2),
    },
    buttonText: {
      color: theme.colors.text.white,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    debugText: {
      fontSize: 10,
      fontFamily: 'monospace',
      color: theme.colors.text.primary,
    },
    errorContainer: {
      backgroundColor: theme.colors.background.error_primary,
      padding: theme.spacing(2),
      borderRadius: theme.radius.sm,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.foreground.error_primary,
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.foreground.error_primary,
      marginBottom: theme.spacing(1),
    },
    noErrorText: {
      fontSize: 12,
      color: theme.colors.foreground.success_primary,
      fontStyle: 'italic',
    },
    secondaryButton: {
      backgroundColor: theme.colors.foreground.brand_secondary,
    },
    secondaryButtonText: {
      color: theme.colors.text.white,
    },
    clearButton: {
      backgroundColor: theme.colors.foreground.error_secondary,
    },
    clearButtonText: {
      color: theme.colors.text.white,
    },
    errorHistoryItem: {
      backgroundColor: theme.colors.background.tertiary,
      padding: theme.spacing(2),
      borderRadius: theme.radius.sm,
      marginBottom: theme.spacing(2),
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.foreground.warning_primary,
    },
    errorTimestamp: {
      fontSize: 10,
      color: theme.colors.text.tertiary,
      fontWeight: 'bold',
      marginBottom: theme.spacing(1),
    },
    errorHistoryText: {
      fontSize: 12,
      color: theme.colors.foreground.error_primary,
      marginBottom: theme.spacing(1),
    },
    errorContextText: {
      fontSize: 10,
      color: theme.colors.text.secondary,
      fontFamily: 'monospace',
    },
    keyButton: {
      backgroundColor: theme.colors.foreground.brand_primary,
    },
    keyButtonText: {
      color: theme.colors.text.white,
    },
    keyInfoContainer: {
      backgroundColor: theme.colors.background.brand_primary,
      padding: theme.spacing(2),
      borderRadius: theme.radius.sm,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.foreground.brand_primary,
    },
    keyInfoText: {
      fontSize: 12,
      color: theme.colors.foreground.brand_primary,
      marginBottom: theme.spacing(1),
      fontFamily: 'monospace',
    },
    resetButton: {
      backgroundColor: theme.colors.foreground.warning_primary,
    },
    resetButtonText: {
      color: theme.colors.text.white,
    },
  });

export default IAPDebugPanel;
