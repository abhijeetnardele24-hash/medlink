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
  const [networkStats, setNetworkStats] = useState<{ packetLoss: number | null, jitter: number | null, rtt: number | null }>({ packetLoss: null, jitter: null, rtt: null });
  const [isAutoAudioOnly, setIsAutoAudioOnly] = useState(false);
  const isAutoAudioOnlyRef = useRef(false);
  useEffect(() => { isAutoAudioOnlyRef.current = isAutoAudioOnly; }, [isAutoAudioOnly]);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulateRef = useRef(false);

  // Hardware Controls
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const isAudioMutedRef = useRef(false);
  useEffect(() => { isAudioMutedRef.current = isAudioMuted; }, [isAudioMuted]);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const isVideoOffRef = useRef(false);
  useEffect(() => { isVideoOffRef.current = isVideoOff; }, [isVideoOff]);
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
  const [remoteVideoOff, setRemoteVideoOff] = useState(false);
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

  // Remote Recording Status Notification
  const [remoteRecordingActive, setRemoteRecordingActive] = useState(false);

  // Devices
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');

  // Recording (Local)
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
        } catch (mediaErr) {
          console.warn("Camera failed, falling back to audio-only", mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
          } catch (audioErr) {
            console.warn("Audio failed too! Using fake virtual stream.", audioErr);
            const canvas = document.createElement("canvas");
            canvas.width = 1280;
            canvas.height = 720;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Draw first frame synchronously before capture!
              const drawFrame = () => {
                ctx.fillStyle = "#111827";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "white";
                ctx.font = "48px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("No Camera/Mic", canvas.width / 2, canvas.height / 2);
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2 + 80, 10, 0, 2 * Math.PI);
                ctx.fillStyle = Date.now() % 1000 > 500 ? "red" : "gray";
                ctx.fill();
              };
              drawFrame();
              setInterval(drawFrame, 500);
            }
            stream = canvas.captureStream(30);
            
            // Create fake audio
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const dest = audioCtx.createMediaStreamDestination();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0; // Silent
            oscillator.connect(gainNode);
            gainNode.connect(dest);
            oscillator.start();
            stream.addTrack(dest.stream.getAudioTracks()[0]);
          }
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

        const joinRoom = () => {
          console.log('[Patient Socket] Emitting join-encounter:', encounterId);
          socket.emit('join-encounter', encounterId);
        };

        if (socket.connected) {
          joinRoom();
        }
        socket.on('connect', joinRoom);

        socket.on('connect_error', (err) => {
          console.error('[Patient Socket] Connection error:', err.message);
          if (isMounted) setError('Failed to connect to call server. Please refresh.');
        });

        socket.on('error', (errMsg: string) => {
          console.error('[Patient Socket] Server error:', errMsg);
          if (errMsg === 'Unauthorized to join this encounter') {
            console.error('[Patient Socket] Unauthorized - likely wrong user/appointment combination');
          } else if (isMounted) {
            setError(`Call server error: ${errMsg}`);
          }
        });

        const joinedPromise = new Promise<void>((resolve) => {
          socket.on('joined-encounter', ({ encounterId: joinedId }) => {
            console.log('[Patient Socket] Successfully joined encounter room:', joinedId);
            resolve();
          });
        });

        // Fetch ICE servers
        const turnRes = await api.get('/webrtc/credentials');
        const iceConfig = turnRes.data;

        // CRITICAL FIX: Wait for the server to acknowledge we joined the room
        // BEFORE creating the peer connection. Otherwise, onnegotiationneeded fires instantly,
        // we emit 'webrtc-offer', and the server rejects it as 'Unauthorized' because
        // the async join-encounter DB lookup hasn't finished yet!
        await joinedPromise;

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

        const iceCandidateQueue: RTCIceCandidateInit[] = [];

        let peerInRoom = false;
        socket.on('peer-joined', () => {
          console.log('[Patient Socket] A peer joined the room. Ready for negotiation.');
          peerInRoom = true;
        });

        // Removed onnegotiationneeded (using explicit manual signaling from Doctor)

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
            }
          }
        };

        socket.on('webrtc-offer', async ({ offer }) => {
          try {
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-answer', { encounterId, answer: pc.localDescription });

            // Process queued ICE candidates
            while (iceCandidateQueue.length) {
              const candidate = iceCandidateQueue.shift();
              if (candidate) await pc.addIceCandidate(candidate);
            }
          } catch (err) {
            console.error("Failed to handle webrtc-offer", err);
          }
        });

        socket.on('webrtc-answer', async ({ answer }) => {
          try {
            await pc.setRemoteDescription(answer);
            // Process queued ICE candidates
            while (iceCandidateQueue.length) {
              const candidate = iceCandidateQueue.shift();
              if (candidate) await pc.addIceCandidate(candidate);
            }
          } catch (err) {
            console.error("Failed to handle webrtc-answer", err);
          }
        });

        socket.on('webrtc-ice-candidate', async ({ candidate }) => {
          try {
            if (candidate) {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(candidate);
              } else {
                iceCandidateQueue.push(candidate);
              }
            }
          } catch (err) {
            console.error("Error adding ice candidate:", err);
          }
        });

        // Meeting Signaling Events
        socket.on('recording-status', ({ isRecording }) => {
          setRemoteRecordingActive(isRecording);
        });

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
    const currentlyOff = isVideoOff || isAutoAudioOnly;
    const newOff = !currentlyOff;
    
    if (!newOff) {
      setIsAutoAudioOnly(false);
    }
    
    const videoTracks = localStream.getVideoTracks();
    
    if (videoTracks.length > 0) {
      // We have tracks - simply enable or disable them
      videoTracks.forEach(track => { track.enabled = !newOff; });
      setIsVideoOff(newOff);
    } else if (!newOff) {
      // Turning ON but no video tracks exist - get a new camera
      try {
        const vidStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
        });
        const newTrack = vidStream.getVideoTracks()[0];
        newTrack.enabled = true;
        localStream.addTrack(newTrack);
        originalVideoTrackRef.current = newTrack;
        
        // Add to peer connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(newTrack);
          } else {
            peerConnectionRef.current.addTrack(newTrack, localStream);
          }
        }
        
        // Force React re-render by creating new stream reference
        setLocalStream(new MediaStream(localStream.getTracks()));
        setIsVideoOff(false);
      } catch (e) {
        console.warn("Could not access camera:", e);
        setIsVideoOff(false); // Still mark as 'on' so placeholder shows
      }
    }
    
    if (encounterId && socketRef.current) {
      socketRef.current.emit('media-state-change', {
        encounterId,
        isAudioMuted,
        isVideoOff: newOff
      });
    }
  }, [localStream, isAudioMuted, isVideoOff, encounterId]);

  const toggleSimulatePoorNetwork = useCallback(() => {
    simulateRef.current = !simulateRef.current;
    setIsSimulating(simulateRef.current);
    if (simulateRef.current) {
      qualityScore.current = 0;
    } else {
      qualityScore.current = 5;
    }
  }, []);

  // Screen Sharing
  const startScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current || !localStream) return;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: false
      });
      screenStreamRef.current = displayStream;
      const screenVideoTrack = displayStream.getVideoTracks()[0];

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
        participantName: auth?.currentUser?.displayName || 'Patient'
      });
    }
  }, [isHandRaised, encounterId]);

  const sendReaction = useCallback((emoji: string) => {
    if (encounterId && socketRef.current) {
      socketRef.current.emit('emoji-reaction', {
        encounterId,
        emoji,
        participantName: auth?.currentUser?.displayName || 'Patient'
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

  // Composite Local + Remote MediaRecorder for Direct Local Download
  const startRecording = useCallback(() => {
    recordingChunksRef.current = [];
    setRecordingBlob(null);

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

    const activeVideoStream = remoteStream || screenStreamRef.current || localStream;
    if (!activeVideoStream) {
      alert("No active video feed to record.");
      return;
    }

    const mixedStream = new MediaStream([
      ...activeVideoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    let options = { mimeType: 'video/webm;codecs=h264,opus' };
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
        const blob = new Blob(recordingChunksRef.current, { type: 'video/mp4' });
        setRecordingBlob(blob);
      };

      recorder.start(1000);
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
          startedBy: 'Patient',
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
          startedBy: 'Patient',
          type: 'local'
        });
      }
    }
  }, [encounterId]);

  const clearRecording = useCallback(() => {
    setRecordingBlob(null);
  }, []);

  // Adaptive network monitoring
  useEffect(() => {
    if (!isConnected || !peerConnectionRef.current) return;
    const interval = setInterval(async () => {
      if (!peerConnectionRef.current || isRestartingIce.current) return;
      try {
        const stats = await peerConnectionRef.current.getStats();
        let hasPoorStat = false;

        if (simulateRef.current) {
          hasPoorStat = true;
          qualityScore.current = 0;
        }

        let currentPacketLoss = null;
        let currentJitter = null;
        let currentRtt = null;

        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            const packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost || 1);
            currentPacketLoss = packetLoss;
            currentJitter = report.jitter;
            if (packetLoss > 0.1 || report.jitter > 0.05) hasPoorStat = true;
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            currentRtt = report.currentRoundTripTime;
            if (report.currentRoundTripTime > 0.5) hasPoorStat = true;
          }
        });

        setNetworkStats({ packetLoss: currentPacketLoss, jitter: currentJitter, rtt: currentRtt });

        if (!simulateRef.current) {
          if (hasPoorStat) {
            qualityScore.current = Math.max(0, qualityScore.current - 1);
          } else {
            qualityScore.current = Math.min(5, qualityScore.current + 1);
          }
        }

        if (qualityScore.current === 0) {
          if (!isVideoOffRef.current && !isAutoAudioOnlyRef.current) {
            setIsAutoAudioOnly(true);
            if (localStream) {
              localStream.getVideoTracks().forEach(t => t.enabled = false);
            }
            if (encounterId && socketRef.current) {
              socketRef.current.emit('media-state-change', { encounterId, isAudioMuted: isAudioMutedRef.current, isVideoOff: true });
            }
          }
          setConnectionQuality('audio-only');
        } else if (qualityScore.current === 5) {
          if (isAutoAudioOnlyRef.current) {
            setIsAutoAudioOnly(false);
            if (!isVideoOffRef.current && localStream) {
              localStream.getVideoTracks().forEach(t => t.enabled = true);
            }
            if (encounterId && socketRef.current) {
              socketRef.current.emit('media-state-change', { encounterId, isAudioMuted: isAudioMutedRef.current, isVideoOff: isVideoOffRef.current });
            }
          }
          setConnectionQuality('good');
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

  // Emit network mode change to the other peer via signaling server
  useEffect(() => {
    if (isConnected && socketRef.current && encounterId) {
      socketRef.current.emit('network-mode-change', {
        encounterId,
        mode: connectionQuality,
        role: 'patient'
      });
    }
  }, [connectionQuality, isConnected, encounterId]);

  return {
    localStream,
    remoteStream,
    isConnected,
    error,
    connectionQuality,
    networkStats,
    endMeetingReason,
    isAutoAudioOnly,
    isSimulating,
    toggleSimulatePoorNetwork,

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
    clearRecording,
    remoteRecordingActive,

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
    refreshDevices,
    pc: peerConnectionRef.current,
    socket: socketRef.current
  };
};
