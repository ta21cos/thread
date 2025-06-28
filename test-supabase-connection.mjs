// This script tests the connection to Supabase
// Run it with: node test-supabase-connection.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase URL or anon key is missing in .env.local');
  process.exit(1);
}

console.log('Attempting to connect to Supabase...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${supabaseAnonKey.substring(0, 5)}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test authentication
    console.log('\nTesting authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('Authentication error:', authError.message);
    } else {
      console.log('Authentication service is working correctly');
      console.log('Session:', authData.session ? 'Active' : 'None');
    }

    // Test database
    console.log('\nTesting database connection...');
    try {
      // Try a simple select to check if the memos table exists
      const { error: dbError } = await supabase.from('memos').select('id').limit(1);

      if (dbError && dbError.message.includes('does not exist')) {
        console.error('Database error: The "memos" table does not exist');
        console.log('Hint: You need to run the SQL setup script in supabase-setup.sql');
        console.log(
          'Go to your Supabase dashboard > SQL Editor > New query, then paste and run the contents of supabase-setup.sql'
        );
      } else if (dbError) {
        console.error('Database query error:', dbError.message);
        console.log('Hint: Check your RLS policies in Supabase');
      } else {
        console.log('Database connection is working correctly');
        console.log('Memos table exists and is accessible');
      }
    } catch (error) {
      console.error('Unexpected database error:', error.message);
    }

    // Test storage
    console.log('\nTesting storage...');
    try {
      // First list all buckets to check if storage is accessible
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('Storage list error:', listError.message);
        console.log('Hint: Make sure your Supabase project has storage enabled');
      } else {
        console.log('Storage service is accessible');

        // Check if our specific bucket exists
        const bucketExists = buckets.some((bucket) => bucket.name === 'memo-images');
        if (!bucketExists) {
          console.error('Storage error: The "memo-images" bucket does not exist');
          console.log('Hint: You need to run the SQL setup script in supabase-setup.sql');
          console.log(
            'Go to your Supabase dashboard > SQL Editor > New query, then paste and run the contents of supabase-setup.sql'
          );
        } else {
          console.log('Storage is working correctly');
          console.log('memo-images bucket exists and is accessible');
        }
      }
    } catch (error) {
      console.error('Unexpected storage error:', error.message);
    }

    // Determine overall status
    console.log('\nSummary:');
    if (!authError) {
      console.log('✅ Authentication: Connected successfully');
    } else {
      console.log('❌ Authentication: Failed to connect');
    }

    // Check if memos table exists by trying to query it
    const { error: tableCheckError } = await supabase.from('memos').select('id').limit(1);

    if (!tableCheckError) {
      console.log('✅ Database: Connected successfully');
    } else {
      console.log('❌ Database: Failed to connect or table does not exist');
    }

    // Check if storage bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.listBuckets();

    const bucketExists = bucketData && bucketData.some((bucket) => bucket.name === 'memo-images');

    if (!bucketError && bucketExists) {
      console.log('✅ Storage: Connected successfully');
    } else {
      console.log('❌ Storage: Failed to connect or bucket does not exist');
    }

    if (!authError && !tableCheckError && !bucketError && bucketExists) {
      console.log('\n✅ Overall: Supabase connection is working correctly!');
    } else {
      console.log('\n❌ Overall: There were some issues with the Supabase connection.');
      console.log('Please check the errors above and make sure:');
      console.log('1. Your .env.local file has the correct Supabase URL and anon key');
      console.log('2. You have run the SQL setup script in supabase-setup.sql');
      console.log('3. Your Supabase project is properly configured');
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testConnection();
