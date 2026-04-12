import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ubzyvxaguazbkjyucawi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVienl2eGFndWF6YmtqeXVjYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzI2ODEsImV4cCI6MjA5MDIwODY4MX0.DQ0BWdCgGiJTaVtONcYnMqCaH44hVt7KpXu2RrnKQy0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
