import { supabase } from './client';
import { Branch, BankAccount, Fanpage } from '@/models/settings';

export interface AppSettings {
  id: string;
  jpy_exchange_rate: number;
  branches: Branch[];
  bank_accounts: BankAccount[];
  fanpage_urls: Fanpage[];
  contact_phone: string;
  created_at: string | null;
  updated_at: string | null;
}

export const fetchAppSettings = async (): Promise<AppSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }

    if (!data) return null;

    // Parse JSON fields
    return {
      id: data.id,
      jpy_exchange_rate: data.jpy_exchange_rate ?? 170.22,
      branches: (data.branches as unknown as Branch[]) ?? [],
      bank_accounts: (data.bank_accounts as unknown as BankAccount[]) ?? [],
      fanpage_urls: (data.fanpage_urls as unknown as Fanpage[]) ?? [],
      contact_phone: (data as any).contact_phone ?? '',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Error in fetchAppSettings:', error);
    return null;
  }
};
