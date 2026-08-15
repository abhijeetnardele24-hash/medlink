import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-neutral-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden font-['Inter',sans-serif]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-base font-['Manrope']">In-Meeting Messages</h3>
          <p className="text-[11px] text-white/50">Messages are synced securely</p>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg: any) => {
          const isMe = msg.senderId === currentUserId;
          const msgReactions = reactionsMap[msg.id] || {};

          if (msg.isSystemEvent) {
            return (
              <div key={msg.id} className="text-center text-xs text-neutral-400 italic my-2 bg-white/5 py-1 px-3 rounded-full mx-auto max-w-xs border border-white/5">
                {msg.body}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-600/20'
                    : 'bg-neutral-800 text-neutral-100 rounded-bl-none border border-white/5'
                }`}
              >
                <p>{msg.body}</p>
                <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-blue-200' : 'text-neutral-400'}`}>
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>

              {/* Emoji Reactions List on Message */}
              {Object.keys(msgReactions).length > 0 && (
                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {Object.entries(msgReactions).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      className="bg-black/60 border border-white/10 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-white shadow-sm"
                    >
                      <span>{emoji}</span>
                      <span className="text-[10px] font-bold text-white/70">{count}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Hover Reaction Picker Button */}
              {hoveredMsgId === msg.id && (
                <div className={`absolute -top-7 ${isMe ? 'right-0' : 'left-0'} bg-neutral-900 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1 shadow-2xl z-20 animate-in fade-in zoom-in-90 duration-150`}>
                  {CHAT_REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReactToMessage(msg.id, emoji)}
                      className="hover:scale-125 transition-transform text-sm p-0.5"
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
          <div className="flex items-center gap-2 text-xs text-neutral-400 italic bg-neutral-800/80 px-3 py-1.5 rounded-2xl w-fit border border-white/5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            <span>Participant is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Send a message to everyone..."
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            newMessage.trim()
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
