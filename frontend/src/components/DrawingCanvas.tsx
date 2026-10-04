'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { extractMathOcr } from '../lib/api';
import { OcrExtractResponse } from '../lib/types';

interface DrawingCanvasProps {
  onExtractionSuccess: (latex: string, response: OcrExtractResponse) => void;
  onError: (errorMessage: string) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onExtractionSuccess,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background for optimal OCR contrast
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a'; // Deep slate ink
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), currentData]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    saveState();
    setIsDrawing(true);
    setHasContent(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    ctx?.beginPath();
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setHasContent(false);
    setHistory([]);
  };

  const undoLastStroke = () => {
    if (history.length === 0) {
      clearCanvas();
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const previousState = history[history.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory((prev) => prev.slice(0, -1));
  };

  const recognizeDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;

    setIsProcessing(true);
    try {
      // Export canvas as PNG blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (!blob) {
        throw new Error('Failed to generate image from canvas');
      }

      const response = await extractMathOcr(blob, 'drawing.png');
      if (response.success && response.latex) {
        onExtractionSuccess(response.latex, response);
      } else {
        onError('Unable to recognize formula from handwriting. Please write clearly or try typing.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Handwriting recognition failed';
      onError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">
          Draw or handwrite math formulas directly:
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undoLastStroke}
            disabled={history.length === 0 || isProcessing}
            className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors"
            title="Undo stroke"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            disabled={!hasContent || isProcessing}
            className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-900/50 disabled:opacity-40 rounded-lg transition-colors"
            title="Clear canvas"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative border border-slate-700/80 rounded-xl overflow-hidden shadow-inner bg-white">
        <canvas
          ref={canvasRef}
          width={800}
          height={260}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="w-full h-44 sm:h-52 cursor-crosshair touch-none"
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400/60 text-xs sm:text-sm font-sans">
            Write an equation (e.g., x² + 2x + 1 = 0, or ∫ x dx)
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={recognizeDrawing}
          disabled={!hasContent || isProcessing}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Recognizing...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Transcribe &amp; Load Equation
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
