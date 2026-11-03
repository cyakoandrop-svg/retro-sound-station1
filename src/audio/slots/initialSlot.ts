import { SoundSlotPattern } from '../../types/soundSlot';

// 起動時の空スロット・デフォルト演奏データ（ユーザーが読込・編集・書出するための初期テンプレート）
export const INITIAL_EMPTY_SLOT: SoundSlotPattern = {
  id: 'custom-session-slot',
  title: '新規セッションスロット',
  description: '外部JSONファイルの読み込み、またはチャンネル音源切り替え・演奏スタイル適用で編集・入替可能なスロット',
  version: '1.0.0',
  author: 'User',
  styleId: 'chill',
  channel: 'guitar',
  bpm: 88,
  chords: [
    { name: 'Cmaj7', notes: [261.63, 329.63, 392.00, 493.88], bass: 130.81 },
    { name: 'Am7',   notes: [220.00, 261.63, 329.63, 392.00], bass: 110.00 },
    { name: 'Dm7',   notes: [293.66, 349.23, 440.00, 523.25], bass: 146.83 },
    { name: 'G7',    notes: [196.00, 246.94, 293.66, 349.23], bass: 98.00 }
  ],
  bassSteps: [
    { step: 0, pitchOffset: 1.0, velocity: 0.90, duration: 0.4 },
    { step: 6, pitchOffset: 1.498, velocity: 0.80, duration: 0.3 },
    { step: 10, pitchOffset: 1.0, velocity: 0.85, duration: 0.4 },
    { step: 14, pitchOffset: 1.498, velocity: 0.75, duration: 0.3 }
  ],
  chordSteps: [
    { step: 2, velocity: 0.80, duration: 0.35, stagger: 0.015 },
    { step: 5, velocity: 0.75, duration: 0.35, stagger: 0.015 },
    { step: 8, velocity: 0.70, duration: 0.35, stagger: 0.015 },
    { step: 11, velocity: 0.80, duration: 0.35, stagger: 0.015 },
    { step: 14, velocity: 0.72, duration: 0.35, stagger: 0.015 }
  ],
  melodySteps: [
    { step: 2, pitchOffset: 2.0, velocity: 0.82, duration: 0.4 },
    { step: 5, pitchOffset: 2.247, velocity: 0.85, duration: 0.4 },
    { step: 8, pitchOffset: 2.0, velocity: 0.78, duration: 0.4 },
    { step: 12, pitchOffset: 2.5, velocity: 0.88, duration: 0.4 }
  ],
  melodyScale: [440.00, 493.88, 554.37, 659.25, 739.99, 880.00],
  drumSteps: [
    { step: 0, type: 'kick', velocity: 0.65 },
    { step: 4, type: 'hihat_closed', velocity: 0.40 },
    { step: 8, type: 'snare', velocity: 0.55 },
    { step: 12, type: 'hihat_closed', velocity: 0.40 },
    { step: 14, type: 'hihat_open', velocity: 0.35 }
  ],
  partMutes: {
    melody: false,
    chords: false,
    bass: false,
    drums: false
  }
};
