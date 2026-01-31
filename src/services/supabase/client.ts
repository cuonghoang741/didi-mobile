import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { Database } from '@/types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://brsigfliyzwlomomoxqu.supabase.co";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "sb_publishable_yTnYgR3r8pmTlhOlt1zRHQ_IQO54sBe";

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Important for React Native
  },
});

export default supabase;
