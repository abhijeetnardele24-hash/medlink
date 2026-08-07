import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Mic, VideoOff, PhoneOff, Play, Square, UploadCloud, Loader2 } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { auth } from '../lib/firebase';

export const Consultation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { localStream, remoteStream, isConnected, error, startCall, connectionQuality } = useWebRTC(id || null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

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

  const handleStartRecording = () => {
    if (!remoteStream) {
      alert("No remote stream to record yet.");
      return;
    }
    chunksRef.current = [];
    const options = { mimeType: 'video/webm; codecs=vp9' };
    const mediaRecorder = new MediaRecorder(remoteStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordingBlob(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadRecording = async () => {
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
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      
      alert("Recording successfully securely uploaded to Cloud Storage!");
      setRecordingBlob(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload recording.");
    } finally {
      setIsUploading(false);
    }
  };

  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="card text-center p-8 text-red-500">
          <p className="text-xl font-bold">{error}</p>
          <p className="mt-2">Please ensure camera and microphone permissions are granted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0A0A0A] relative flex flex-col h-screen overflow-hidden">
      {/* Remote Video (Main) */}
      <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/50 flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <VideoOff size={32} />
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-white mb-2 font-['Manrope']">Patient is offline</p>
              <p className="text-sm">Click 'Start Call' when you are ready to ring the patient.</p>
            </div>
            {!isConnected && (
              <button 
                onClick={startCall}
                className="btn btn-primary mt-4"
              >
                Start Call (Ring Patient)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white font-['Manrope']">Doctor's Command Center</h2>
          <p className="text-white/70 text-sm flex items-center gap-2 mt-1">
            {isConnected ? (
              <>
                <span className={`w-2 h-2 rounded-full ${connectionQuality === 'good' ? 'bg-green-500' : connectionQuality === 'poor' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                Connected E2EE {connectionQuality !== 'good' && <span className="font-bold">({connectionQuality.toUpperCase()})</span>}
              </>
            ) : (
              "Waiting for connection"
            )}
          </p>
          {/* TODO: Add state machine fallback for offline / chat modes when connection is completely lost */}
        </div>
        
        {/* Recording Status / Upload */}
        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 font-bold animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              REC
            </div>
          )}
          {recordingBlob && !isRecording && (
            <button 
              onClick={uploadRecording}
              disabled={isUploading}
              className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
              {isUploading ? 'Uploading to Cloud...' : 'Upload Recording'}
            </button>
          )}
        </div>
      </div>

      {/* Local Video (PIP) */}
      <div className="absolute bottom-32 right-8 z-10 w-64 aspect-video bg-black/80 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
        {localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <VideoOff size={24} />
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-2xl">
          <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
            <Mic size={24} />
          </button>
          <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
            <Video size={24} />
          </button>
          
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          
          {!isRecording ? (
             <button 
               onClick={handleStartRecording}
               disabled={!remoteStream}
               title="Record Cloud Video"
               className={`w-14 h-14 rounded-full ${remoteStream ? 'bg-white/10 hover:bg-red-500/20 text-white' : 'bg-white/5 text-white/30 cursor-not-allowed'} flex items-center justify-center transition-all`}
             >
               <Play size={24} />
             </button>
          ) : (
            <button 
               onClick={handleStopRecording}
               title="Stop Recording"
               className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg shadow-red-500/20"
             >
               <Square size={20} fill="currentColor" />
             </button>
          )}

          <div className="w-px h-8 bg-white/10 mx-2"></div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg shadow-red-500/20"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
