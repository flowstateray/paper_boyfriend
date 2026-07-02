'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoicePlayerProps {
  audioUri?: string;
  text?: string;
  speaker?: string;
}

const SPEAKER_VOICE_MAP: Record<string, string> = {
  'zh_male_taocheng_uranus_bigtts': 'zh-CN-YunxiNeural',
  'zh_male_m191_uranus_bigtts': 'zh-CN-YunjianNeural',
  'zh_female_vv_uranus_bigtts': 'zh-CN-XiaoxiaoNeural',
};

export default function VoicePlayer({ audioUri, text, speaker }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<number | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUri]);

  const getTargetVoice = useCallback((targetVoiceName: string) => {
    const voices = voicesRef.current;
    
    const exactMatch = voices.find(v => v.name === targetVoiceName);
    if (exactMatch) return exactMatch;

    const langMatch = voices.find(v => v.lang === 'zh-CN' && v.name.includes('Yunxi'));
    if (langMatch) return langMatch;

    const maleMatch = voices.find(v => v.lang === 'zh-CN' && v.name.includes('Male'));
    if (maleMatch) return maleMatch;

    const chineseMatch = voices.find(v => v.lang === 'zh-CN');
    if (chineseMatch) return chineseMatch;

    return voices.find(v => v.lang.startsWith('zh'));
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.speechSynthesis.cancel();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    const targetVoiceName = speaker ? SPEAKER_VOICE_MAP[speaker] : 'zh-CN-YunxiNeural';

    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      const targetVoice = getTargetVoice(targetVoiceName);
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setDuration(text.length * 0.18);
        let currentProgress = 0;
        timerRef.current = window.setInterval(() => {
          currentProgress += (100 / ((text.length * 0.18) * 10));
          if (currentProgress >= 100) {
            currentProgress = 100;
            if (timerRef.current) clearInterval(timerRef.current);
          }
          setProgress(currentProgress);
        }, 100);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setProgress(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else if (audioUri) {
      const audio = audioRef.current;
      if (audio) {
        audio.play();
        setIsPlaying(true);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[120px]">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0">
        {formatDuration(duration)}
      </span>
      {audioUri && <audio ref={audioRef} src={audioUri} />}
    </div>
  );
}