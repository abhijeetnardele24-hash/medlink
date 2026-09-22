import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Settings,
  MessageSquare,
  PhoneOff,
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
