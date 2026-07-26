import { useQuery } from '@tanstack/react-query';
import { fetchAppSettings, AppSettings } from '@/services/supabase/settingService';

export const useSettings = () => {
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery<AppSettings | null>({
    queryKey: ['settings'],
    queryFn: fetchAppSettings,
    // Keep settings fresh so CMS changes (contact links, exchange rate, etc.)
    // appear quickly instead of being stuck on a stale cache.
    staleTime: 1000 * 60, // 1 minute
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    settings,
    isLoading,
    error,
    refetch,
    // Helper getters
    branches: settings?.branches ?? [],
    bankAccounts: settings?.bank_accounts ?? [],
    fanpageUrls: settings?.fanpage_urls ?? [],
    exchangeRate: settings?.jpy_exchange_rate ?? 170.22,
    contactPhone: settings?.contact_phone ?? '',
  };
};
