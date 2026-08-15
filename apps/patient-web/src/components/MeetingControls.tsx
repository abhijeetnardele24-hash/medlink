import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  StopCircle,
  Edit3,
  Smile,
  Hand,
  Settings,
  MessageSquare,
  PhoneOff,
  Pause,
  Play,
  Maximize
} from 'lucide-react';

interface MeetingControlsProps {
  isAudioMuted: boolean;
  isVideoOff: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  audioLevel: number;

  isScreenSharing: boolean;
  onToggleScreenShare: () => void;

  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;

  isHandRaised: boolean;
  onToggleRaiseHand: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleWhiteboard: () => void;
  isWhiteboardOpen: boolean;

  onToggleSettings: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onEndCall: () => void;
  onToggleFullscreen?: () => void;
}

const EMOJIS = ['👍', '❤️', '👏', '🎉', '💡', '😂', '🔥', '🙏'];

export const MeetingControls: React.FC<MeetingControlsProps> = ({
  isAudioMuted,
  isVideoOff,
  onToggleAudio,
  onToggleVideo,
  audioLevel,
  isScreenSharing,
  onToggleScreenShare,
  isRecording,
  isPaused,
  recordingDuration,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  isHandRaised,
  onToggleRaiseHand,
  onSendReaction,
  onToggleWhiteboard,
  isWhiteboardOpen,
  onToggleSettings,
  isChatOpen,
  onToggleChat,
  onEndCall,
  onToggleFullscreen
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
      {/* Floating Emoji Picker */}
      {showEmojiPicker && (
        <div style={{
          position: 'absolute',
          bottom: '5rem',
          background: 'rgba(24,24,27,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '0.75rem',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 50
        }}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSendReaction(emoji);
                setShowEmojiPicker(false);
              }}
              style={{
                fontSize: '1.5rem',
                padding: '0.375rem',
                borderRadius: '0.75rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Bottom Floating Dock */}
      <div style={{
        background: 'rgba(24,24,27,0.8)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '0.75rem 1.5rem',
        borderRadius: '2rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        {/* 1. Microphone Toggle */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={onToggleAudio}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isAudioMuted ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.05)',
              background: isAudioMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
              color: isAudioMuted ? '#f87171' : 'white',
              cursor: 'pointer'
            }}
          >
            {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          {!isAudioMuted && audioLevel > 15 && (
            <span style={{
              position: 'absolute',
              top: '-0.25rem',
              right: '-0.25rem',
              width: '0.75rem',
              height: '0.75rem',
              background: '#10b981',
              borderRadius: '50%'
            }} />
          )}
        </div>

        {/* 2. Video Toggle */}
        <button
          onClick={onToggleVideo}
          title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isVideoOff ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.05)',
            background: isVideoOff ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
            color: isVideoOff ? '#f87171' : 'white',
            cursor: 'pointer'
          }}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <div style={{ width: 1, height: '2rem', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />

        {/* 3. Screen Share */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isScreenSharing ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
            background: isScreenSharing ? '#423FDE' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <ScreenShare size={20} />
        </button>

        {/* 4. Whiteboard */}
        <button
          onClick={onToggleWhiteboard}
          title="Open Collaborative Whiteboard"
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isWhiteboardOpen ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.05)',
            background: isWhiteboardOpen ? '#9333ea' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <Edit3 size={20} />
        </button>

        {/* 5. Reactions */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Send Emoji Reaction"
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <Smile size={20} />
        </button>

        {/* 6. Raise Hand */}
        <button
          onClick={onToggleRaiseHand}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: isHandRaised ? '#f59e0b' : 'rgba(255,255,255,0.1)',
            color: isHandRaised ? 'black' : 'white',
            fontWeight: isHandRaised ? 700 : 400,
            cursor: 'pointer'
          }}
        >
          <Hand size={20} />
        </button>

        <div style={{ width: 1, height: '2rem', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />

        {/* 7. Local Recording */}
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            title="Start Recording (Saved to your device)"
            style={{
              height: '3rem',
              padding: '0 1rem',
              borderRadius: '1rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Record</span>
          </button>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.3)',
            padding: '0.375rem 0.75rem',
            borderRadius: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
              <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#f87171' }}>
                {formatTime(recordingDuration)}
              </span>
            </div>

            {isPaused ? (
              <button
                onClick={onResumeRecording}
                style={{ padding: '0.375rem', borderRadius: '0.5rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <Play size={15} />
              </button>
            ) : (
              <button
                onClick={onPauseRecording}
                style={{ padding: '0.375rem', borderRadius: '0.5rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <Pause size={15} />
              </button>
            )}

            <button
              onClick={onStopRecording}
              style={{ padding: '0.375rem', borderRadius: '0.5rem', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <StopCircle size={16} />
            </button>
          </div>
        )}

        {/* 8. Settings */}
        <button
          onClick={onToggleSettings}
          title="Settings"
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <Settings size={20} />
        </button>

        {/* 9. Chat */}
        <button
          onClick={onToggleChat}
          title="Chat"
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.05)',
            background: isChatOpen ? '#423FDE' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={20} />
        </button>

        <div style={{ width: 1, height: '2rem', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />

        {/* 10. Leave Call */}
        <button
          onClick={onEndCall}
          title="Leave Call"
          style={{
            height: '3rem',
            padding: '0 1.25rem',
            borderRadius: '1rem',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(220,38,38,0.4)'
          }}
        >
          <PhoneOff size={20} />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
};
