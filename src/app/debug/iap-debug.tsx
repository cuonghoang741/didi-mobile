import IAPDebugPanel from '@/services/iap/debug/IAPDebugPanel';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts';

const IAPDebugPage: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);

  return (
    <View style={styles.container}>
      <IAPDebugPanel />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>, insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
  });

export default IAPDebugPage;
