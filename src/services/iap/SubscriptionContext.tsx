import React, { createContext, useContext, useMemo } from 'react';
import { useSubscription, UseSubscriptionReturn } from '@/services/iap/useSubscription';

interface SubscriptionContextProps extends UseSubscriptionReturn {}

const SubscriptionContext = createContext<SubscriptionContextProps>({
  // State
  isConnected: false,
  products: [],
  availablePackages: [],
  activeSubscription: null,
  activePurchases: [],
  hasActiveSubscription: false,
  subscriptionExpiresAt: undefined,
  isLoading: false,
  error: null,
  purchaseStatus: 'idle',
  isPreloaded: false,

  // Actions
  initialize: async () => {},
  purchaseSubscription: async () => {},
  restorePurchases: async () => {},
  refreshProducts: async () => {},
  refreshUserProducts: async () => {},
  preloadData: async () => {},
});

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subscriptionData = useSubscription();

  const value = useMemo(() => subscriptionData, [subscriptionData]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
