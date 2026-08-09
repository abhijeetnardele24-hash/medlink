import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../lib/firebase';
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
    let newSocket: Socket | null = null;
    const initSocket = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
          auth: { token },
        });

        newSocket.on('notification', (notification: Notification) => {
          setNotifications(prev => [notification, ...prev]);
        });
      } catch (e) {
        // Ignore token errors
      }
    };

    initSocket();

    return () => {
      if (newSocket) newSocket.disconnect();
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
