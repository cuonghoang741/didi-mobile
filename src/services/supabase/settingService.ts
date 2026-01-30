import { supabase } from './client';

export interface AppSettings {
  id: string;
  jpy_exchange_rate: number;
}

export const fetchAppSettings = async (): Promise<AppSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('id, jpy_exchange_rate')
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }

    // data can be null if no row found
    return (data as unknown as AppSettings) || null;
  } catch (error) {
    console.error('Error in fetchAppSettings:', error);
    return null;
  }
};
