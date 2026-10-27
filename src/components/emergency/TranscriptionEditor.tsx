'use client';

import React, { useState } from 'react';
import { FileText, Edit3, CheckCircle2, RotateCcw, Globe } from 'lucide-react';

interface TranscriptionEditorProps {
  transcription: string;
  detectedLanguage?: string;
  onAccept: (editedText: string) => void;
  onReRecord?: () => void;
}

export function TranscriptionEditor({
  transcription,
  detectedLanguage = 'English',
  onAccept,
  onReRecord,
}: TranscriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription);
  const [accepted, setAccepted] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    setAccepted(true);
    onAccept(editedText);
  };

  return (
    <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Voice Transcription
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
          <Globe className="w-3 h-3" />
          <span>Language: {detectedLanguage}</span>
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={3}
          className="w-full bg-slate-950 border border-purple-500/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Edit your voice transcription..."
        />
      ) : (
        <blockquote className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-sm text-purple-100 italic leading-relaxed">
          "{editedText}"
        </blockquote>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SAVE EDITS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>[EDIT]</span>
            </button>
          )}

          {onReRecord && (
            <button
              type="button"
              onClick={onReRecord}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>[RECORD AGAIN]</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
            accepted
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{accepted ? '✔ DESCRIPTION ATTACHED' : '[USE THIS DESCRIPTION]'}</span>
        </button>
      </div>
    </div>
  );
}
