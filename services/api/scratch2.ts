import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/medlink' });
async function run() {
  const users = await pool.query("SELECT id, \"firebaseUid\" FROM users");
  console.log("USERS:", users.rows);
  const patients = await pool.query("SELECT id, \"userId\" FROM patients");
  console.log("PATIENTS:", patients.rows);
  pool.end();
}
run();
