import Button from '@/components/ui/button/button';
import Typography from '@/components/ui/typography/typography';
import { SubscriptionType } from '@/constants/subscription';
import { useTheme } from '@/providers/theme-provider';
import { useSubscription } from '@/services/iap/useSubscription';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SubscriptionManagerProps {
  onSubscriptionChange?: (isActive: boolean) => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  onSubscriptionChange,
}) => {
  const theme = useTheme();
  const { activeSubscription, isLoading, purchaseSubscription, restorePurchases } =
    useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType>('yearly');

  const handlePurchase = async () => {
    try {
      await purchaseSubscription(selectedPlan);
      onSubscriptionChange?.(true);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      onSubscriptionChange?.(!!activeSubscription);
    } catch (error) {
      console.error('Restore failed:', error);
    }
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'To manage your subscription, please go to your device Settings > Apple ID > Subscriptions.',
      [{ text: 'OK' }],
    );
  };

  if (activeSubscription) {
    return (
      <View style={styles.container}>
        <View
          style={[styles.statusCard, { backgroundColor: theme.colors.background.success_primary }]}
        >
          <Typography style={{ color: theme.colors.text.success_primary, fontWeight: 'bold' }}>
            ✓ Premium Active
          </Typography>
          <Typography
            style={{ color: theme.colors.text.success_primary, fontSize: 12, marginTop: 4 }}
          >
            You have full access to all features
          </Typography>
        </View>

        <TouchableOpacity
          onPress={handleManageSubscription}
          style={[styles.manageButton, { borderColor: theme.colors.border.primary }]}
        >
          <Typography style={{ color: theme.colors.text.primary }}>Manage Subscription</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Typography
        style={{
          color: theme.colors.text.primary,
          fontWeight: 'bold',
          marginBottom: 16,
        }}
      >
        Choose Your Plan
      </Typography>

      {/* Plan Selection */}
      <View style={styles.planContainer}>
        {(['weekly', 'monthly', 'yearly'] as SubscriptionType[]).map((plan) => (
          <TouchableOpacity
            key={plan}
            onPress={() => setSelectedPlan(plan)}
            style={[
              styles.planButton,
              {
                backgroundColor:
                  selectedPlan === plan
                    ? theme.colors.background.brand_primary
                    : theme.colors.background.secondary,
                borderColor:
                  selectedPlan === plan ? theme.colors.border.brand : theme.colors.border.secondary,
              },
            ]}
          >
            <Typography
              style={{
                color: selectedPlan === plan ? theme.colors.text.white : theme.colors.text.primary,
                fontWeight: 'bold',
                textTransform: 'capitalize',
              }}
            >
              {plan}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button fullWidth onPress={handlePurchase} disabled={isLoading} color='primary'>
          {isLoading ? 'Processing...' : `Subscribe ${selectedPlan}`}
        </Button>

        <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
          <Typography style={{ color: theme.colors.text.secondary }}>Restore Purchases</Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  manageButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  planContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  planButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  restoreButton: {
    padding: 12,
    alignItems: 'center',
  },
});

export default SubscriptionManager;
