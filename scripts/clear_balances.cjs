const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ommeobwgtqbkqcifhbkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbWVvYndndHFia3FjaWZoYmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5ODY3MzAsImV4cCI6MjA4OTU2MjczMH0.1pwTGd0CGNavEz3TkAHzsEdGy_mdAtP93WYZBRJDl-k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearBalances() {
    try {
        console.log("Clearing all balances in DB...");
        const { data, error } = await supabase
            .from('balances')
            .update({ 
                fiat_balance: 0, 
                trading_balance: 0, 
                crypto_balances: {} 
            })
            .not('user_id', 'is', null); // Universal filter

        if (error) {
            console.error("Error clearing balances:", error.message);
        } else {
            console.log("Balances cleared successfully.");
        }
    } catch (err) {
        console.error("Unexpected error:", err.message);
    }
}

clearBalances();
