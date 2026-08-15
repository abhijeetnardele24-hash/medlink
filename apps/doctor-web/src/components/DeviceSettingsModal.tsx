import React, { useState } from 'react';
import { X, Camera, Mic, Volume2, Sparkles, Check } from 'lucide-react';

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioInputDevices: MediaDeviceInfo[];
  videoInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  selectedCameraId: string;
  selectedMicId: string;
  selectedSpeakerId: string;
  onSwitchCamera: (deviceId: string) => void;
  onSwitchMicrophone: (deviceId: string) => void;
  onSwitchAudioOutput: (deviceId: string) => void;
  audioLevel: number;
  isBlurActive: boolean;
  onToggleBlur: () => void;
}

export const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({
  isOpen,
  onClose,
  audioInputDevices,
  videoInputDevices,
  audioOutputDevices,
  selectedCameraId,
  selectedMicId,
  selectedSpeakerId,
  onSwitchCamera,
  onSwitchMicrophone,
  onSwitchAudioOutput,
  audioLevel,
  isBlurActive,
  onToggleBlur
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#18181B] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div>
            <h3 className="text-white font-bold text-xl font-['Manrope']">Audio & Video Settings</h3>
            <p className="text-xs text-white/50 mt-0.5">Customize your hardware devices and effects</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Camera Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <Camera size={16} className="text-blue-400" /> Camera
            </label>
            <select
              value={selectedCameraId}
              onChange={(e) => onSwitchCamera(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              {videoInputDevices.length === 0 && <option value="">Default Camera</option>}
              {videoInputDevices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId} className="bg-neutral-900 text-white">
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <Mic size={16} className="text-emerald-400" /> Microphone
            </label>
            <select
              value={selectedMicId}
              onChange={(e) => onSwitchMicrophone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {audioInputDevices.length === 0 && <option value="">Default Microphone</option>}
              {audioInputDevices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId} className="bg-neutral-900 text-white">
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>

            {/* Live Mic Test Meter */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Input Level</span>
                <span>{audioLevel}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Speaker Selection */}
          {audioOutputDevices.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Volume2 size={16} className="text-purple-400" /> Speakers / Output
              </label>
              <select
                value={selectedSpeakerId}
                onChange={(e) => onSwitchAudioOutput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                {audioOutputDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId} className="bg-neutral-900 text-white">
                    {d.label || `Speaker ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visual Effects / Background Blur */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Background Soft Blur</h4>
                  <p className="text-xs text-white/50">Blur clutter in your room for privacy</p>
                </div>
              </div>
              <button
                onClick={onToggleBlur}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${isBlurActive ? 'bg-blue-600' : 'bg-white/10'}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${isBlurActive ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            <Check size={16} /> Done
          </button>
        </div>
      </div>
    </div>
  );
};
