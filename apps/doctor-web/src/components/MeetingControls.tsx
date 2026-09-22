import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Settings,
  MessageSquare,
  FileText,
  PhoneOff,
  MoreVertical
} from 'lucide-react';

interface MeetingControlsProps {
  // Audio/Video
  isAudioMuted: boolean;
  isVideoOff: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  audioLevel: number;

  // Screen Share
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;

  // Settings & Chat & Modals
  onToggleSettings: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onOpenPrescribe?: () => void;
  onEndCall: () => void;
  onEndMeetingForAll?: () => void;
  isDoctor?: boolean;
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
  onOpenPrescribe,
  onEndCall,
  onEndMeetingForAll,
  isDoctor = false
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEndOptions, setShowEndOptions] = useState(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex items-center justify-center pointer-events-auto">

      {/* Doctor End Options Modal Popup */}
      {showEndOptions && (
        <div className="absolute bottom-20 bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[200px] animate-in fade-in slide-in-from-bottom-3 duration-200 z-50">
          <button
            onClick={() => {
              setShowEndOptions(false);
              onEndCall();
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/10 text-white text-sm font-medium transition-colors"
          >
            Leave Consultation
          </button>
          {isDoctor && onEndMeetingForAll && (
            <button
              onClick={() => {
                setShowEndOptions(false);
                onEndMeetingForAll();
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold transition-colors flex items-center justify-between"
            >
              <span>End for Everyone</span>
              <span className="text-[10px] bg-red-500/30 px-1.5 py-0.5 rounded">All</span>
            </button>
          )}
        </div>
      )}

      {/* Main Bottom Floating Dock */}
      <div className="bg-neutral-900/80 backdrop-blur-2xl border border-white/10 px-6 py-3.5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-3">
        {/* 1. Microphone Toggle */}
        <div className="relative">
          <button
            onClick={onToggleAudio}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isAudioMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
            }`}
          >
            {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          {!isAudioMuted && audioLevel > 15 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          )}
        </div>

        {/* 2. Video Toggle */}
        <button
          onClick={onToggleVideo}
          title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isVideoOff
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
          }`}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* 3. Screen Share */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen (Google Meet / Zoom)'}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isScreenSharing
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
          }`}
        >
          <ScreenShare size={20} />
        </button>
        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* 8. Hardware Device Settings */}
        <button
          onClick={onToggleSettings}
          title="Audio & Video Settings"
          className="w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/5 flex items-center justify-center transition-all"
        >
          <Settings size={20} />
        </button>

        {/* 9. In-Call Chat */}
        <button
          onClick={onToggleChat}
          title="In-call Chat"
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isChatOpen
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
          }`}
        >
          <MessageSquare size={20} />
        </button>

        {/* 11. Issue Prescription (Doctor Only) */}
        {isDoctor && onOpenPrescribe && (
          <button
            onClick={onOpenPrescribe}
            title="Issue Clinical Prescription"
            className="h-12 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all border border-blue-400"
          >
            <FileText size={18} />
            <span>Prescribe</span>
          </button>
        )}

        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* 11. End Call Button (Google Meet / Zoom style) */}
        <button
          onClick={() => {
            if (isDoctor) {
              setShowEndOptions(!showEndOptions);
            } else {
              onEndCall();
            }
          }}
          title={isDoctor ? 'End Call Options' : 'Leave Call'}
          className="h-12 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-600/40 transition-all active:scale-95"
        >
          <PhoneOff size={20} />
          <span className="text-xs">{isDoctor ? 'End Call' : 'Leave'}</span>
        </button>
      </div>
    </div>
  );
};
