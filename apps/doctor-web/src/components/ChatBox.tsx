import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { api } from '../lib/api';
import { socketRef } from '../hooks/useWebRTC';
import { auth } from '../lib/firebase';
import { useLiveQuery } from 'dexie-react-hooks';
import { syncDb } from '../lib/sync/SyncDB';
import { syncManager } from '../lib/sync/SyncManager';

export interface Message {
  id: string;
  senderId: string;
  body: string;
  isSystemEvent: boolean;
  createdAt: string;
}

export const ChatBox: React.FC<{ encounterId: string }> = ({ encounterId }) => {
  const [newMessage, setNewMessage] = useState('');
  const [remoteTyping, setRemoteTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const currentUserId = auth?.currentUser?.uid || 'test-id';

  // Reactively query local Dexie DB for messages for this encounter
  const messages = useLiveQuery(
    () => syncDb.messages_cache.where({ encounterId }).sortBy('createdAt'),
    [encounterId],
    []
  );

  useEffect(() => {
    // 1. Initial pull (either via REST or sync loop)
    syncManager.sync([encounterId]).catch(console.error);
    
    // 2. Also fetch directly to populate cache for backward compatibility / initial load
    api.get(`/encounters/${encounterId}/messages`).then(async (res) => {
      const serverMsgs = res.data.messages.map((m: any) => ({
        id: m.id,
        encounterId: m.encounterId,
        senderId: m.senderId,
        body: m.body,
        createdAt: new Date(m.createdAt).getTime(),
        syncStatus: 'synced',
        isSystemEvent: m.isSystemEvent
      }));
      await syncDb.messages_cache.bulkPut(serverMsgs);
    }).catch(console.error);
  }, [encounterId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleMessage = async ({ message }: { message: Message }) => {
      // Put incoming socket message into local cache
      await syncDb.messages_cache.put({
        id: message.id,
        encounterId: encounterId,
        senderId: message.senderId,
        body: message.body,
        createdAt: new Date(message.createdAt).getTime(),
        syncStatus: 'synced'
      });
      setRemoteTyping(false); 
    };

    const handleTyping = ({ isTyping, senderId }: { isTyping: boolean, senderId: string }) => {
      if (senderId !== currentUserId) {
        setRemoteTyping(isTyping);
      }
    };

    socket.on('message', handleMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('message', handleMessage);
      socket.off('typing', handleTyping);
    };
  }, [currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, remoteTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const body = newMessage;
    setNewMessage('');
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('typing', { encounterId, isTyping: false, senderId: currentUserId });

    try {
      // Offline-first sync enqueue
      await syncManager.enqueueMessage(encounterId, currentUserId, body);
      // We don't manually emit 'message' over socket here because the sync loop 
      // is handling it (and backend handles broadcasting if we wanted to), 
      // but for V1 we can still attempt an optimistic emit if online:
      if (navigator.onLine) {
        socketRef.current?.emit('message', { 
          encounterId, 
          message: { id: crypto.randomUUID(), senderId: currentUserId, body, createdAt: new Date().toISOString() } 
        });
      }
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    socketRef.current?.emit('typing', { encounterId, isTyping: true, senderId: currentUserId });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { encounterId, isTyping: false, senderId: currentUserId });
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111827', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Chat</h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg: any) => {
          const isMe = msg.senderId === currentUserId;
          const isPending = msg.syncStatus === 'pending_push';

          if (msg.isSystemEvent) {
            return (
              <div key={msg.id} style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic', margin: '0.5rem 0' }}>
                {msg.body}
              </div>
            );
          }
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                maxWidth: '75%', 
                padding: '0.75rem 1rem', 
                borderRadius: '1rem',
                borderBottomRightRadius: isMe ? 0 : '1rem',
                borderBottomLeftRadius: !isMe ? 0 : '1rem',
                background: isMe ? '#423FDE' : '#374151',
                color: 'white',
                fontSize: '0.95rem',
                lineHeight: 1.4,
                opacity: isPending ? 0.7 : 1
              }}>
                {msg.body}
              </div>
            </div>
          );
        })}
        {remoteTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#374151', padding: '0.5rem 1rem', borderRadius: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          style={{ flex: 1, background: '#1f2937', border: '1px solid #374151', borderRadius: '999px', padding: '0.75rem 1.25rem', color: 'white', outline: 'none' }}
        />
        <button type="submit" disabled={!newMessage.trim()} style={{ width: 48, height: 48, borderRadius: '50%', background: newMessage.trim() ? '#423FDE' : '#374151', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: newMessage.trim() ? 'pointer' : 'default' }}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
