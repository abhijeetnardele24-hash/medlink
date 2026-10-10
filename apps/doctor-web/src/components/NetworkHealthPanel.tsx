import React from 'react';

interface NetworkHealthPanelProps {
  connectionQuality: 'good' | 'poor' | 'audio-only' | null;
  networkStats: {
    packetLoss: number | null;
    jitter: number | null;
    rtt: number | null;
  };
  isConnected: boolean;
}

export const NetworkHealthPanel: React.FC<NetworkHealthPanelProps> = ({
  connectionQuality,
  networkStats,
  isConnected
}) => {
  if (!isConnected) return null;

  let qualityColor = '#10b981'; // Green
  let qualityText = 'GOOD';
  let qualityIcon = '🟢';

  if (connectionQuality === 'poor' || connectionQuality === 'audio-only') {
    qualityColor = '#ef4444'; // Red
    qualityText = 'POOR';
    qualityIcon = '🔴';
  } else if (networkStats.packetLoss !== null && (networkStats.packetLoss > 0.05 || (networkStats.jitter && networkStats.jitter > 0.03))) {
    qualityColor = '#f59e0b'; // Yellow
    qualityText = 'MODERATE';
    qualityIcon = '🟡';
  }

  const formatPercent = (val: number | null) => val !== null ? `${(val * 100).toFixed(1)}%` : 'N/A';
  const formatMs = (val: number | null) => val !== null ? `${Math.round(val * 1000)} ms` : 'N/A';
  
  // if all are null, it might be checking
  const isChecking = networkStats.packetLoss === null && networkStats.jitter === null && networkStats.rtt === null;

  const modeText = connectionQuality === 'audio-only' ? 'AUDIO' : 'VIDEO';

  return (
    <div style={{
      position: 'absolute',
      top: '5.5rem',
      left: '2rem',
      background: 'rgba(24, 24, 27, 0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0.75rem',
      padding: '1rem',
      color: 'white',
      zIndex: 10,
      width: '16rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
    }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'rgba(255,255,255,0.9)' }}>
        Network Health
      </h3>
      
      {isChecking ? (
        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Checking...</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 700, color: qualityColor }}>
            {qualityIcon} {qualityText}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.75rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Connection</span>
            <span style={{ textAlign: 'right', fontWeight: 500 }}>{isConnected ? 'Connected' : 'Disconnected'}</span>
            
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Packet Loss</span>
            <span style={{ textAlign: 'right', fontWeight: 500 }}>{formatPercent(networkStats.packetLoss)}</span>
            
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Jitter</span>
            <span style={{ textAlign: 'right', fontWeight: 500 }}>{formatMs(networkStats.jitter)}</span>
            
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Mode</span>
            <span style={{ textAlign: 'right', fontWeight: 500, color: modeText === 'AUDIO' ? '#f59e0b' : 'white' }}>{modeText}</span>
          </div>

          {connectionQuality === 'audio-only' && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '0.375rem', fontSize: '0.7rem', color: '#fcd34d', lineHeight: 1.4 }}>
              Poor connection — switched to audio to maintain call quality.
            </div>
          )}
          {qualityText === 'POOR' && connectionQuality !== 'audio-only' && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.375rem', fontSize: '0.7rem', color: '#fca5a5', lineHeight: 1.4 }}>
              Network quality is poor. Video quality may be affected.
            </div>
          )}
        </>
      )}
    </div>
  );
};
