import { useState, useEffect } from 'react';
import { sharedNotificationSocket } from './useNotifications';

export const useDashboardNetwork = () => {
  const [networkStates, setNetworkStates] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleNetworkStatus = (data: { encounterId: string; mode: string }) => {
      setNetworkStates(prev => ({ ...prev, [data.encounterId]: data.mode }));
    };

    if (sharedNotificationSocket) {
      sharedNotificationSocket.on('patient-network-status', handleNetworkStatus);
    } else {
      // In case it's not initialized immediately, we could poll or wait
      let attempts = 0;
      const interval = setInterval(() => {
        if (sharedNotificationSocket) {
          sharedNotificationSocket.on('patient-network-status', handleNetworkStatus);
          clearInterval(interval);
        } else if (attempts > 10) {
          clearInterval(interval);
        }
        attempts++;
      }, 500);
    }

    return () => {
      if (sharedNotificationSocket) {
        sharedNotificationSocket.off('patient-network-status', handleNetworkStatus);
      }
    };
  }, []);

  return { networkStates };
};
