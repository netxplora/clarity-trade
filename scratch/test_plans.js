
import * as db from '../server/db/json-db.js';

async function test() {
    try {
        console.log("Fetching investment plans...");
        const plans = await db.getInvestmentPlans();
        console.log(`Found ${plans.length} plans.`);
        plans.forEach(p => {
            console.log(`- ${p.plan_name} (${p.status})`);
        });
        
        const activePlans = plans.filter(p => p.status === 'Active');
        console.log(`Active plans: ${activePlans.length}`);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
