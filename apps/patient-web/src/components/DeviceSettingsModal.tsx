import React from 'react';
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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(12px)'
    }}>
      <div style={{
        background: '#18181B',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%',
        maxWidth: '32rem',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.4)'
        }}>
          <div>
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem', margin: 0, fontFamily: 'Manrope, sans-serif' }}>Audio & Video Settings</h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '0.25rem 0 0 0' }}>Select hardware devices & effects</p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.8)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Camera Selection */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Camera size={16} color="#818cf8" /> Camera
            </label>
            <select
              value={selectedCameraId}
              onChange={(e) => onSwitchCamera(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1rem',
                padding: '0.75rem 1rem',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              {videoInputDevices.length === 0 && <option value="">Default Camera</option>}
              {videoInputDevices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId} style={{ background: '#18181B', color: 'white' }}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Selection */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Mic size={16} color="#34d399" /> Microphone
            </label>
            <select
              value={selectedMicId}
              onChange={(e) => onSwitchMicrophone(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1rem',
                padding: '0.75rem 1rem',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              {audioInputDevices.length === 0 && <option value="">Default Microphone</option>}
              {audioInputDevices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId} style={{ background: '#18181B', color: 'white' }}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>

            {/* Live Mic Test Meter */}
            <div style={{ paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                <span>Input Level</span>
                <span>{audioLevel}%</span>
              </div>
              <div style={{ width: '100%', height: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#10b981',
                    width: `${audioLevel}%`,
                    transition: 'width 75ms ease-out',
                    borderRadius: '999px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Speaker Selection */}
          {audioOutputDevices.length > 0 && (
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Volume2 size={16} color="#c084fc" /> Speakers / Output
              </label>
              <select
                value={selectedSpeakerId}
                onChange={(e) => onSwitchAudioOutput(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  padding: '0.75rem 1rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                {audioOutputDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId} style={{ background: '#18181B', color: 'white' }}>
                    {d.label || `Speaker ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visual Effects */}
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', margin: 0 }}>Background Soft Blur</h4>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Blur room background</p>
                </div>
              </div>
              <button
                onClick={onToggleBlur}
                style={{
                  width: '3rem',
                  height: '1.5rem',
                  borderRadius: '999px',
                  background: isBlurActive ? '#423FDE' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: '0.125rem'
                }}
              >
                <div
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    background: 'white',
                    borderRadius: '50%',
                    transform: isBlurActive ? 'translateX(1.5rem)' : 'translateX(0)',
                    transition: 'transform 200ms ease'
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '1rem',
              background: '#423FDE',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Check size={16} /> Done
          </button>
        </div>
      </div>
    </div>
  );
};
