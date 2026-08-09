import axios from 'axios';
import { randomUUID } from 'crypto';

async function testIdempotency() {
  const api = axios.create({ baseURL: 'http://localhost:3005/v1' });

  // 1. We need an encounter and a user
  // For testing let's assume we can mock or just create a random one or use bypass auth?
  // Our backend doesn't seem to enforce auth heavily if TEST_BYPASS_AUTH is set.
  
  const idempKey = randomUUID();
  const operations = [{
    idempotencyKey: idempKey,
    entityType: 'message',
    action: 'CREATE',
    payload: {
      encounterId: 'test-encounter-id', // Assuming foreign keys are not strictly checked for test or we just test the endpoint logic
      body: 'Hello World (Test)'
    },
    timestamp: Date.now()
  }];

  try {
    console.log('Sending first push...');
    const res1 = await api.post('/sync/push', { operations }, {
      headers: {
        'x-user-id': 'test-user-id',
        'x-user-role': 'patient'
      }
    });
    console.log('Push 1 Result:', res1.data);

    console.log('Sending exact same push again (testing idempotency)...');
    const res2 = await api.post('/sync/push', { operations }, {
      headers: {
        'x-user-id': 'test-user-id',
        'x-user-role': 'patient'
      }
    });
    console.log('Push 2 Result:', res2.data);
    
    if (res1.data.results[0].status === 'success' && res2.data.results[0].status === 'success') {
       if (res1.data.results[0].serverId === res2.data.results[0].serverId) {
           console.log('SUCCESS: Both returned the same server ID. Idempotency is working!');
       } else {
           console.log('FAIL: Different server IDs returned.');
       }
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testIdempotency();
