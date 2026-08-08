import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Mic, VideoOff, PhoneOff, Maximize, MessageSquare } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { ChatBox } from '../components/ChatBox';

export const Consultation: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { localStream, remoteStream, isConnected, error } = useWebRTC(id || null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ textAlign: 'center', color: '#fca5a5', padding: '2rem' }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{error}</p>
          <p style={{ marginTop: '0.5rem', color: '#9ca3af' }}>Please ensure camera and microphone permissions are granted.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', borderRadius: '999px', background: '#423FDE', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0a', overflow: 'hidden' }}>
      {/* Remote Video (Main) */}
      <div style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.8)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '1.1rem' }}>Waiting for doctor to connect...</p>
          </div>
        )}
      </div>

      {/* Header Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.5rem 2rem', zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Consultation Room</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {isConnected ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Connected securely (E2EE)
              </span>
            ) : 'Connecting to secure server...'}
          </p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1.25rem', borderRadius: '999px', color: 'white', fontWeight: 600 }}>
          {isConnected ? '●  Live' : 'Waiting'}
        </div>
      </div>

      {/* Local Video (PIP) */}
      <div style={{ position: 'absolute', bottom: '8rem', right: '2rem', zIndex: 10, width: '16rem', aspectRatio: '16/9', background: 'rgba(0,0,0,0.8)', borderRadius: '1rem', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        {localStream ? (
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <VideoOff size={24} />
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <button style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Mic size={24} />
          </button>
          <button style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Video size={24} />
          </button>
          <button
            onClick={() => navigate('/')}
            style={{ width: 56, height: 56, borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}
          >
            <PhoneOff size={24} />
          </button>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }} />
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{ width: 56, height: 56, borderRadius: '50%', background: isChatOpen ? '#423FDE' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <MessageSquare size={24} />
          </button>
          <button style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Maximize size={24} />
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && id && (
        <div style={{ position: 'absolute', right: '2rem', top: '5.5rem', bottom: '11rem', width: '24rem', zIndex: 20 }}>
          <ChatBox encounterId={id} />
        </div>
      )}
    </div>
  );
};
