#!/usr/bin/env node

/**
 * Simple migration runner for Supabase PostgreSQL
 * Usage: node scripts/run-migration.js <migration-file-name>
 * Example: node scripts/run-migration.js 012_expand_flashcard_categories.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get migration file name from command line
const migrationFileName = process.argv[2];

if (!migrationFileName) {
  console.error('❌ Error: Please provide a migration file name');
  console.log('Usage: node scripts/run-migration.js <migration-file-name>');
  console.log('Example: node scripts/run-migration.js 012_expand_flashcard_categories.sql');
  process.exit(1);
}

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Read migration file
const migrationPath = path.join(__dirname, '..', 'src', 'lib', 'database', 'migrations', migrationFileName);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Error: Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log(`📝 Running migration: ${migrationFileName}`);
console.log(`📂 Path: ${migrationPath}`);
console.log(`🔗 Database: ${supabaseUrl}`);
console.log('');

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Run migration
async function runMigration() {
  try {
    console.log('🚀 Executing migration SQL...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.error('Details:', error.message);
      console.error('Hint:', error.hint);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('');

    if (data) {
      console.log('Result:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();
