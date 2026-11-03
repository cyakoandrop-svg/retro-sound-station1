export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: string;
}

export interface Station {
  frequency: number; // e.g. 88.1
  name: string;
  genre: string;
  description: string;
  tracks: Track[];
  accentColor: string; // Tailwind class
  isSecret?: boolean;
}

export interface DebugLogItem {
  id: string;
  timestamp: string;
  category: 'audio' | 'tuner' | 'timer' | 'system' | 'error';
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

