import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Check, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  taskType: string;
  dueAt: string;
  outcome: string;
  doctor: {
    fullName: string;
  };
}

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await api.get('/admin/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleComplete = async (taskId: string) => {
    try {
      await api.patch(`/admin/tasks/${taskId}`, { outcome: 'reached', coordinatorNote: 'Handled via Dashboard' });
      fetchTasks(true);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingTasks = tasks.filter(t => t.outcome === 'pending' || t.outcome === 'attempted');
  const completedTasks = tasks.filter(t => t.outcome !== 'pending' && t.outcome !== 'attempted');

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Task Queue</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>Manage follow-ups, reminders, and confirmations.</p>
        </div>
        
        <button onClick={() => fetchTasks(true)} className="btn btn-secondary" disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? "spinner" : ""} style={refreshing ? { border: 'none', animation: 'spin 1s linear infinite'} : {}} />
        </button>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#eab308' }}>Action Required ({pendingTasks.length})</h2>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner"></div></div>
      ) : pendingTasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem' }}>
          <Check size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <p>You're all caught up on tasks.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
          {pendingTasks.map(task => (
            <div key={task.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #eab308' }}>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '1.125rem', margin: '0 0 0.25rem 0' }}>{task.taskType.replace(/_/g, ' ').toUpperCase()}</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Due: {new Date(task.dueAt).toLocaleString()}</p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Doctor: <strong>Dr. {task.doctor?.fullName}</strong>
                </div>
              </div>
              <button onClick={() => handleComplete(task.id)} className="btn btn-primary" style={{ background: '#10b981', color: 'black' }}>
                <Check size={16} style={{ marginRight: '0.5rem' }}/> Mark Resolved
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Recently Resolved</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {completedTasks.slice(0, 5).map(task => (
          <div key={task.id} className="glass-panel" style={{ padding: '1rem 1.5rem', opacity: 0.7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>{task.taskType.replace(/_/g, ' ').toUpperCase()}</span>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{task.outcome}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
