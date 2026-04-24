import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('deposit_wallets').select('*').limit(1);
  if (error) {
     console.log("Error:", error);
  } else if (data && data.length > 0) {
     console.log("Columns found:", Object.keys(data[0]).join(", "));
  } else {
     console.log("No data to infer columns. Checking table info...");
     // Fallback to a query that might reveal columns or just try common names
  }
}

checkSchema();
