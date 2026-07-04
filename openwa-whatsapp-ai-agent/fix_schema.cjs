const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Try creating the RPC first
  const createRpc = `
    CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
    RETURNS JSONB
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      EXECUTE query;
      result := '{"success": true}'::JSONB;
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      result := jsonb_build_object('success', false, 'error', SQLERRM);
      RETURN result;
    END;
    $$;
  `;

  // Try direct query via REST API
  const sql = `
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT;
  `;

  // Use the Supabase management API - /rest/v1/ with sql query param
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  if (!res.ok) {
    console.error('REST failed:', res.status, await res.text());
    return;
  }
  const spec = await res.json();
  console.log('Supabase API accessible');

  // Try the exec_sql RPC (needs to be created first)
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { query: sql });
  if (rpcError) {
    console.error('RPC error:', rpcError.message);
    // Try to create the function via Supabase's SQL
    console.log('Need to run SQL manually in Supabase dashboard SQL editor');
    console.log('SQL to run:');
    console.log(sql);
  } else {
    console.log('Schema updated successfully:', rpcData);
  }
})();
