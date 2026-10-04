import fs from "node:fs"; import path from "node:path";
const root=path.resolve(import.meta.dirname,"..");
const required=["supabase/functions/tradelab-market-cycle/index.ts","supabase/functions/tradelab-market-cycle/core/market-clock.ts","supabase/functions/tradelab-market-cycle/core/data-engine.ts","supabase/functions/tradelab-market-cycle/core/profiles.ts","supabase/functions/tradelab-market-cycle/core/forward-engine.ts","supabase/migrations/202610040001_p2a_server_automation.sql"];
for(const f of required)if(!fs.existsSync(path.join(root,f)))throw new Error(`MISSING ${f}`);
for(const f of required.filter(x=>x.endsWith('.ts'))){const s=fs.readFileSync(path.join(root,f),'utf8');for(const forbidden of ['localStorage','sessionStorage','document.','window.'])if(s.includes(forbidden))throw new Error(`${f} contains browser dependency ${forbidden}`);}
const index=fs.readFileSync(path.join(root,required[0]),'utf8');if(index.includes('sb_secret_')||index.includes('service_role_key='))throw new Error('HARDCODED SECRET');
console.log('P2-A static checks passed');
