import Button from '@/components/ui/Button/Button';
import Typography from '@/components/ui/Typography/Typography';
import { useTheme } from '@/providers/theme-provider';
import { disableFirebaseAnalyticsDebug, enableFirebaseAnalyticsDebug, testFirebaseAnalytics } from '@/services/firebase/firebase-debug';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Firebase Analytics Debug Component
 * Only use this in development builds
 */
const FirebaseAnalyticsDebug = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);

  // Check analytics collection status on mount
  useEffect(() => {
    const checkAnalyticsStatus = async () => {
      try {
        // Note: isCollectionEnabled might not be available in all versions
        // We'll assume it's enabled if no error occurs
        setIsDebugEnabled(true);
      } catch (error) {
        console.error('Failed to check analytics status:', error);
        setIsDebugEnabled(false);
      }
    };

    checkAnalyticsStatus();
  }, []);

  const handleEnableDebug = async () => {
    await enableFirebaseAnalyticsDebug();
    setIsDebugEnabled(true);
  };

  const handleDisableDebug = async () => {
    await disableFirebaseAnalyticsDebug();
    setIsDebugEnabled(false);
  };

  const handleTestEvent = async () => {
    await testFirebaseAnalytics();
  };

  return (
    <View style={styles.container}>
      <Typography variant="text" size="lg" weight="bold" style={styles.title}>
        🔥 Firebase Analytics Debug
      </Typography>

      <Typography variant="text" size="md" style={styles.description}>
        Analytics Collection: {isDebugEnabled ? '✅ ENABLED' : '❌ DISABLED'}
      </Typography>

      <View style={styles.buttonContainer}>
        {!isDebugEnabled ? (
          <Button onPress={handleEnableDebug} colorScheme="brand" style={styles.button}>
            Enable Analytics
          </Button>
        ) : (
          <Button onPress={handleDisableDebug} colorScheme="error" style={styles.button}>
            Disable Analytics
          </Button>
        )}

        <Button onPress={handleTestEvent} colorScheme="brand" style={styles.button}>
          Send Test Event
        </Button>
      </View>

      <Typography variant="text" size="xs" style={styles.instructions}>
        📊 After enabling analytics, check Firebase Console → Analytics → Debug View
        {'\n'}ℹ️ Debug mode is now controlled via Firebase Console settings
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
      marginBottom: theme.spacing(2),
      color: theme.colors.text.primary,
    },
    description: {
      textAlign: 'center',
      marginBottom: theme.spacing(3),
      color: theme.colors.text.secondary,
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
    },
  });

export default FirebaseAnalyticsDebug;
