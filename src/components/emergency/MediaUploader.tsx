'use client';

import React, { useState } from 'react';
import { Camera, Video, Trash2, FileCheck, AlertCircle } from 'lucide-react';

interface MediaUploaderProps {
  onMediaSelect?: (files: File[]) => void;
}

export function MediaUploader({ onMediaSelect }: MediaUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files);
    const validMedia: { file: File; preview: string; type: 'image' | 'video' }[] = [];

    for (const file of filesArray) {
      if (file.size > 15 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 15MB size limit.`);
        continue;
      }

      if (file.type.startsWith('image/')) {
        validMedia.push({
          file,
          preview: URL.createObjectURL(file),
          type: 'image',
        });
      } else if (file.type.startsWith('video/')) {
        validMedia.push({
          file,
          preview: URL.createObjectURL(file),
          type: 'video',
        });
      } else {
        setError(`Unsupported format: ${file.name}. Please upload images or videos.`);
      }
    }

    const updated = [...selectedFiles, ...validMedia];
    setSelectedFiles(updated);
    if (onMediaSelect) {
      onMediaSelect(updated.map((m) => m.file));
    }
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    if (onMediaSelect) {
      onMediaSelect(updated.map((m) => m.file));
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
        Optional Incident Media (Image / Video Evidence)
      </label>

      {error && (
        <div className="p-2 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-slate-200 transition-colors">
          <Camera className="w-4 h-4 text-blue-400" />
          <span>Add Photos</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-slate-200 transition-colors">
          <Video className="w-4 h-4 text-purple-400" />
          <span>Add Video</span>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <span className="text-[11px] text-slate-400">Max 15MB per file</span>
      </div>

      {/* Media Previews */}
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {selectedFiles.map((item, idx) => (
            <div key={idx} className="relative group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              {item.type === 'image' ? (
                <img src={item.preview} alt="Evidence preview" className="object-cover w-full h-full" />
              ) : (
                <video src={item.preview} className="object-cover w-full h-full" />
              )}
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-500 transition-colors opacity-90 group-hover:opacity-100"
                title="Remove file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1 left-1.5 text-[10px] bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-300">
                {item.type.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400 italic">
        * Media files are attached to the emergency record as secondary visual evidence for responder triage.
      </p>
    </div>
  );
}
