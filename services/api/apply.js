const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_vqUO9gL8TxzY@ep-muddy-cherry-aycbxeyl-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });
  await client.connect();
  const sql = fs.readFileSync('./src/db/migrations/0003_odd_patriot.sql', 'utf8');
  console.log('Applying migration...');
  const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    console.log('Executing: ' + stmt.substring(0, 50) + '...');
    try {
      await client.query(stmt);
    } catch(e) {
      console.error(e.message);
    }
  }
  await client.end();
  console.log('Done.');
}
run();
