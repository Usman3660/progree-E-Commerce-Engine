const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  const connectionString = process.env.SUPABASE_URL;
  console.log('Connecting to:', connectionString ? connectionString.replace(/:[^:@]+@/, ':****@') : 'None');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT current_database(), now()');
    console.log('✅ PostgreSQL Connection successful:', res.rows[0]);

    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('📊 Tables in public schema:', tablesRes.rows.map(r => r.table_name));

    await pool.end();
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
}

testConnection();
