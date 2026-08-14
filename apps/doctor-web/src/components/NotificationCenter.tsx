import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          transition: 'color 0.2s',
          borderRadius: '50%'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent)'}
        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 6px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            lineHeight: 1,
            color: 'white',
            background: 'var(--danger)',
            borderRadius: '9999px',
            transform: 'translate(25%, -25%)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: '0.5rem',
          width: '320px',
          background: 'var(--bg-surface-elevated)',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column'
        }} className="fade-in">
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Notifications</h3>
          </div>
          
          <div style={{
            maxHeight: '350px',
            overflowY: 'auto'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--text-muted)'
              }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border)',
                    background: notification.isRead ? 'transparent' : 'rgba(66, 63, 222, 0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (notification.isRead) {
                      e.currentTarget.style.background = 'var(--bg-surface)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (notification.isRead) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.9rem', 
                      fontWeight: notification.isRead ? 600 : 700,
                      color: 'var(--text-main)' 
                    }}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span style={{
                        height: '8px',
                        width: '8px',
                        background: 'var(--accent)',
                        borderRadius: '50%',
                        marginTop: '6px',
                        flexShrink: 0
                      }}></span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {notification.message}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
