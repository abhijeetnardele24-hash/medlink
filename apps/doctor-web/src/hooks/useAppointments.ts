import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import type { Appointment } from '../types';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [apptRes, msgRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/doctors/me/messages/unread')
      ]);
      if (apptRes.data) {
        setAppointments(apptRes.data.data || []);
      }
      if (msgRes.data) {
        setUnreadMessages(msgRes.data.data || []);
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    fetchAppointments(); 
  }, [fetchAppointments]);

  const handleAction = async (id: string, action: string, version: number) => {
    try {
      await api.patch(`/appointments/${id}`, { action, version });
      toast.success(`Request ${action}ed successfully.`);
      fetchAppointments(true);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} appointment.`);
      setError('Failed to update appointment.');
    }
  };

  return {
    appointments,
    unreadMessages,
    loading,
    refreshing,
    error,
    fetchAppointments,
    handleAction
  };
};
