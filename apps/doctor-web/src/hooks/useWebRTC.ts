import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

// Global socket ref for chat and meeting components
export const socketRef: { current: Socket | null } = { current: null };

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  createdAt: number;
}

export interface WhiteboardStroke {
  color: string;
  size: number;
  isEraser?: boolean;
  points: { x: number; y: number }[];
}

export const useWebRTC = (encounterId: string | null) => {
  // Streams & Connection
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'audio-only'>('good');
  const [endMeetingReason, setEndMeetingReason] = useState<string | null>(null);

  // Hardware Controls
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
  const [remoteVideoOff, setRemoteVideoOff] = useState(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Screen Sharing
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Meeting Interactive Tools
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [remoteHandRaised, setRemoteHandRaised] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([]);

  // Devices
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');

  // Recording (Local + Cloud)
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Internal WebRTC Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const qualityScore = useRef(5);
  const isRestartingIce = useRef(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Fetch Available Audio/Video Devices
  const refreshDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
      setVideoInputDevices(devices.filter(d => d.kind === 'videoinput'));
      setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
    } catch (err) {
      console.warn("Failed to enumerate devices", err);
    }
  }, []);

  // Initialize WebRTC and Sockets
  useEffect(() => {
    if (!encounterId) return;

    let isMounted = true;

    const init = async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
          stream.getVideoTracks().forEach(track => { track.enabled = false; });
        } catch (mediaErr) {
          console.warn("Camera failed, falling back to audio-only", mediaErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
        }

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setLocalStream(stream);
        originalVideoTrackRef.current = stream.getVideoTracks()[0] || null;

        // Setup Audio Analyser for Local Mic Visualizer
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            }
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        } catch (e) {
          console.warn("Could not start audio analyser", e);
        }

        await refreshDevices();

        if (!auth || !auth.currentUser) {
          setError("User not authenticated");
          return;
        }

        const token = await auth.currentUser.getIdToken();
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
          auth: { token },
          withCredentials: true
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-encounter', encounterId);
        });

        socket.on('connect_error', () => {
          console.error('Socket connection error');
        });

        // Fetch ICE servers
        const turnRes = await api.get('/webrtc/credentials');
        const iceConfig = turnRes.data;

        const pc = new RTCPeerConnection(iceConfig);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc-offer', { encounterId, offer: pc.localDescription });
          } catch (err) {
            console.error("Error during renegotiation:", err);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc-ice-candidate', {
              encounterId,
              candidate: event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setIsConnected(true);
            isRestartingIce.current = false;
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setIsConnected(false);
            if (!isRestartingIce.current) {
              isRestartingIce.current = true;
              pc.restartIce();
              pc.createOffer().then(offer => pc.setLocalDescription(offer))
                .then(() => socket.emit('webrtc-offer', { encounterId, offer: pc.localDescription }))
                .catch(err => {
                  console.error("Failed to restart ICE:", err);
                  isRestartingIce.current = false;
                });
            }
          }
        };

        // WebRTC Signaling Listeners
        socket.on('webrtc-answer', async ({ answer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('webrtc-offer', async ({ offer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc-answer', { encounterId, answer });
        });

        socket.on('webrtc-ice-candidate', async ({ candidate }) => {
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        // Meeting Signaling Events
        socket.on('screen-share-toggle', ({ isSharing }) => {
          setRemoteScreenSharing(isSharing);
        });

        socket.on('raise-hand', ({ isRaised }) => {
          setRemoteHandRaised(isRaised);
        });

        socket.on('emoji-reaction', ({ emoji, participantName, id }) => {
          const newReaction: FloatingReaction = {
            id: id || Math.random().toString(),
            emoji,
            senderName: participantName || 'Guest',
            createdAt: Date.now()
          };
          setReactions(prev => [...prev.slice(-15), newReaction]);
        });

        socket.on('whiteboard-draw', ({ stroke }) => {
          setWhiteboardStrokes(prev => [...prev, stroke]);
        });

        socket.on('whiteboard-clear', () => {
          setWhiteboardStrokes([]);
        });

        socket.on('media-state-change', ({ isAudioMuted, isVideoOff }) => {
          if (typeof isAudioMuted === 'boolean') setRemoteAudioMuted(isAudioMuted);
          if (typeof isVideoOff === 'boolean') setRemoteVideoOff(isVideoOff);
        });

        socket.on('mute-participant', ({ muteType }) => {
          if (muteType === 'audio') {
            stream.getAudioTracks().forEach(t => (t.enabled = false));
            setIsAudioMuted(true);
          }
        });

        socket.on('end-meeting-all', ({ reason }) => {
          setEndMeetingReason(reason || "Meeting has concluded");
        });

      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Could not access camera or microphone. Please check permissions.');
      }
    };

    init();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      localStream?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      peerConnectionRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, [encounterId]);

  // Start Call (Doctor rings Patient)
  const startCall = useCallback(async () => {
    if (!peerConnectionRef.current || !socketRef.current || !encounterId) return;
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.emit('webrtc-offer', { encounterId, offer });
      socketRef.current.emit('ring-patient', { encounterId });
    } catch (err) {
      console.error('Error starting call', err);
    }
  }, [encounterId]);

  // Toggle Microphone Mute
  const toggleAudio = useCallback(() => {
    if (!localStream) return;
    const newMuted = !isAudioMuted;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !newMuted;
    });
    setIsAudioMuted(newMuted);
    if (encounterId && socketRef.current) {
      socketRef.current.emit('media-state-change', {
        encounterId,
        isAudioMuted: newMuted,
        isVideoOff
      });
    }
  }, [localStream, isAudioMuted, isVideoOff, encounterId]);

  // Toggle Camera On/Off
  const toggleVideo = useCallback(async () => {
    if (!localStream) return;
    const newOff = !isVideoOff;
    
    if (!newOff && localStream.getVideoTracks().length === 0) {
      try {
        const vidStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } });
        const newTrack = vidStream.getVideoTracks()[0];
        localStream.addTrack(newTrack);
        originalVideoTrackRef.current = newTrack;
        if (peerConnectionRef.current) {
           peerConnectionRef.current.addTrack(newTrack, localStream);
        }
      } catch (e) {
        alert("Camera could not be accessed.");
        return;
      }
    } else {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !newOff;
      });
    }

    setIsVideoOff(newOff);
    if (encounterId && socketRef.current) {
      socketRef.current.emit('media-state-change', {
        encounterId,
        isAudioMuted,
        isVideoOff: newOff
      });
    }
  }, [localStream, isAudioMuted, isVideoOff, encounterId]);

  // Screen Sharing (Google Meet / Zoom style)
  const startScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current || !localStream) return;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: false
      });
      screenStreamRef.current = displayStream;
      const screenVideoTrack = displayStream.getVideoTracks()[0];

      // Replace current video track in RTCPeerConnection sender
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(screenVideoTrack);
      } else {
        peerConnectionRef.current.addTrack(screenVideoTrack, screenStreamRef.current);
      }

      setIsScreenSharing(true);
      if (encounterId && socketRef.current) {
        socketRef.current.emit('screen-share-toggle', { encounterId, isSharing: true });
      }

      // Revert if user clicks Chrome's native "Stop Sharing" floating bar
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn("Screen sharing cancelled or failed", err);
    }
  }, [localStream, encounterId]);

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        if (originalVideoTrackRef.current) {
          await videoSender.replaceTrack(originalVideoTrackRef.current);
        } else {
          peerConnectionRef.current.removeTrack(videoSender);
        }
      }
    }
    setIsScreenSharing(false);
    if (encounterId && socketRef.current) {
      socketRef.current.emit('screen-share-toggle', { encounterId, isSharing: false });
    }
  }, [encounterId]);

  // Device Switching
  const switchCamera = useCallback(async (deviceId: string) => {
    if (!deviceId) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      const newTrack = newStream.getVideoTracks()[0];
      if (localStream) {
        const oldTrack = localStream.getVideoTracks()[0];
        if (oldTrack) {
          localStream.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStream.addTrack(newTrack);
      }
      originalVideoTrackRef.current = newTrack;
      if (peerConnectionRef.current && !isScreenSharing) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newTrack);
        }
      }
      setSelectedCameraId(deviceId);
    } catch (err) {
      console.error("Failed to switch camera", err);
    }
  }, [localStream, isScreenSharing]);

  const switchMicrophone = useCallback(async (deviceId: string) => {
    if (!deviceId) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      const newTrack = newStream.getAudioTracks()[0];
      if (localStream) {
        const oldTrack = localStream.getAudioTracks()[0];
        if (oldTrack) {
          localStream.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStream.addTrack(newTrack);
      }
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
        if (audioSender) {
          await audioSender.replaceTrack(newTrack);
        }
      }
      setSelectedMicId(deviceId);
    } catch (err) {
      console.error("Failed to switch microphone", err);
    }
  }, [localStream]);

  const switchAudioOutput = useCallback(async (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
  }, []);

  // Meeting Interactive Tools
  const toggleRaiseHand = useCallback(() => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    if (encounterId && socketRef.current) {
      socketRef.current.emit('raise-hand', {
        encounterId,
        isRaised: next,
        participantName: auth?.currentUser?.displayName || 'Doctor'
      });
    }
  }, [isHandRaised, encounterId]);

  const sendReaction = useCallback((emoji: string) => {
    if (encounterId && socketRef.current) {
      socketRef.current.emit('emoji-reaction', {
        encounterId,
        emoji,
        participantName: auth?.currentUser?.displayName || 'Doctor'
      });
    }
  }, [encounterId]);

  const sendWhiteboardStroke = useCallback((stroke: WhiteboardStroke) => {
    setWhiteboardStrokes(prev => [...prev, stroke]);
    if (encounterId && socketRef.current) {
      socketRef.current.emit('whiteboard-draw', { encounterId, stroke });
    }
  }, [encounterId]);

  const clearWhiteboard = useCallback(() => {
    setWhiteboardStrokes([]);
    if (encounterId && socketRef.current) {
      socketRef.current.emit('whiteboard-clear', { encounterId });
    }
  }, [encounterId]);

  // Host Controls
  const muteRemoteParticipant = useCallback((muteType: 'audio' | 'video' = 'audio') => {
    if (encounterId && socketRef.current) {
      socketRef.current.emit('mute-participant', { encounterId, muteType });
    }
  }, [encounterId]);

  const endMeetingForAll = useCallback(() => {
    if (encounterId && socketRef.current) {
      socketRef.current.emit('end-meeting-all', {
        encounterId,
        reason: "Consultation ended by Doctor"
      });
    }
  }, [encounterId]);

  // Composite Local + Remote MediaRecorder for Direct Local Download
  const startRecording = useCallback(() => {
    recordingChunksRef.current = [];
    setRecordingBlob(null);

    // Mix Audio (Local + Remote)
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioCtx;
    const dest = audioCtx.createMediaStreamDestination();

    if (localStream && localStream.getAudioTracks().length > 0) {
      const localAudioSource = audioCtx.createMediaStreamSource(localStream);
      localAudioSource.connect(dest);
    }
    if (remoteStream && remoteStream.getAudioTracks().length > 0) {
      const remoteAudioSource = audioCtx.createMediaStreamSource(remoteStream);
      remoteAudioSource.connect(dest);
    }

    // Video Stream (Remote video, or screen share, or local)
    const activeVideoStream = remoteStream || screenStreamRef.current || localStream;
    if (!activeVideoStream) {
      alert("No active video feed to record.");
      return;
    }

    const mixedStream = new MediaStream([
      ...activeVideoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }

    try {
      const recorder = new MediaRecorder(mixedStream, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordingChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
        setRecordingBlob(blob);

        // Instant Direct Download to Local Storage / Computer
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `MedLink_Consultation_${encounterId || 'session'}_${timestamp}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };

      recorder.start(1000); // 1s slice
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      if (encounterId && socketRef.current) {
        socketRef.current.emit('recording-status', {
          encounterId,
          isRecording: true,
          startedBy: 'Doctor',
          type: 'local'
        });
      }
    } catch (err) {
      console.error("Failed to start MediaRecorder", err);
      alert("Could not start recording.");
    }
  }, [localStream, remoteStream, encounterId]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      if (encounterId && socketRef.current) {
        socketRef.current.emit('recording-status', {
          encounterId,
          isRecording: false,
          startedBy: 'Doctor',
          type: 'local'
        });
      }
    }
  }, [encounterId]);

  // Adaptive network monitoring
  useEffect(() => {
    if (!isConnected || !peerConnectionRef.current) return;
    const interval = setInterval(async () => {
      if (!peerConnectionRef.current || isRestartingIce.current) return;
      try {
        const stats = await peerConnectionRef.current.getStats();
        let hasPoorStat = false;

        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            const packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost || 1);
            if (packetLoss > 0.1 || report.jitter > 0.05) hasPoorStat = true;
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime > 0.5) hasPoorStat = true;
          }
        });

        if (hasPoorStat) {
          qualityScore.current = Math.max(0, qualityScore.current - 1);
        } else {
          qualityScore.current = Math.min(5, qualityScore.current + 1);
        }

        if (qualityScore.current === 0) {
          setConnectionQuality('audio-only');
        } else if (qualityScore.current <= 2) {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('good');
        }
      } catch (err) {
        console.error('Failed to get stats', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    // Streams & Connection
    localStream,
    remoteStream,
    isConnected,
    error,
    connectionQuality,
    startCall,
    endMeetingReason,

    // Audio / Video
    isAudioMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    remoteAudioMuted,
    remoteVideoOff,
    audioLevel,

    // Screen Share
    isScreenSharing,
    remoteScreenSharing,
    startScreenShare,
    stopScreenShare,

    // Recording
    isRecording,
    isPaused,
    recordingDuration,
    recordingBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,

    // Interactive
    isHandRaised,
    remoteHandRaised,
    toggleRaiseHand,
    reactions,
    sendReaction,
    whiteboardStrokes,
    sendWhiteboardStroke,
    clearWhiteboard,

    // Devices
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    selectedCameraId,
    selectedMicId,
    selectedSpeakerId,
    switchCamera,
    switchMicrophone,
    switchAudioOutput,
    refreshDevices,

    // Host Controls
    muteRemoteParticipant,
    endMeetingForAll
  };
};
