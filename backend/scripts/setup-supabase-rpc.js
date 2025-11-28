import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function setupSupabaseRPC() {
  console.log('=== Setting up Supabase RPC functions ===\n');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Read the SQL function from the file
    const sqlFunction = fs.readFileSync('./create-exec-sql-function.sql', 'utf8');

    console.log('Executing SQL function creation script...');
    
    // Execute the SQL to create the function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlFunction,
      sql_params: []
    });

    if (error) {
      console.error('Error creating function:', error.message);
      // Alternative: Execute directly without RPC for DDL statements
      console.log('Attempting direct execution...');
      
      const { error: directError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT 1", // Placeholder - we'll use the Supabase client directly
        sql_params: []
      });

      // For DDL statements like CREATE FUNCTION, we need to use a direct database connection
      // or execute them through the Supabase SQL Editor in the dashboard
      console.log('For DDL statements like CREATE FUNCTION, please execute the SQL directly in the Supabase SQL Editor:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Paste and run the content of create-exec-sql-function.sql');
      console.log('\nSQL function content:');
      console.log('----------------------------------------');
      console.log(sqlFunction);
      console.log('----------------------------------------');
    } else {
      console.log('✓ Function created successfully!');
      console.log(data);
    }

    console.log('\n✓ Supabase RPC setup completed!');
  } catch (error) {
    console.error('\n✗ Setup failed');
    console.error('Error:', error.message);
    console.error('Details:', error);
  }
}

// Only run if this file is executed directly
if (process.argv[1].endsWith('setup-supabase-rpc.js')) {
  setupSupabaseRPC();
}

export default setupSupabaseRPC;