import axios from 'axios';
import { randomUUID } from 'crypto';

async function testSync() {
  const encId = randomUUID();
  const idempKey = randomUUID();
  const api = axios.create({ baseURL: 'http://localhost:3005/v1' });
  
  const payload = {
    idempotencyKey: idempKey,
    entityType: 'message',
    action: 'CREATE',
    payload: { encounterId: encId, body: 'Hello UUID test' },
    timestamp: Date.now()
  };

  try {
    const res1 = await api.post('/sync/push', { operations: [payload] }, { headers: { 'x-user-id': randomUUID(), 'x-user-role': 'patient' } });
    console.log('RES 1', res1.data);
    const res2 = await api.post('/sync/push', { operations: [payload] }, { headers: { 'x-user-id': randomUUID(), 'x-user-role': 'patient' } });
    console.log('RES 2', res2.data);
    if (res1.data.results[0].serverId === res2.data.results[0].serverId) {
       console.log('SUCCESS: IDEMPOTENCY WORKS');
    }
  } catch(e: any) {
    console.log('ERROR:', e.response?.data || e.message);
  }
}
testSync();
