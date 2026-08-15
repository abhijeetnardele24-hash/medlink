import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Edit2, Circle, Undo, Download } from 'lucide-react';
import type { WhiteboardStroke } from '../hooks/useWebRTC';

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  strokes: WhiteboardStroke[];
  onSendStroke: (stroke: WhiteboardStroke) => void;
  onClear: () => void;
}

const COLORS = ['#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#A855F7', '#EC4899'];
const BRUSH_SIZES = [2, 4, 8, 14];

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({
  isOpen,
  onClose,
  strokes,
  onSendStroke,
  onClear
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);

  // Redraw all strokes whenever strokes array updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? '#1E1E1E' : stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      ctx.stroke();
    });
  }, [strokes]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setIsDrawing(true);
    currentPoints.current = [{ x, y }];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    currentPoints.current.push({ x, y });

    // Draw live local stroke
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pts = currentPoints.current;
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = isEraser ? '#1E1E1E' : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(pts[pts.length - 2].x * canvas.width, pts[pts.length - 2].y * canvas.height);
      ctx.lineTo(pts[pts.length - 1].x * canvas.width, pts[pts.length - 1].y * canvas.height);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.current.length > 1) {
      onSendStroke({
        color,
        size: brushSize,
        isEraser,
        points: currentPoints.current
      });
    }
    currentPoints.current = [];
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-annotation-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#18181B] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Edit2 size={18} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg font-['Manrope']">Collaborative Whiteboard</h3>
              <p className="text-xs text-white/50">Draw & annotate simultaneously in real time</p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              title="Save Whiteboard image"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all text-xs flex items-center gap-1.5 border border-white/5"
            >
              <Download size={15} /> Save
            </button>
            <button
              onClick={onClear}
              title="Clear all strokes"
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all text-xs flex items-center gap-1.5 border border-red-500/20"
            >
              <Trash2 size={15} /> Clear
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#1E1E1E] relative flex items-center justify-center cursor-crosshair overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Toolbar Footer */}
        <div className="p-4 border-t border-white/10 bg-black/60 flex items-center justify-between flex-wrap gap-4">
          {/* Colors */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60 font-medium mr-1">Color:</span>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setIsEraser(false); }}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform ${color === c && !isEraser ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-80'}`}
              />
            ))}
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isEraser ? 'bg-white text-black border-white' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'}`}
            >
              Eraser
            </button>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 font-medium">Thickness:</span>
            {BRUSH_SIZES.map(s => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${brushSize === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
              >
                <div
                  className="bg-current rounded-full"
                  style={{ width: Math.max(4, s), height: Math.max(4, s) }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
