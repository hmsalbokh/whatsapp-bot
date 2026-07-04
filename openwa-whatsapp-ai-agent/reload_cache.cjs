const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Try to notify pgrst to reload schema
  const { data, error } = await supabase.rpc('pg_notify', { channel: 'pgrst', payload: 'reload schema' }).select();
  if (error) {
    console.log('Notify failed, trying direct query...', error.message);
    // Try raw SQL via REST
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });
    console.log('Root status:', res.status);
    const txt = await res.text();
    console.log(txt.slice(0, 300));
    
    // Try to query conversations with specific columns
    const { data: d2, error: e2 } = await supabase.from('conversations').select('id,customer_phone,customer_name,bot_enabled,human_handoff').limit(1).maybeSingle();
    if (e2) console.log('Query error:', e2.message);
    else console.log('Query result:', JSON.stringify(d2));
  } else {
    console.log('Schema reloaded!', data);
  }
})();
