import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Mic,
  VideoOff,
  MicOff,
  PhoneOff,
  Play,
  Square,
  UploadCloud,
  Loader2,
  MessageSquare,
  FileText,
  Radio,
  Hand,
  ScreenShare,
  LayoutGrid,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { auth } from '../lib/firebase';
import { ChatBox } from '../components/ChatBox';
import { PrescribeModal } from '../components/PrescribeModal';
import { MeetingControls } from '../components/MeetingControls';
import { DeviceSettingsModal } from '../components/DeviceSettingsModal';
import { NetworkHealthPanel } from '../components/NetworkHealthPanel';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export const Consultation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuth();

  // WebRTC Hook
  const {
    localStream,
    remoteStream,
    isConnected,
    error,
    connectionQuality,
    remoteConnectionQuality,
    networkStats,
    startCall,
    endMeetingReason,
    isAudioMuted,
    isVideoOff,
    isAutoAudioOnly,
    toggleAudio,
    toggleVideo,
    remoteAudioMuted,
    remoteVideoOff,
    audioLevel,

    isScreenSharing,
    remoteScreenSharing,
    startScreenShare,
    stopScreenShare,

    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    selectedCameraId,
    selectedMicId,
    selectedSpeakerId,
    switchCamera,
    switchMicrophone,
    switchAudioOutput,

    muteRemoteParticipant,
    endMeetingForAll,
    pc,
    socket
  } = useWebRTC(id || null);

  // UI States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPrescribeOpen, setIsPrescribeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBlurActive, setIsBlurActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Call timer
  useEffect(() => {
    let timer: any;
    if (isConnected) {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected]);

  // Video track assignments - keep refs always synced to streams
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Re-attach srcObject when toggling video (stream ref may not change)
  const effectiveVideoOff = isVideoOff || isAutoAudioOnly;

  useEffect(() => {
    if (localVideoRef.current && localStream && !effectiveVideoOff) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [effectiveVideoOff, localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      // CRITICAL FIX: Remote WebRTC streams often require an explicit .play()
      // call after attaching to srcObject, otherwise they render as a black screen.
      remoteVideoRef.current.play().catch(e => console.error("Error playing remote video:", e));
    }
  }, [remoteStream]);

  // Listen for meeting end
  useEffect(() => {
    if (endMeetingReason) {
      alert(endMeetingReason);
      navigate('/dashboard');
    }
  }, [endMeetingReason, navigate]);

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex-1 min-h-screen bg-[#0A0A0A] p-8 flex items-center justify-center">
        <div className="bg-neutral-900 border border-red-500/30 text-center p-8 rounded-2xl max-w-md shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <VideoOff size={32} />
          </div>
          <p className="text-xl font-bold text-white mb-2">{error}</p>
          <p className="text-sm text-neutral-400 mb-6">Please check camera and microphone permissions in your browser.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0A0A0A] flex h-screen overflow-hidden select-none">
      <NetworkHealthPanel connectionQuality={connectionQuality} networkStats={networkStats} isConnected={isConnected} />
      {/* Left: Video Area */}
      <div className="relative flex-1 flex flex-col border-r border-white/10">
        {/* Main Video Presentation / Remote Participant */}
        <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center">
        {/* Remote video always mounted so srcObject works */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ display: remoteStream && !remoteVideoOff ? 'block' : 'none' }}
          className="w-full h-full object-cover"
        />
        {/* Placeholder when no remote stream */}
        {(!remoteStream || remoteVideoOff) && (
          <div className="text-white/60 flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-neutral-800/80 border border-white/10 flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-bold text-blue-400">PT</span>
            </div>
            <div className="text-center">
              <p className="font-bold text-2xl text-white mb-1">
                {remoteVideoOff ? 'Patient Camera is Off' : 'Waiting for Patient'}
              </p>
              <p className="text-sm text-white/50">
                {remoteVideoOff ? 'Audio connection active' : "Click 'Ring Patient' to notify them to join."}
              </p>
            </div>
            {!isConnected && (
              <button
                onClick={startCall}
                className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
              >
                Ring Patient (Start Call)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Top Navigation / Status Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            ML
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">MedLink Consultation</h2>
              {isConnected && (
                <span className="bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-0.5 rounded-full text-xs font-mono text-white/80">
                  {formatTimer(callDuration)}
                </span>
              )}
            </div>
            <p className="text-white/60 text-xs flex items-center gap-2 mt-0.5">
              {isConnected ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        connectionQuality === 'good'
                          ? 'bg-emerald-500'
                          : connectionQuality === 'poor'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span>Local: {connectionQuality.toUpperCase()}</span>
                  </div>
                  {remoteConnectionQuality && (
                    <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          remoteConnectionQuality === 'good'
                            ? 'bg-emerald-500'
                            : remoteConnectionQuality === 'poor'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span>Patient: {remoteConnectionQuality.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              ) : (
                'Connecting to secure medical gateway...'
              )}
            </p>
          </div>
        </div>

        {/* Top Badges & Notifications */}
        <div className="pointer-events-auto flex items-center gap-3">
          {connectionQuality === 'audio-only' ? (
            <span style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fcd34d',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Mic size={12} /> AUDIO CONSULTATION
            </span>
          ) : (
            <span style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93c5fd',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Video size={12} /> VIDEO CONSULTATION
            </span>
          )}

          {/* Screen Share Alert */}
          {(isScreenSharing || remoteScreenSharing) && (
            <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/40 text-blue-300 px-4 py-2 rounded-2xl shadow-lg">
              <ScreenShare size={18} className="text-blue-400" />
              <span className="text-xs font-semibold">
                {isScreenSharing ? 'You are sharing your screen' : 'Patient is sharing screen'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Picture-in-Picture / Local Video Tile */}
      <div className="absolute bottom-28 right-8 z-20 w-72 aspect-video bg-neutral-900/90 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl transition-all hover:scale-105 group">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ display: effectiveVideoOff ? 'none' : 'block' }}
          className={`w-full h-full object-cover transform -scale-x-100 ${isBlurActive ? 'filter blur-[3px]' : ''}`}
        />
        {/* Camera-off placeholder overlay */}
        {effectiveVideoOff && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-neutral-800 text-white/50">
            <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-white text-lg">
              DR
            </div>
            <span className="text-xs text-white/50">{isAutoAudioOnly ? 'Auto Disabled' : 'Camera Off'}</span>
          </div>
        )}

        {/* Local Stream Status Badges */}
        <div className="absolute bottom-2 left-3 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
            You (Dr. {profile?.fullName || 'Doctor'})
          </span>
          {isAudioMuted && (
            <span className="p-1 rounded-md bg-red-500/80 text-white">
              <MicOff size={12} />
            </span>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <MeetingControls
          isAudioMuted={isAudioMuted}
          isVideoOff={effectiveVideoOff}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          audioLevel={audioLevel}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
          onToggleSettings={() => setIsSettingsOpen(true)}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onOpenPrescribe={() => setIsPrescribeOpen(true)}
          onEndCall={() => navigate('/dashboard')}
          onEndMeetingForAll={endMeetingForAll}
          isDoctor={true}
        />
      </div>

      {/* In-Call Chat Overlay (if chat opened over video) */}
      {isChatOpen && id && (
        <div className="absolute right-8 top-24 bottom-28 w-96 z-30 animate-in slide-in-from-right duration-200">
          <ChatBox encounterId={id} />
        </div>
      )}
      </div>

      {/* Right Sidebar: Clinical Panel */}
      <div className="w-[380px] bg-[#111111] border-l border-white/10 flex flex-col z-20 shadow-2xl relative">
        <div className="p-5 border-b border-white/10 bg-black/40">
          <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
            <FileText size={18} className="text-teal-500" /> Clinical Panel
          </h3>
          <p className="text-white/50 text-xs">Patient notes & prescriptions</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Action Cards */}
          <div className="space-y-3">
            <button 
              onClick={() => setIsPrescribeOpen(true)}
              className="w-full p-4 bg-brand-500/10 hover:bg-brand-500/20 border border-teal-500/30 rounded-xl flex items-start gap-3 transition-colors text-left"
            >
              <div className="p-2 bg-brand-500/20 text-teal-400 rounded-lg">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-teal-400 font-bold text-sm">Issue Prescription</h4>
                <p className="text-white/60 text-xs mt-0.5">Write Rx, diagnosis & notes</p>
              </div>
            </button>
            
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="w-full p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-start gap-3 transition-colors text-left"
            >
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <MessageSquare size={20} />
              </div>
              <div>
                <h4 className="text-blue-400 font-bold text-sm">Patient Chat</h4>
                <p className="text-white/60 text-xs mt-0.5">Share links or text</p>
              </div>
            </button>
          </div>
          
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <h4 className="text-white/80 font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" /> Encounter Notes
            </h4>
            <p className="text-white/50 text-xs leading-relaxed">
              Use the Prescription form to finalize your clinical notes and ICD-10 diagnosis. These will be automatically synced to the patient's medical history.
            </p>
          </div>
        </div>
      </div>

      {/* Device & Hardware Settings Modal */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioInputDevices={audioInputDevices}
        videoInputDevices={videoInputDevices}
        audioOutputDevices={audioOutputDevices}
        selectedCameraId={selectedCameraId}
        selectedMicId={selectedMicId}
        selectedSpeakerId={selectedSpeakerId}
        onSwitchCamera={switchCamera}
        onSwitchMicrophone={switchMicrophone}
        onSwitchAudioOutput={switchAudioOutput}
        audioLevel={audioLevel}
        isBlurActive={isBlurActive}
        onToggleBlur={() => setIsBlurActive(!isBlurActive)}
      />

      {/* Prescribe Modal */}
      {isPrescribeOpen && id && profile?.id && (
        <PrescribeModal
          encounterId={id}
          doctorId={profile.id}
          onClose={() => setIsPrescribeOpen(false)}
          onSuccess={() => {
            setIsPrescribeOpen(false);
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
};
