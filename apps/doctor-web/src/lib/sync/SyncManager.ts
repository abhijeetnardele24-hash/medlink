import { syncDb } from './SyncDB';
import { api } from '../api';

class SyncManager {
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.sync());
      // Interval sync every 30s as a fallback
      setInterval(() => this.sync(), 30000);
    }
  }

  /**
   * Enqueues a message for offline sending.
   */
  async enqueueMessage(encounterId: string, senderId: string, body: string) {
    const id = crypto.randomUUID();
    const now = Date.now();

    // 1. Write to cache for optimistic UI
    await syncDb.messages_cache.put({
      id,
      encounterId,
      senderId,
      body,
      createdAt: now,
      syncStatus: 'pending_push'
    });

    // 2. Write to outbox
    await syncDb.outbox.put({
      id,
      entityType: 'message',
      action: 'CREATE',
      payload: { encounterId, body },
      timestamp: now,
      status: 'pending',
      retryCount: 0
    });

    // 3. Trigger background sync
    this.sync();
  }

  /**
   * Syncs the outbox with the server.
   */
  async sync(encounterIds: string[] = []) {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      await this.pushOutbox();
      if (encounterIds.length > 0) {
        await this.pullChanges(encounterIds);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async pullChanges(encounterIds: string[]) {
    try {
      const cursor = localStorage.getItem('medlink_sync_cursor') || '0';
      const res = await api.get(`/sync/pull?cursor=${cursor}&encounterIds=${encounterIds.join(',')}`);
      
      const newMessages = res.data.data.messages || [];
      const nextCursor = res.data.nextCursor;

      if (newMessages.length > 0) {
        // Map backend messages to CachedMessage shape
        const toCache = newMessages.map((msg: any) => ({
          id: msg.id,
          encounterId: msg.encounterId,
          senderId: msg.senderId,
          body: msg.body,
          createdAt: new Date(msg.createdAt).getTime(),
          syncStatus: 'synced'
        }));

        await syncDb.messages_cache.bulkPut(toCache);
      }

      // Update cursor and Ack
      if (nextCursor) {
        localStorage.setItem('medlink_sync_cursor', nextCursor.toString());
        await api.post('/sync/ack', { cursor: nextCursor });
      }
    } catch (err) {
      console.error('Pull sync failed:', err);
    }
  }

  private async pushOutbox() {
    const pending = await syncDb.outbox
      .where('status')
      .anyOf('pending', 'failed_error')
      .toArray();

    if (pending.length === 0) return;

    // Mark as syncing locally
    await syncDb.outbox.bulkPut(
      pending.map(p => ({ ...p, status: 'syncing' }))
    );

    try {
      const payload = pending.map(p => ({
        idempotencyKey: p.id,
        entityType: p.entityType,
        action: p.action,
        payload: p.payload,
        timestamp: p.timestamp
      }));

      const res = await api.post('/sync/push', { operations: payload });
      const results = res.data.results || [];

      for (const result of results) {
        if (result.status === 'success') {
          // Success! Remove from outbox
          await syncDb.outbox.delete(result.idempotencyKey);
          
          // Update cache with real server ID and synced status
          const cached = await syncDb.messages_cache.get(result.idempotencyKey);
          if (cached) {
            await syncDb.messages_cache.delete(result.idempotencyKey);
            await syncDb.messages_cache.put({
              ...cached,
              id: result.serverId, // Use real server ID
              syncStatus: 'synced'
            });
          }
        } else if (result.status === 'conflict') {
          await syncDb.outbox.update(result.idempotencyKey, { status: 'failed_conflict', error: 'Conflict' });
        } else {
          await syncDb.outbox.update(result.idempotencyKey, { status: 'failed_error', error: result.error });
        }
      }
    } catch (err: any) {
      console.error('Push sync failed:', err);
      // Revert status to pending/error and increment retry count
      await syncDb.outbox.bulkPut(
        pending.map(p => ({ 
          ...p, 
          status: 'failed_error', 
          retryCount: p.retryCount + 1,
          error: err.message
        }))
      );
    }
  }
}

export const syncManager = new SyncManager();
