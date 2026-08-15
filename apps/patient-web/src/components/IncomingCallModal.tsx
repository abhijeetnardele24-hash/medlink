import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export const IncomingCallModal: React.FC = () => {
  const [incomingCall, setIncomingCall] = useState<{ encounterId: string; doctorName: string } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let newSocket: Socket | null = null;
    const initSocket = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
          auth: { token },
        });

        newSocket.on('incoming-call', (data: { encounterId: string; doctorName: string }) => {
          setIncomingCall(data);
          
          // Optional: Play a ringing sound here
          // const audio = new Audio('/ringtone.mp3');
          // audio.play();
        });
      } catch (e) {
        console.error("Socket error", e);
      }
    };

    initSocket();

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [user]);

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        
        {/* Pulsing Avatar/Icon */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-2 bg-blue-100 rounded-full flex items-center justify-center">
            <Phone className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-['Manrope']">Incoming Call</h2>
        <p className="text-gray-600 mb-8">{incomingCall.doctorName} is calling you for your consultation.</p>

        <div className="flex justify-center gap-6">
          <button
            onClick={() => setIncomingCall(null)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all shadow-lg group-hover:shadow-red-500/30">
              <PhoneOff size={24} />
            </div>
            <span className="text-sm font-medium text-gray-600 group-hover:text-red-600">Decline</span>
          </button>

          <button
            onClick={() => {
              navigate(`/consultation/${incomingCall.encounterId}`);
              setIncomingCall(null);
            }}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center group-hover:bg-green-600 transition-all shadow-lg shadow-green-500/30">
              <Phone size={24} className="animate-bounce" />
            </div>
            <span className="text-sm font-medium text-gray-900 group-hover:text-green-600">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};
