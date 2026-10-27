'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, RefreshCw, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string, lang: string) => void;
}

export function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setPermissionError(null);
    setTranscriptionError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 120) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setPermissionError(
        'Microphone access denied or unavailable. Please allow microphone permissions or type your emergency manually.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    if (isPlaying && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
    setTranscriptionError(null);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    setTranscribing(true);
    setTranscriptionError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'emergency-recording.webm');

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.transcription) {
        onTranscriptionComplete(data.transcription, data.language || 'English');
      } else {
        setTranscriptionError(
          'Voice transcription failed. You can type the emergency manually.'
        );
      }
    } catch (err) {
      setTranscriptionError(
        'Voice transcription service timed out. You can type the emergency manually.'
      );
    } finally {
      setTranscribing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Mic className="w-4 h-4 text-purple-400" />
          <span>Voice Note Emergency Recording</span>
        </label>
        <span className="text-[11px] text-slate-400">Max 120 Seconds</span>
      </div>

      {permissionError && (
        <div className="p-3 bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Record State UI */}
      {!isRecording && !audioBlob && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition-all hover:scale-[1.01]"
        >
          <Mic className="w-5 h-5 animate-pulse" />
          <span>🎙 START RECORDING VOICE NOTE</span>
        </button>
      )}

      {/* Active Recording View */}
      {isRecording && (
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-mono text-xl font-bold text-red-400">
              🔴 RECORDING {formatTimer(recordingTime)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow"
          >
            <Square className="w-4 h-4" />
            <span>STOP RECORDING</span>
          </button>
        </div>
      )}

      {/* Recorded Audio Playback & Action Controls */}
      {audioBlob && !isRecording && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              <button
                type="button"
                onClick={deleteRecording}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>DELETE</span>
              </button>

              <button
                type="button"
                onClick={startRecording}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span>RECORD AGAIN</span>
              </button>
            </div>

            <span className="font-mono text-xs text-slate-400">Duration: {formatTimer(recordingTime)}</span>
          </div>

          <button
            type="button"
            onClick={transcribeAudio}
            disabled={transcribing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {transcribing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Transcribing Speech with OpenAI Whisper...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>TRANSCRIBE WITH AI (WHISPER)</span>
              </>
            )}
          </button>
        </div>
      )}

      {transcriptionError && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{transcriptionError}</span>
        </div>
      )}
    </div>
  );
}
