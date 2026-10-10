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
   * Enqueues a generic operation for offline sending.
   */
  async enqueueOperation(entityType: string, action: string, payload: any) {
    const id = crypto.randomUUID();
    const now = Date.now();

    // Write to outbox
    await syncDb.outbox.put({
      id,
      entityType,
      action,
      payload,
      timestamp: now,
      status: 'pending',
      retryCount: 0
    });

    // Trigger background sync
    this.sync();
  }

  /**
   * Enqueues an attachment for offline sending.
   */
  async enqueueAttachment(file: Blob, mimeType: string): Promise<string> {
    const id = crypto.randomUUID();
    await syncDb.attachments_outbox.put({
      id,
      file,
      mimeType,
      status: 'pending'
    });
    this.sync();
    return id;
  }

  /**
   * Syncs the outbox with the server.
   */
  async sync(encounterIds: string[] = []) {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      await this.pushAttachments();
      await this.pushOutbox();
      if (encounterIds.length > 0) {
        await this.pullChanges(encounterIds);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushAttachments() {
    const pending = await syncDb.attachments_outbox
      .where('status')
      .anyOf('pending', 'failed')
      .toArray();

    for (const att of pending) {
      try {
        await syncDb.attachments_outbox.update(att.id, { status: 'uploading' });
        
        const formData = new FormData();
        formData.append('file', att.file, `attachment-${att.id}`);

        const res = await api.post('/attachments', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        const serverId = res.data.id;
        
        await syncDb.attachments_outbox.update(att.id, { 
          status: 'synced',
          serverId
        });

        const outboxEntries = await syncDb.outbox.toArray();
        for (const entry of outboxEntries) {
          if (entry.payload && entry.payload.attachmentId === att.id) {
            entry.payload.attachmentId = serverId;
            await syncDb.outbox.put(entry);
          }
        }
      } catch (err) {
        console.error('Attachment upload failed:', err);
        await syncDb.attachments_outbox.update(att.id, { status: 'failed' });
      }
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
      .anyOf('pending', 'failed_error', 'syncing')
      .toArray();

    if (pending.length === 0) return;

    // Check if any operations are waiting on pending attachments
    const waitingForAttachments = pending.some(p => 
      p.payload?.attachmentId && 
      !p.payload.attachmentId.includes('-') === false // If it still has a UUID hyphens, it might be a local ID
      // Actually, a real server ID is also a UUID!
      // But we replace `attachmentId` with `serverId` which is a real UUID.
      // So we can check if it exists in `attachments_outbox` and is not 'synced'
    );
    
    let safePending = pending;
    
    try {
      const allAttachments = await syncDb.attachments_outbox.toArray();
      const pendingLocalIds = allAttachments.filter(a => a.status !== 'synced').map(a => a.id);
      
      safePending = pending.filter(p => {
        if (p.payload?.attachmentId && pendingLocalIds.includes(p.payload.attachmentId)) {
          return false; // Skip pushing this outbox item until attachment is synced
        }
        return true;
      });
    } catch (e) {
      console.error(e);
    }
    
    if (safePending.length === 0) return;

    // Mark as syncing locally
    await syncDb.outbox.bulkPut(
      safePending.map(p => ({ ...p, status: 'syncing' }))
    );

    try {
      const payload = safePending.map(p => ({
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
        safePending.map(p => ({ 
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
