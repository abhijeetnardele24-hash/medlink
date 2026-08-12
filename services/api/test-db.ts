import { Pool } from "pg";
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log("Found .env file at", envPath);
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
} else {
  console.log("Could not find .env file at", envPath);
}

console.log("DATABASE_URL is:", process.env.DATABASE_URL ? "Set (hidden for security)" : "NOT SET");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to Postgres!");
    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to Postgres:", err);
  }
}
main().catch(console.error);
