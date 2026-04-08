// Run with: node migrate.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ijuvqzcobvfxkwbdeard.supabase.co',
  'sb_publishable_14mgvlx07JLFjhM278kXbg_DEN71T_k'
)

async function migrate() {
  // Try via RPC if available, otherwise print instructions
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS improvement_tips jsonb DEFAULT \'[]\'::jsonb;'
  })

  if (error) {
    console.log('\n⚠️  Could not auto-migrate. Run this SQL in your Supabase dashboard:\n')
    console.log('  https://supabase.com/dashboard/project/ijuvqzcobvfxkwbdeard/sql/new\n')
    console.log('  ALTER TABLE contracts ADD COLUMN IF NOT EXISTS improvement_tips jsonb DEFAULT \'[]\'::jsonb;\n')
  } else {
    console.log('✅ Migration applied: improvement_tips column added to contracts table.')
  }
}

migrate()
