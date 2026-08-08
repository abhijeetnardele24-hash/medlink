import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

// Global socket ref for chat component
export const socketRef: { current: Socket | null } = { current: null };

export const useWebRTC = (encounterId: string | null) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'audio-only'>('good');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const qualityScore = useRef(5);

  useEffect(() => {
    if (!encounterId) return;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        if (!socketRef.current) {
          if (!auth || !auth.currentUser) {
            setError("User not authenticated");
            return;
          }
          const token = await auth.currentUser.getIdToken();
          socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', { 
            auth: { token },
            withCredentials: true 
          });
        }
        
        socketRef.current.on('connect', () => {
          socketRef.current?.emit('join-encounter', encounterId);
        });

        socketRef.current.on('connect_error', () => {
          socketRef.current?.emit('join-encounter', encounterId);
        });

        // Fetch TURN credentials
        const turnRes = await api.get('/webrtc/credentials');
        const iceConfig = turnRes.data; // e.g. { iceServers: [...] }

        // TODO: For testing relay, you can uncomment this to force TURN relay
        // iceConfig.iceTransportPolicy = 'relay';

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

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current?.emit('webrtc-ice-candidate', {
              encounterId,
              candidate: event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setIsConnected(true);
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setIsConnected(false);
          }
        };

        socketRef.current.on('webrtc-offer', async ({ offer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit('webrtc-answer', { encounterId, answer });
        });

        socketRef.current.on('webrtc-answer', async ({ answer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socketRef.current.on('webrtc-ice-candidate', async ({ candidate }) => {
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        // If I am the doctor, I initiate the call (create offer)
        // Since this is the Patient hook, we just wait for the offer.

      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Could not access camera/microphone');
      }
    };

    init();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peerConnectionRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, [encounterId]);

  // Adaptive Engine: monitor WebRTC stats
  useEffect(() => {
    if (!isConnected || !peerConnectionRef.current) return;
    
    const interval = setInterval(async () => {
      if (!peerConnectionRef.current) return;
      
      try {
        const stats = await peerConnectionRef.current.getStats();
        let hasPoorStat = false;

        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            const packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost || 1);
            if (packetLoss > 0.1 || report.jitter > 0.05) hasPoorStat = true;
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime > 0.5) hasPoorStat = true; // > 500ms RTT
          }
        });

        if (hasPoorStat) {
          qualityScore.current = Math.max(0, qualityScore.current - 1);
        } else {
          qualityScore.current = Math.min(5, qualityScore.current + 1);
        }

        if (qualityScore.current === 0) {
          setConnectionQuality('audio-only');
          // Auto-downgrade by disabling video tracks locally
          localStream?.getVideoTracks().forEach(t => t.enabled = false);
        } else if (qualityScore.current <= 2) {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('good');
          // Auto-recover video tracks if quality is back to good
          localStream?.getVideoTracks().forEach(t => t.enabled = true);
        }
      } catch (err) {
        console.error('Failed to get stats', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, localStream]);

  return { localStream, remoteStream, isConnected, error, peerConnectionRef, connectionQuality };
};
