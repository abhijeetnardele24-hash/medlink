import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface RecordingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingBlob: Blob | null;
  encounterId: string | null;
}

export const RecordingPreviewModal: React.FC<RecordingPreviewModalProps> = ({
  isOpen,
  onClose,
  recordingBlob,
  encounterId
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (recordingBlob) {
      const url = URL.createObjectURL(recordingBlob);
      setVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [recordingBlob]);

  if (!isOpen || !recordingBlob || !videoUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = videoUrl;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `MedLink_Consultation_${encounterId || 'session'}_${timestamp}.mp4`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
          <div>
            <h3 className="text-white font-bold text-lg m-0">Recording Ready</h3>
            <p className="text-xs text-white/50 m-0 mt-1">Review and download your session locally.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-white/10 shadow-inner">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200">
            <strong>Privacy Note:</strong> This recording is stored temporarily in your browser and has not been uploaded to any server. Please download it if you wish to keep it.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white hover:bg-white/10 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-[#0d9488] hover:bg-[#0f766e] text-white transition-colors"
          >
            <Download size={16} />
            Download MP4
          </button>
        </div>
      </div>
    </div>
  );
};
