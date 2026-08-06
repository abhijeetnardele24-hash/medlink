import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Video, Mic, MicOff, VideoOff, PhoneOff, FileText, Pill, Save, Activity } from 'lucide-react';

export const Consultation: React.FC = () => {
  const { id: appointmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  
  // WebRTC Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // UI State
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  
  // Clinical Notes State
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState('');
  const [saving, setSaving] = useState(false);

  // 1. Initialize Encounter & Socket
  useEffect(() => {
    let currentSocket: Socket;

    const init = async () => {
      try {
        // Start encounter via API
        const { data } = await api.post('/encounters', { appointmentId });
        setEncounterId(data.id);

        // Connect to Signaling Server
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        currentSocket = io(backendUrl, { withCredentials: true });

        currentSocket.on('connect', () => {
          setConnected(true);
          currentSocket.emit('join-encounter', data.id);
        });

        // WebRTC Signaling Handlers
        currentSocket.on('webrtc-offer', async ({ offer }) => {
          if (!peerConnectionRef.current) return;
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          currentSocket.emit('webrtc-answer', { encounterId: data.id, answer });
        });

        currentSocket.on('webrtc-answer', async ({ answer }) => {
          if (!peerConnectionRef.current) return;
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        currentSocket.on('webrtc-ice-candidate', async ({ candidate }) => {
          if (!peerConnectionRef.current) return;
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding ICE candidate', e);
          }
        });

        startLocalStream(data.id, currentSocket);
      } catch (err) {
        console.error("Failed to start encounter", err);
        alert("Could not start consultation. Please try again.");
        navigate('/');
      }
    };

    init();

    return () => {
      if (currentSocket) currentSocket.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [appointmentId, navigate]);

  // 2. Initialize WebRTC Media
  const startLocalStream = async (encId: string, sock: Socket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sock.emit('webrtc-ice-candidate', { encounterId: encId, candidate: event.candidate });
        }
      };

      // Doctor is the caller, so we create the offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sock.emit('webrtc-offer', { encounterId: encId, offer });

    } catch (err) {
      console.error("Failed to access media devices", err);
      // Fallback to chat or error out gracefully in a real app
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = !micEnabled;
      setMicEnabled(!micEnabled);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks()[0].enabled = !cameraEnabled;
      setCameraEnabled(!cameraEnabled);
    }
  };

  const endCall = () => {
    navigate('/');
  };

  const submitPrescription = async (e: FormEvent) => {
    e.preventDefault();
    if (!encounterId) return;
    
    setSaving(true);
    try {
      await api.post(`/encounters/${encounterId}/prescriptions`, {
        doctorId: user?.uid, // Using firebase UID for demo; backend expects UUID ideally
        medicinesJson: { medicines: medicines.split(',') },
        instructionsText: notes
      });
      alert('Consultation finalized and prescription saved!');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>
      
      {/* LEFT PANE: WebRTC Video Workspace */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity color={connected ? '#10b981' : '#fca5a5'} size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Virtual Clinic Room</h2>
          </div>
          <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '12px', fontSize: '0.875rem' }}>
            ID: {appointmentId?.substring(0,8)}...
          </span>
        </header>

        <div className="glass-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          {/* Remote Video (Patient) */}
          <video 
            ref={remoteVideoRef}
            autoPlay 
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Local Video (Doctor PIP) */}
          <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', width: '200px', height: '150px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', background: '#111', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <video 
              ref={localVideoRef}
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Controls Overlay */}
          <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.75rem 1.5rem', borderRadius: '99px', backdropFilter: 'blur(10px)' }}>
            <button onClick={toggleMic} style={{ width: '48px', height: '48px', borderRadius: '50%', background: micEnabled ? 'rgba(255,255,255,0.1)' : '#ef4444', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button onClick={toggleCamera} style={{ width: '48px', height: '48px', borderRadius: '50%', background: cameraEnabled ? 'rgba(255,255,255,0.1)' : '#ef4444', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button onClick={endCall} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PhoneOff size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Clinical Notes & Prescriptions */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--primary)" /> Clinical Notes
        </h3>

        <form onSubmit={submitPrescription} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1.5rem' }}>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Consultation Notes</label>
            <textarea 
              className="input-field" 
              style={{ flex: 1, resize: 'none', padding: '1rem', minHeight: '200px' }}
              placeholder="Record patient symptoms, diagnosis, and plan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Pill size={14} /> E-Prescription (Medicines)
            </label>
            <input 
              type="text"
              className="input-field" 
              placeholder="e.g. Paracetamol 500mg, Amoxicillin"
              value={medicines}
              onChange={(e) => setMedicines(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }} disabled={saving}>
            {saving ? 'Finalizing...' : <><Save size={18} /> Finalize Encounter</>}
          </button>
        </form>
      </div>

    </div>
  );
};
