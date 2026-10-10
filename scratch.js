const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/medlink' });
async function run() {
  const users = await pool.query("SELECT * FROM users");
  console.log("USERS:", users.rows);
  const patients = await pool.query("SELECT * FROM patients");
  console.log("PATIENTS:", patients.rows);
  pool.end();
}
run();
