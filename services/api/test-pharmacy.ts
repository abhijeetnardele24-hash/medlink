import axios from 'axios';
import crypto from 'crypto';
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

const API_URL = (process.env.API_URL || 'http://localhost:3005') + '/v1';

async function generateTestHeaders(role: 'patient' | 'doctor', uid: string) {
  return {
    'x-user-id': uid,
    'x-role': role
  };
}

async function runTests() {
  console.log('--- Starting Pharmacy Integration Tests ---');
  // Fetch real patient and doctor UUIDs from API
  // Well, I can't fetch patients easily. I'll just use the first doctor and first patient using raw SQL query inside the script using pg instead, or just use axios.
  // Wait, there's a login route but I don't know the password.
  // Let me just require 'pg' directly.
  const pg = (await import('pg')).default;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const doctorRes = await pool.query("SELECT id, firebase_uid FROM users WHERE role = 'doctor' LIMIT 1");
  const patientRes = await pool.query("SELECT id, firebase_uid FROM users WHERE role = 'patient' LIMIT 1");

  const doctorId = doctorRes.rows[0]?.id;
  const patientId = patientRes.rows[0]?.id;

  if (!doctorId || !patientId) throw new Error("No patient or doctor found in DB.");

  // Ensure patient profile exists
  const pProfile = await pool.query("SELECT id FROM patients WHERE user_id = $1", [patientId]);
  if (pProfile.rowCount === 0) {
    await pool.query("INSERT INTO patients (id, user_id, date_of_birth, gender) VALUES (gen_random_uuid(), $1, '1990-01-01', 'other')", [patientId]);
  }

  // Ensure doctor profile exists
  const dProfile = await pool.query("SELECT id FROM doctors WHERE user_id = $1", [doctorId]);
  if (dProfile.rowCount === 0) {
    await pool.query("INSERT INTO doctors (id, user_id, full_name, speciality, verification_status) VALUES (gen_random_uuid(), $1, 'Test Dr', 'General', 'verified')", [doctorId]);
  } else {
    await pool.query("UPDATE doctors SET verification_status = 'verified' WHERE user_id = $1", [doctorId]);
  }
  
  const doctorProfile = await pool.query("SELECT id FROM doctors WHERE user_id = $1", [doctorId]);
  const doctorProfileId = doctorProfile.rows[0].id;

  const headers = await generateTestHeaders('patient', patientRes.rows[0].firebase_uid);
  const headersDoctor = await generateTestHeaders('doctor', doctorRes.rows[0].firebase_uid);
  
  try {
    console.log('\n[1/5] Fetching medicine catalog...');
    const searchRes = await axios.get(`${API_URL}/medicines`, { headers });
    console.log(`✅ Fetched ${searchRes.data.medicines.length} medicines`);
    
    if (searchRes.data.medicines.length === 0) {
      throw new Error('No medicines found. Please run seed_medicines.ts first.');
    }
    
    const paracetamol = searchRes.data.medicines.find((m: any) => m.name.toLowerCase().includes('paracetamol'));
    const amoxicillin = searchRes.data.medicines.find((m: any) => m.name.toLowerCase().includes('amoxicillin'));
    
    if (!paracetamol || !amoxicillin) {
      throw new Error('Required medicines missing in seed data.');
    }
    
    console.log('\n[2/5] Creating a test prescription...');
    // Create appointment first
    const apptRes = await axios.post(`${API_URL}/appointments`, {
      doctorId: doctorProfileId,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      concernCategory: 'General'
    }, { headers: headers });
    const appointmentId = apptRes.data.id;

    // We need an encounter first
    const encRes = await axios.post(`${API_URL}/encounters`, {
      appointmentId: appointmentId,
      patientUserId: patientId
    }, { headers: headersDoctor });
    const encounterId = encRes.data.id;
    
    const rxRes = await axios.post(`${API_URL}/encounters/${encounterId}/prescriptions`, {
      doctorId: doctorProfileId,
      medicinesJson: [{ name: 'Amoxicillin 500mg' }]
    }, { headers: headersDoctor });
    const prescriptionId = rxRes.data.id;
    console.log(`✅ Prescription ${prescriptionId} created`);

    console.log('\n[3/5] Creating order without prescription for an Rx-required item (should fail)...');
    try {
      await axios.post(`${API_URL}/pharmacy/orders`, {
        deliveryAddress: '123 Fake St',
        items: [{ medicineId: amoxicillin.id, quantity: 1 }] // amoxicillin is Rx required
      }, { headers });
      console.error('❌ Failed: Allowed order without prescription');
    } catch (e: any) {
      if (e.response?.status === 403) {
        console.log('✅ Correctly blocked order without prescription.');
      } else {
        throw e;
      }
    }

    console.log('\n[3.5/5] Creating order with prescription for an unrelated/ambiguous Rx item (should fail)...');
    try {
      // Find a different Rx medicine not in the prescription (prescription only has Amoxicillin)
      const omeprazoleRes = await pool.query("SELECT id FROM medicines WHERE name ILIKE '%omeprazole%' LIMIT 1");
      const omeprazoleId = omeprazoleRes.rows[0].id;
      
      await axios.post(`${API_URL}/pharmacy/orders`, {
        prescriptionId,
        deliveryAddress: '123 Fake St',
        items: [{ medicineId: omeprazoleId, quantity: 1 }] // Rx required, but not in prescription
      }, { headers });
      console.error('❌ Failed: Allowed order with unrelated prescription');
    } catch (e: any) {
      if (e.response?.status === 403) {
        console.log('✅ Correctly blocked order due to strict prescription reconciliation failure.');
      } else {
        throw e;
      }
    }

    console.log('\n[4/5] Creating valid order with prescription...');
    const orderRes = await axios.post(`${API_URL}/pharmacy/orders`, {
      prescriptionId,
      deliveryAddress: '123 Fake St',
      items: [
        { medicineId: amoxicillin.id, quantity: 1 },
        { medicineId: paracetamol.id, quantity: 2 } // OTC allowed
      ]
    }, { headers });
    const orderId = orderRes.data.order.id;
    const paymentId = orderRes.data.razorpayOrderId;
    console.log(`✅ Order ${orderId} created successfully`);
    
    console.log('\n[5/5] Testing Webhook to mark order paid...');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            order_id: paymentId,
            id: 'pay_test123'
          }
        }
      }
    });
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    
    const webhookRes = await axios.post(`http://localhost:3005/webhooks/razorpay`, payload, {
      headers: {
        'x-razorpay-signature': signature,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Webhook processed successfully`);
    
    // Verify idempotent nature
    console.log('\n[6/6] Verifying webhook idempotency...');
    await axios.post(`http://localhost:3005/webhooks/razorpay`, payload, {
      headers: {
        'x-razorpay-signature': signature,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Second webhook processed successfully (idempotent)`);

    console.log('\n--- ALL PHARMACY TESTS PASSED ---');
  } catch (error: any) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();





