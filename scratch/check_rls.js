import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log("Checking RLS policies for investment_plans...");
    const { data: policies, error } = await supabase.rpc('get_policies', { table_name: 'investment_plans' });
    
    if (error) {
        // Fallback: query pg_policies directly
        const { data: pgPolicies, error: pgError } = await supabase.from('pg_policies').select('*').eq('tablename', 'investment_plans');
        if (pgError) {
            // Try another way: raw query if possible via SQL editor or similar. 
            // Here we can just try to fetch with ANON key and see if it works.
            console.log("Could not fetch policies via RPC or pg_policies (likely permission denied).");
            console.log("Attempting to fetch plans with ANON key...");
            
            const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
            const { data: plans, error: fetchError } = await anonClient.from('investment_plans').select('*');
            if (fetchError) {
                console.error("Anon fetch error:", fetchError);
            } else {
                console.log(`Anon fetch returned ${plans.length} records.`);
                console.log("Plans data:", JSON.stringify(plans, null, 2));
                if (plans.length === 0) {
                    console.log("RECORDS EXIST but anon fetch returned 0. COMPARING WITH SERVICE ROLE...");
                    const { data: serviceData } = await supabase.from('investment_plans').select('*');
                    console.log("Service role fetch returned", serviceData.length, "records.");
                }
            }
            return;
        }
        console.log("Policies:", pgPolicies);
    } else {
        console.log("Policies:", policies);
    }
}

checkRLS();
