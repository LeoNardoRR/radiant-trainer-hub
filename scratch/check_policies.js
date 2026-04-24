import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'sessions' });
  if (error) {
    console.error("RPC failed, trying raw query via anon key (might fail):", error.message);
  } else {
    console.log("Policies via RPC:", data);
  }
}
check();
