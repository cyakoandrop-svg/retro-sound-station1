// 本線ラジオチャンネル専用 カセット・セットプレイリスト型定義
export interface ChordDefinition {
  name: string;
  root: number; // Hz
  notes: number[]; // 和音構成音周波数 (Hz)
  bass: number; // ベース音周波数 (Hz)
}

export interface StationDrumPattern {
  kick: number[];
  snare: number[];
  hihat: number[];
}

export interface StationProgression {
  tempo: number;
  tempoPatterns?: number[];
  swing: number;
  chords: ChordDefinition[];
  chordPatterns?: ChordDefinition[][];
  melodyScale: number[];
  melodyScales?: number[][];
  drumPattern: StationDrumPattern;
  drumPatterns?: StationDrumPattern[];
  chordRhythmPatterns?: number[][];
  chordSteps?: number[];
  trackNames?: string[];
}

export interface CassetteTrackItem {
  setNumber: number; // 1, 2, 3...
  title: string;
  artist?: string;
  genre?: string;
  description?: string;
  bpm: number;
  chords: ChordDefinition[];
  drumPattern?: StationDrumPattern;
  chordRhythm?: number[];
  melodyScale?: number[];
}

export interface StationCassettePlaylist {
  type: 'station_cassette_playlist';
  version: '1.0.0';
  frequency: number;
  stationName: string;
  genre: string;
  exportedAt: string;
  description: string;
  tracks: CassetteTrackItem[];
}
