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
  Sparkles,
  LayoutGrid,
  Maximize2
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { auth } from '../lib/firebase';
import { ChatBox } from '../components/ChatBox';
import { PrescribeModal } from '../components/PrescribeModal';
import { AIScribeModal } from '../components/AIScribeModal';
import { MeetingControls } from '../components/MeetingControls';
import { WhiteboardModal } from '../components/WhiteboardModal';
import { DeviceSettingsModal } from '../components/DeviceSettingsModal';
import { FloatingReactions } from '../components/FloatingReactions';
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
    startCall,
    endMeetingReason,

    isAudioMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    remoteAudioMuted,
    remoteVideoOff,
    audioLevel,

    isScreenSharing,
    remoteScreenSharing,
    startScreenShare,
    stopScreenShare,

    isRecording,
    isPaused,
    recordingDuration,
    recordingBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,

    isHandRaised,
    remoteHandRaised,
    toggleRaiseHand,
    reactions,
    sendReaction,
    whiteboardStrokes,
    sendWhiteboardStroke,
    clearWhiteboard,

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
    endMeetingForAll
  } = useWebRTC(id || null);

  // UI States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPrescribeOpen, setIsPrescribeOpen] = useState(false);
  const [isAIScribeOpen, setIsAIScribeOpen] = useState(false);
  const [autoFilledMedicines, setAutoFilledMedicines] = useState<any[]>([]);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBlurActive, setIsBlurActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  // Video track assignments
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
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

  // Cloud upload recording
  const handleUploadCloudRecording = async () => {
    if (!recordingBlob || !id) return;
    setIsUploading(true);

    try {
      const token = await auth?.currentUser?.getIdToken();
      const formData = new FormData();
      formData.append('recording', recordingBlob, `recording_${id}.webm`);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/encounters/${id}/recording`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      alert('Recording securely stored in Cloud Storage!');
    } catch (err) {
      console.error(err);
      alert('Failed to upload recording to cloud.');
    } finally {
      setIsUploading(false);
    }
  };

  if (error) {
    return (
      <div className="flex-1 min-h-screen bg-[#0A0A0A] p-8 flex items-center justify-center">
        <div className="bg-neutral-900 border border-red-500/30 text-center p-8 rounded-3xl max-w-md shadow-2xl">
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
    <div className="flex-1 bg-[#0A0A0A] relative flex flex-col h-screen overflow-hidden select-none font-['Inter',sans-serif]">
      {/* Floating Reactions Layer */}
      <FloatingReactions reactions={reactions} />

      {/* Main Video Presentation / Remote Participant */}
      <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center">
        {remoteStream && !remoteVideoOff ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/60 flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-neutral-800/80 border border-white/10 flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-bold text-blue-400 font-['Manrope']">PT</span>
            </div>
            <div className="text-center">
              <p className="font-bold text-2xl text-white mb-1 font-['Manrope']">
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
              <h2 className="text-lg font-bold text-white font-['Manrope']">MedLink Consultation</h2>
              {isConnected && (
                <span className="bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-0.5 rounded-full text-xs font-mono text-white/80">
                  {formatTimer(callDuration)}
                </span>
              )}
            </div>
            <p className="text-white/60 text-xs flex items-center gap-2 mt-0.5">
              {isConnected ? (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connectionQuality === 'good'
                        ? 'bg-emerald-500'
                        : connectionQuality === 'poor'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <span>E2E Encrypted ({connectionQuality.toUpperCase()})</span>
                </>
              ) : (
                'Connecting to secure medical gateway...'
              )}
            </p>
          </div>
        </div>

        {/* Top Badges & Notifications */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Hand Raise Alert */}
          {remoteHandRaised && (
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-2xl animate-bounce shadow-lg">
              <Hand size={18} className="text-amber-400" />
              <span className="text-xs font-bold">Patient raised hand</span>
            </div>
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

          {/* Recording Badge */}
          {isRecording && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-2 rounded-2xl font-bold animate-pulse shadow-lg">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span className="text-xs font-mono">REC {formatTimer(recordingDuration)}</span>
            </div>
          )}

          {/* Cloud Upload Action */}
          {recordingBlob && !isRecording && (
            <button
              onClick={handleUploadCloudRecording}
              disabled={isUploading}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              <span>{isUploading ? 'Uploading Cloud Backup...' : 'Save to Cloud'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Picture-in-Picture / Local Video Tile */}
      <div className="absolute bottom-28 right-8 z-20 w-72 aspect-video bg-neutral-900/90 backdrop-blur-md rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl transition-all hover:scale-105 group">
        {localStream && !isVideoOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${
              isBlurActive ? 'filter blur-[3px]' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-neutral-800 text-white/50">
            <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-white text-lg font-['Manrope']">
              DR
            </div>
            <span className="text-xs text-white/50">Camera Off</span>
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

      {/* Meeting Controls Floating Dock */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <MeetingControls
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          audioLevel={audioLevel}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
          isRecording={isRecording}
          isPaused={isPaused}
          recordingDuration={recordingDuration}
          onStartRecording={startRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onStopRecording={stopRecording}
          hasRecordingReady={Boolean(recordingBlob)}
          onUploadCloud={handleUploadCloudRecording}
          isUploadingCloud={isUploading}
          isHandRaised={isHandRaised}
          onToggleRaiseHand={toggleRaiseHand}
          onSendReaction={sendReaction}
          onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
          isWhiteboardOpen={isWhiteboardOpen}
          onToggleSettings={() => setIsSettingsOpen(true)}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onOpenPrescribe={() => setIsPrescribeOpen(true)}
          onToggleAIScribe={() => setIsAIScribeOpen(!isAIScribeOpen)}
          isAIScribeOpen={isAIScribeOpen}
          onEndCall={() => navigate('/dashboard')}
          onEndMeetingForAll={endMeetingForAll}
          isDoctor={true}
        />
      </div>

      {/* In-Call Chat Sidebar */}
      {isChatOpen && id && (
        <div className="absolute right-8 top-24 bottom-28 w-96 z-30 animate-in slide-in-from-right duration-200">
          <ChatBox encounterId={id} />
        </div>
      )}

      {/* Collaborative Whiteboard Modal */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        strokes={whiteboardStrokes}
        onSendStroke={sendWhiteboardStroke}
        onClear={clearWhiteboard}
      />

      {/* Ambient AI Clinical Scribe Modal */}
      {id && (
        <AIScribeModal
          isOpen={isAIScribeOpen}
          onClose={() => setIsAIScribeOpen(false)}
          encounterId={id}
          patientName="Patient"
          onAutoFillPrescription={(extractedMeds) => {
            const mapped = extractedMeds.map((m: any) => ({
              medicineId: '',
              name: m.medicineName,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              recommend: true
            }));
            setAutoFilledMedicines(mapped);
            setIsAIScribeOpen(false);
            setIsPrescribeOpen(true);
          }}
        />
      )}

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
          initialMedicines={autoFilledMedicines}
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
