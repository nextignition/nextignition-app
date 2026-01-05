import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
  'https://gatwoxtvedjgdxahgzkw.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhdHdveHR2ZWRqZ2R4YWhnemt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTU4NDMsImV4cCI6MjA3ODY5MTg0M30.9zOein_7CoSRHeFiJzcMLCajDHu8T_OIlh1XnnPoicc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable to detect session from URL (needed for password reset)
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
