import Typography from '@/components/ui/typography/typography';
import { useTheme } from '@/providers/theme-provider';
import { useSubscription } from '@/services/iap/useSubscription';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface SubscriptionStatusProps {
  showDetails?: boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ showDetails = false }) => {
  const theme = useTheme();
  const { activeSubscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
        <Typography style={{ color: theme.colors.text.secondary }}>
          Checking subscription status...
        </Typography>
      </View>
    );
  }

  if (!activeSubscription) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background.warning_primary }]}
      >
        <Typography style={{ color: theme.colors.text.warning_primary }}>
          No active subscription
        </Typography>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.success_primary }]}>
      <Typography style={{ color: theme.colors.text.success_primary }}>
        ✓ Active Subscription
      </Typography>
      {showDetails && (
        <Typography
          style={{
            color: theme.colors.text.success_primary,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          Product ID: {activeSubscription.productId}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
});

export default SubscriptionStatus;
