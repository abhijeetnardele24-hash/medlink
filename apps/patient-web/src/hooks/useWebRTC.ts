import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = (encounterId: string | null) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!encounterId) return;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        socketRef.current = io('http://localhost:5000', { withCredentials: true });
        
        socketRef.current.on('connect', () => {
          socketRef.current?.emit('join-encounter', encounterId);
        });

        const pc = new RTCPeerConnection(ICE_SERVERS);
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

  return { localStream, remoteStream, isConnected, error, peerConnectionRef };
};
