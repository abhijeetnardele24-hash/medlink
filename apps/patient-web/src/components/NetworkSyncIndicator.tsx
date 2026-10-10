import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { syncDb } from '../lib/sync/SyncDB';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export const NetworkSyncIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const pendingCount = useLiveQuery(() => syncDb.outbox.count(), []) || 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', fontWeight: 500, marginRight: '1rem' }}>
      {isOnline ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981' }}>
          <Wifi size={16} /> Online
        </span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444' }}>
          <WifiOff size={16} /> Offline
        </span>
      )}
      {!isOnline ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b' }}>
          Waiting to sync
        </span>
      ) : pendingCount > 0 ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b' }}>
          <RefreshCw size={16} className="animate-spin" /> Syncing... {pendingCount} {pendingCount === 1 ? 'item' : 'items'} pending
        </span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981' }}>
          <CheckCircle2 size={16} /> Synced
        </span>
      )}
    </div>
  );
};
