'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Eye, Box, Layers, ShieldAlert, Check } from 'lucide-react';
import { AccidentDetectionResult } from '@/types/emergency';

interface ImageAnalyzerProps {
  onObservationsExtracted: (observations: string[], indicators: string[], detectionOutput?: any, accidentDetection?: AccidentDetectionResult) => void;
}

export function ImageAnalyzer({ onObservationsExtracted }: ImageAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setError(null);
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setAnalysisResult(null);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const res = await fetch('/api/emergency/analyze-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setAnalysisResult(data);
        onObservationsExtracted(
          data.observations || [],
          data.indicators || [],
          data.detection_output,
          data.accident_detection
        );
      } else {
        setError(data.error || 'Image analysis unavailable.');
      }
    } catch (err: any) {
      setError(`Image analysis connection error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const accidentDetection: AccidentDetectionResult | undefined = analysisResult?.accident_detection;
  const detectionOutput = analysisResult?.detection_output;
  const objectCounts = detectionOutput?.object_counts;
  const boundingBoxes = detectionOutput?.bounding_boxes || [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <span>📷 Computer Vision Accident Detection</span>
        </label>
        <span className="text-[10px] text-blue-400 font-mono font-bold bg-blue-950 px-2 py-0.5 rounded border border-blue-500/30">
          CAD / YOLO PRETRAINED
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Select Photo Buttons */}
      {!selectedImage && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold p-3.5 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Camera className="w-4 h-4 text-blue-400" />
            <span>TAKE PHOTO</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold p-3.5 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>UPLOAD IMAGE</span>
          </button>
        </div>
      )}

      {/* Image Preview & Bounding Box Overlay */}
      {selectedImage && imagePreview && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
            <img src={imagePreview} alt="Incident Scene" className="w-full h-full object-contain" />

            {/* Bounding Box Overlay */}
            {showBoundingBoxes && analysisResult && boundingBoxes.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {boundingBoxes.map((boxItem: any, idx: number) => {
                  const { box, label, class: boxClass } = boxItem;
                  let colorClass = 'border-blue-500 bg-blue-500/10 text-blue-300';
                  if (boxClass === 'Damaged Vehicle') colorClass = 'border-amber-500 bg-amber-500/15 text-amber-300';
                  if (boxClass === 'Smoke / Fire') colorClass = 'border-red-500 bg-red-500/15 text-red-300';
                  if (boxClass === 'People') colorClass = 'border-emerald-500 bg-emerald-500/15 text-emerald-300';

                  return (
                    <div
                      key={idx}
                      className={`absolute border-2 rounded ${colorClass} transition-all`}
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                      }}
                    >
                      <span className="absolute -top-5 left-0 bg-slate-950/90 border border-slate-700 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow">
                        🎯 {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyzeImage}
              disabled={analyzing}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow transition-all uppercase tracking-wider"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running Computer Vision Model...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>ANALYZE ACCIDENT SCENE IMAGE</span>
                </>
              )}
            </button>

            {analysisResult && (
              <button
                type="button"
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition ${
                  showBoundingBoxes ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Bounding Box Overlay"
              >
                <Layers className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleRemoveImage}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl flex items-center justify-center text-xs font-bold border border-slate-700"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>

          {/* ACCIDENT CLASSIFICATION OUTPUT UI CARD (Section 3 Requirement) */}
          {accidentDetection && (
            <div className="bg-slate-900 border-2 border-emerald-500/50 p-4 rounded-xl space-y-3 text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-extrabold text-emerald-400 uppercase tracking-wider text-sm">
                    {accidentDetection.accident_detected ? '🚨 ACCIDENT DETECTED' : 'NO ACCIDENT DETECTED'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Confidence</span>
                  <span className="text-emerald-400 font-extrabold font-mono text-sm">
                    {(accidentDetection.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Incident Type</span>
                  <span className="text-white font-extrabold text-xs">{accidentDetection.incident_type}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Detected Objects</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {accidentDetection.detected_objects.map((obj, i) => (
                      <span key={i} className="bg-blue-950 text-blue-300 font-mono font-bold px-1.5 py-0.5 rounded text-[10px] border border-blue-500/30">
                        • {obj}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extra Object Counts */}
              {objectCounts && (
                <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-center">
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block">Vehicles</span>
                    <span className="text-blue-400 font-bold">{objectCounts.vehicles}</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block">People</span>
                    <span className="text-emerald-400 font-bold">{objectCounts.people}</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block">Smoke/Fire</span>
                    <span className="text-red-400 font-bold">{objectCounts.smoke_fire > 0 ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block">Road Block</span>
                    <span className="text-amber-400 font-bold">{accidentDetection.road_blockage_detected ? 'YES' : 'NO'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
