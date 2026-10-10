import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Mic,
  VideoOff,
  MicOff,
  PhoneOff,
  Hand,
  ScreenShare,
  UploadCloud,
  Loader2,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { auth } from '../lib/firebase';
import { ChatBox } from '../components/ChatBox';
import { MeetingControls } from '../components/MeetingControls';
import { DeviceSettingsModal } from '../components/DeviceSettingsModal';
import { NetworkHealthPanel } from '../components/NetworkHealthPanel';
import { useTranslation } from 'react-i18next';

export const Consultation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = window.location.search ? [new URLSearchParams(window.location.search)] : [new URLSearchParams()];
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const isAsyncMode = searchParams.get('mode') === 'async';

  const {
    localStream,
    remoteStream,
    isConnected,
    error,
    connectionQuality,
    networkStats,
    endMeetingReason,

    isAudioMuted,
    isVideoOff,
    isAutoAudioOnly,
    isSimulating,
    toggleSimulatePoorNetwork,
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
    pc,
    socket
  } = useWebRTC(isAsyncMode ? null : (id || null));

  const [isChatOpen, setIsChatOpen] = useState(isAsyncMode ? true : false);
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
      navigate('/');
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
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ textAlign: 'center', color: '#fca5a5', padding: '2rem', background: '#18181b', borderRadius: '1.5rem', border: '1px solid rgba(239,68,68,0.2)', maxWidth: '28rem' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <VideoOff size={32} />
          </div>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{error}</p>
          <p style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>{t('consultation.permissionError') || 'Please check camera and microphone permissions.'}</p>
          <button
            onClick={() => navigate('/')}
            style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', borderRadius: '999px', background: '#423FDE', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            {t('consultation.goBack') || 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0a', overflow: 'hidden', userSelect: 'none' }}>
      <NetworkHealthPanel connectionQuality={connectionQuality} networkStats={networkStats} isConnected={isConnected} />
      
      {/* Main Video Feed / Remote Participant */}
      {!isAsyncMode && (
        <div style={{ position: 'absolute', inset: 0, background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Remote video always mounted so srcObject works */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ display: remoteStream && !remoteVideoOff ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Placeholder when no remote stream or camera off */}
          {(!remoteStream || remoteVideoOff) && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#818cf8' }}>DR</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.5rem', color: 'white', margin: '0 0 0.25rem 0' }}>
                  {remoteVideoOff ? 'Doctor Camera is Off' : t('consultation.waitingForDoctor') || 'Waiting for Doctor to connect...'}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  {remoteVideoOff ? 'Audio consultation in progress' : 'Please stay on this page. Your doctor has been notified.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Header Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '1.5rem 2rem',
        zIndex: 20,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '1rem', background: 'rgba(66,63,222,0.2)', border: '1px solid rgba(66,63,222,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 700 }}>
            ML
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {t('consultation.title') || 'Doctor Consultation'}
              </h2>
              {isConnected && (
                <span style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.125rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>
                  {formatTimer(callDuration)}
                </span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0 0 0' }}>
              {isConnected ? (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: connectionQuality === 'good' ? '#10b981' : connectionQuality === 'poor' ? '#f59e0b' : '#ef4444' }} />
                  <span>{t('consultation.connectedSecurely') || 'Connected Securely'} ({connectionQuality.toUpperCase()})</span>
                </>
              ) : (
                t('consultation.connecting') || 'Connecting...'
              )}
            </p>
          </div>
        </div>

          {/* Badges & Alerts */}
          <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            {/* Development-only simulation button */}
            <button
              onClick={toggleSimulatePoorNetwork}
              style={{
                background: isSimulating ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${isSimulating ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                color: isSimulating ? '#fca5a5' : '#e5e7eb',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isSimulating ? 'Stop Simulation' : 'Simulate Bad Network'}
            </button>
        </div>
      </div>

      {isChatOpen && (
        <div style={{
          position: 'absolute',
          right: isAsyncMode ? '50%' : '2rem',
          transform: isAsyncMode ? 'translateX(50%)' : 'none',
          top: '5.5rem',
          bottom: '6.5rem',
          width: isAsyncMode ? '100%' : '380px',
          maxWidth: isAsyncMode ? '800px' : '380px',
          zIndex: 30
        }}>
          <ChatBox encounterId={id!} />
        </div>
      )}

      {/* Picture-in-Picture Local Video */}
      {!isAsyncMode && (
        <div style={{
          position: 'absolute',
          bottom: '7rem',
          right: '2rem',
          zIndex: 20,
          width: '18rem',
          aspectRatio: '16/9',
          background: '#18181B',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              display: effectiveVideoOff ? 'none' : 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              filter: isBlurActive ? 'blur(3px)' : 'none'
            }}
          />
          {/* Camera-off placeholder */}
          {effectiveVideoOff && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', gap: '0.5rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>
                PT
              </div>
              <span style={{ fontSize: '0.75rem' }}>{isAutoAudioOnly ? 'Auto Disabled' : 'Camera Off'}</span>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'white', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '0.125rem 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              You (Patient)
            </span>
            {isAudioMuted && (
              <span style={{ padding: '0.25rem', borderRadius: '0.375rem', background: '#ef4444', color: 'white', display: 'flex' }}>
                <MicOff size={10} />
              </span>
            )}
          </div>
        </div>
      )}

      {!isAsyncMode && (
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
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
            onEndCall={() => navigate('/')}
          />
        </div>
      )}

      {/* Hardware Settings Modal */}
      {!isAsyncMode && (
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
      )}
    </div>
  );
};
