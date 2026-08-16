import React, { useEffect, useRef } from 'react';
import { MicOff, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  isAudioMuted?: boolean;
  name?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  stream, 
  isLocal = false, 
  isAudioMuted = false,
  name = "Participant",
  className = "" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Check if we actually have a valid video track
  const hasVideo = stream && stream.getVideoTracks().length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800 ${className}`}
    >
      {stream && hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Never play our own audio back to ourselves to prevent echo
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`} // Mirror local video
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-400 font-medium">Camera Off</p>
        </div>
      )}

      {/* Name and Status Overlay */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
        <span className="text-sm font-medium text-white">{name} {isLocal && "(You)"}</span>
        {isAudioMuted && (
          <div className="bg-red-500/20 p-1 rounded-md">
            <MicOff className="w-3 h-3 text-red-500" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
