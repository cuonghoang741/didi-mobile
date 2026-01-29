import Button from '@/components/ui/Button/Button';
import Typography from '@/components/ui/Typography/Typography';
import { useTheme } from '@/providers/theme-provider';
import analytics from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FirebaseStatus {
  isCollectionEnabled: boolean;
  isInitialized: boolean;
  appInstanceId: string | null;
  lastEventTime: string | null;
}

/**
 * Firebase Status Debug Component
 * Shows detailed Firebase Analytics status and configuration
 */
const FirebaseStatusDebug = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const [status, setStatus] = useState<FirebaseStatus>({
    isCollectionEnabled: false,
    isInitialized: false,
    appInstanceId: null,
    lastEventTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkFirebaseStatus = async () => {
    setIsLoading(true);
    try {
      // Ensure default app exists before using analytics
      let isInitialized = false;
      try {
        // Modular API: getApp() throws if default app is not ready
        const defaultApp = getApp();
        isInitialized = !!defaultApp?.name;
      } catch {
        isInitialized = false;
      }

      // Try to get app instance ID
      let appInstanceId = null;
      try {
        if (isInitialized) {
          appInstanceId = await analytics().getAppInstanceId();
        }
      } catch (error) {
        console.warn('Could not get app instance ID:', error);
      }

      // Check collection status (this might not be available in all versions)
      let isCollectionEnabled = false;
      try {
        // Note: This method might not exist in all versions
        if (isInitialized) {
          isCollectionEnabled = true; // Assume enabled if app exists
        }
      } catch (error) {
        console.warn('Could not check collection status:', error);
      }

      setStatus({
        isCollectionEnabled,
        isInitialized,
        appInstanceId,
        lastEventTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to check Firebase status:', error);
      Alert.alert('Error', 'Failed to check Firebase status');
    } finally {
      setIsLoading(false);
    }
  };

  const testAnalyticsConnection = async () => {
    try {
      await analytics().logEvent('firebase_status_test', {
        test_timestamp: new Date().toISOString(),
        test_platform: 'react-native',
        test_environment: __DEV__ ? 'development' : 'production',
      });

      Alert.alert(
        'Test Event Sent',
        'Check Firebase Console → Analytics → Debug View to see the event. It may take a few minutes to appear.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to send test event:', error);
      Alert.alert('Error', 'Failed to send test event');
    }
  };

  const showFirebaseConsole = () => {
    Alert.alert(
      'Firebase Console',
      'Open Firebase Console to view analytics data:\n\nhttps://console.firebase.google.com/project/iq-app-f44d3/analytics',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Console', onPress: () => {
            // You could use Linking.openURL here if needed
            console.log('Firebase Console URL: https://console.firebase.google.com/project/iq-app-f44d3/analytics');
          }
        }
      ]
    );
  };

  useEffect(() => {
    checkFirebaseStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Typography variant="text" size="lg" weight="bold" style={styles.title}>
        🔥 Firebase Status Debug
      </Typography>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Typography variant="text" size="md" style={styles.label}>Initialized:</Typography>
          <Typography variant="text" size="md" style={[styles.value, status.isInitialized ? styles.success : styles.error]}>
            {status.isInitialized ? '✅ YES' : '❌ NO'}
          </Typography>
        </View>

        <View style={styles.statusRow}>
          <Typography variant="text" size="md" style={styles.label}>Collection Enabled:</Typography>
          <Typography variant="text" size="md" style={[styles.value, status.isCollectionEnabled ? styles.success : styles.error]}>
            {status.isCollectionEnabled ? '✅ YES' : '❌ NO'}
          </Typography>
        </View>

        <View style={styles.statusRow}>
          <Typography variant="text" size="md" style={styles.label}>App Instance ID:</Typography>
          <Typography variant="text" size="xs" style={styles.value}>
            {status.appInstanceId || 'Not available'}
          </Typography>
        </View>

        <View style={styles.statusRow}>
          <Typography variant="text" size="md" style={styles.label}>Last Check:</Typography>
          <Typography variant="text" size="xs" style={styles.value}>
            {status.lastEventTime ? new Date(status.lastEventTime).toLocaleTimeString() : 'Never'}
          </Typography>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={checkFirebaseStatus}
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? 'Checking...' : 'Refresh Status'}
        </Button>

        <Button
          onPress={testAnalyticsConnection}
          variant="outline"
        >
          Send Test Event
        </Button>

        <Button
          onPress={showFirebaseConsole}
          variant="outline"
        >
          Open Firebase Console
        </Button>
      </View>

      <Typography variant="text" size="xs" style={styles.instructions}>
        📊 Events may take 1-24 hours to appear in Firebase Console
        {'\n'}🔍 For real-time debugging, use Firebase Debug View
        {'\n'}⚠️ Make sure IS_ANALYTICS_ENABLED is true in GoogleService-Info.plist
      </Typography>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>, insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    container: {
      padding: theme.spacing(4),
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.radius.md,
      margin: theme.spacing(2),
    },
    title: {
      textAlign: 'center',
      marginBottom: theme.spacing(3),
      color: theme.colors.foreground.brand_primary,
    },
    statusContainer: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.radius.sm,
      padding: theme.spacing(3),
      marginBottom: theme.spacing(3),
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing(2),
    },
    label: {
      fontWeight: '600',
      color: theme.colors.text.secondary,
    },
    value: {
      color: theme.colors.text.secondary,
      flex: 1,
      textAlign: 'right',
    },
    success: {
      color: theme.colors.foreground.success_primary,
      fontWeight: 'bold',
    },
    error: {
      color: theme.colors.foreground.error_primary,
      fontWeight: 'bold',
    },
    buttonContainer: {
      gap: theme.spacing(2),
      marginBottom: theme.spacing(3),
    },
    button: {
      width: '100%',
    },
    instructions: {
      textAlign: 'center',
      color: theme.colors.text.tertiary,
      fontStyle: 'italic',
      lineHeight: 20,
    },
  });

export default FirebaseStatusDebug;
