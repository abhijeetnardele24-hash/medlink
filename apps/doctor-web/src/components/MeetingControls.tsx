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
  Radio,
  Settings,
  MessageSquare,
  FileText,
  PhoneOff,
  Pause,
  Play,
  Download,
  Sparkles,
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

  // Recording
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  hasRecordingReady?: boolean;
  onUploadCloud?: () => void;
  isUploadingCloud?: boolean;

  // Interactive Tools
  isHandRaised: boolean;
  onToggleRaiseHand: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleWhiteboard: () => void;
  isWhiteboardOpen: boolean;

  // Settings & Chat & Modals
  onToggleSettings: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onOpenPrescribe?: () => void;
  onToggleAIScribe?: () => void;
  isAIScribeOpen?: boolean;
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
  isRecording,
  isPaused,
  recordingDuration,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  hasRecordingReady,
  onUploadCloud,
  isUploadingCloud,
  isHandRaised,
  onToggleRaiseHand,
  onSendReaction,
  onToggleWhiteboard,
  isWhiteboardOpen,
  onToggleSettings,
  isChatOpen,
  onToggleChat,
  onOpenPrescribe,
  onToggleAIScribe,
  isAIScribeOpen,
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
      {/* Floating Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 z-50">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSendReaction(emoji);
                setShowEmojiPicker(false);
              }}
              className="text-2xl hover:scale-130 active:scale-95 transition-transform p-1.5 rounded-xl hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

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

        {/* 4. Whiteboard */}
        <button
          onClick={onToggleWhiteboard}
          title="Open Collaborative Whiteboard"
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isWhiteboardOpen
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
          }`}
        >
          <Edit3 size={20} />
        </button>

        {/* 5. Reactions */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Send Emoji Reaction"
          className="w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/5 flex items-center justify-center transition-all"
        >
          <Smile size={20} />
        </button>

        {/* 6. Raise Hand */}
        <button
          onClick={onToggleRaiseHand}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isHandRaised
              ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
          }`}
        >
          <Hand size={20} />
        </button>

        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* 7. Recording Controls (Local Instant Download + Cloud) */}
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            title="Start Meeting Recording (Auto-saves to your local computer)"
            className="h-12 px-4 rounded-2xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white border border-white/5 flex items-center gap-2 transition-all group"
          >
            <div className="w-3 h-3 rounded-full bg-red-500 group-hover:animate-ping" />
            <span className="text-xs font-semibold">Record</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-2xl">
            <div className="flex items-center gap-2 mr-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-red-400">
                {formatTime(recordingDuration)}
              </span>
            </div>

            {isPaused ? (
              <button
                onClick={onResumeRecording}
                title="Resume Recording"
                className="p-1.5 rounded-xl hover:bg-white/10 text-white"
              >
                <Play size={15} />
              </button>
            ) : (
              <button
                onClick={onPauseRecording}
                title="Pause Recording"
                className="p-1.5 rounded-xl hover:bg-white/10 text-white"
              >
                <Pause size={15} />
              </button>
            )}

            <button
              onClick={onStopRecording}
              title="Stop & Save to Local Computer"
              className="p-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
            >
              <StopCircle size={16} />
            </button>
          </div>
        )}

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

        {/* 10. AI Clinical Scribe (Doctor Only) */}
        {isDoctor && onToggleAIScribe && (
          <button
            onClick={onToggleAIScribe}
            title="Open Ambient AI Clinical Scribe (Nuance DAX / Abridge Copilot)"
            className={`h-12 px-4 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all border ${
              isAIScribeOpen
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border-purple-400'
                : 'bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border-purple-500/30'
            }`}
          >
            <Sparkles size={18} className="text-purple-300 animate-pulse" />
            <span>AI Scribe</span>
          </button>
        )}

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
