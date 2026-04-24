import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDepositsSchema() {
  const { data, error } = await supabase.from('crypto_deposits').select('*').limit(1);
  if (error) {
     console.log("Error:", error);
  } else {
     // If empty, we can't see keys. Let's try to insert a dummy (and rollback/delete if possible)
     // Or just try to select a specific column to see if it exists
     const { error: err2 } = await supabase.from('crypto_deposits').select('asset').limit(1);
     if (err2) {
        console.log("Column 'asset' DOES NOT exist. Checking 'coin'...");
        const { error: err3 } = await supabase.from('crypto_deposits').select('coin').limit(1);
        if (err3) {
           console.log("Column 'coin' also DOES NOT exist.");
        } else {
           console.log("Column 'coin' EXISTS.");
        }
     } else {
        console.log("Column 'asset' EXISTS.");
     }
  }
}

checkDepositsSchema();
