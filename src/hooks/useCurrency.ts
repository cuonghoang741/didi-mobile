import { useQuery } from '@tanstack/react-query';
import { fetchAppSettings } from '@/services/supabase/settingService';

const DEFAULT_RATE = 170.22;

export const useCurrency = () => {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchAppSettings,
    staleTime: 1000 * 60 * 60, // 1 hour (ít thay đổi)
  });

  const rate = settings?.jpy_exchange_rate || DEFAULT_RATE;

  const formatJpy = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatVnd = (amountInJpy: number) => {
    // Làm tròn đến hàng đơn vị
    const vndAmount = Math.round(amountInJpy * rate);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(vndAmount);
  };

  const formatPrice = (amountInJpy: number) => {
    return {
      jpy: formatJpy(amountInJpy),
      vnd: formatVnd(amountInJpy),
      rawValue: amountInJpy,
      exchangeRate: rate,
    };
  };

  return {
    exchangeRate: rate,
    formatJpy,
    formatVnd,
    formatPrice,
  };
};
