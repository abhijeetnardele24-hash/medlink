import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Edit2, Download } from 'lucide-react';
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
        maxWidth: '56rem',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        height: '85vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '50%',
              background: 'rgba(66,63,222,0.2)',
              border: '1px solid rgba(66,63,222,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <Edit2 size={18} />
            </div>
            <div>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem', margin: 0, fontFamily: 'Manrope, sans-serif' }}>Collaborative Whiteboard</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Draw & annotate in real time</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleDownload}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <Download size={15} /> Save
            </button>
            <button
              onClick={onClear}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.75rem',
                background: 'rgba(239,68,68,0.1)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.2)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <Trash2 size={15} /> Clear
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                borderRadius: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.8)',
                border: 'none',
                cursor: 'pointer',
                marginLeft: '0.5rem'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div style={{
          flex: 1,
          background: '#1E1E1E',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'crosshair',
          overflow: 'hidden'
        }}>
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Toolbar Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Color:</span>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setIsEraser(false); }}
                style={{
                  backgroundColor: c,
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '50%',
                  border: color === c && !isEraser ? '2px solid white' : 'none',
                  transform: color === c && !isEraser ? 'scale(1.2)' : 'none',
                  cursor: 'pointer'
                }}
              />
            ))}
            <button
              onClick={() => setIsEraser(!isEraser)}
              style={{
                marginLeft: '0.5rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: isEraser ? 'white' : 'rgba(255,255,255,0.05)',
                color: isEraser ? 'black' : 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              Eraser
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Thickness:</span>
            {BRUSH_SIZES.map(s => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: brushSize === s ? '#423FDE' : 'rgba(255,255,255,0.05)',
                  color: brushSize === s ? 'white' : 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  background: 'currentColor',
                  borderRadius: '50%',
                  width: Math.max(4, s),
                  height: Math.max(4, s)
                }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
