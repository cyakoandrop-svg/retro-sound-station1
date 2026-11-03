// 外部スロット・演奏データカートリッジの型定義
export type SoundLabChannelId = 'musicbox' | 'piano' | 'guitar' | 'sax' | 'raindrop' | 'ambient';

export interface ChordNoteData {
  name: string;
  notes: number[];   // 和音構成音周波数 (Hz)
  bass: number;      // ベース音周波数 (Hz)
}

export interface RhythmStepTrigger {
  step: number;       // 0〜15 (16分音符のステップ位置)
  pitchOffset?: number; // 移調やオクターブ比率 (例: 2 = 1オクターブ上, 1.498 = 5度音)
  velocity?: number;  // 音量比率 (0.1 〜 1.0)
  duration?: number;  // 発音長 (秒)
  stagger?: number;   // アルペジオずらし幅 (秒)
  noteIndex?: number; // 和音の構成音インデックス (0 = ルート, 1 = 3度, 2 = 5度... 分散和音アルペジオ用)
  noteIndices?: number[]; // 複数構成音の指定
  octaveShift?: number; // オクターブシフト (-1, 0, 1...)
  note?: string;      // 音名指定 (例: "A4", "C5")
  notes?: string[];   // 候補音名の配列（ランダム選定用）
  pitch?: number;     // 周波数直接指定 (Hz)
  probability?: number; // 発音確率 (0.0 〜 1.0, 未指定時は 1.0)
  random?: boolean;   // ランダム音高生成フラグ
  randomWalk?: boolean; // スケール・ランダムウォーク生成フラグ
  isSparkle?: boolean; // 高域きらめき雫フラグ
}

export interface SoundSlotPartChannels {
  bass?: SoundLabChannelId;
  chords?: SoundLabChannelId;
  melody?: SoundLabChannelId;
}

export interface SoundSlotPartMutes {
  bass?: boolean;
  chords?: boolean;
  melody?: boolean;
  drums?: boolean;
}

export interface SoundSlotDrumStep {
  step: number;
  type: string;
  velocity?: number;
}

export interface SoundSlotPattern {
  id: string;
  title: string;
  description: string;
  version: string;
  author?: string;
  styleId?: string; // 伴奏スタイルID ('chill' | 'oriental' | 'cinematic' | 'cascade')
  channel: SoundLabChannelId; // マスターチャンネル（全パート一括）
  partChannels?: SoundSlotPartChannels; // パート別チャンネル設定（個別指定）
  partMutes?: SoundSlotPartMutes; // パート別ミュート設定
  bpm: number;
  chords: ChordNoteData[];
  bassSteps: RhythmStepTrigger[];
  chordSteps: RhythmStepTrigger[];
  melodySteps: RhythmStepTrigger[];
  melodyScale?: number[]; // メロディ用スケール (Hz または周波数比率)
  drumSteps?: SoundSlotDrumStep[];
  drumPatternDescription?: string;
  melodyRules?: Record<string, any>;
}

