import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
  console.log("Checking Supabase tables...");
  const tables = ['deposit_wallets', 'crypto_providers', 'crypto_deposits', 'platform_settings'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table ${table}: ERROR - ${error.message} (${error.code})`);
      } else {
        console.log(`Table ${table}: OK (Data: ${data?.length > 0 ? 'Found' : 'Empty'})`);
      }
    } catch (e) {
      console.log(`Table ${table}: EXCEPTION - ${e.message}`);
    }
  }
}

checkTables();
