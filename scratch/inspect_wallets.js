import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectWallets() {
  const { data, error } = await supabase.from('deposit_wallets').select('*');
  if (error) {
    console.log("Error:", error);
  } else {
    console.log("Wallets found:", data.length);
    data.forEach(w => {
      console.log(JSON.stringify(w, null, 2));
    });
  }
}

inspectWallets();
