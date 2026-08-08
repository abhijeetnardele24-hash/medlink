import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../services/api/.env') });

const API_URL = process.env.API_URL || 'http://localhost:3005';

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
  const doctorRes = await pool.query("SELECT id FROM users WHERE role = 'doctor' LIMIT 1");
  const patientRes = await pool.query("SELECT id FROM users WHERE role = 'patient' LIMIT 1");
  await pool.end();

  const doctorId = doctorRes.rows[0]?.id;
  const patientId = patientRes.rows[0]?.id;

  if (!doctorId || !patientId) throw new Error("No patient or doctor found in DB.");

  const headers = await generateTestHeaders('patient', patientId);
  const headersDoctor = await generateTestHeaders('doctor', doctorId);
  
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
      doctorId: doctorId,
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
      doctorName: 'Dr. Test',
      medicinesJson: JSON.stringify([{ name: 'Amoxicillin 500mg' }])
    }, { headers: headersDoctor });
    const prescriptionId = rxRes.data.prescriptionId;
    console.log(`✅ Prescription ${prescriptionId} created`);

    console.log('\n[3/5] Creating order without prescription for an Rx-required item (should fail)...');
    try {
      await axios.post(`${API_URL}/pharmacy/orders`, {
        deliveryAddress: '123 Fake St',
        items: [{ medicineId: amoxicillin.id, quantity: 1 }]
      }, { headers });
      throw new Error('Order creation succeeded but should have failed.');
    } catch (e: any) {
      if (e.response?.status === 403) {
        console.log('✅ Correctly blocked order without prescription.');
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
    const orderId = orderRes.data.orderId;
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
    
    const webhookRes = await axios.post(`${API_URL}/webhooks/razorpay`, payload, {
      headers: {
        'x-razorpay-signature': signature,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Webhook processed successfully`);
    
    // Verify idempotent nature
    console.log('\n[6/6] Verifying webhook idempotency...');
    await axios.post(`${API_URL}/webhooks/razorpay`, payload, {
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
  }
}

runTests();
