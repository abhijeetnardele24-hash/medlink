import axios from 'axios';
import { randomUUID } from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      val = val.replace(/^['"]|['"]$/g, '');
      process.env[match[1]] = val;
    }
  });
}

// Fixed the port bug: backend runs on 3000 by default unless configured otherwise.
const PORT = process.env.PORT || '3000';
const api = axios.create({ baseURL: `http://localhost:${PORT}/v1` });

async function testSyncAuth() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // 1. Find a real encounter and its valid participant (patient or doctor)
    const encounterResult = await pool.query(`
      SELECT e.id as "encounterId", p.user_id as "patientUserId", d.user_id as "doctorUserId"
      FROM encounters e
      JOIN appointments a ON e.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      LIMIT 1
    `);
    
    if (encounterResult.rows.length === 0) {
      console.log('No encounters found to test with.');
      return;
    }
    
    const { encounterId, patientUserId, doctorUserId } = encounterResult.rows[0];
    
    // Find some other user who is NOT a participant
    const otherUserResult = await pool.query('SELECT id FROM users WHERE id != $1 AND id != $2 LIMIT 1', [patientUserId, doctorUserId]);
    const invalidUserId = otherUserResult.rows[0].id;

    console.log(`\n--- Testing PUSH as Valid User ---`);
    const validPushPayload = {
      idempotencyKey: randomUUID(),
      entityType: 'message',
      action: 'CREATE',
      payload: { encounterId, body: 'Hello this is a valid message for sync testing!' },
      timestamp: Date.now()
    };
    
    const pushValidRes = await api.post('/sync/push', { operations: [validPushPayload] }, { 
      headers: { 'x-user-id': patientUserId, 'x-user-role': 'patient' } 
    });
    console.log(`[VALID USER] /sync/push Result:`, pushValidRes.data.results[0]);

    console.log(`\n--- Testing PULL Authorization ---`);
    
    // Test 1: Pull as valid participant
    const pullValidRes = await api.get(`/sync/pull?encounterIds=${encounterId}`, { 
      headers: { 'x-user-id': patientUserId, 'x-user-role': 'patient' } 
    });
    console.log(`[VALID USER] /sync/pull for ${encounterId} -> Status: ${pullValidRes.status}`);
    const validMessages = pullValidRes.data.data.messages;
    console.log(`[VALID USER] Returned ${validMessages.length} messages.`);
    if (validMessages.length > 0) {
      console.log('SUCCESS: Valid user successfully pulled messages.');
    } else {
      console.log('FAIL: Valid user received 0 messages after pushing one.');
    }
    
    // Test 2: Pull as invalid participant
    const pullInvalidRes = await api.get(`/sync/pull?encounterIds=${encounterId}`, { 
      headers: { 'x-user-id': invalidUserId, 'x-user-role': 'patient' } 
    });
    console.log(`[INVALID USER] /sync/pull for ${encounterId} -> Status: ${pullInvalidRes.status}`);
    console.log(`[INVALID USER] Returned ${pullInvalidRes.data.data.messages.length} messages.`);
    
    if (pullInvalidRes.data.data.messages.length === 0) {
        console.log('SUCCESS: Invalid user was rejected/filtered correctly during PULL.');
    } else {
        console.log('FAIL: Invalid user received messages they should not have seen!');
    }

    console.log(`\n--- Testing PUSH Authorization ---`);

    // Test 3: Push as invalid participant
    const pushPayload = {
      idempotencyKey: randomUUID(),
      entityType: 'message',
      action: 'CREATE',
      payload: { encounterId, body: 'Malicious message from non-participant' },
      timestamp: Date.now()
    };
    
    const pushInvalidRes = await api.post('/sync/push', { operations: [pushPayload] }, { 
      headers: { 'x-user-id': invalidUserId, 'x-user-role': 'patient' } 
    });
    console.log(`[INVALID USER] /sync/push Result:`, pushInvalidRes.data.results[0]);
    if (pushInvalidRes.data.results[0].status === 'error') {
        console.log('SUCCESS: Invalid user was blocked from PUSHing.');
    } else {
        console.log('FAIL: Invalid user was allowed to PUSH.');
    }

  } catch(e: any) {
    console.error('ERROR:', e.response?.data || e.message);
  } finally {
    await pool.end();
  }
}

testSyncAuth();
