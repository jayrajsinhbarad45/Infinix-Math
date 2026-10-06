'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, FileImage, Loader2, Sparkles, UploadCloud, X } from 'lucide-react';
import { extractMathOcr } from '../lib/api';
import { OcrExtractResponse } from '../lib/types';

interface ImageUploaderProps {
  onExtractionSuccess: (latex: string, response: OcrExtractResponse) => void;
  onError: (errorMessage: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onExtractionSuccess,
  onError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrExtractResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file (PNG, JPEG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('Image size exceeds 10 MB limit');
      return;
    }

    setSelectedFile(file);
    setOcrResult(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Support clipboard paste (e.g. Win+Shift+S screenshot)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const blob = items[i].getAsFile();
        if (blob) {
          handleFileChange(blob);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Run OCR
  const handleExtract = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const response = await extractMathOcr(selectedFile, selectedFile.name);
      setOcrResult(response);
      if (response.success && response.latex) {
        onExtractionSuccess(response.latex, response);
      } else {
        onError('Unable to detect clear mathematical equations in this image');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OCR extraction failed';
      onError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        id="math-image-upload-input"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        id="math-camera-snap-input"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
      />

      {!previewUrl ? (
        <div className="space-y-3">
          <div
            id="dropzone-area"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-950/30 scale-[1.01]'
                : 'border-slate-700/80 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/70'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Drag and drop equation photo, or{' '}
                  <span className="text-indigo-400 underline underline-offset-2">browse files</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PNG, JPEG, WebP up to 10MB • <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700">Ctrl+V</kbd> to paste
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Camera Direct Action Button */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-indigo-400" />
              <span>Take Photo with Camera</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-slate-400" />
              <span>Choose from Gallery</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black/40 border border-slate-800 max-h-56 flex items-center justify-center">
            {/* Preview image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded equation preview"
              className="object-contain max-h-56 max-w-full"
            />
            <button
              type="button"
              id="btn-remove-image"
              onClick={clearSelection}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-rose-900/80 transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400 truncate">
              <FileImage className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{selectedFile?.name}</span>
              <span>({((selectedFile?.size || 0) / 1024).toFixed(0)} KB)</span>
            </div>

            <button
              type="button"
              id="btn-extract-ocr"
              onClick={handleExtract}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Extract with Gemini Vision
                </>
              )}
            </button>
          </div>

          {ocrResult && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Extracted: <code className="bg-emerald-900/40 px-1.5 py-0.5 rounded text-emerald-200 font-mono">{ocrResult.latex}</code></span>
              </div>
              <span className="text-[10px] text-emerald-400/80 shrink-0 font-mono">
                {ocrResult.execution_time_ms} ms
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
