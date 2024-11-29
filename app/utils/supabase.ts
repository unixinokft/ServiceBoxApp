import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xyztxxvjjwbtwvwrzgtx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enR4eHZqandidHd2d3J6Z3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NTU4MDgsImV4cCI6MjA0NjAzMTgwOH0.YpaZzGfFQ-vFGox0Kx0nA1vragmd8pMbuV_66TIPTp8";
// const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enR4eHZqandidHd2d3J6Z3R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDQ1NTgwOCwiZXhwIjoyMDQ2MDMxODA4fQ.eX8-bkRZodl3R89gDF7gfDkxi5sr0dNH8eBsM5yWbas";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase