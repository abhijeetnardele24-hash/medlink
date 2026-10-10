import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadataJson?: any;
}

export let sharedNotificationSocket: Socket | null = null;
let socketSubscribers = 0;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
      } catch (error: any) {
        if (error?.response?.status !== 401 && error?.response?.status !== 403) {
          console.error('Failed to fetch notifications', error);
        }
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  useEffect(() => {
    if (!user) return;
    
    socketSubscribers++;

    if (!sharedNotificationSocket) {
      user.getIdToken().then(token => {
        if (!sharedNotificationSocket) {
          sharedNotificationSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
            auth: { token },
          });
        }
        
        sharedNotificationSocket.on('notification', (notification: Notification) => {
          setNotifications(prev => [notification, ...prev]);
        });
      });
    } else {
      // If already created by another subscriber, just add listener
      sharedNotificationSocket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
      });
    }

    return () => {
      socketSubscribers--;
      if (sharedNotificationSocket) {
        sharedNotificationSocket.off('notification');
        if (socketSubscribers <= 0) {
          sharedNotificationSocket.disconnect();
          sharedNotificationSocket = null;
        }
      }
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  return { notifications, unreadCount, markAsRead };
};
