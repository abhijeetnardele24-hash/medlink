import Dexie, { type Table } from 'dexie';

export interface OutboxEntry {
  id: string; // Idempotency key
  entityType: 'message';
  action: 'CREATE';
  payload: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed_conflict' | 'failed_error';
  retryCount: number;
  error?: string;
}

export interface CachedMessage {
  id: string; // Real ID or temporary pending ID
  encounterId: string;
  senderId: string;
  body: string;
  createdAt: number;
  syncStatus: 'synced' | 'pending_push';
}

export class MedLinkSyncDB extends Dexie {
  outbox!: Table<OutboxEntry, string>;
  messages_cache!: Table<CachedMessage, string>;

  constructor() {
    super('MedLinkSyncDB');
    this.version(1).stores({
      outbox: 'id, entityType, status, timestamp',
      messages_cache: 'id, encounterId, createdAt, syncStatus'
    });
  }
}

export const syncDb = new MedLinkSyncDB();
