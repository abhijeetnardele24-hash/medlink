import React, { useEffect, useState } from 'react';

interface DebugProps {
  pc: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  socket: any;
}

export const WebRTCDebugger: React.FC<DebugProps> = ({ pc, localStream, remoteStream, socket }) => {
  const [stats, setStats] = useState<any>({});
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const newStats: any = {
        camera: localStream ? `Yes (${localStream.getVideoTracks().length}V, ${localStream.getAudioTracks().length}A)` : 'No',
        localVideoTrackReadyState: localStream?.getVideoTracks()[0]?.readyState || 'N/A',
        localVideoTrackEnabled: localStream?.getVideoTracks()[0]?.enabled !== false ? 'Yes' : 'No',
        socketConnected: socket?.connected ? 'Yes' : 'No',
        iceState: pc?.iceConnectionState || 'N/A',
        connState: pc?.connectionState || 'N/A',
        signalingState: pc?.signalingState || 'N/A',
        remoteStream: remoteStream ? `Yes (${remoteStream.getVideoTracks().length}V, ${remoteStream.getAudioTracks().length}A)` : 'No',
        senders: pc?.getSenders().length || 0,
        receivers: pc?.getReceivers().length || 0,
      };

      if (pc) {
        try {
          const rtcStats = await pc.getStats();
          let framesSent = 0;
          let framesReceived = 0;
          let bytesSent = 0;
          let bytesReceived = 0;
          
          rtcStats.forEach((report) => {
            if (report.type === 'outbound-rtp' && report.kind === 'video') {
              framesSent = report.framesEncoded || 0;
              bytesSent = report.bytesSent || 0;
            }
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              framesReceived = report.framesDecoded || 0;
              bytesReceived = report.bytesReceived || 0;
            }
          });
          
          newStats.framesSent = framesSent;
          newStats.framesReceived = framesReceived;
          newStats.bytesSent = bytesSent;
          newStats.bytesReceived = bytesReceived;
        } catch (e) {}
      }
      setStats(newStats);
    }, 1000);
    return () => clearInterval(interval);
  }, [pc, localStream, remoteStream, socket]);

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: '#0f0', padding: 20, fontFamily: 'monospace', fontSize: 12, borderRadius: 8, border: '1px solid #0f0' }}>
      <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>WebRTC Diagnostics</h3>
      <table style={{ width: '100%', textAlign: 'left' }}>
        <tbody>
          <tr><th>Camera Success</th><td>{stats.camera}</td></tr>
          <tr><th>Local Track Ready</th><td>{stats.localVideoTrackReadyState}</td></tr>
          <tr><th>Local Track Enabled</th><td>{stats.localVideoTrackEnabled}</td></tr>
          <tr><th>Socket.io</th><td>{stats.socketConnected}</td></tr>
          <tr><th>Connection State</th><td>{stats.connState}</td></tr>
          <tr><th>ICE State</th><td>{stats.iceState}</td></tr>
          <tr><th>Signaling State</th><td>{stats.signalingState}</td></tr>
          <tr><th>Senders</th><td>{stats.senders}</td></tr>
          <tr><th>Receivers</th><td>{stats.receivers}</td></tr>
          <tr><th>Remote Stream</th><td>{stats.remoteStream}</td></tr>
          <tr><th>Video Frames Sent</th><td>{stats.framesSent}</td></tr>
          <tr><th>Video Frames Rcvd</th><td>{stats.framesReceived}</td></tr>
          <tr><th>Video Bytes Sent</th><td>{stats.bytesSent}</td></tr>
          <tr><th>Video Bytes Rcvd</th><td>{stats.bytesReceived}</td></tr>
        </tbody>
      </table>
    </div>
  );
};
