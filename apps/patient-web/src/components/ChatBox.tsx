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

const CHAT_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏'];

export const ChatBox: React.FC<{ encounterId: string }> = ({ encounterId }) => {
  const [newMessage, setNewMessage] = useState('');
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [reactionsMap, setReactionsMap] = useState<Record<string, Record<string, number>>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = auth?.currentUser?.uid || 'test-id';

  const messages = useLiveQuery(
    () => syncDb.messages_cache.where({ encounterId }).sortBy('createdAt'),
    [encounterId],
    []
  );

  useEffect(() => {
    syncManager.sync([encounterId]).catch(console.error);

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

    const handleTyping = ({ isTyping, senderId }: { isTyping: boolean; senderId: string }) => {
      if (senderId !== currentUserId) {
        setRemoteTyping(isTyping);
      }
    };

    const handleMessageReaction = ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      setReactionsMap((prev) => {
        const msgReactions = prev[messageId] || {};
        return {
          ...prev,
          [messageId]: {
            ...msgReactions,
            [emoji]: (msgReactions[emoji] || 0) + 1
          }
        };
      });
    };

    socket.on('message', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('message-reaction', handleMessageReaction);

    return () => {
      socket.off('message', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('message-reaction', handleMessageReaction);
    };
  }, [currentUserId, encounterId]);

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
      await syncManager.enqueueMessage(encounterId, currentUserId, body);
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

  const handleReactToMessage = (messageId: string, emoji: string) => {
    setReactionsMap((prev) => {
      const msgReactions = prev[messageId] || {};
      return {
        ...prev,
        [messageId]: {
          ...msgReactions,
          [emoji]: (msgReactions[emoji] || 0) + 1
        }
      };
    });

    socketRef.current?.emit('message-reaction', {
      encounterId,
      messageId,
      emoji,
      userId: currentUserId
    });
    setHoveredMsgId(null);
  };

  const formatMessageTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(24,24,27,0.92)', backdropFilter: 'blur(20px)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}>In-Meeting Chat</h3>
          <p style={{ margin: 0, fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>Direct encrypted messages</p>
        </div>
      </div>

      {/* Message List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((msg: any) => {
          const isMe = msg.senderId === currentUserId;
          const msgReactions = reactionsMap[msg.id] || {};

          if (msg.isSystemEvent) {
            return (
              <div key={msg.id} style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', fontStyle: 'italic', margin: '0.25rem 0', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '999px', alignSelf: 'center' }}>
                {msg.body}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              <div style={{
                maxWidth: '85%',
                padding: '0.625rem 1rem',
                borderRadius: '1rem',
                borderBottomRightRadius: isMe ? 0 : '1rem',
                borderBottomLeftRadius: !isMe ? 0 : '1rem',
                background: isMe ? '#423FDE' : 'rgba(255,255,255,0.08)',
                color: 'white',
                fontSize: '0.875rem',
                lineHeight: 1.4,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}>
                <p style={{ margin: 0 }}>{msg.body}</p>
                <span style={{ fontSize: '0.625rem', display: 'block', textAlign: 'right', marginTop: '0.25rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}>
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>

              {/* Reaction Badges */}
              {Object.keys(msgReactions).length > 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                  {Object.entries(msgReactions).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      style={{
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'white'
                      }}
                    >
                      <span>{emoji}</span>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{count}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Reaction Picker on Hover */}
              {hoveredMsgId === msg.id && (
                <div style={{
                  position: 'absolute',
                  top: '-1.75rem',
                  right: isMe ? 0 : 'auto',
                  left: !isMe ? 0 : 'auto',
                  background: '#18181B',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '999px',
                  padding: '0.25rem 0.5rem',
                  display: 'flex',
                  gap: '0.25rem',
                  zIndex: 20,
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                }}>
                  {CHAT_REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReactToMessage(msg.id, emoji)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', padding: '0.125rem' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {remoteTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic', background: 'rgba(255,255,255,0.05)', padding: '0.375rem 0.75rem', borderRadius: '1rem', width: 'fit-content' }}>
            <span>Doctor is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Send a message..."
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '0.625rem 1rem', color: 'white', fontSize: '0.875rem', outline: 'none' }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            background: newMessage.trim() ? '#423FDE' : 'rgba(255,255,255,0.05)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: newMessage.trim() ? 'pointer' : 'default'
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
