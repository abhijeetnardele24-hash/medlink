import Dexie, { type Table } from 'dexie';

export interface OutboxEntry {
  id: string; // Idempotency key
  entityType: string;
  action: string;
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

export interface CachedAppointment {
  id: string; // Real ID or temporary pending ID
  scheduledAt: string;
  endsAt?: string;
  status: string;
  concernCategory: string;
  doctor?: { fullName: string; speciality: string };
  syncStatus: 'synced' | 'pending_push' | 'failed_conflict';
  error?: string;
}

export interface QueuedAttachment {
  id: string; // uuid
  file: Blob;
  mimeType: string;
  status: 'pending' | 'uploading' | 'failed' | 'synced';
  serverId?: string;
}

export class MedLinkSyncDB extends Dexie {
  outbox!: Table<OutboxEntry, string>;
  messages_cache!: Table<CachedMessage, string>;
  appointments_cache!: Table<CachedAppointment, string>;
  health_profile!: Table<any, string>;
  prescriptions_cache!: Table<any, string>;
  encounters_cache!: Table<any, string>;
  doctors_cache!: Table<any, string>;
  attachments_outbox!: Table<QueuedAttachment, string>;

  constructor() {
    super('MedLinkSyncDB');
    this.version(2).stores({
      outbox: 'id, entityType, status, timestamp',
      messages_cache: 'id, encounterId, createdAt, syncStatus',
      appointments_cache: 'id, scheduledAt, syncStatus, status'
    });
    this.version(3).stores({
      health_profile: 'id',
      prescriptions_cache: 'id, issuedAt',
      encounters_cache: 'id, startedAt',
      doctors_cache: 'id'
    });
    this.version(4).stores({
      attachments_outbox: 'id, status'
    });
  }
}

export const syncDb = new MedLinkSyncDB();
