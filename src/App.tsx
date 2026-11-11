import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Radio, 
  Info, 
  Power,
  Target,
  Coffee,
  Moon,
  Timer,
  Clock,
  Minimize2,
  RotateCcw,
  Search,
  Shuffle,
  Palette,
  Eye,
  Sliders,
  Bell,
  Zap,
  Music,
  Flame,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Volume2,
  VolumeX,
  Sun
} from 'lucide-react';
import { STATIONS } from './data';
import { Station } from './types';
import Visualizer from './components/Visualizer';
import TapeDeck from './components/TapeDeck';
import RadioTuner from './components/RadioTuner';
import Equalizer from './components/Equalizer';
import { retroMusicBox } from './audio/retroMusicBox';
import { retroLoungePiano } from './audio/retroLoungePiano';
import { acousticJazzDrums } from './audio/acousticJazzDrums';
import { toneDrumKit } from './audio/toneDrumKit';
import { tokyoMorningBossaGuitar } from './audio/tokyoMorningBossaGuitar';
import { raindropMelody } from './audio/raindropMelody';
import { aquaBubbleChords } from './audio/aquaBubbleChords';
import { shibuyaSynthBrass } from './audio/shibuyaSynthBrass';
import { shibuyaDaylightWoodBass } from './audio/shibuyaDaylightWoodBass';
import { shibuyaSaxophone } from './audio/shibuyaSaxophone';
import { shibuyaNeoRocaGuitar } from './audio/shibuyaNeoRocaGuitar';
import { electroHealing } from './audio/electroHealing';
import { BackgroundTimer } from './utils/backgroundTimer';

// 各FMステーションに対応するコード進行・スケール・ドラムパターンの定義
interface ChordDefinition {
  name: string;
  root: number; // Hz
  notes: number[]; // Hz list for 7th/9th chord
  bass: number; // Hz
}

interface StationProgression {
  tempo: number;
  tempoPatterns?: number[]; // テンポパターンのバリエーション（3種類）
  swing: number; // Swing time factor (0 - 0.2)
  chords: ChordDefinition[]; // 4小節のコード進行
  chordPatterns?: ChordDefinition[][]; // パターンごとのコード進行バリエーション
  melodyScale: number[]; // メロディ用スケール
  melodyScales?: number[][]; // パターンごとのメロディスケール
  drumPattern: {
    kick: number[]; // 16ステップの打点 (1 = ON, 0 = OFF, 0.5 = soft)
    snare: number[];
    hihat: number[];
  };
  drumPatterns?: Array<{ // リズムパターンのバリエーション（3種類）
    kick: number[];
    snare: number[];
    hihat: number[];
  }>;
  chordRhythmPatterns?: number[][]; // コードリズムパターンのバリエーション（3種類）
  chordSteps?: number[];
  trackNames?: string[];
}

// 92.4MHz 本線トラック2 (Daylight Blues: 12小節ブルース用 Eブルース・スケール: E, G, A, Bb, B, D)
const E_BLUES_SCALE = [
  164.81, // E3
  196.00, // G3
  220.00, // A3
  233.08, // Bb3 (Blue Note)
  246.94, // B3
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  466.16, // Bb4 (Blue Note)
  493.88, // B4
  587.33, // D5
  659.25, // E5
];

// 88.1 MHz: TOKYO MORNING BOSSA (Bossa Nova Chord Progression: Dm9 - G7(13) - CM7(9) - Am7)
const CHORD_PROGRESSIONS: { [key: number]: StationProgression } = {
  76.0: { // ELECTRO HEALING (エレクトロ・ヒーリング)
    tempo: 52,
    tempoPatterns: [48, 66, 56, 52], // パターン0: 48 BPM(古寺瞑想), パターン1: 66 BPM(隊商パルス), パターン2: 56 BPM(星辰の海), パターン3: 52 BPM(波の呼吸)
    swing: 0.0,
    chords: [
      { name: "Dm9", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63, 329.63], bass: 73.42 },
      { name: "Gadd9/B", root: 123.47, notes: [123.47, 196.00, 246.94, 293.66, 392.00], bass: 61.74 },
      { name: "Bbmaj7", root: 116.54, notes: [116.54, 146.83, 174.61, 220.00, 261.63], bass: 58.27 },
      { name: "Asus4(b9)", root: 110.00, notes: [110.00, 146.83, 220.00, 233.08, 329.63], bass: 55.00 }
    ],
    chordPatterns: [
      // パターン0 (Sanctuary / シルクロード・悠久の祈り): チベット瞑想ドリアン和声 (Dm9 - Gadd9/B - Bbmaj7 - Asus4(b9))
      // 悠久の自然と寺院の祈りを描く、深遠で穏やかなモーダル進行
      [
        { name: "Dm9", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63, 329.63], bass: 73.42 },
        { name: "Gadd9/B", root: 123.47, notes: [123.47, 196.00, 246.94, 293.66, 392.00], bass: 61.74 },
        { name: "Bbmaj7", root: 116.54, notes: [116.54, 146.83, 174.61, 220.00, 261.63], bass: 58.27 },
        { name: "Asus4(b9)", root: 110.00, notes: [110.00, 146.83, 220.00, 233.08, 329.63], bass: 55.00 }
      ],
      // パターン1 (Oasis Caravan / 幽玄なオアシス・隊商の旅路): 中東ハーモニックマイナー・ヒジャーズ調 (Gm9 - Ebmaj7#11 - Cm9 - D7b9)
      // 砂漠の夜を渡る隊商の歩みとエキゾチックな緊張・解決をもたらす神秘的和声
      [
        { name: "Gm9", root: 196.00, notes: [196.00, 233.08, 293.66, 349.23, 440.00], bass: 49.00 },
        { name: "Ebmaj7#11", root: 155.56, notes: [155.56, 196.00, 233.08, 293.66, 440.00], bass: 77.78 },
        { name: "Cm9", root: 130.81, notes: [130.81, 155.56, 196.00, 233.08, 293.66], bass: 65.41 },
        { name: "D7(b9)", root: 146.83, notes: [146.83, 185.00, 220.00, 261.63, 311.13], bass: 73.42 }
      ],
      // パターン2 (Celestial Aurora / 天空・星辰の海): リディアン＆天体クォーラル和声 (Cmaj9#11 - Em11 - Fmaj9 - G6/9)
      // 重力を脱ぎ去り、宇宙の星屑とオーロラが広がる透明で美しい長調・天体進行
      [
        { name: "Cmaj9(#11)", root: 130.81, notes: [130.81, 164.81, 196.00, 246.94, 293.66, 369.99], bass: 65.41 },
        { name: "Em11", root: 164.81, notes: [164.81, 196.00, 246.94, 293.66, 349.23, 440.00], bass: 82.41 },
        { name: "Fmaj9", root: 174.61, notes: [174.61, 220.00, 261.63, 329.63, 392.00], bass: 87.31 },
        { name: "G6/9", root: 196.00, notes: [196.00, 246.94, 293.66, 329.63, 440.00], bass: 98.00 }
      ],
      // パターン3 (Ocean Swell / 穏やかな海と波のうねり): Fmaj9 - Am7(11) - Bbmaj9 - Cadd9
      // 陽光きらめく穏やかな海と波の満ち引きを描く、開放的で透明なオーシャン・アンビエント和声
      [
        { name: "Fmaj9", root: 174.61, notes: [174.61, 220.00, 261.63, 329.63, 392.00], bass: 43.65 },
        { name: "Am7(11)", root: 220.00, notes: [164.81, 220.00, 261.63, 293.66, 329.63], bass: 55.00 },
        { name: "Bbmaj9", root: 116.54, notes: [116.54, 174.61, 220.00, 261.63, 293.66], bass: 58.27 },
        { name: "Cadd9", root: 130.81, notes: [130.81, 164.81, 196.00, 246.94, 293.66], bass: 65.41 }
      ]
    ],
    melodyScale: [146.83, 174.61, 196.00, 220.00, 246.94, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25],
    melodyScales: [
      // パターン0 (シルクロード・悠久の祈り): D In-Scale / メディタティブ・ドリアン音階 (D, F, G, A, B, C, D, E)
      [146.83, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33],
      // パターン1 (幽玄なオアシス・隊商の旅路): G ハーモニックマイナー＆ヒジャーズ音階 (G, Ab, B, C, D, Eb, F#)
      [196.00, 207.65, 246.94, 261.63, 293.66, 311.13, 369.99, 392.00, 415.30, 493.88, 523.25, 587.33, 622.25],
      // パターン2 (天空・星辰の海): C リディアン＆天体クリスタルスケール (C, D, E, F#, G, A, B)
      [261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 739.99, 783.99, 880.00],
      // パターン3 (穏やかな海と波 / F Major Ocean Scale): F, G, A, Bb, C, D
      [174.61, 196.00, 220.00, 233.08, 261.63, 293.66, 349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 698.46]
    ],
    drumPattern: {
      kick:  [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0], // 儀礼太鼓
      snare: [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0], // シンギングボウル
      hihat: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0]  // 風鈴
    },
    drumPatterns: [
      {
        // パターン0 (悠久の祈り): 小節頭の大地の一打、シンギングボウル、澄んだ風鈴
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        snare: [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0],
        hihat: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0]
      },
      {
        // パターン1 (オアシス隊商): 民族フレームドラムのシンコペーショングルーヴ ＆ フィンガーシンバル
        kick:  [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
        hihat: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0]
      },
      {
        // パターン2 (星辰の海): ドラム完全排除（無重力）、963Hz天体ソルフェジオベルと星屑チャイム
        kick:  [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
        hihat: [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 0,  0, 0, 1, 0]
      },
      {
        // パターン3 (穏やかな海と波): ドラム・スネアなし、水面のきらめきと光のリフレクション
        kick:  [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        hihat: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0]
      }
    ],
    chordRhythmPatterns: [
      [0],           // パターン0: 1小節まるごと悠久に鳴り響くチベット瞑想シンセパッド
      [0, 8],        // パターン1: 隊商の足取りに合わせた2拍周期のパッドスウィープ
      [0, 6, 12],    // パターン2: 星辰の満ち引きを描く3拍周期の天体オーロラパッド
      [0]            // パターン3: 波の満ち引きに同調するオーシャン・シンセパッド
    ]
  },
  88.1: {
    tempo: 80, // 作業用リラックス・ボサノヴァテンポ (80 BPM)
    tempoPatterns: [72, 80, 88, 76],
    swing: 0.05,
    trackNames: [
      'Morning Light',
      'Sunlit Breeze',
      'Café da Manhã',
      'Warm Breeze'
    ],
    chords: [
      { name: "Dm9", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63, 329.63], bass: 73.42 },     // Dm9 (最高音: E4 329.63Hz)
      { name: "G7(13)", root: 196.00, notes: [174.61, 196.00, 246.94, 329.63], bass: 98.00 },          // G7(13) (高すぎたE5/A4を排除し中低域ボイシング F3, G3, B3, E4)
      { name: "CM7(9)", root: 130.81, notes: [130.81, 164.81, 196.00, 246.94, 293.66], bass: 65.41 },   // CM7(9) (最高音: D4 293.66Hz)
      { name: "Am7", root: 220.00, notes: [196.00, 220.00, 261.63, 329.63], bass: 110.00 }             // Am7 (最高音: E4 329.63Hz)
    ],
    chordPatterns: [
      // パターン0 (イパネマ風/基本ボサノバ): Dm9 - G7(13) - CM7(9) - Am7
      [
        { name: "Dm9", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63, 329.63], bass: 73.42 },
        { name: "G7(13)", root: 196.00, notes: [174.61, 196.00, 246.94, 329.63], bass: 98.00 },
        { name: "CM7(9)", root: 130.81, notes: [130.81, 164.81, 196.00, 246.94, 293.66], bass: 65.41 },
        { name: "Am7", root: 220.00, notes: [196.00, 220.00, 261.63, 329.63], bass: 110.00 }
      ],
      // パターン1 (プロジェクト 2): FM7(9) - G7(13) - Em7 - Am7
      [
        { name: "FM7(9)", root: 174.61, notes: [164.81, 174.61, 220.00, 261.63, 329.63], bass: 87.31 },
        { name: "G7(13)", root: 196.00, notes: [174.61, 196.00, 246.94, 329.63], bass: 98.00 },
        { name: "Em7", root: 164.81, notes: [164.81, 196.00, 246.94, 293.66], bass: 82.41 },
        { name: "Am7", root: 220.00, notes: [196.00, 220.00, 261.63, 329.63], bass: 110.00 }
      ],
      // パターン2 (名称未設定 2 楽譜コード進行): CM7(9) - Am9 - FM7(9) - G7(13)
      [
        { name: "CM7(9)", root: 130.81, notes: [130.81, 164.81, 196.00, 246.94, 293.66], bass: 65.41 },
        { name: "Am9", root: 220.00, notes: [196.00, 220.00, 246.94, 261.63, 329.63], bass: 110.00 },
        { name: "FM7(9)", root: 174.61, notes: [164.81, 174.61, 220.00, 261.63, 329.63], bass: 87.31 },
        { name: "G7(13)", root: 196.00, notes: [174.61, 196.00, 246.94, 329.63], bass: 98.00 }
      ],
      // パターン3 (★Warm Breeze - 分散和音 F-1-3-5-3): FM7(9) - Em7(11) - Dm9 - CM7(9)
      [
        { name: "FM7(9)", root: 174.61, notes: [174.61, 220.00, 261.63, 329.63, 392.00], bass: 87.31 },
        { name: "Em7(11)", root: 164.81, notes: [164.81, 196.00, 246.94, 293.66, 329.63], bass: 82.41 },
        { name: "Dm9", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63, 329.63], bass: 73.42 },
        { name: "CM7(9)", root: 130.81, notes: [130.81, 164.81, 196.00, 246.94, 293.66], bass: 65.41 }
      ]
    ],
    melodyScale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25], // C Major / Bossa Scale
    drumPattern: {
      kick:  [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0], // 連打排除: 1拍目(0)と3拍目(8)のゆったりとしたスルド打音
      snare: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0], // 2拍目(4)と4拍目(12)の落ち着いたクロススティック
      hihat: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0]  // 8分音符連打を解消し、4分音符(0, 4, 8, 12)の穏やかなシェイカー刻み
    },
    drumPatterns: [
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0],
        hihat: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0]
      },
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0], // 2拍目のみの極めてシンプルなワンショット
        hihat: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0]  // 2拍・4拍のペダルハット
      },
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0.8, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0],
        hihat: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0]
      },
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0],
        hihat: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0]
      }
    ],
    chordRhythmPatterns: [
      [0, 10],
      [0, 6, 12],
      [0, 4, 8, 12],
      [0, 2, 4, 6, 7, 8, 10, 12, 14, 15]
    ]
  },
  92.4: { // SHIBUYA DAYLIGHT GROOVE (City Pop, 12-Bar Blues & Neo-Rockabilly Twist)
    tempo: 90,
    tempoPatterns: [90, 94, 96, 110],
    swing: 0.08,
    chords: [
      { name: "F#m7(11)", root: 185.00, notes: [185.00, 220.00, 246.94, 277.18, 329.63], bass: 92.50 }, // F#3(Root), A3(m3), B3(11), C#4(5), E4(m7), bass: F#2
      { name: "G#m(b13)", root: 207.65, notes: [207.65, 246.94, 311.13, 329.63], bass: 103.83 },        // G#3(Root), B3(m3), D#4(5), E4(b13), bass: G#2
      { name: "Amaj7", root: 220.00, notes: [220.00, 277.18, 329.63, 415.30], bass: 110.00 },             // A3(Root), C#4(3), E4(5), G#4(M7), bass: A2
      { name: "G#m7(b13)", root: 207.65, notes: [207.65, 246.94, 311.13, 329.63, 369.99], bass: 103.83 } // G#3(Root), B3(m3), D#4(5), E4(b13), F#4(m7), bass: G#2
    ],
    chordPatterns: [
      // パターン0: 爽やかな渋谷の昼下がり・シティポップ (F#m7(11) - G#m(b13) - Amaj7 - G#m7(b13))
      [
        { name: "F#m7(11)", root: 185.00, notes: [185.00, 220.00, 246.94, 277.18, 329.63], bass: 92.50 },
        { name: "G#m(b13)", root: 207.65, notes: [207.65, 246.94, 311.13, 329.63], bass: 103.83 },
        { name: "Amaj7", root: 220.00, notes: [220.00, 277.18, 329.63, 415.30], bass: 110.00 },
        { name: "G#m7(b13)", root: 207.65, notes: [207.65, 246.94, 311.13, 329.63, 369.99], bass: 103.83 }
      ],
      // パターン1: 92.4MHz 本線トラック2 (Daylight Blues: 12小節ブルース & サックス / E7 - A7 - B7 - Turnaround)
      [
        { name: "E7", root: 82.41, notes: [164.81, 207.65, 246.94, 293.66], bass: 82.41 },
        { name: "E7", root: 82.41, notes: [164.81, 207.65, 246.94, 293.66], bass: 82.41 },
        { name: "E7", root: 82.41, notes: [164.81, 207.65, 246.94, 293.66], bass: 82.41 },
        { name: "E7", root: 82.41, notes: [164.81, 207.65, 246.94, 293.66], bass: 82.41 },
        { name: "A7", root: 110.00, notes: [220.00, 277.18, 329.63, 392.00], bass: 110.00 },
        { name: "A7", root: 110.00, notes: [220.00, 277.18, 329.63, 392.00], bass: 110.00 },
        { name: "E7", root: 82.41, notes: [164.81, 207.65, 246.94, 293.66], bass: 82.41 },
        { name: "E7", root: 82.41, notes: [164.81, 207.65, 246.94, 293.66], bass: 82.41 },
        { name: "B7", root: 123.47, notes: [246.94, 311.13, 369.99, 440.00], bass: 123.47 },
        { name: "A7", root: 110.00, notes: [220.00, 277.18, 329.63, 392.00], bass: 110.00 },
        { name: "E7", root: 82.41, notes: [164.81, 207.65, 246.94, 293.66], bass: 82.41 },
        { name: "B7", root: 123.47, notes: [246.94, 311.13, 369.99, 440.00], bass: 123.47 }
      ],
      // パターン2: 軽快なサンシャイン・シティポップ (Amaj7 - B7 - G#m7 - C#m7)
      [
        { name: "Amaj7", root: 220.00, notes: [220.00, 277.18, 329.63, 415.30], bass: 110.00 },
        { name: "B7", root: 246.94, notes: [246.94, 311.13, 369.99, 440.00], bass: 123.47 },
        { name: "G#m7", root: 207.65, notes: [207.65, 246.94, 311.13, 369.99], bass: 103.83 },
        { name: "C#m7", root: 277.18, notes: [277.18, 329.63, 415.30, 493.88], bass: 138.59 }
      ],
      // パターン3: Cat・street・Twist (Neo-Roca) - 80s ネオロカビリー・ツイスト (C6 → Am7 → F6 → G7)
      [
        { name: "C6", root: 130.81, notes: [164.81, 196.00, 220.00, 261.63], bass: 65.41 },
        { name: "Am7", root: 110.00, notes: [164.81, 196.00, 220.00, 261.63], bass: 55.00 },
        { name: "F6", root: 87.31, notes: [174.61, 220.00, 261.63, 293.66], bass: 43.65 },
        { name: "G7", root: 98.00, notes: [174.61, 196.00, 246.94, 293.66], bass: 49.00 }
      ]
    ],
    melodyScale: [185.00, 207.65, 220.00, 246.94, 277.18, 329.63, 370.00, 415.30, 440.00], // E Major / F# Minor
    melodyScales: [
      [185.00, 207.65, 220.00, 246.94, 277.18, 329.63, 370.00, 415.30, 440.00], // パターン0: E Major / F# Minor
      E_BLUES_SCALE, // パターン1: 92.4MHz 本線トラック2 E ブルース・スケール (ブルーノート入り)
      [185.00, 207.65, 220.00, 246.94, 277.18, 329.63, 370.00, 415.30, 440.00], // パターン2: E Major / F# Minor
      // パターン3: C ロカビリー・ロックンロール・スケール (ブルーノート Eb, F#, Bb を交えたホットなロカビリー音階)
      [261.63, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 440.00, 466.16, 523.25, 587.33, 622.25, 659.26, 739.99, 783.99, 880.00, 932.33, 1046.50]
    ],
    drumPattern: {
      kick:  [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 0, 0],
      snare: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
      hihat: [0.6, 0.2, 0.5, 0.2,  0.6, 0.2, 0.8, 0.2,  0.6, 0.2, 0.5, 0.2,  0.6, 0.2, 0.9, 0.3]
    },
    drumPatterns: [
      // パターン1: 爽やかな渋谷の昼下がり・シティポップビート
      {
        kick:  [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
        hihat: [0.6, 0.2, 0.5, 0.2,  0.6, 0.2, 0.8, 0.2,  0.6, 0.2, 0.5, 0.2,  0.6, 0.2, 0.9, 0.3]
      },
      // パターン2: 92.4MHz 本線トラック2 12小節ブルース・シャッフルビート
      {
        kick:  [1, 0, 0, 0,  0, 0, 1, 0,  1, 0, 0, 0,  0, 0, 1, 0],
        snare: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
        hihat: [0.6, 0.2, 0.8, 0.2,  0.6, 0.2, 0.8, 0.2,  0.6, 0.2, 0.8, 0.2,  0.6, 0.2, 0.8, 0.2]
      },
      // パターン3: 陽だまりのメロウ・デイタイム（ソフト＆エアリー）
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0.75, 0, 0, 0,  0, 0, 0, 0,  0.75, 0, 0, 0],
        hihat: [0.5, 0.15, 0.4, 0.15,  0.5, 0.15, 0.6, 0.15,  0.5, 0.15, 0.4, 0.15,  0.5, 0.15, 0.7, 0.2]
      },
      // パターン4 (インデックス3): Cat・street・Twist (Neo-Roca) - 熱狂のネオロカビリー・シャッフル＆ツイストビート（スネア・バックビート＋裏拍ゴーストノート＋跳ねるハット）
      {
        kick:  [1.0, 0, 0, 0,   0, 0, 0.85, 0,  0.95, 0, 0, 0,   0, 0, 0.80, 0],
        snare: [0, 0, 0, 0,    1.0, 0, 0, 0.35,  0, 0, 0, 0,    1.0, 0, 0, 0.40],
        hihat: [0.65, 0, 0.45, 0.60,  0.65, 0, 0.85, 0.50,  0.65, 0, 0.45, 0.60,  0.65, 0, 0.88, 0.50]
      }
    ],
    chordRhythmPatterns: [
      [0, 6, 12],
      [0, 6, 12],            // ブルース用ブラススタブアクセント
      [0, 3, 6, 10, 12, 14], // 軽快なシティポップ・カッティング
      [2, 4, 6, 10, 12, 14]  // ネオロカビリー・ホローボディギター＆ホーンスタブ
    ]
  },
  97.5: { // AKIHABARA CRONOS (Retro Ambient Chill & Yoimiya Minimal & Retro Quest)
    tempo: 68,
    tempoPatterns: [64, 68, 72, 76],
    swing: 0.12,
    chords: [
      { name: "F△7", root: 174.61, notes: [174.61, 220.00, 261.63, 329.63], bass: 87.31 },
      { name: "Em7", root: 164.81, notes: [164.81, 196.00, 246.94, 293.66], bass: 82.41 },
      { name: "E♭△7", root: 155.56, notes: [155.56, 196.00, 233.08, 293.66], bass: 77.78 },
      { name: "Dm7", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63], bass: 73.42 }
    ],
    chordPatterns: [
      // パターン0 (元あった既存パターン: 昭和レトロラジオ・オルゴール音源による分散和音)
      [
        { name: "F△7", root: 174.61, notes: [174.61, 220.00, 261.63, 329.63], bass: 87.31 },
        { name: "Em7", root: 164.81, notes: [164.81, 196.00, 246.94, 293.66], bass: 82.41 },
        { name: "E♭△7", root: 155.56, notes: [155.56, 196.00, 233.08, 293.66], bass: 77.78 },
        { name: "Dm7", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63], bass: 73.42 }
      ],
      // パターン1 (元あった既存パターン: レトロ・アンビエント調)
      [
        { name: "Cmaj7", root: 130.81, notes: [261.63, 392.00, 493.88, 659.25], bass: 130.81 },
        { name: "Am9", root: 110.00, notes: [220.00, 329.63, 392.00, 523.25], bass: 110.00 },
        { name: "Fm", root: 87.31, notes: [174.61, 415.30, 523.25], bass: 87.31 },
        { name: "G7", root: 98.00, notes: [196.00, 293.66, 349.23, 493.88], bass: 98.00 }
      ],
      // パターン2 (宵宮の調べ × ミニマル・ポリリズム - Am → Fmaj7 → G → Em)
      [
        { name: "Am", root: 220.00, notes: [220.00, 261.63, 329.63, 440.00], bass: 110.00 },
        { name: "Fmaj7", root: 174.61, notes: [174.61, 220.00, 261.63, 329.63], bass: 87.31 },
        { name: "G", root: 196.00, notes: [196.00, 246.94, 293.66, 392.00], bass: 98.00 },
        { name: "Em", root: 164.81, notes: [164.81, 196.00, 246.94, 329.63], bass: 82.41 }
      ],
      // パターン3 (★NEW: 昭和レトロRPG風・オルゴール行進曲: Am → Dm7 → E7 → Am)
      [
        { name: "Am", root: 110.00, notes: [110.00, 130.81, 164.81, 220.00], bass: 110.00 },
        { name: "Dm7", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63], bass: 73.42 },
        { name: "E7", root: 164.81, notes: [164.81, 207.65, 246.94, 293.66], bass: 82.41 },
        { name: "Am", root: 110.00, notes: [110.00, 130.81, 164.81, 220.00], bass: 110.00 }
      ]
    ],
    melodyScale: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
    melodyScales: [
      // パターン0 (元あったスケール)
      [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
      // パターン1 (元あったスケール)
      [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
      // パターン2 (宵宮の調べ - ヨナ抜き/Aマイナー・ペンタトニック)
      [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00],
      // パターン3 (★NEW: 昭和レトロRPG風: 15音協和スケール)
      [261.63, 293.66, 329.63, 349.23, 415.30, 440.00, 493.88, 523.25, 587.33, 659.26, 698.46, 830.61, 880.00, 987.77, 1046.50]
    ],
    drumPattern: {
      kick:  [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 0],
      snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
      hihat: [0.3, 0, 0.2, 0,  0.3, 0, 0.2, 0,  0.3, 0, 0.2, 0,  0.3, 0, 0.2, 0]
    },
    drumPatterns: [
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        hihat: [0.3, 0, 0.2, 0,  0.3, 0, 0.2, 0,  0.3, 0, 0.2, 0,  0.3, 0, 0.2, 0]
      },
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        hihat: [0, 0, 0, 0,  0.25, 0, 0, 0,  0, 0, 0, 0,  0.25, 0, 0, 0]
      },
      {
        kick:  [0.6, 0, 0, 0,  0, 0, 0, 0,  0.4, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        hihat: [0.2, 0, 0.15, 0,  0.2, 0, 0.15, 0,  0.2, 0, 0.15, 0,  0.2, 0, 0.15, 0]
      },
      {
        // パターン3 (Retro Quest): ドラムなし（オルゴール澄んだ独奏）
        kick:  [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
        hihat: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      }
    ],
    chordRhythmPatterns: [
      [0, 10],   // パターン0 (元あったリズム)
      [0, 8],    // パターン1 (元あったリズム)
      [0, 6, 12], // パターン2 (宵宮ミニマル用)
      [2, 6, 10, 14] // パターン3 (★NEW: 昭和RPG風アルペジオ)
    ]
  },
  101.5: { // GINZA MIDNIGHT CLUB (Jazz Study & Luxury Neo-Soul & 80s City Pop Progressions)
    tempo: 75,
    tempoPatterns: [72, 75, 88],
    swing: 0.12,
    chords: [
      { name: "Dm7", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63], bass: 73.42 },
      { name: "G7", root: 196.00, notes: [196.00, 246.94, 293.66, 349.23], bass: 48.99 },
      { name: "Cmaj7", root: 130.81, notes: [130.81, 164.81, 196.00, 246.94], bass: 65.41 },
      { name: "A7b9", root: 110.00, notes: [110.00, 138.59, 164.81, 196.00, 233.08], bass: 55.00 }
    ],
    chordPatterns: [
      // パターン0 (サティ風ジムノペディ調)
      [
        { name: "Dm7", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63], bass: 73.42 },
        { name: "G7", root: 196.00, notes: [196.00, 246.94, 293.66, 349.23], bass: 48.99 },
        { name: "Cmaj7", root: 130.81, notes: [130.81, 164.81, 196.00, 246.94], bass: 65.41 },
        { name: "A7b9", root: 110.00, notes: [110.00, 138.59, 164.81, 196.00, 233.08], bass: 55.00 }
      ],
      // パターン1 (大人の夜にふさわしいラグジュアリーなジャズ・ネオソウル調)
      [
        { name: "Cmaj9", root: 130.81, notes: [130.81, 196.00, 246.94, 293.66, 329.63, 392.00, 493.88, 587.33], bass: 65.41 },
        { name: "A7b9", root: 110.00, notes: [110.00, 196.00, 277.18, 329.63, 392.00, 466.16, 554.37, 659.25], bass: 55.00 },
        { name: "Dm9", root: 146.83, notes: [146.83, 220.00, 349.23, 523.25, 659.25, 698.46], bass: 73.42 },
        { name: "F/G", root: 98.00, notes: [98.00, 146.83, 349.23, 440.00, 523.25, 698.46, 880.00], bass: 98.00 }
      ],
      // パターン2 (★NEW: ベイサイド・トワイライト・ハイウェイ 80sシティポップ進行: FM9 → Em7 → Dm9 → Cmaj9)
      [
        { name: "FM9", root: 174.61, notes: [174.61, 220, 261.63, 329.63, 392], bass: 87.31 },
        { name: "Em7", root: 164.81, notes: [164.81, 196, 246.94, 293.66], bass: 82.41 },
        { name: "Dm9", root: 146.83, notes: [146.83, 174.61, 220, 261.63, 329.63], bass: 73.42 },
        { name: "Cmaj9", root: 130.81, notes: [130.81, 164.81, 196, 246.94, 293.66], bass: 65.41 }
      ]
    ],
    melodyScale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25],
    melodyScales: [
      // パターン0 (サティ風)
      [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25],
      // パターン1 (ネオソウル)
      [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25],
      // パターン2 (ベイサイド・トワイライト 15音完全協和スケール)
      [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.26, 698.46, 783.99, 880, 987.77, 1046.5]
    ],
    drumPattern: {
      kick:  [1, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0,  0, 0, 0, 0],
      snare: [0, 0, 0, 0,  0.85, 0, 0, 0,  0, 0, 0, 0,  0.85, 0, 0, 0],
      hihat: [0.75, 0, 0.45, 0,  0.95, 0, 0.45, 0,  0.75, 0, 0.45, 0,  0.95, 0, 0.45, 0]
    },
    drumPatterns: [
      // パターン0: クラシック・ジャズラウンジ（1・3拍キックフェザリング ＆ 2・4拍の確実なスネア/リム）
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0.85, 0, 0, 0,  0, 0, 0, 0,  0.85, 0, 0, 0],
        hihat: [0.75, 0, 0.45, 0,  0.95, 0, 0.45, 0,  0.75, 0, 0.45, 0,  0.95, 0, 0.45, 0]
      },
      // パターン1: ミッドナイト・ジャズスウィング（安定した2・4拍バックビートとライドシンバル刻み）
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0.85, 0, 0, 0,  0, 0, 0, 0,  0.85, 0, 0, 0],
        hihat: [0.70, 0, 0.40, 0,  0.90, 0, 0.40, 0,  0.70, 0, 0.40, 0,  0.90, 0, 0.40, 0]
      },
      // パターン2: ★NEW: ベイサイド・トワイライト 80sシティポップ ダンサブル・グルーヴ
      {
        kick:  [0.95, 0, 0, 0,  0, 0, 0, 0,  0.85, 0, 0.75, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0.90, 0, 0, 0,  0, 0, 0, 0,  0.92, 0, 0, 0],
        hihat: [0, 0, 0.65, 0,  0, 0, 0.75, 0,  0, 0, 0, 0.60,  0, 0, 0.80, 0]
      }
    ],
    chordRhythmPatterns: [
      [0, 8],
      [0, 10],
      [2, 4, 7, 10, 12, 15] // パターン2: 16分音符の裏拍・シンコペーションを強調したピアノカッティング
    ]
  },
  105.8: { // ROPPONGI Petrichor FM (Pattern 0: Rainy Lofi, Pattern 1: Raindrop Ragtime, Pattern 2: Debussy Rêverie Arpeggio)
    tempo: 70,
    tempoPatterns: [70, 92, 70],
    swing: 0.14,
    chords: [
      { name: "Fmaj7", root: 174.61, notes: [174.61, 220.00, 261.63, 329.63], bass: 87.31 },
      { name: "Fm6", root: 174.61, notes: [174.61, 207.65, 261.63, 293.66], bass: 87.31 },
      { name: "Cmaj7", root: 261.63, notes: [130.81, 196.00, 246.94, 329.63], bass: 65.41 },
      { name: "C7", root: 261.63, notes: [130.81, 196.00, 233.08, 329.63], bass: 65.41 }
    ],
    chordPatterns: [
      // パターン0: チル雨音 (Fmaj7 - Fm6 - Cmaj7 - C7)
      [
        { name: "Fmaj7", root: 174.61, notes: [174.61, 220.00, 261.63, 329.63], bass: 87.31 },
        { name: "Fm6", root: 174.61, notes: [174.61, 207.65, 261.63, 293.66], bass: 87.31 },
        { name: "Cmaj7", root: 261.63, notes: [130.81, 196.00, 246.94, 329.63], bass: 65.41 },
        { name: "C7", root: 261.63, notes: [130.81, 196.00, 233.08, 329.63], bass: 65.41 }
      ],
      // パターン1: 水滴ラグタイム (F - D7 - Gm7 - C7 / 軽快なジャズ・ラグ進行)
      [
        { name: "F", root: 174.61, notes: [174.61, 220.00, 261.63, 349.23], bass: 87.31 },
        { name: "D7", root: 146.83, notes: [146.83, 185.00, 220.00, 261.63], bass: 73.42 },
        { name: "Gm7", root: 196.00, notes: [196.00, 233.08, 293.66, 349.23], bass: 98.00 },
        { name: "C7", root: 130.81, notes: [130.81, 164.81, 196.00, 233.08, 293.66], bass: 65.41 }
      ],
      // パターン2: ドビュッシー「夢」水滴分散和音アルペジオ (Fmaj9 - Dm9 - Bbmaj7(#11) - C9sus4)
      [
        { name: "Fmaj9", root: 174.61, notes: [174.61, 220.00, 261.63, 329.63, 392.00], bass: 87.31 },
        { name: "Dm9", root: 146.83, notes: [146.83, 174.61, 220.00, 261.63, 329.63], bass: 73.42 },
        { name: "Bbmaj7(#11)", root: 116.54, notes: [116.54, 146.83, 174.61, 220.00, 329.63], bass: 58.27 },
        { name: "C9sus4", root: 130.81, notes: [130.81, 174.61, 196.00, 233.08, 293.66], bass: 65.41 }
      ]
    ],
    melodyScale: [174.61, 196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25],
    melodyScales: [
      [174.61, 196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25],
      [174.61, 196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25],
      [349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 932.33, 1046.50, 1174.66, 1318.51]
    ],
    drumPattern: {
      kick:  [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 0, 0],
      snare: [0, 0, 0, 0,  0.8, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0],
      hihat: [1, 0, 0.6, 0,  1, 0, 0.6, 0,  1, 0, 0.6, 0,  1, 0, 0.6, 0]
    },
    drumPatterns: [
      // パターン0: チルホップ雨音ビート
      {
        kick:  [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0.8, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0],
        hihat: [1, 0, 0.6, 0,  1, 0, 0.6, 0,  1, 0, 0.6, 0,  1, 0, 0.6, 0]
      },
      // パターン1: 軽快なラグタイム・ストライド2ビート (ブン・チャッ・ブン・チャッ)
      {
        kick:  [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0.85, 0, 0, 0,  0, 0, 0, 0,  0.85, 0, 0, 0],
        hihat: [0.8, 0, 0.55, 0,  0.9, 0, 0.55, 0,  0.8, 0, 0.55, 0,  0.9, 0, 0.55, 0]
      },
      // パターン2: 105.8MHz 六本木本線直系 チルホップ雨音ビート (キック: 0, 6, 10拍 / スネア: 4, 12拍 / 8分ハット)
      {
        kick:  [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 0, 0],
        snare: [0, 0, 0, 0,  0.8, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0],
        hihat: [1, 0, 0.6, 0,  1, 0, 0.6, 0,  1, 0, 0.6, 0,  1, 0, 0.6, 0]
      }
    ],
    chordRhythmPatterns: [
      [0, 10],
      [4, 12],
      [0, 1, 2, 5, 7, 8, 9, 10, 13, 15] // パターン2: 5拍目・7拍目を休符にしたアルペジオ
    ]
  }
};




// 旋律生成用の状態管理
interface MelodyState {
  scaleIdx: number;       // 現在のスケールインデックス
  direction: 1 | -1;      // 現在の進行方向 (1: 上昇, -1: 下降)
  sameDirCount: number;   // 現在の方向に進んだ回数
  minDirSteps: number;    // 現在の方向を維持すべき最低歩数 (2〜4)
  history?: number[];     // 直近の使用音インデックス履歴（偏り分散用）
}

const melodyStates: { [freq: number]: MelodyState } = {};

// 曲頭のイントロバリエーション構成定義 (5〜8種類の開始パターン)
interface IntroPattern {
  register: 'low' | 'mid' | 'high';
  direction: 1 | -1 | 0; // 1: 上昇, -1: 下降, 0: 同音付近
  rhythm: 'long' | 'rest' | 'motif';
  density: 'sparse' | 'moderate' | 'active_end';
}

const INTRO_PATTERNS: IntroPattern[] = [
  { register: 'low', direction: 1, rhythm: 'long', density: 'sparse' },
  { register: 'mid', direction: -1, rhythm: 'rest', density: 'moderate' },
  { register: 'high', direction: 1, rhythm: 'motif', density: 'active_end' },
  { register: 'mid', direction: 0, rhythm: 'long', density: 'sparse' },
  { register: 'low', direction: -1, rhythm: 'motif', density: 'moderate' },
  { register: 'high', direction: -1, rhythm: 'rest', density: 'sparse' },
  { register: 'mid', direction: 1, rhythm: 'motif', density: 'active_end' },
  { register: 'low', direction: 0, rhythm: 'rest', density: 'moderate' },
];

let currentIntroPattern: IntroPattern = INTRO_PATTERNS[0];

// 88.1MHz ボサノヴァ用 1小節メロディパターン生成用の状態・構造体
interface BossaMelodyStepInfo {
  step: number;
  isLanding: boolean; // 長音で着地するかどうか
  duration?: number;  // 個別の音価指定 (s)
}

let currentBossaBarId = -1;
let currentBossaBarPattern: BossaMelodyStepInfo[] = [];

// 105.8MHz 雨音メロディ用 1小節雨粒ステップイベント構造体
interface RaindropStepEvent {
  step: number;
  duration: number;
  volMultiplier: number;
  isSparkle: boolean;
  humanOffsetSec: number;
}

let currentRaindropBarId = -1;
let currentRaindropBarEvents: RaindropStepEvent[] = [];

let currentRagtimeBarId = -1;
let currentRagtimeBarEvents: RaindropStepEvent[] = [];

let lastDebussyMelodyPitch = 523.25; // C5 (ドビュッシー旋律の直前音程保持)

interface YoimiyaStepEvent {
  step: number;
  duration: number;
  volMultiplier: number;
  isHighRegister?: boolean;
  isLanding?: boolean;
}

let currentYoimiyaBarId = -1;
let currentYoimiyaBarEvents: YoimiyaStepEvent[] = [];

interface RetroQuestStepEvent {
  step: number;
  duration: number;
  volMultiplier: number;
  isAccent?: boolean;
  hasGraceNote?: boolean;
}

let currentRetroQuestBarId = -1;
let currentRetroQuestBarEvents: RetroQuestStepEvent[] = [];

/**
 * 曲全体のコード進行を先に生成し、1曲全体を解析してから最も自然な開始音と開始コードを決定する関数。
 * 曲全体の流れから逆算し、局の基準キーやトニック、開始コードを初期位置や基準として使用しない。
 * 毎曲異なる多様で自然な開始音を生成する。
 */
function getSongFlowStartMelody(
  scale: number[],
  chords: { notes: number[]; root: number }[],
  pitchMultiplier: number
): { startIdx: number; direction: 1 | -1 } {
  const scaleLen = scale.length;
  const shiftedScale = scale.map((n) => n * pitchMultiplier);

  // 1曲全体のコード進行全体に曲ごとのランダムな揺らぎ・展開を与えて解析し、音響的重心を算出
  let totalPitchSum = 0;
  let totalCount = 0;
  chords.forEach((chord, cIdx) => {
    const chordFactor = 1 + (Math.sin(cIdx * 1.5 + Math.random() * 2) * 0.05);
    chord.notes.forEach((note) => {
      totalPitchSum += note * pitchMultiplier * chordFactor;
      totalCount++;
    });
  });
  const avgFlowPitch = totalCount > 0 ? totalPitchSum / totalCount : shiftedScale[Math.floor(scaleLen / 2)];

  // 曲全体の流れから逆算して、最も自然な開始音のスケールインデックスを決定
  let bestIdx = Math.floor(scaleLen * 0.5);
  let minDiff = Infinity;
  shiftedScale.forEach((sNote, idx) => {
    const diff = Math.abs(sNote - avgFlowPitch);
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = idx;
    }
  });

  // 曲全体のコード進行の推移傾向（上行・下行モーメンタム）から逆算して進行方向を決定
  let upwardMomentum = 0;
  for (let i = 0; i < chords.length - 1; i++) {
    if (chords[i + 1].root >= chords[i].root) {
      upwardMomentum++;
    }
  }
  // ランダムな揺らぎを加えて毎回異なる進行方向に分岐させる
  const momentumBias = (Math.random() - 0.5) * 0.6;
  const direction: 1 | -1 = (upwardMomentum / chords.length + momentumBias) >= 0.5 ? 1 : -1;

  // 開始位置を全体スケール内で広く動的にランダム分散（固定トニックやホームポジションへの帰還処理なし）
  const spread = Math.floor(scaleLen * 0.4);
  const randomShift = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
  const finalIdx = Math.max(0, Math.min(scaleLen - 1, bestIdx + randomShift));

  return { startIdx: finalIdx, direction };
}

/**
 * 88.1MHz ボサノヴァ用 1小節 (16step) のメロディリズムパターン生成
 * 最初の2小節 (totalBar === 0 または 1) は選択されたイントロパターンを反映し、
 * 3小節目以降は選択されたボサノヴァパターン（パターン0 / パターン1）に応じた生成ルールへ自然に接続する。
 */
function generateBossaMelodySteps(
  totalBar: number,
  intro: IntroPattern,
  bossaPatternIndex: number = 0
): BossaMelodyStepInfo[] {
  const result: BossaMelodyStepInfo[] = [];

  if (bossaPatternIndex === 3) {
    // パターン3 (★Warm Breeze - 案A: 心地よいボサノヴァ・ランダムリズム生成):
    // 4小節進行 (FM7 - Em7 - Dm9 - CM7) の骨格と歌心を保ちつつ、小節ごと・コーラスごとに
    // 洗練されたシンコペーション、裏拍、アンティシペーション、休符のゆらぎを動的に演出
    const barInProg = totalBar % 4;
    // 4小節（1コーラス）ごとのランダムフレーズ型 (0: クラシック, 1: シンコペーション, 2: アンティシペーション, 3: レイドバック・歌心)
    const phraseType = Math.abs((Math.floor(totalBar / 4) * 3 + totalBar) % 4);

    if (barInProg === 0) {
      // 1小節目 (FM7): 歌い出しの優美なモチーフ
      if (phraseType === 1) {
        // シンコペーション型: 2(弱), 6(裏拍), 10(着地)
        result.push({ step: 2, isLanding: false, duration: 0.45 });
        result.push({ step: 6, isLanding: false, duration: 0.55 });
        result.push({ step: 10, isLanding: true, duration: 0.85 });
      } else if (phraseType === 2) {
        // アンティシペーション型: 4(拍2), 8(拍3), 14(次小節への食い込み)
        result.push({ step: 4, isLanding: false, duration: 0.55 });
        result.push({ step: 8, isLanding: true, duration: 0.70 });
        result.push({ step: 14, isLanding: false, duration: 0.40 });
      } else if (phraseType === 3) {
        // レイドバック型: 0(小節頭の提示), 6(シンコペーション)
        result.push({ step: 0, isLanding: false, duration: 0.60 });
        result.push({ step: 6, isLanding: true, duration: 0.90 });
      } else {
        // クラシック型: 4(拍2), 8(拍3のロング着地)
        result.push({ step: 4, isLanding: false, duration: 0.65 });
        result.push({ step: 8, isLanding: true, duration: 0.85 });
      }
    } else if (barInProg === 1) {
      // 2小節目 (Em7): 自然な応答と展開
      if (phraseType === 1) {
        result.push({ step: 2, isLanding: false, duration: 0.45 });
        result.push({ step: 8, isLanding: true, duration: 0.85 });
      } else if (phraseType === 2) {
        result.push({ step: 4, isLanding: false, duration: 0.55 });
        result.push({ step: 10, isLanding: true, duration: 0.80 });
      } else if (phraseType === 3) {
        result.push({ step: 6, isLanding: false, duration: 0.50 });
        result.push({ step: 10, isLanding: true, duration: 0.85 });
      } else {
        result.push({ step: 4, isLanding: false, duration: 0.65 });
        result.push({ step: 8, isLanding: true, duration: 0.85 });
      }
    } else if (barInProg === 2) {
      // 3小節目 (Dm9): 情感豊かなクライマックス（短3度Fと長9度Eの歌心・B音クラッシュ防止協和音階）
      if (phraseType === 1) {
        // 0拍頭から6拍裏への流れるようなフレーズ
        result.push({ step: 0, isLanding: false, duration: 0.55 });
        result.push({ step: 6, isLanding: false, duration: 0.45 });
        result.push({ step: 10, isLanding: true, duration: 0.85 });
      } else if (phraseType === 2) {
        // 2拍裏からの応答と8拍着地
        result.push({ step: 2, isLanding: false, duration: 0.50 });
        result.push({ step: 8, isLanding: true, duration: 0.90 });
      } else if (phraseType === 3) {
        // 0拍頭の豊かなロングトーン
        result.push({ step: 0, isLanding: true, duration: 1.10 });
        result.push({ step: 10, isLanding: false, duration: 0.45 });
      } else {
        // 原型の安定進行: 0, 8
        result.push({ step: 0, isLanding: false, duration: 0.65 });
        result.push({ step: 8, isLanding: true, duration: 0.85 });
      }
    } else {
      // 4小節目 (CM7): 調性解決と穏やかなブレス（次コーラスへの準備）
      if (phraseType === 1) {
        result.push({ step: 4, isLanding: false, duration: 0.55 });
        result.push({ step: 8, isLanding: true, duration: 0.70 });
        result.push({ step: 12, isLanding: false, duration: 0.40 });
      } else if (phraseType === 2) {
        result.push({ step: 6, isLanding: false, duration: 0.50 });
        result.push({ step: 10, isLanding: true, duration: 0.85 });
      } else if (phraseType === 3) {
        // 温かな解決ロングトーン (1.05s)
        result.push({ step: 4, isLanding: true, duration: 1.05 });
      } else {
        result.push({ step: 4, isLanding: false, duration: 0.65 });
        result.push({ step: 8, isLanding: true, duration: 0.85 });
      }
    }
    return result;
  }

  const isFirstTwoBars = (totalBar === 0 || totalBar === 1);

  if (isFirstTwoBars && intro) {
    if (totalBar === 0) {
      if (intro.rhythm === 'long') {
        result.push({ step: 0, isLanding: true, duration: 1.4 });
        result.push({ step: 6, isLanding: false, duration: 0.22 });
        if (intro.density !== 'sparse') {
          result.push({ step: 8, isLanding: true, duration: 0.8 });
          result.push({ step: 12, isLanding: false, duration: 0.22 });
        }
      } else if (intro.rhythm === 'rest') {
        result.push({ step: 4, isLanding: false, duration: 0.22 });
        result.push({ step: 8, isLanding: true, duration: 0.8 });
        if (intro.density === 'active_end' || intro.density === 'moderate') {
          result.push({ step: 12, isLanding: false, duration: 0.3 });
          result.push({ step: 14, isLanding: false, duration: 0.22 });
        }
      } else if (intro.rhythm === 'motif') {
        result.push({ step: 0, isLanding: false, duration: 0.22 });
        result.push({ step: 2, isLanding: false, duration: 0.22 });
        result.push({ step: 4, isLanding: true, duration: 0.65 });
        result.push({ step: 8, isLanding: false, duration: 0.22 });
        result.push({ step: 10, isLanding: false, duration: 0.22 });
      }
    } else {
      // 2小節目 (totalBar === 1)
      if (intro.density === 'sparse') {
        result.push({ step: 0, isLanding: true, duration: 1.1 });
      } else if (intro.density === 'moderate') {
        result.push({ step: 0, isLanding: false, duration: 0.25 });
        result.push({ step: 4, isLanding: true, duration: 0.7 });
        result.push({ step: 10, isLanding: true, duration: 0.5 });
      } else if (intro.density === 'active_end') {
        result.push({ step: 4, isLanding: true, duration: 0.7 });
        result.push({ step: 12, isLanding: false, duration: 0.22 });
        result.push({ step: 14, isLanding: false, duration: 0.22 });
        result.push({ step: 15, isLanding: true, duration: 0.4 });
      } else {
        result.push({ step: 0, isLanding: true, duration: 0.8 });
        result.push({ step: 6, isLanding: true, duration: 0.6 });
      }
    }
    return result.sort((a, b) => a.step - b.step);
  }

  // 3小節目以降は選択されたパターンに合わせたコール＆レスポンス構造へ自然に接続
  const isOddBarCall = totalBar % 2 === 0; // 0, 2, 4... は第1小節 (Odd Bar / Call)

  if (bossaPatternIndex === 2) {
    // パターン2: 楽譜「プロジェクト 3」4/4拍子 8分音符・4分音符のみのメロディーリズム (偶数ステップ [0, 2, 6, 10, 14])
    if (isOddBarCall) {
      const callPatterns = [
        [0, 2, 6, 10, 14],
        [0, 4, 8, 12],
        [2, 6, 10, 14],
        [0, 2, 8, 10, 14],
      ];
      const pattern = callPatterns[Math.floor(Math.random() * callPatterns.length)];
      pattern.forEach((st, idx) => {
        result.push({
          step: st,
          isLanding: idx === pattern.length - 1,
          duration: idx === pattern.length - 1 ? 0.85 : 0.45,
        });
      });
    } else {
      const responsePatterns = [
        [2, 6, 10, 14],
        [0, 4, 8, 12, 14],
        [2, 4, 8, 12],
        [0, 6, 10, 14],
      ];
      const pattern = responsePatterns[Math.floor(Math.random() * responsePatterns.length)];
      pattern.forEach((st, idx) => {
        result.push({
          step: st,
          isLanding: idx === pattern.length - 1,
          duration: idx === pattern.length - 1 ? 0.80 : 0.40,
        });
      });
    }
  } else if (bossaPatternIndex === 1) {
    // パターン1: 楽譜「プロジェクト 2」のコード・ベースリズム(0, 1, 3, 6, 8, 9, 11, 14)に調和するメロディーリズム
    if (isOddBarCall) {
      const callPatterns = [
        { mainSteps: [0, 3], endSteps: [11, 14] },
        { mainSteps: [1, 6], endSteps: [14] },
        { mainSteps: [0, 6], endSteps: [11, 14] },
        { mainSteps: [3, 8], endSteps: [14] },
        { mainSteps: [0, 8], endSteps: [11, 14] },
      ];

      const pattern = callPatterns[Math.floor(Math.random() * callPatterns.length)];

      pattern.mainSteps.forEach((st) => {
        result.push({
          step: st,
          isLanding: true,
          duration: 0.75,
        });
      });

      pattern.endSteps.forEach((st) => {
        result.push({
          step: st,
          isLanding: false,
          duration: 0.24,
        });
      });
    } else {
      const responsePatterns = [
        [0, 1, 3, 6, 8],
        [1, 3, 6, 9, 11],
        [0, 3, 6, 11, 14],
        [0, 1, 6, 8, 11],
        [3, 6, 8, 11, 14],
      ];

      const pattern = responsePatterns[Math.floor(Math.random() * responsePatterns.length)];
      const noteCount = Math.floor(Math.random() * 3) + 3;
      const selectedSteps = pattern.slice(0, noteCount).sort((a, b) => a - b);

      selectedSteps.forEach((st, idx) => {
        const isLast = idx === selectedSteps.length - 1;
        result.push({
          step: st,
          isLanding: isLast,
          duration: isLast ? 0.70 : 0.24,
        });
      });
    }
  } else {
    // パターン0: 従来パターン (イパネマの娘風リズム)
    if (isOddBarCall) {
      const callPatterns = [
        { mainSteps: [0], endSteps: [14, 15] },
        { mainSteps: [2], endSteps: [13, 14] },
        { mainSteps: [0, 6], endSteps: [14] },
        { mainSteps: [3], endSteps: [14, 15] },
        { mainSteps: [0, 8], endSteps: [15] },
      ];

      const pattern = callPatterns[Math.floor(Math.random() * callPatterns.length)];

      pattern.mainSteps.forEach((st) => {
        result.push({
          step: st,
          isLanding: true,
          duration: 0.75,
        });
      });

      pattern.endSteps.forEach((st) => {
        result.push({
          step: st,
          isLanding: false,
          duration: 0.22,
        });
      });
    } else {
      const responsePatterns = [
        [0, 3, 6, 10],
        [0, 4, 7, 10, 12],
        [2, 5, 8, 12],
        [0, 3, 6, 9, 12],
        [0, 4, 8, 11, 14],
      ];

      const pattern = responsePatterns[Math.floor(Math.random() * responsePatterns.length)];
      const noteCount = Math.floor(Math.random() * 3) + 3;
      const selectedSteps = pattern.slice(0, noteCount).sort((a, b) => a - b);

      selectedSteps.forEach((st, idx) => {
        const isLast = idx === selectedSteps.length - 1;
        result.push({
          step: st,
          isLanding: isLast,
          duration: isLast ? 0.65 : 0.22,
        });
      });
    }
  }

  return result.sort((a, b) => a.step - b.step);
}

/**
 * ボサノヴァ Pattern 2 用 Voice Leading（ボイシング選択）関数
 * 既存のコード進行（和音名・ルート音等）は一切変更せず、
 * 直前小節のボイシング(prevNotes)に対してトップノートおよび内声の音高変化が最も滑らかになる
 * 転回形（オクターブ位置選択）を返します。
 */
function getVoiceLedNotes(currentNotes: number[], prevNotes: number[] | null): number[] {
  // 和音の各音をギター中低音域（120Hz〜350Hz）に正規化し、最高音が高くなりすぎないように制御
  const normalizePitch = (freq: number): number => {
    let p = freq;
    while (p > 350.0) p *= 0.5;
    while (p < 120.0) p *= 2.0;
    return p;
  };

  const normalized = currentNotes.map(normalizePitch).sort((a, b) => a - b);
  if (!prevNotes || prevNotes.length === 0) return normalized;

  const sortedPrev = [...prevNotes].map(normalizePitch).sort((a, b) => a - b);
  const prevTop = sortedPrev[sortedPrev.length - 1];
  const prevAvg = sortedPrev.reduce((s, n) => s + n, 0) / sortedPrev.length;

  const nLen = normalized.length;
  let bestNotes = normalized;
  let minCost = Infinity;

  // 転回形バリエーションの探索（最高音350Hz以下を厳守）
  for (let inv = 0; inv < nLen; inv++) {
    const candidate = normalized
      .map((n, idx) => (idx < inv ? n * 2 : n))
      .map(normalizePitch)
      .sort((a, b) => a - b);

    const candTop = candidate[candidate.length - 1];
    const candAvg = candidate.reduce((s, n) => s + n, 0) / candidate.length;

    // トップノートの音高変化(重み2.5) + 内声平均変化(重み1.0) の対数コスト計算
    const topDiff = Math.abs(Math.log2(candTop / prevTop));
    const avgDiff = Math.abs(Math.log2(candAvg / prevAvg));
    const cost = topDiff * 2.5 + avgDiff * 1.0;

    if (cost < minCost) {
      minCost = cost;
      bestNotes = candidate;
    }
  }

  return bestNotes;
}

// 88ch Pattern 2 コンピングイベントデータ構造 (Bass / Chord / Chord Change / Rest の分離管理)
type CompingEventType = 'bass' | 'chord' | 'chord_change' | 'rest';

interface CompingStepEvent {
  step: number;
  type: CompingEventType;
  durationSteps: number;
  velocity: number;
  bassType?: 'root' | 'fifth';
}

// 奇数小節 (Odd Bar: Call) コンピング・イベント配置
const PATTERN2_ODD_BAR_EVENTS: CompingStepEvent[] = [
  { step: 0,  type: 'bass',         durationSteps: 4, velocity: 0.70, bassType: 'root' },
  { step: 0,  type: 'chord',        durationSteps: 4, velocity: 0.52 },
  { step: 4,  type: 'chord',        durationSteps: 6, velocity: 0.52 },
  { step: 8,  type: 'bass',         durationSteps: 4, velocity: 0.65, bassType: 'fifth' },
  { step: 8,  type: 'rest',         durationSteps: 2, velocity: 0 },
  { step: 10, type: 'chord',        durationSteps: 4, velocity: 0.52 },
  { step: 14, type: 'chord_change', durationSteps: 6, velocity: 0.52 }, // 4拍目裏で次小節コードへシンコペーションタイ
];

// 偶数小節 (Even Bar: Response) コンピング・イベント配置
const PATTERN2_EVEN_BAR_EVENTS: CompingStepEvent[] = [
  { step: 0,  type: 'bass',         durationSteps: 4, velocity: 0.70, bassType: 'root' },
  { step: 0,  type: 'rest',         durationSteps: 4, velocity: 0 }, // 前小節Step 14タイ持続のためコード打鍵Rest
  { step: 4,  type: 'chord',        durationSteps: 6, velocity: 0.52 },
  { step: 8,  type: 'bass',         durationSteps: 4, velocity: 0.65, bassType: 'fifth' },
  { step: 8,  type: 'rest',         durationSteps: 2, velocity: 0 },
  { step: 10, type: 'chord',        durationSteps: 4, velocity: 0.52 },
  { step: 14, type: 'chord_change', durationSteps: 6, velocity: 0.52 }, // 4拍目裏で次小節コードへシンコペーションタイ
];

/**
 * 88.1MHz Warm Breeze（パターン3）専用ボイスリーディング・メロディ音選定関数
 * - 直前音からのボイスリーディング（跳躍防止・最短音程差・順次進行優先）を適用
 * - 3小節目 Dm9 の不協和音となるB♮を排し、短3度F4と長9度E4が歌う協和音階に完全準拠
 */
function getWarmBreezeMelodyPitch(scale: number[], prevPitch: number | null): number {
  if (!prevPitch) {
    // 歌い出し: FM7の美しいコードトーン（第1音、第3音、第5音、第9音）からランダム選定
    const starters = [scale[0], scale[1], scale[2], scale[3]].filter(Boolean);
    return starters[Math.floor(Math.random() * starters.length)] || scale[0];
  }

  // 直前音からの半音差を計算
  const candidates = scale.map((note) => {
    const semitones = Math.abs(12 * Math.log2(note / prevPitch));
    return { note, semitones };
  });

  // 半音差が小さい順にソート (跳躍防止・ボイスリーディング)
  candidates.sort((a, b) => a.semitones - b.semitones);

  // 1. 同音連打（0半音）の過度な継続を防ぎ、1〜4半音（短2度・長2度・短3度・長3度）の歌う順次進行（85%）
  const stepCandidates = candidates.filter((c) => c.semitones >= 0.8 && c.semitones <= 4.2);
  // 2. ボサノヴァ特有の優美な跳躍（4度〜5度・5〜7半音のアルペジオ的跳躍アーチ）（15%）
  const archCandidates = candidates.filter((c) => c.semitones > 4.2 && c.semitones <= 7.2);

  if (archCandidates.length > 0 && Math.random() < 0.15) {
    return archCandidates[Math.floor(Math.random() * archCandidates.length)].note;
  }

  if (stepCandidates.length > 0) {
    // 上位2〜3候補の中からランダムに選択（旋律に有機的なゆらぎを付与）
    const pickRange = Math.min(stepCandidates.length, 3);
    return stepCandidates[Math.floor(Math.random() * pickRange)].note;
  }

  return candidates[0].note;
}

/**
 * ユーザー指定ルールに基づく対向的・連続的メロディ音選定関数
 * 1. 隣接音中心 (85%), 3度移動は補助 (15%), 4度以上は完全禁止
 * 2. 上昇/下降の方向を最低2〜4音は維持する（毎音方向を変えない）
 * 3. 音域端で折り返す
 * 4. コードは不協和音防止の補正としてのみ使う
 */
function getNextMelodyPitch(
  freq: number,
  scale: number[],
  chordNotes: number[],
  pitchMultiplier: number
): number {
  const shiftedScale = scale.map((n) => n * pitchMultiplier);
  const scaleLen = shiftedScale.length;

  // 状態の初期化（局の基準キーや中央位置に固定せず、ダイナミックにランダム分散）
  if (!melodyStates[freq]) {
    melodyStates[freq] = {
      scaleIdx: Math.floor(Math.random() * scaleLen),
      direction: Math.random() > 0.5 ? 1 : -1,
      sameDirCount: 0,
      minDirSteps: Math.floor(Math.random() * 3) + 2, // 2, 3, または 4音
      history: [],
    };
  }

  const state = melodyStates[freq];
  if (!state.history) state.history = [];

  // 端（上限・下限）到達時の強制折り返しチェック
  if (state.direction === 1 && state.scaleIdx >= scaleLen - 1) {
    state.direction = -1;
    state.sameDirCount = 0;
    state.minDirSteps = Math.floor(Math.random() * 3) + 2;
  } else if (state.direction === -1 && state.scaleIdx <= 0) {
    state.direction = 1;
    state.sameDirCount = 0;
    state.minDirSteps = Math.floor(Math.random() * 3) + 2;
  } else if (state.sameDirCount >= state.minDirSteps && Math.random() < 0.3) {
    // 最低維持音数（2〜4音）を満たした後は方向転換
    state.direction = (state.direction * -1) as (1 | -1);
    state.sameDirCount = 0;
    state.minDirSteps = Math.floor(Math.random() * 3) + 2;
  }

  // ステップ距離決定 (隣接音: 1 step (80%), 3度移動: 2 step (20%), 4度以上(3以上)は完全禁止)
  let step = Math.random() < 0.2 ? 2 : 1;

  // 偏り分散（ペンタトニック等の過度な特定音固執を防ぐため、直近数回と同じ音型が続く場合に少し揺らぎを付与）
  if (state.history.length >= 4) {
    const recent = state.history.slice(-4);
    const uniqueCount = new Set(recent).size;
    if (uniqueCount <= 2 && Math.random() < 0.4) {
      step = 2;
      if (Math.random() < 0.5) {
        state.direction = (state.direction * -1) as (1 | -1);
      }
    }
  }

  let nextIdx = state.scaleIdx + state.direction * step;

  // 境界クランプ＆反転処理
  if (nextIdx >= scaleLen) {
    nextIdx = scaleLen - 1;
    state.direction = -1;
    state.sameDirCount = 0;
    state.minDirSteps = Math.floor(Math.random() * 3) + 2;
  } else if (nextIdx < 0) {
    nextIdx = 0;
    state.direction = 1;
    state.sameDirCount = 0;
    state.minDirSteps = Math.floor(Math.random() * 3) + 2;
  }

  state.scaleIdx = nextIdx;
  state.sameDirCount += 1;

  state.history.push(nextIdx);
  if (state.history.length > 8) {
    state.history.shift();
  }

  let chosenPitch = shiftedScale[nextIdx];

  // コード進行に対する不協和音（オクターブを跨いだマイナー2度などの半音衝突）を厳格にチェック＆クレンジング
  const checkDissonance = (pitch: number) => {
    return chordNotes.some((chordPitch) => {
      const semitones = Math.abs(12 * Math.log2(pitch / chordPitch));
      const semitoneMod = Math.round(semitones) % 12;
      const diffFromSemitone = Math.abs(semitones - Math.round(semitones));
      // 1半音 (短2度 / 短9度) または 11半音 (長7度) の衝突を検出
      return (semitoneMod === 1 || semitoneMod === 11) && diffFromSemitone < 0.25;
    });
  };

  const isTooDissonant = checkDissonance(chosenPitch);

  if (isTooDissonant) {
    // 濁りを防ぐため、上下のスケールから最も協和する安全なノートを探索して置換
    let foundSafe = false;
    for (let offset of [1, -1, 2, -2]) {
      const altIdx = Math.max(0, Math.min(scaleLen - 1, nextIdx + offset));
      const altPitch = shiftedScale[altIdx];
      if (!checkDissonance(altPitch)) {
        chosenPitch = altPitch;
        state.scaleIdx = altIdx;
        foundSafe = true;
        break;
      }
    }
    if (!foundSafe) {
      const shift = nextIdx < scaleLen - 1 ? 1 : -1;
      const safeIdx = Math.max(0, Math.min(scaleLen - 1, nextIdx + shift));
      chosenPitch = shiftedScale[safeIdx];
      state.scaleIdx = safeIdx;
    }
  }

  return chosenPitch;
}

/**
 * 105.8MHz (ROPPONGI Petrichor FM) 専用 雨音メロディ・リズムパターン生成
 * 静かに降る雨の情景をイメージした、不協和音や発音の遅れが一切ない心地よいランダム雨粒リズム
 */
function generateRaindropBarEvents(
  totalBar: number,
  isIntro: boolean,
  isOutro: boolean
): RaindropStepEvent[] {
  const events: RaindropStepEvent[] = [];

  if (isOutro) {
    // アウトロ: 雨脚が静かに遠のき、数滴の雫がゆっくりと落ちる
    const steps = [0, 6, 12].filter(() => Math.random() < 0.65);
    if (steps.length === 0) steps.push(4);
    steps.forEach((s) => {
      events.push({
        step: s,
        duration: 1.2 + Math.random() * 0.5,
        volMultiplier: 0.70 + Math.random() * 0.15,
        isSparkle: Math.random() < 0.2,
        humanOffsetSec: 0, // 発音遅延ゼロ
      });
    });
    return events;
  }

  // 4小節のサイクルで雨の表情が自然に移ろう（ドラム＆コードの16ビートグリッドに完璧に同期）
  const barCycle = totalBar % 4;
  let chosenSteps: number[] = [];

  if (barCycle === 0) {
    // 【静かなポツポツ小雨】(Gentle Drizzle) - 空間を活かした静謐な雫 (2~3音)
    const pool = [0, 4, 8, 12, 14];
    chosenSteps = pool.filter(() => Math.random() < 0.6);
    if (chosenSteps.length === 0) chosenSteps = [0, 8];
  } else if (barCycle === 1) {
    // 【しとしと心地よい夜雨】(Soothing Steady Rain) - チルホップの心地よいグルーヴに乗るリズム (3~4音)
    const pool = [0, 2, 6, 8, 10, 14];
    chosenSteps = pool.filter(() => Math.random() < 0.65);
    if (chosenSteps.length === 0) chosenSteps = [2, 6, 10];
  } else if (barCycle === 2) {
    // 【パラパラッと弾ける雫バースト】(Puddle Splash Burst) - 時折2〜3粒がパラパラッと跳ねる
    const burstStart = Math.random() < 0.5 ? 4 : 8;
    const base = [0, 14];
    const burst = [burstStart, burstStart + 2];
    chosenSteps = [...base.filter(() => Math.random() < 0.6), ...burst];
  } else {
    // 【水面の波紋】(Water Ripples) - 余韻を響かせるメロウなリズム (3~4音)
    const pool = [0, 4, 7, 10, 12];
    chosenSteps = pool.filter(() => Math.random() < 0.65);
    if (chosenSteps.length === 0) chosenSteps = [0, 6, 12];
  }

  if (isIntro) {
    chosenSteps = chosenSteps.filter(() => Math.random() < 0.55);
    if (chosenSteps.length === 0) chosenSteps = [0, 8];
  }

  // 重複除去＆ソート
  const uniqueSteps = Array.from(new Set(chosenSteps)).sort((a, b) => a - b);

  uniqueSteps.forEach((step) => {
    // 雫の種類: 軽快に跳ねる水滴 (0.35s〜0.55s) vs 水面に広がる波紋 (0.8s〜1.2s)
    const isShortPluck = Math.random() < 0.5;
    const duration = isShortPluck
      ? 0.4 + Math.random() * 0.18
      : 0.85 + Math.random() * 0.35;

    // 水滴の大きさに応じた音量ダイナミクス
    const volMultiplier = (isShortPluck ? 0.88 : 1.0) * (0.90 + Math.random() * 0.20);

    // 高い雫（きらめく跳ね返り）
    const isSparkle = Math.random() < 0.22;

    events.push({
      step,
      duration,
      volMultiplier,
      isSparkle,
      humanOffsetSec: 0, // リズムの遅れやズレを完全排除（0ms）
    });
  });

  return events;
}

/**
 * 105.8MHz専用 雨音・水滴ピッチ選定関数
 * 現在鳴っているコード（Fmaj7, Fm6, Cmaj7, C7）と完璧に協和するノートのみを抽出し、
 * 半音衝突（不協和音）を100%排除した透明感あふれる雨音メロディを生成
 */
function getNextRaindropPitch(
  scale: number[],
  chordNotes: number[],
  pitchMultiplier: number,
  isHighSparkle: boolean = false
): number {
  const shiftedScale = scale.map((n) => n * pitchMultiplier);

  // コード構成音に対する不協和度（半音衝突・短2度/短9度）を厳格に検定
  const isDissonantWithChord = (pitch: number) => {
    return chordNotes.some((chordPitch) => {
      const semitones = Math.abs(12 * Math.log2(pitch / chordPitch));
      const semitoneMod = Math.round(semitones) % 12;
      const diffFromSemitone = Math.abs(semitones - Math.round(semitones));
      // 短2度 (1半音) および 長7度/短9度 (11半音) の濁る衝突を検出
      return (semitoneMod === 1 || semitoneMod === 11) && diffFromSemitone < 0.25;
    });
  };

  // 現コードと完全に協和する候補音プールを抽出（Chord Tones + Consonant Tensions）
  let safePitches = shiftedScale.filter((p) => !isDissonantWithChord(p));
  if (safePitches.length === 0) {
    safePitches = chordNotes.map((cn) => cn);
  }

  const scaleLen = safePitches.length;

  if (!melodyStates[105.8]) {
    melodyStates[105.8] = {
      scaleIdx: Math.floor(Math.random() * scaleLen),
      direction: Math.random() > 0.5 ? 1 : -1,
      sameDirCount: 0,
      minDirSteps: 2,
      history: [],
    };
  }

  const state = melodyStates[105.8];
  if (!state.history) state.history = [];

  // スムーズな跳躍と順次進行（隣接音または3度跳躍）
  const step = Math.random() < 0.65 ? 1 : 2;
  if (Math.random() < 0.35) {
    state.direction = (state.direction * -1) as (1 | -1);
  }

  let nextIdx = state.scaleIdx + state.direction * step;
  if (nextIdx >= scaleLen) {
    nextIdx = scaleLen - 1;
    state.direction = -1;
  } else if (nextIdx < 0) {
    nextIdx = 0;
    state.direction = 1;
  }

  state.scaleIdx = nextIdx;
  state.history.push(nextIdx);
  if (state.history.length > 6) state.history.shift();

  let chosenPitch = safePitches[nextIdx] * 2; // 澄んだ中高域

  // オクターブ上のきらめき雫
  if (isHighSparkle) {
    chosenPitch *= 2;
  }

  return chosenPitch;
}

/**
 * 105.8MHz (ROPPONGI Petrichor FM) パターン1専用 水滴ラグタイム・リズムパターン生成
 * スコット・ジョプリン風のシンコペーション、軽快な裏拍バウンス、4小節のコール＆レスポンス
 */
function generateRagtimeMelodyEvents(
  totalBar: number,
  isIntro: boolean,
  isOutro: boolean
): RaindropStepEvent[] {
  const events: RaindropStepEvent[] = [];

  if (isOutro) {
    // アウトロ: ラグタイム風ストップタイム終止
    const steps = [0, 4, 8, 12];
    steps.forEach((s, idx) => {
      events.push({
        step: s,
        duration: idx === steps.length - 1 ? 1.4 : 0.28,
        volMultiplier: idx === steps.length - 1 ? 1.1 : 0.85,
        isSparkle: idx === steps.length - 1,
        humanOffsetSec: 0,
      });
    });
    return events;
  }

  // 4小節のラグタイム進行（F - D7 - Gm7 - C7）に連動する旋律構成
  const barCycle = totalBar % 4;
  let chosenEvents: { step: number; isLanding?: boolean; isSparkle?: boolean; duration?: number }[] = [];

  if (barCycle === 0) {
    // 【小節1 (F): メインモチーフの提示 / 軽快なシンコペーション】
    const patterns = [
      [
        { step: 0, isLanding: false, duration: 0.22 },
        { step: 2, isLanding: false, duration: 0.22 },
        { step: 3, isLanding: true, duration: 0.35 },
        { step: 6, isLanding: true, duration: 0.40 },
        { step: 8, isLanding: false, duration: 0.22 },
        { step: 10, isLanding: false, duration: 0.22 },
        { step: 12, isLanding: false, duration: 0.22 },
        { step: 14, isLanding: true, duration: 0.32 },
      ],
      [
        { step: 0, isLanding: false, duration: 0.22 },
        { step: 3, isLanding: true, duration: 0.35 },
        { step: 6, isLanding: false, duration: 0.22 },
        { step: 8, isLanding: true, duration: 0.38 },
        { step: 11, isLanding: false, duration: 0.22 },
        { step: 14, isLanding: true, duration: 0.35 },
      ],
      [
        { step: 2, isLanding: false, duration: 0.20 },
        { step: 3, isLanding: false, duration: 0.20 },
        { step: 4, isLanding: true, duration: 0.38 },
        { step: 6, isLanding: false, duration: 0.22 },
        { step: 8, isLanding: false, duration: 0.22 },
        { step: 10, isLanding: false, duration: 0.22 },
        { step: 12, isLanding: true, duration: 0.40 },
        { step: 14, isLanding: false, duration: 0.20 },
      ]
    ];
    chosenEvents = patterns[Math.floor(Math.random() * patterns.length)];
  } else if (barCycle === 1) {
    // 【小節2 (D7): セカンダリードミナント / 華やかな転回とレスポンス】
    const patterns = [
      [
        { step: 0, isLanding: false, duration: 0.22 },
        { step: 2, isLanding: false, duration: 0.22 },
        { step: 4, isLanding: false, duration: 0.22 },
        { step: 6, isLanding: false, duration: 0.22 },
        { step: 8, isLanding: true, duration: 0.65 },
        { step: 14, isLanding: false, duration: 0.22 },
      ],
      [
        { step: 0, isLanding: false, duration: 0.22 },
        { step: 3, isLanding: true, duration: 0.35 },
        { step: 6, isLanding: false, duration: 0.22 },
        { step: 8, isLanding: true, duration: 0.55 },
        { step: 12, isLanding: false, duration: 0.22 },
      ],
      [
        { step: 2, isLanding: false, duration: 0.22 },
        { step: 4, isLanding: true, duration: 0.35 },
        { step: 8, isLanding: true, duration: 0.60 },
        { step: 14, isLanding: false, duration: 0.20 },
      ]
    ];
    chosenEvents = patterns[Math.floor(Math.random() * patterns.length)];
  } else if (barCycle === 2) {
    // 【小節3 (Gm7): サブドミナント / スウィング＆アルペジオ】
    const patterns = [
      [
        { step: 0, isLanding: false, duration: 0.22 },
        { step: 2, isLanding: false, duration: 0.22 },
        { step: 4, isLanding: false, duration: 0.22 },
        { step: 7, isLanding: true, duration: 0.38 },
        { step: 10, isLanding: false, duration: 0.22 },
        { step: 12, isLanding: true, duration: 0.35 },
        { step: 14, isLanding: false, duration: 0.22 },
      ],
      [
        { step: 0, isLanding: false, duration: 0.22 },
        { step: 3, isLanding: true, duration: 0.35 },
        { step: 6, isLanding: false, duration: 0.22 },
        { step: 8, isLanding: false, duration: 0.22 },
        { step: 10, isLanding: true, duration: 0.35 },
        { step: 14, isLanding: false, duration: 0.22 },
      ],
      [
        { step: 2, isLanding: false, duration: 0.20 },
        { step: 4, isLanding: false, duration: 0.20 },
        { step: 6, isLanding: true, duration: 0.35 },
        { step: 8, isLanding: false, duration: 0.22 },
        { step: 11, isLanding: true, duration: 0.40 },
        { step: 14, isLanding: false, duration: 0.20 },
      ]
    ];
    chosenEvents = patterns[Math.floor(Math.random() * patterns.length)];
  } else {
    // 【小節4 (C7): ドミナント終止 / ラグタイム特有の鮮やかなターンアラウンド】
    const patterns = [
      [
        { step: 0, isLanding: false, duration: 0.22 },
        { step: 2, isLanding: false, duration: 0.22 },
        { step: 4, isLanding: false, duration: 0.22 },
        { step: 6, isLanding: false, duration: 0.22 },
        { step: 8, isLanding: true, duration: 0.55 },
        { step: 12, isLanding: true, duration: 0.50, isSparkle: true },
      ],
      [
        { step: 0, isLanding: false, duration: 0.22 },
        { step: 3, isLanding: true, duration: 0.35 },
        { step: 6, isLanding: false, duration: 0.22 },
        { step: 8, isLanding: true, duration: 0.45 },
        { step: 10, isLanding: false, duration: 0.22 },
        { step: 12, isLanding: true, duration: 0.55, isSparkle: true },
      ],
      [
        { step: 2, isLanding: false, duration: 0.20 },
        { step: 4, isLanding: false, duration: 0.20 },
        { step: 8, isLanding: true, duration: 0.50 },
        { step: 12, isLanding: true, duration: 0.50, isSparkle: true },
      ]
    ];
    chosenEvents = patterns[Math.floor(Math.random() * patterns.length)];
  }

  if (isIntro && totalBar === 0) {
    chosenEvents = chosenEvents.filter((_, idx) => idx % 2 === 0);
  }

  chosenEvents.forEach((ce) => {
    const isSparkle = ce.isSparkle || (ce.isLanding && Math.random() < 0.25);
    const duration = ce.duration || (ce.isLanding ? 0.55 : 0.22);
    const volMultiplier = ce.isLanding ? 1.05 : (0.88 + Math.random() * 0.15);

    events.push({
      step: ce.step,
      duration,
      volMultiplier,
      isSparkle,
      humanOffsetSec: 0,
    });
  });

  return events.sort((a, b) => a.step - b.step);
}

/**
 * 97.5MHz 宵宮（Yoimiya Minimal）専用 和風動的メロディ・リズムパターン生成
 * 3拍周期オルゴール・伴奏ポリリズムと美しく噛み合い、毎小節・毎サイクルで表情を変え続ける動的生成エンジン
 */
function generateYoimiyaBarEvents(
  totalBar: number,
  isIntro: boolean,
  isOutro: boolean
): YoimiyaStepEvent[] {
  const events: YoimiyaStepEvent[] = [];
  const bar = totalBar % 4;

  if (isOutro) {
    // アウトロ: 静寂へと還る宵宮。余韻の長い鐘がぽつりぽつりと響く
    const outroPool = [0, 6, 12];
    const chosen = outroPool.filter(() => Math.random() < 0.65);
    if (chosen.length === 0) chosen.push(0);
    chosen.forEach(s => {
      events.push({
        step: s,
        duration: 2.5 + Math.random() * 0.8,
        volMultiplier: 0.70 + Math.random() * 0.15,
        isLanding: true
      });
    });
    return events;
  }

  // イントロ (0~1小節目): 遠くから聴こえてくる宵宮の気配。空間（間）を活かした静謐な立ち上がり
  if (isIntro && totalBar === 0) {
    const introSteps = [4, 10, 14].filter(() => Math.random() < 0.65);
    if (introSteps.length === 0) introSteps.push(8);
    introSteps.forEach(s => {
      events.push({
        step: s,
        duration: 1.8 + Math.random() * 0.5,
        volMultiplier: 0.75 + Math.random() * 0.15,
        isLanding: false
      });
    });
    return events;
  }

  // 4小節の起承転結サイクル（毎サイクル・毎小節ランダムにリズムモチーフを選択＆変奏生成）
  let baseMotifPool: number[][];
  if (bar === 0) {
    // 起: Am - 静謐な呼びかけ。3拍ポリリズム(0,3,6,9,12,15)と美しく噛み合う隙間のステップ
    baseMotifPool = [
      [0, 5, 8, 13],
      [0, 4, 8, 12],
      [2, 6, 10, 14],
      [0, 8, 13],
      [0, 6, 10],
      [4, 8, 13]
    ];
  } else if (bar === 1) {
    // 承: Fmaj7 - 雅な展開。流れるようなステップ
    baseMotifPool = [
      [0, 4, 8, 11, 14],
      [0, 5, 8, 13],
      [2, 5, 9, 13],
      [0, 6, 9, 14],
      [4, 8, 12, 15],
      [0, 4, 8, 12]
    ];
  } else if (bar === 2) {
    // 転: G - 星空の瞬きと高まり。高音域への跳躍と細やかな装飾音
    baseMotifPool = [
      [0, 4, 8, 11, 14],
      [0, 3, 7, 10, 14],
      [2, 6, 8, 12, 14],
      [0, 5, 8, 12, 15],
      [0, 4, 7, 11],
      [2, 5, 8, 11, 14]
    ];
  } else {
    // 結: Em - 静かな着地と次の循環への余白。末尾に自然な息継ぎ（ブレス）
    baseMotifPool = [
      [0, 4, 8, 11],
      [0, 5, 8, 12],
      [2, 6, 10],
      [0, 6, 10],
      [0, 4, 8],
      [0, 5, 8]
    ];
  }

  // ランダムにモチーフを選択
  const chosenPattern = baseMotifPool[Math.floor(Math.random() * baseMotifPool.length)];

  chosenPattern.forEach((step, idx) => {
    // 確率的ドロップ（10%の確率で休符にして偶発的な「間」を生み出す）
    if (idx > 0 && Math.random() < 0.10) return;

    // 音価の動的決定: 小節頭やフレーズ末尾は長い余韻、中間は細やかな音
    const isMajorAccent = (step === 0 || step === 8);
    const isCadence = (bar === 3 && idx === chosenPattern.length - 1);
    const duration = isCadence ? 2.2 : (isMajorAccent ? 1.6 + Math.random() * 0.4 : 1.0 + Math.random() * 0.3);
    const volMultiplier = isMajorAccent ? 1.05 : (0.85 + Math.random() * 0.20);
    const isHighRegister = (bar === 2 && Math.random() < 0.55);

    events.push({
      step,
      duration,
      volMultiplier,
      isHighRegister,
      isLanding: isCadence || isMajorAccent
    });
  });

  return events.sort((a, b) => a.step - b.step);
}

/**
 * 97.5MHz Retro Quest（昭和レトロRPG風オルゴール行進曲）専用 動的メロディ・リズムパターン生成
 * 懐かしのドット絵RPGのフィールドや城下町を思わせる、勇壮かつ哀愁漂うオルゴール旋律を
 * 起承転結（Am → Dm7 → E7 → Am）のコード進行に合わせて毎小節・毎サイクル動的生成
 */
function generateRetroQuestBarEvents(
  totalBar: number,
  isIntro: boolean,
  isOutro: boolean
): RetroQuestStepEvent[] {
  const events: RetroQuestStepEvent[] = [];
  const bar = totalBar % 4;

  if (isOutro) {
    // アウトロ: 旅の終焉と黄昏。ゆっくりと消えゆく余韻のアルペジオ
    const outroPool = [0, 4, 8, 12];
    const chosen = outroPool.filter(() => Math.random() < 0.7);
    if (chosen.length === 0) chosen.push(0);
    chosen.forEach((s, idx) => {
      events.push({
        step: s,
        duration: 2.4 + Math.random() * 0.8,
        volMultiplier: 0.65 + Math.random() * 0.15,
        isAccent: idx === 0,
        hasGraceNote: false
      });
    });
    return events.sort((a, b) => a.step - b.step);
  }

  if (isIntro && totalBar === 0) {
    // イントロ: 冒険の幕開けを告げるファンファーレ・プロローグ
    const introSteps = [0, 4, 8, 12, 14].filter(() => Math.random() < 0.8);
    if (introSteps.length === 0) introSteps.push(0, 8);
    introSteps.forEach((s, idx) => {
      events.push({
        step: s,
        duration: 1.6 + Math.random() * 0.5,
        volMultiplier: 0.85 + Math.random() * 0.15,
        isAccent: idx === 0,
        hasGraceNote: Math.random() < 0.3
      });
    });
    return events.sort((a, b) => a.step - b.step);
  }

  // 4小節のドラマチックなRPGメロディサイクル
  let motifPool: number[][];
  if (bar === 0) {
    // 起: Am - 旅立ちの動機。堂々とした行進と確固たるテーマ提示
    motifPool = [
      [0, 6, 8, 10, 12],
      [0, 4, 6, 8, 12],
      [0, 6, 9, 10, 12],
      [0, 4, 8, 12, 14],
      [0, 2, 6, 8, 12]
    ];
  } else if (bar === 1) {
    // 承: Dm7 - 冒険の展開。流れるような駆け上がりと跳躍
    motifPool = [
      [0, 2, 4, 6, 8, 10, 12],
      [0, 4, 8, 10, 12, 14],
      [2, 6, 8, 10, 12, 14],
      [0, 3, 6, 8, 12],
      [0, 4, 7, 10, 12]
    ];
  } else if (bar === 2) {
    // 転: E7 - クライマックス。ドミナントの緊張感と熱いシンコペーション
    motifPool = [
      [0, 4, 6, 9, 10, 12],
      [0, 3, 6, 10, 12, 14],
      [0, 2, 6, 8, 10, 12],
      [0, 6, 8, 11, 14],
      [0, 4, 8, 11, 12]
    ];
  } else {
    // 結: Am - 凱旋と調和の解決。次章へと続く安定したフレーズ
    motifPool = [
      [0, 4, 8, 12],
      [0, 6, 8, 12, 14],
      [0, 2, 4, 8, 12],
      [0, 4, 8, 10, 12],
      [0, 6, 10, 12]
    ];
  }

  const basePattern = motifPool[Math.floor(Math.random() * motifPool.length)];
  const stepsSet = new Set(basePattern);

  // 装飾的パッシング16分音符を微細に追加
  if (Math.random() < 0.25) {
    const candidateSteps = [2, 4, 6, 10, 14].filter(s => !stepsSet.has(s));
    if (candidateSteps.length > 0) {
      stepsSet.add(candidateSteps[Math.floor(Math.random() * candidateSteps.length)]);
    }
  }

  const sortedSteps = Array.from(stepsSet).sort((a, b) => a - b);
  sortedSteps.forEach((s) => {
    const isMainBeat = (s === 0 || s === 8);
    const duration = isMainBeat ? 1.4 + Math.random() * 0.4 : 0.8 + Math.random() * 0.3;
    const volMultiplier = isMainBeat ? 1.05 : 0.82 + Math.random() * 0.20;
    const hasGraceNote = Math.random() < 0.20 && (s === 0 || s === 6 || s === 8);

    events.push({
      step: s,
      duration,
      volMultiplier,
      isAccent: isMainBeat,
      hasGraceNote
    });
  });

  return events.sort((a, b) => a.step - b.step);
}

/**
 * 105.8MHz パターン1専用 ラグタイム音高選定関数
 * コードトーン（根音・3度・5度・7度・テンション）と半音下からの装飾音を駆使した
 * 華やかで親しみやすいラグタイム旋律を生成
 */
function getNextRagtimePitch(
  chordNotes: number[],
  pitchMultiplier: number,
  isSparkle: boolean = false,
  isLanding: boolean = false
): number {
  const shiftedChord = chordNotes.map((n) => n * pitchMultiplier);

  // ラグタイムの音域正規化 (300Hz〜1150Hz: 澄んだコロコロとした水滴トーン)
  const normalizePitch = (p: number) => {
    let res = p;
    while (res < 300) res *= 2;
    while (res > 1150) res *= 0.5;
    return res;
  };

  const ragPool: number[] = [];
  shiftedChord.forEach((cn) => {
    ragPool.push(normalizePitch(cn));
    ragPool.push(normalizePitch(cn * 1.5)); // 5度上の響き
  });

  const cleanPool = Array.from(new Set(ragPool)).sort((a, b) => a - b);
  const poolLen = cleanPool.length;

  if (!melodyStates[105.81]) {
    melodyStates[105.81] = {
      scaleIdx: Math.floor(poolLen / 2),
      direction: Math.random() > 0.5 ? 1 : -1,
      sameDirCount: 0,
      minDirSteps: 2,
      history: [],
    };
  }

  const state = melodyStates[105.81];
  if (!state.history) state.history = [];

  if (isLanding) {
    // 着地音: ルート音または第3音に解決
    const targetTone = normalizePitch(shiftedChord[0]);
    let closestIdx = 0;
    let minDiff = Infinity;
    cleanPool.forEach((p, idx) => {
      const diff = Math.abs(p - targetTone);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    state.scaleIdx = closestIdx;
    let chosen = cleanPool[closestIdx];
    if (isSparkle) chosen *= 2;
    return chosen;
  }

  // ステップ移動 (順次進行 65%, 2段跳躍 35%)
  const step = Math.random() < 0.65 ? 1 : 2;
  if (state.sameDirCount >= state.minDirSteps && Math.random() < 0.4) {
    state.direction = (state.direction * -1) as (1 | -1);
    state.sameDirCount = 0;
    state.minDirSteps = Math.floor(Math.random() * 3) + 2;
  }

  let nextIdx = state.scaleIdx + state.direction * step;
  if (nextIdx >= poolLen) {
    nextIdx = poolLen - 1;
    state.direction = -1;
    state.sameDirCount = 0;
  } else if (nextIdx < 0) {
    nextIdx = 0;
    state.direction = 1;
    state.sameDirCount = 0;
  }

  state.scaleIdx = nextIdx;
  state.sameDirCount++;
  state.history.push(nextIdx);
  if (state.history.length > 6) state.history.shift();

  let chosen = cleanPool[nextIdx];
  if (isSparkle) chosen *= 2;
  return chosen;
}

// 時間帯（朝・昼・晩）判定ヘルパー
function getTimeSlotInfo(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) {
    return {
      slot: 'morning' as const,
      label: '朝 (5:00 - 10:59)',
      icon: '🌅',
      recommendedFreq: 88.1,
      stationName: 'TOKYO MORNING BOSSA'
    };
  } else if (hour >= 11 && hour < 18) {
    return {
      slot: 'afternoon' as const,
      label: '昼 (11:00 - 17:59)',
      icon: '☀️',
      recommendedFreq: 92.4,
      stationName: 'SHIBUYA DAYLIGHT GROOVE'
    };
  } else {
    return {
      slot: 'night' as const,
      label: '晩・夜 (18:00 - 4:59)',
      icon: '🌙',
      recommendedFreq: 101.5,
      stationName: 'GINZA MIDNIGHT CLUB'
    };
  }
}

// ワンタップ選局 2局交互ランダム再生プリセット定義
export type PresetPairType = 'cafe' | 'daytime' | 'sleep' | null;

export const PRESET_PAIRS: Record<'cafe' | 'daytime' | 'sleep', {
  name: string;
  genre: string;
  frequencies: [number, number];
  stationNames: [string, string];
  icon: string;
}> = {
  cafe: {
    name: 'カフェ',
    genre: 'ボサノヴァ ⇄ ジャズ',
    frequencies: [88.1, 101.5],
    stationNames: ['88.1ch TOKYO MORNING BOSSA', '101.5ch GINZA MIDNIGHT CLUB'],
    icon: '☕',
  },
  daytime: {
    name: 'デイタイム',
    genre: 'シティポップ ⇄ 雨音チルホップ',
    frequencies: [92.4, 105.8],
    stationNames: ['92.4ch SHIBUYA DAYLIGHT GROOVE', '105.8ch ROPPONGI Petrichor FM'],
    icon: '☀️',
  },
  sleep: {
    name: 'おやすみ',
    genre: 'エレクトロヒーリング ⇄ レトロアンビエント',
    frequencies: [76.0, 97.5],
    stationNames: ['76.0ch ELECTRO HEALING', '97.5ch AKIHABARA CRONOS'],
    icon: '🌙',
  },
};

// 周波数から所属するプリセットペアを特定するヘルパー
export function getPresetPairForFreq(freq: number): 'cafe' | 'daytime' | 'sleep' {
  if (Math.abs(freq - 88.1) < 0.25 || Math.abs(freq - 101.5) < 0.25) return 'cafe';
  if (Math.abs(freq - 92.4) < 0.25 || Math.abs(freq - 105.8) < 0.25) return 'daytime';
  if (Math.abs(freq - 76.0) < 0.25 || Math.abs(freq - 97.5) < 0.25) return 'sleep';
  return 'cafe';
}

export default function App() {
  // テーマ：ウォルナット木目 vs ヘアラインシルバーアルミ vs Candy POP
  const [theme, setTheme] = useState<'wood' | 'silver' | 'candypop'>('silver');

  // コントロールパネル用アクティブタブ ('tuning' | 'presets' | 'timers' | 'theme')
  const [activeControlTab, setActiveControlTab] = useState<'tuning' | 'presets' | 'timers' | 'theme'>('tuning');

  // ワンタップ選局 3つのモード ON/OFF ('cafe' | 'daytime' | 'sleep' | null)
  // 通常再生はチューナー選択（null）
  const [activePresetPair, setActivePresetPair] = useState<PresetPairType>(null);
  const activePresetPairRef = useRef<PresetPairType>(null);
  activePresetPairRef.current = activePresetPair;

  // ワンタップ選局（2局交互再生）用 非連続・全曲巡回トラック履歴管理
  const presetPairTrackHistoryRef = useRef<{
    lastTrackByFreq: Record<number, number>;
    lastPatternByFreq: Record<number, number>;
    decks: Record<number, number[]>;
  }>({
    lastTrackByFreq: {},
    lastPatternByFreq: {},
    decks: {}
  });

  // 各ステーションのトラック番号に対応する和音セット（bossaPatternIndex）を取得
  const getStationPatternIndex = (freq: number, trackIdx: number): number => {
    if (Math.abs(freq - 101.5) < 0.25 || Math.abs(freq - 101.2) < 0.25) {
      if (trackIdx === 3) return 2;
      if (trackIdx === 1) return 1;
      return 0;
    }
    if (Math.abs(freq - 105.8) < 0.25) {
      if (trackIdx === 2) return 2;
      if (trackIdx === 1 || trackIdx === 3) return 1;
      return 0;
    }
    if (Math.abs(freq - 97.5) < 0.25) {
      if (trackIdx === 4) return 3;
      if (trackIdx === 3) return 2;
      if (trackIdx === 1) return 1;
      return 0;
    }
    return trackIdx % 4;
  };

  /**
   * ワンタップ選局（2局交互再生）用 非連続・全曲巡回トラック選出関数
   * - 同一局で同じトラック/セットが連続して演奏されるのを100%防止
   * - 全トラックが一度ずつ演奏されるまで重複しないシャッフル巡回（フィッシャー・イェーツ方式）
   * - 新しい巡回サイクル開始時も直前のトラック/セットと重複しないよう保証
   * - 交互切り替え時に相手局と同じトラック番号が続く違和感も極小化
   */
  const getNextPresetPairTrackIndex = (targetStation: Station, previousStationTrackIdx?: number): number => {
    const freq = targetStation.frequency;
    const totalTracks = targetStation.tracks.length;
    if (totalTracks <= 1) return 0;

    const history = presetPairTrackHistoryRef.current;
    let deck = history.decks[freq];
    const lastTrack = history.lastTrackByFreq[freq];
    const lastPattern = history.lastPatternByFreq[freq];

    // デッキが存在しない、または空になった場合は全トラック番号をシャッフル補充
    if (!deck || deck.length === 0) {
      const allIndices = Array.from({ length: totalTracks }, (_, i) => i);
      // Fisher-Yates シャッフル
      for (let i = allIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
      }
      // 前回の同一局トラック、または前回の同一局パターンと重なる場合、先頭要素をスワップして連続を確実に回避
      if (allIndices.length > 1) {
        const firstPat = getStationPatternIndex(freq, allIndices[0]);
        if (allIndices[0] === lastTrack || (lastPattern !== undefined && firstPat === lastPattern)) {
          const betterIdx = allIndices.findIndex(
            (idx, i) => i > 0 && idx !== lastTrack && getStationPatternIndex(freq, idx) !== lastPattern
          );
          if (betterIdx > 0) {
            [allIndices[0], allIndices[betterIdx]] = [allIndices[betterIdx], allIndices[0]];
          } else {
            const swapTarget = allIndices.length - 1;
            [allIndices[0], allIndices[swapTarget]] = [allIndices[swapTarget], allIndices[0]];
          }
        }
      }
      deck = allIndices;
    }

    // デッキ内から最適な候補を選択
    let chosenDeckPos = -1;

    // 第1優先: lastTrackともlastPatternともpreviousStationTrackIdxとも異なるトラック
    chosenDeckPos = deck.findIndex((tIdx) => {
      const pat = getStationPatternIndex(freq, tIdx);
      const notSameTrack = (lastTrack === undefined || tIdx !== lastTrack);
      const notSamePattern = (lastPattern === undefined || pat !== lastPattern);
      const notSameAsPrevStation = (previousStationTrackIdx === undefined || tIdx !== previousStationTrackIdx);
      return notSameTrack && notSamePattern && notSameAsPrevStation;
    });

    // 第2優先: 直前局とは同じでもよいが、同一局でのlastTrackおよびlastPatternと異なるトラック
    if (chosenDeckPos === -1) {
      chosenDeckPos = deck.findIndex((tIdx) => {
        const pat = getStationPatternIndex(freq, tIdx);
        const notSameTrack = (lastTrack === undefined || tIdx !== lastTrack);
        const notSamePattern = (lastPattern === undefined || pat !== lastPattern);
        return notSameTrack && notSamePattern;
      });
    }

    // 第3優先: 同一局のlastTrackと異なるトラック
    if (chosenDeckPos === -1) {
      chosenDeckPos = deck.findIndex((tIdx) => lastTrack === undefined || tIdx !== lastTrack);
    }

    // フォールバック: デッキ先頭
    if (chosenDeckPos === -1) {
      chosenDeckPos = 0;
    }

    const chosenIdx = deck.splice(chosenDeckPos, 1)[0];

    // 履歴更新
    history.lastTrackByFreq[freq] = chosenIdx;
    history.lastPatternByFreq[freq] = getStationPatternIndex(freq, chosenIdx);
    history.decks[freq] = deck;

    return chosenIdx;
  };

  // 朝・昼・晩 時間帯自動連動サーチモード
  const [isTimeAutoSearch, setIsTimeAutoSearch] = useState<boolean>(false);

  // ラジオchランダム再生モード
  const [isRandomStationMode, setIsRandomStationMode] = useState<boolean>(false);

  // ミニマル作業集中表示モード
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const [audioCtxState, setAudioCtxState] = useState<AudioContext | null>(null);


  // 本番環境：デバッグログ更新による無駄な再レンダリングを抑止（軽量no-op化）
  const addDebugLog = (
    _category: 'audio' | 'tuner' | 'timer' | 'system' | 'error',
    _message: string,
    _level: 'info' | 'warn' | 'error' | 'success' = 'info'
  ) => {};

  // 本線ラジオチャンネル専用 カスタムカセット演奏データオーバーライド
  const stationAudioOverridesRef = useRef<Record<number, StationProgression>>({});



  // グローバル例外・未処理Promiseの捕捉とデバッグログ連携
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      addDebugLog('error', `Runtime error: ${event.message} at ${event.filename || 'script'}:${event.lineno || 0}`, 'error');
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      addDebugLog('error', `Unhandled rejection: ${event.reason?.message || event.reason || 'Unknown'}`, 'error');
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // バックグラウンド切り替えやブラウザ復帰時のAudioContext自動再開（サスペンド・interruptedからの自動復帰）
  useEffect(() => {
    const handleResumeAudio = () => {
      if (audioCtxRef.current && isPlayingRef.current && isPowerOnRef.current) {
        const state = audioCtxRef.current.state as string;
        if (state === 'suspended' || state === 'interrupted') {
          audioCtxRef.current.resume().then(() => {
            addDebugLog('audio', `AudioContext automatically resumed from ${state} (window/tab restored)`, 'success');
            if (audioCtxRef.current) setAudioCtxState(audioCtxRef.current);
          }).catch(() => {});
        }
      }
    };

    // 画面タッチやクリック時にも自動復帰（iOS/Safariのジェスチャー連動再開）
    const handleUserGesture = () => {
      if (audioCtxRef.current && isPlayingRef.current && isPowerOnRef.current) {
        const state = audioCtxRef.current.state as string;
        if (state === 'suspended' || state === 'interrupted') {
          audioCtxRef.current.resume().then(() => {
            if (audioCtxRef.current) setAudioCtxState(audioCtxRef.current);
          }).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleResumeAudio);
    window.addEventListener('focus', handleResumeAudio);
    window.addEventListener('pageshow', handleResumeAudio);
    window.addEventListener('pointerdown', handleUserGesture, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleResumeAudio);
      window.removeEventListener('focus', handleResumeAudio);
      window.removeEventListener('pageshow', handleResumeAudio);
      window.removeEventListener('pointerdown', handleUserGesture);
    };
  }, []);

  // 省電力・高パフォーマンスモード（軽量化・ブラウザ負荷軽減）
  const [isEcoMode, setIsEcoMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('retro_chill_fm_ecomode') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('retro_chill_fm_ecomode', String(isEcoMode));
    } catch (e) {}
  }, [isEcoMode]);

  // ラジオ基本ステート
  const [selectedBand, setSelectedBand] = useState<'FM' | 'AM' | 'SW'>('FM');
  const [unlockedSecret, setUnlockedSecret] = useState<boolean>(false);
  const [isPowerOn, setIsPowerOn] = useState<boolean>(true);
  const [powerAnimState, setPowerAnimState] = useState<'powering_on' | 'powering_off' | null>(null);

  // 初期ステーションの決定（単一局を1度だけ選定し、周波数・カセット表示・ターゲット表示の初期ズレを完全防止）
  const [initialStation] = useState<Station>(() => {
    try {
      const saved = localStorage.getItem('retro_chill_fm_favorites');
      if (saved) {
        const parsed: number[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const matched = STATIONS.filter(s => parsed.includes(s.frequency));
          if (matched.length > 0) {
            return matched[Math.floor(Math.random() * matched.length)];
          }
        }
      }
    } catch (e) {}
    return STATIONS.length > 0 ? STATIONS[Math.floor(Math.random() * STATIONS.length)] : STATIONS[0];
  });

  const [frequency, setFrequency] = useState<number>(() => initialStation.frequency);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('retro_chill_fm_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 集中タイマー（作業25分/50分 ＆ 休憩5分/10分）
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break' | 'off'>('off');
  const [focusWorkMinutes, setFocusWorkMinutes] = useState<number>(25);
  const focusWorkMinutesRef = useRef<number>(25);
  focusWorkMinutesRef.current = focusWorkMinutes;
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState<number>(25 * 60);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const pomodoroTimerRef = useRef<number | null>(null);

  // トラック時間＆進行状況
  const [progress, setProgress] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(120); // 動的に曲の正確な長さを反映
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isFastForwarding, setIsFastForwarding] = useState<boolean>(false);
  const [currentBpm, setCurrentBpm] = useState<number>(72);

  // イコライザー設定値（深夜ラウンジにベストなMID -5dBをデフォルト設定＆永続化）
  const [bass, setBass] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('retro_chill_fm_eq_bass');
      return saved !== null ? parseInt(saved, 10) : 3;
    } catch (e) {
      return 3;
    }
  });
  const [mid, setMid] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('retro_chill_fm_eq_mid');
      return saved !== null ? parseInt(saved, 10) : -5;
    } catch (e) {
      return -5;
    }
  });
  const [treble, setTreble] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('retro_chill_fm_eq_treble');
      return saved !== null ? parseInt(saved, 10) : 2;
    } catch (e) {
      return 2;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('retro_chill_fm_eq_bass', bass.toString());
      localStorage.setItem('retro_chill_fm_eq_mid', mid.toString());
      localStorage.setItem('retro_chill_fm_eq_treble', treble.toString());
    } catch (e) {}
  }, [bass, mid, treble]);

  // スリープタイマー
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);

  // ラジオ時報 / 30分毎ステーションジングル
  const [isTimeSignalEnabled, setIsTimeSignalEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('retro_chill_fm_timesignal');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  // 30分毎ステーションジングル独立ON/OFF
  const [isJingleEnabled, setIsJingleEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('retro_chill_fm_jingle');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  // 30分毎の送出モード: 'jingle' (Prime Time Gold ジングル) | 'traditional' (時報音・チャイム)
  const [timeSignalMode, setTimeSignalMode] = useState<'jingle' | 'traditional'>(() => {
    try {
      const saved = localStorage.getItem('retro_chill_fm_timesignal_mode');
      return saved === 'traditional' ? 'traditional' : 'jingle'; // デフォルトはジングル
    } catch (e) {
      return 'jingle';
    }
  });

  // ジングル再生中ステート & Ref
  const [isJinglePlaying, setIsJinglePlaying] = useState<boolean>(false);
  const isJinglePlayingRef = useRef<boolean>(false);
  isJinglePlayingRef.current = isJinglePlaying;
  const jingleSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const jingleGainRef = useRef<GainNode | null>(null);
  const jingleAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const jingleBufferRef = useRef<AudioBuffer | null>(null);
  const jingleArrayBufferRef = useRef<ArrayBuffer | null>(null);
  const jingleFadeTimeoutRef = useRef<number | null>(null);

  // ジングル音声ファイルの先行プリロード（初回再生時のロード待ち・音切れを防止）
  useEffect(() => {
    fetch('/assets/aistudio/Prime_Time_Gold_e63f4979.mp3')
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        jingleArrayBufferRef.current = ab;
        if (audioCtxRef.current && !jingleBufferRef.current) {
          audioCtxRef.current.decodeAudioData(ab.slice(0)).then((buf) => {
            jingleBufferRef.current = buf;
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('retro_chill_fm_timesignal', JSON.stringify(isTimeSignalEnabled));
    } catch (e) {}
  }, [isTimeSignalEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('retro_chill_fm_jingle', JSON.stringify(isJingleEnabled));
    } catch (e) {}
  }, [isJingleEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('retro_chill_fm_timesignal_mode', timeSignalMode);
    } catch (e) {}
  }, [timeSignalMode]);

  const lastTimeSignalSlotRef = useRef<string>('');
  useEffect(() => {
    if (!isTimeSignalEnabled && !isJingleEnabled) return;
    const interval = setInterval(() => {
      if (!isPowerOnRef.current) return;
      const now = new Date();
      const m = now.getMinutes();
      const s = now.getSeconds();
      const h = now.getHours();
      
      // ═════════════════════════════════════════════════════════════
      // 1. 正時 (XX:00:00) の時報: isTimeSignalEnabled が true の時のみ発音
      // 59分57〜58秒に開始して00秒ジャストに高音ピーン音と明るいアナウンス
      // ═════════════════════════════════════════════════════════════
      if (isTimeSignalEnabled && m === 59 && (s === 57 || s === 58)) {
        const nextHour = (h + 1) % 24;
        const slotKey = `signal-${nextHour}:00`;
        if (lastTimeSignalSlotRef.current !== slotKey) {
          lastTimeSignalSlotRef.current = slotKey;
          playTimeSignal(false, false);
        }
      }
      // ═════════════════════════════════════════════════════════════
      // 2. 毎時30分 (XX:30:00) のジングル/シグナル: isJingleEnabled が true の時のみ発音
      //    ・ジングルモード: ステーションジングル (Prime Time Gold)
      //    ・従来モード: 「ピンポーン」チャイム
      // ═════════════════════════════════════════════════════════════
      else if (isJingleEnabled && m === 30 && (s === 0 || s === 1)) {
        const slotKey = `${timeSignalMode}-${h}:30`;
        if (lastTimeSignalSlotRef.current !== slotKey) {
          lastTimeSignalSlotRef.current = slotKey;
          if (timeSignalMode === 'jingle') {
            playStationJingle(false);
          } else {
            playTimeSignal(false, true);
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimeSignalEnabled, isJingleEnabled, timeSignalMode]);

  // アクティブ局とトラックリスト（単一のinitialStationから一致させて初期化し表示のズレを完全防止）
  const [activeStation, setActiveStation] = useState<Station | null>(() => initialStation);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [trackIteration, setTrackIteration] = useState<number>(0);
  const [isTuning, setIsTuning] = useState<boolean>(false);
  const [targetStationName, setTargetStationName] = useState<string>(
    () => `${initialStation.name} (${initialStation.frequency.toFixed(1)} MHz)`
  );
  const currentTrack = activeStation?.tracks[currentTrackIndex] || null;

  // Web Audio 関連オブジェクト
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // EQ Biquad Filter Nodes
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);

  // ラジオ・ザーザー砂嵐音 (Static Noise) 生成ノード
  const staticSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const staticGainRef = useRef<GainNode | null>(null);
  const prevPattern2NotesRef = useRef<number[] | null>(null);
  const prevWarmBreezePitchRef = useRef<number | null>(null);
  const lastWarmBreezeShiftRef = useRef<number>(0);

  // 合成音楽用のマスター Gain Node
  const musicGainRef = useRef<GainNode | null>(null);
  const masterCompressorRef = useRef<DynamicsCompressorNode | null>(null);

  // シーケンサーのタイマー（Web Workerによる高精度・バックグラウンド間引き防止タイマー）
  const stepTimerRef = useRef<BackgroundTimer | null>(null);

  // チャンネル切り替えタイマー管理用（前回のタイマーを完全クリアして混線防止）
  const transitionTimeoutsRef = useRef<number[]>([]);

  // 発音中のWeb Audioノード管理（チャンネル変更時に即時強制停止）
  const activeAudioNodesRef = useRef<Array<{ stop: () => void }>>([]);

  // 現在周波数とアクティブステーション・再生状態・電源・音量等の即時参照用Ref（非同期コールバックでの混線・再生成防止）
  const frequencyRef = useRef<number>(frequency);
  frequencyRef.current = frequency;
  const activeStationRef = useRef<Station | null>(activeStation);
  activeStationRef.current = activeStation;
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;
  const isPowerOnRef = useRef<boolean>(isPowerOn);
  isPowerOnRef.current = isPowerOn;
  const volumeRef = useRef<number>(volume);
  volumeRef.current = volume;
  const isMutedRef = useRef<boolean>(isMuted);
  isMutedRef.current = isMuted;
  const isRandomStationModeRef = useRef<boolean>(isRandomStationMode);
  isRandomStationModeRef.current = isRandomStationMode;
  const timeSignalTimeoutRef = useRef<number | null>(null);
  const stopStationJingleRef = useRef<() => void>(() => {});

  // チャンネル変更・曲間遷移・電源OFF時に全音源・残響・オシレーターを即座に完全停止する関数
  // stopJingle: 電源OFF・停止ボタン・選局時のみtrue。曲間自動遷移ではジングルを途中で切らないようfalseを指定
  const stopAllAudioImmediate = (stopJingle: boolean = false) => {
    // 0. ステーションジングルが再生中の場合（明示的停止時のみ）
    if (stopJingle) {
      try { stopStationJingleRef.current(); } catch (e) {}
    }

    // 1. シーケンサーのタイマーを即時停止
    if (stepTimerRef.current) {
      stepTimerRef.current.destroy();
      stepTimerRef.current = null;
    }

    // 2. 進行中のトランジションタイマーをすべて破棄 & チューニング状態の即時解除
    transitionTimeoutsRef.current.forEach((tId) => clearTimeout(tId));
    transitionTimeoutsRef.current = [];
    setIsTuning(false);
    isTransitioningRef.current = false;
    isFadingRef.current = false;

    // 3. 発音中のオシレーター群をすべて即座に停止・切断
    if (activeAudioNodesRef.current.length > 0) {
      activeAudioNodesRef.current.forEach((item) => {
        try { item.stop(); } catch (e) {}
      });
      activeAudioNodesRef.current = [];
    }

    // 4. 各専用音源モジュールの発音・ディレイ・残響ループを完全に消音遮断
    try { electroHealing.stopAll(); } catch (e) {}
    try { retroMusicBox.stopAll(); } catch (e) {}
    try { retroLoungePiano.stopAll(); } catch (e) {}
    try { acousticJazzDrums.stopAll(); } catch (e) {}
    try { toneDrumKit.stopAll(); } catch (e) {}
    try { tokyoMorningBossaGuitar.stopAll(); } catch (e) {}
    try { raindropMelody.stopAll(); } catch (e) {}
    try { aquaBubbleChords.stopAll(); } catch (e) {}
    try { shibuyaSynthBrass.stopAll(); } catch (e) {}
    try { shibuyaDaylightWoodBass.stopAll(); } catch (e) {}

    // 5. マスター音楽ゲイン及びチューニング砂嵐ノイズを瞬時に極小値（0.0001）へ落とし、いかなる音の漏れも遮断
    if (audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (musicGainRef.current) {
        try {
          const curr = musicGainRef.current.gain.value;
          musicGainRef.current.gain.cancelScheduledValues(now);
          musicGainRef.current.gain.setValueAtTime(Math.max(curr, 0.0001), now);
          musicGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.02);
        } catch (e) {}
      }
      if (staticGainRef.current) {
        try {
          const currStatic = staticGainRef.current.gain.value;
          staticGainRef.current.gain.cancelScheduledValues(now);
          staticGainRef.current.gain.setValueAtTime(Math.max(currStatic, 0.0001), now);
          staticGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.02);
        } catch (e) {}
      }
    }

    // 6. 時報アナウンスタイマーと音声合成の確実なキャンセル
    if (timeSignalTimeoutRef.current) {
      clearTimeout(timeSignalTimeoutRef.current);
      timeSignalTimeoutRef.current = null;
    }
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  };

  // 生成されたオシレーターのライフサイクル管理用ヘルパー
  const registerActiveAudioNode = (stopFn: () => void) => {
    const nodeItem = { stop: stopFn };
    activeAudioNodesRef.current.push(nodeItem);
    return () => {
      const idx = activeAudioNodesRef.current.indexOf(nodeItem);
      if (idx !== -1) activeAudioNodesRef.current.splice(idx, 1);
    };
  };

  // 人間の耳の聴覚特性（対数感度）に合わせたマスターゲイン計算（0.0〜1.0 -> 0.0〜1.0の2.2乗カーブ）
  const getEffectiveMasterGain = (vol: number, muted: boolean): number => {
    if (muted || vol <= 0) return 0;
    return Math.pow(vol, 2.2);
  };

  // AudioContextの停止・サスペンド・interrupted（中断）状態からの自動確実復帰ヘルパー
  const ensureCtxRunning = (ctx: AudioContext | null | undefined): void => {
    if (!ctx) return;
    const state = ctx.state as string;
    if (state === 'suspended' || state === 'interrupted') {
      ctx.resume().catch(() => {});
    }
  };

  // AudioContextと各種フィルタ・ノード群の初期設定
  const initAudioEngine = (forceRecreate = false) => {
    if (audioCtxRef.current && !forceRecreate) {
      const state = audioCtxRef.current.state as string;
      if (state === 'suspended' || state === 'interrupted') {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (!audioCtxState || audioCtxState !== audioCtxRef.current) {
        setAudioCtxState(audioCtxRef.current);
      }
      return audioCtxRef.current;
    }

    if (audioCtxRef.current && forceRecreate) {
      try {
        audioCtxRef.current.close().catch(() => {});
      } catch (e) {}
      audioCtxRef.current = null;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    setAudioCtxState(ctx);

    // アナライザー（ビジュアライザー用）
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64; 
    analyserRef.current = analyser;

    // イコライザー：低音
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.setValueAtTime(150, ctx.currentTime);
    bassFilter.gain.setValueAtTime(bass, ctx.currentTime);
    bassFilterRef.current = bassFilter;

    // イコライザー：中音
    const midFilter = ctx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.setValueAtTime(1000, ctx.currentTime);
    midFilter.Q.setValueAtTime(1.0, ctx.currentTime);
    midFilter.gain.setValueAtTime(mid, ctx.currentTime);
    midFilterRef.current = midFilter;

    // イコライザー：高音
    const trebleFilter = ctx.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.setValueAtTime(3500, ctx.currentTime);
    trebleFilter.gain.setValueAtTime(treble, ctx.currentTime);
    trebleFilterRef.current = trebleFilter;

    // マスター・ダイナミクス・コンプレッサー（歪み・過大入力防止＆リミッター）
    const masterCompressor = ctx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-6, ctx.currentTime);
    masterCompressor.knee.setValueAtTime(12, ctx.currentTime);
    masterCompressor.ratio.setValueAtTime(12, ctx.currentTime);
    masterCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
    masterCompressor.release.setValueAtTime(0.25, ctx.currentTime);
    masterCompressorRef.current = masterCompressor;

    // 音楽のマスター音量ノード
    const musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(getEffectiveMasterGain(volume, isMuted), ctx.currentTime);
    musicGainRef.current = musicGain;

    // 接続ルート: [シンセ音源] -> bassFilter -> midFilter -> trebleFilter -> masterCompressor -> musicGain -> analyser -> destination
    bassFilter
      .connect(midFilter)
      .connect(trebleFilter)
      .connect(masterCompressor)
      .connect(musicGain)
      .connect(analyser)
      .connect(ctx.destination);

    // アナログ砂嵐音 (Static Noise) ジェネレーターの起動
    initStaticNoise(ctx);

    // 昭和レトロラジオ・オルゴール音源エンジンの初期化（イコライザー入力へ接続）
    retroMusicBox.init(ctx, bassFilter);

    // 昭和レトロ夜のラウンジピアノ音源エンジンの初期化（イコライザー入力へ接続）
    retroLoungePiano.init(ctx, bassFilter);

    // 昭和レトロ夜のラウンジ・アコースティックジャズドラム音源エンジンの初期化（イコライザー入力へ接続）
    acousticJazzDrums.init(ctx, bassFilter);

    // Tone.js ドラム音源サンプラーエンジンの初期化（イコライザー入力へ接続）
    toneDrumKit.init(ctx, bassFilter);

    // 88.1MHz TOKYO morning bossa アコースティックギター音源エンジンの初期化
    tokyoMorningBossaGuitar.init(ctx, bassFilter);

    // 105.8MHz ROPPONGI Petrichor FM レインドロップ（水滴）音源エンジンの初期化
    raindropMelody.init(ctx, bassFilter);

    // 105.8MHz ROPPONGI Petrichor FM コポコポ水泡（アクア・バブルコード）音源エンジンの初期化
    aquaBubbleChords.init(ctx, bassFilter);

    // 92.4MHz SHIBUYA DAYLIGHT GROOVE 音源エンジンの初期化（シンセブラス・ウッドベース・サックス・ネオロカビリーギター）
    shibuyaSynthBrass.init(ctx, bassFilter);
    shibuyaDaylightWoodBass.init(ctx, bassFilter);
    shibuyaSaxophone.init(ctx, bassFilter);
    shibuyaNeoRocaGuitar.init(ctx, bassFilter);

    // 76.0MHz ELECTRO HEALING エレクトロ・ヒーリング音源エンジンの初期化
    electroHealing.init(ctx, bassFilter);

    // バックグラウンド・モバイル省電力による無音スリープ（AudioContextサスペンド）防止用キープアライブ
    try {
      const keepAliveOsc = ctx.createOscillator();
      const keepAliveGain = ctx.createGain();
      keepAliveOsc.type = 'sine';
      keepAliveOsc.frequency.setValueAtTime(44, ctx.currentTime);
      keepAliveGain.gain.setValueAtTime(0.000005, ctx.currentTime); // 完全不可聴レベル（-106dB）
      keepAliveOsc.connect(keepAliveGain);
      keepAliveGain.connect(ctx.destination);
      keepAliveOsc.start();
    } catch (e) {}

    // ステーションジングル音声を先行デコード（再生時のバッファ未完による音切れ・遅延を完全根絶）
    if (!jingleBufferRef.current) {
      if (jingleArrayBufferRef.current) {
        ctx.decodeAudioData(jingleArrayBufferRef.current.slice(0)).then((buf) => {
          jingleBufferRef.current = buf;
        }).catch(() => {});
      } else {
        fetch('/assets/aistudio/Prime_Time_Gold_e63f4979.mp3')
          .then((res) => res.arrayBuffer())
          .then((ab) => {
            jingleArrayBufferRef.current = ab;
            return ctx.decodeAudioData(ab.slice(0));
          })
          .then((buf) => {
            jingleBufferRef.current = buf;
          })
          .catch(() => {});
      }
    }

    // AudioContext状態変化監視と自動復帰ハンドラー（suspended・interrupted両対応）
    ctx.onstatechange = () => {
      setAudioCtxState(ctx);
      const state = ctx.state as string;
      if ((state === 'suspended' || state === 'interrupted') && isPlayingRef.current && isPowerOnRef.current) {
        ctx.resume().catch(() => {});
      }
    };

    return ctx;
  };

  // オーディオエンジンの確実な取得＆状態保証（停止中・デバッグ時にも安全に初期化）
  const ensureAudioEngine = (): AudioContext => {
    const ctx = audioCtxRef.current || initAudioEngine();
    const state = ctx?.state as string;
    if (ctx && (state === 'suspended' || state === 'interrupted')) {
      ctx.resume().catch(() => {});
    }
    if (ctx && (!audioCtxState || audioCtxState !== ctx)) {
      setAudioCtxState(ctx);
    }
    return ctx;
  };





  // 優しいポモドーロ完了通知チャイム
  const playFocusChime = () => {
    const ctx = audioCtxRef.current || initAudioEngine();
    if (!ctx) return;
    const now = ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      
      gain.gain.setValueAtTime(0, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 1.3);
    });
  };



  // ═════════════════════════════════════════════════════════════
  // ステーションジングル (30分毎に挟む Prime Time Gold ジングル)
  // ═════════════════════════════════════════════════════════════
  const stopStationJingle = () => {
    if (jingleFadeTimeoutRef.current) {
      clearTimeout(jingleFadeTimeoutRef.current);
      jingleFadeTimeoutRef.current = null;
    }

    try {
      if (jingleSourceRef.current) {
        const src = jingleSourceRef.current;
        jingleSourceRef.current = null;
        src.stop();
        src.disconnect();
      }
    } catch (e) {}

    try {
      if (jingleGainRef.current) {
        jingleGainRef.current.disconnect();
        jingleGainRef.current = null;
      }
    } catch (e) {}

    try {
      if (jingleAudioElementRef.current) {
        jingleAudioElementRef.current.pause();
        jingleAudioElementRef.current.currentTime = 0;
        jingleAudioElementRef.current = null;
      }
    } catch (e) {}

    setIsJinglePlaying(false);
    isJinglePlayingRef.current = false;

    // BGM音量を通常値へ滑らかに復帰 (1.2秒フェードイン) - ラジオ稼働中のみ
    if (musicGainRef.current && audioCtxRef.current && isPlayingRef.current && isPowerOnRef.current) {
      const now = audioCtxRef.current.currentTime;
      const normalGain = getEffectiveMasterGain(volumeRef.current, isMutedRef.current);
      try {
        musicGainRef.current.gain.cancelScheduledValues(now);
        musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, now);
        musicGainRef.current.gain.linearRampToValueAtTime(normalGain, now + 1.2);
      } catch (e) {}
    }
  };
  stopStationJingleRef.current = stopStationJingle;

  const playStationJingle = async (isManualTest = false) => {
    addDebugLog('timer', `Station Jingle triggered: Prime Time Gold [${isManualTest ? 'Manual Test' : 'Auto 30m'}]`, 'info');

    // 既にジングル再生中の場合は停止トグルとして動作（テスト時等に即座に停止可能）
    if (isJinglePlayingRef.current) {
      stopStationJingle();
      return;
    }

    const ctx = ensureAudioEngine();
    if (!ctx) return;
    const state = ctx.state as string;
    if (state === 'suspended' || state === 'interrupted') {
      try { await ctx.resume(); } catch (e) {}
    }

    // トランジション等の保留タイマーを全クリアして、BGMフェードインや曲間遷移の誤割り込みを完全防止
    transitionTimeoutsRef.current.forEach((tId) => clearTimeout(tId));
    transitionTimeoutsRef.current = [];
    isTransitioningRef.current = false;
    isFadingRef.current = false;

    const fadeOutNow = ctx.currentTime;
    const currentVol = volumeRef.current;
    const currentMuted = isMutedRef.current;
    // ステーションジングルとして明瞭かつ迫力ある適正音量（BGMに負けない十分なゲイン）
    const targetJingleGain = (currentMuted && !isManualTest) ? 0 : Math.min(1.35, Math.max(0.01, currentVol * 1.25));

    // 1. ラジオ番組BGMを0.6秒かけて完全にフェードアウト（ジングルをクリアに届ける）
    if (musicGainRef.current) {
      try {
        musicGainRef.current.gain.cancelScheduledValues(fadeOutNow);
        musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, fadeOutNow);
        musicGainRef.current.gain.linearRampToValueAtTime(0.0001, fadeOutNow + 0.6);
      } catch (e) {}
    }

    setIsJinglePlaying(true);
    isJinglePlayingRef.current = true;

    const onJingleEnded = () => {
      setIsJinglePlaying(false);
      isJinglePlayingRef.current = false;
      jingleSourceRef.current = null;
      jingleGainRef.current = null;
      jingleAudioElementRef.current = null;

      // ジングル終了時: ラジオBGMを1.5秒かけて優美にフェードイン復帰（ラジオ稼働時のみ）
      if (musicGainRef.current && audioCtxRef.current && isPlayingRef.current && isPowerOnRef.current) {
        const curCtx = audioCtxRef.current;
        const curNow = curCtx.currentTime;
        const normalGain = getEffectiveMasterGain(volumeRef.current, isMutedRef.current);
        try {
          musicGainRef.current.gain.cancelScheduledValues(curNow);
          musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, curNow);
          musicGainRef.current.gain.linearRampToValueAtTime(normalGain, curNow + 1.5);
        } catch (e) {}
      }
    };

    // 2. ジングル音声再生（/assets/aistudio/Prime_Time_Gold_e63f4979.mp3）
    const jingleUrl = '/assets/aistudio/Prime_Time_Gold_e63f4979.mp3';

    try {
      let buffer = jingleBufferRef.current;
      if (!buffer) {
        if (jingleArrayBufferRef.current) {
          try {
            buffer = await ctx.decodeAudioData(jingleArrayBufferRef.current.slice(0));
            jingleBufferRef.current = buffer;
          } catch (e) {}
        }
        if (!buffer) {
          const res = await fetch(jingleUrl);
          const arrayBuf = await res.arrayBuffer();
          jingleArrayBufferRef.current = arrayBuf.slice(0);
          buffer = await ctx.decodeAudioData(arrayBuf);
          jingleBufferRef.current = buffer;
        }
      }

      // ロード中にユーザーが停止ボタンを押した場合は中断
      if (!isJinglePlayingRef.current) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      const playNow = ctx.currentTime;
      gainNode.gain.setValueAtTime(0.0001, playNow);
      // ジングルはアタック30msで自然に立ち上がり
      gainNode.gain.linearRampToValueAtTime(targetJingleGain, playNow + 0.03);

      source.connect(gainNode);

      // 重要: musicGain（BGMフェード用ノード）を通さず、アナライザー経由でdestinationへ出力！
      // これによりBGMがフェードアウトしてもジングル自身の音量は一切減衰されず、力強く響きます
      if (analyserRef.current) {
        gainNode.connect(analyserRef.current);
      } else {
        gainNode.connect(ctx.destination);
      }

      jingleSourceRef.current = source;
      jingleGainRef.current = gainNode;

      source.onended = () => {
        if (jingleSourceRef.current === source) {
          onJingleEnded();
        }
      };

      source.start(playNow);
    } catch (err) {
      // フォールバック: HTMLAudioElement
      try {
        const audio = new Audio(jingleUrl);
        audio.volume = (currentMuted && !isManualTest) ? 0 : Math.max(0, Math.min(1, currentVol));
        audio.onended = () => {
          onJingleEnded();
        };
        jingleAudioElementRef.current = audio;
        await audio.play();
      } catch (fallbackErr) {
        onJingleEnded();
      }
    }
  };

  // ボリューム・ミュート変更時のジングル音量追従
  useEffect(() => {
    if (jingleGainRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0 : Math.min(1.35, Math.max(0, volume * 1.25));
      jingleGainRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05);
    }
    if (jingleAudioElementRef.current) {
      jingleAudioElementRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    }
  }, [volume, isMuted]);

  // ラジオ時報 (正時: ポ・ポ・ポ・ピーン ＋ 明るい音声アナウンス / 毎時30分: ピンポーン)
  // isHalfHour: true の場合は毎時30分用の「ピンポーン」チャイムのみ（予報音や音声アナウンスはなし）
  const playTimeSignal = (isManualTest: boolean = false, isHalfHour: boolean = false) => {
    addDebugLog('timer', `Time signal triggered (${isHalfHour ? '30m ping-pong chime' : '00m chime + announcement'} [${isManualTest ? 'Manual Test' : 'Auto'}])`, 'info');
    const ctx = ensureAudioEngine();
    if (!ctx) return;
    const state = ctx.state as string;
    if (state === 'suspended' || state === 'interrupted') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const currentVol = volumeRef.current;
    const currentMuted = isMutedRef.current;

    if (isHalfHour) {
      // ═════════════════════════════════════════════════════════════
      // 毎時30分時報: 「ピンポーン」チャイム（ポポポ・音声アナウンスなし）
      // ═════════════════════════════════════════════════════════════
      // 1. ピンポーン発音中の短時間BGMダッキング（約2.3秒）
      if (musicGainRef.current) {
        const normalGain = getEffectiveMasterGain(currentVol, currentMuted);
        const duckedGain = normalGain * 0.22;
        try {
          musicGainRef.current.gain.cancelScheduledValues(now);
          musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, now);
          musicGainRef.current.gain.linearRampToValueAtTime(duckedGain, now + 0.08);
          musicGainRef.current.gain.setValueAtTime(duckedGain, now + 1.75);
          musicGainRef.current.gain.linearRampToValueAtTime(normalGain, now + 2.30);
        } catch (e) {}
      }

      // 2. 澄んだアコースティック感あふれる「ピンポーン」チャイム
      const playChimeNote = (freq: number, startTime: number, duration: number, peakVol: number) => {
        if ((currentMuted && !isManualTest) || peakVol <= 0) return;

        // 基音 (澄んだメインのサイン波)
        const oscMain = ctx.createOscillator();
        const gainMain = ctx.createGain();
        oscMain.type = 'sine';
        oscMain.frequency.setValueAtTime(freq, startTime);

        // 鐘・チャイム特有の煌めく倍音 (2.756倍音)
        const oscOvertone = ctx.createOscillator();
        const gainOvertone = ctx.createGain();
        oscOvertone.type = 'sine';
        oscOvertone.frequency.setValueAtTime(freq * 2.756, startTime);

        // オクターブ倍音 (2倍音)
        const oscOctave = ctx.createOscillator();
        const gainOctave = ctx.createGain();
        oscOctave.type = 'sine';
        oscOctave.frequency.setValueAtTime(freq * 2, startTime);

        // 基音エンベロープ: 素早いアタック (8ms) と自然な残響減衰
        gainMain.gain.setValueAtTime(0, startTime);
        gainMain.gain.linearRampToValueAtTime(peakVol, startTime + 0.008);
        gainMain.gain.setValueAtTime(peakVol * 0.85, startTime + 0.12);
        gainMain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        // 煌めく倍音エンベロープ: 鐘を打った直後に短くキラッと響いて減衰
        const overtoneVol = peakVol * 0.18;
        gainOvertone.gain.setValueAtTime(0, startTime);
        gainOvertone.gain.linearRampToValueAtTime(overtoneVol, startTime + 0.005);
        gainOvertone.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(0.35, duration * 0.4));

        // オクターブ倍音エンベロープ
        const octaveVol = peakVol * 0.14;
        gainOctave.gain.setValueAtTime(0, startTime);
        gainOctave.gain.linearRampToValueAtTime(octaveVol, startTime + 0.006);
        gainOctave.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(0.55, duration * 0.6));

        // 接続
        oscMain.connect(gainMain);
        gainMain.connect(ctx.destination);

        oscOvertone.connect(gainOvertone);
        gainOvertone.connect(ctx.destination);

        oscOctave.connect(gainOctave);
        gainOctave.connect(ctx.destination);

        // 再生と停止
        oscMain.start(startTime);
        oscOvertone.start(startTime);
        oscOctave.start(startTime);

        oscMain.stop(startTime + duration + 0.05);
        oscOvertone.stop(startTime + duration + 0.05);
        oscOctave.stop(startTime + duration + 0.05);
      };

      const baseVol = (currentMuted && !isManualTest) ? 0 : Math.pow(currentVol, 2.2) * 0.62;

      // 「ピン」 (A5: 880Hz / 澄んだ高音)
      playChimeNote(880, now, 0.95, baseVol);

      // 「ポーン」 (F5: 698.46Hz / 長く心地よく響く低音)
      playChimeNote(698.46, now + 0.50, 1.65, baseVol * 0.95);

      return;
    }

    // ═════════════════════════════════════════════════════════════
    // 正時(00分)時報: ポ・ポ・ポ・ピーン ＋ 明るいトーンの時刻音声アナウンス
    // ═════════════════════════════════════════════════════════════
    // 1. BGMダッキング（時報・アナウンス中はBGM音量を15%まで一時的に下げる）
    if (musicGainRef.current) {
      const normalGain = getEffectiveMasterGain(currentVol, currentMuted);
      const duckedGain = normalGain * 0.15;
      try {
        musicGainRef.current.gain.cancelScheduledValues(now);
        musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, now);
        musicGainRef.current.gain.linearRampToValueAtTime(duckedGain, now + 0.2);
        musicGainRef.current.gain.setValueAtTime(duckedGain, now + 7.0);
        musicGainRef.current.gain.linearRampToValueAtTime(normalGain, now + 7.5);
      } catch (e) {}
    }

    // 3 short low beeps (880Hz) at 0s, 1s, 2s
    for (let i = 0; i < 3; i++) {
      const beepTime = now + i;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, beepTime);
      
      const beepVol = (currentMuted && !isManualTest) ? 0 : Math.pow(currentVol, 2.2) * 0.5;
      gain.gain.setValueAtTime(0, beepTime);
      gain.gain.linearRampToValueAtTime(beepVol, beepTime + 0.01);
      gain.gain.setValueAtTime(beepVol, beepTime + 0.08);
      gain.gain.linearRampToValueAtTime(0.0001, beepTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(beepTime);
      osc.stop(beepTime + 0.11);
    }

    // 1 long high beep (1760Hz) at 3s
    const finalTime = now + 3;
    const finalOsc = ctx.createOscillator();
    const finalGain = ctx.createGain();
    finalOsc.type = 'sine';
    finalOsc.frequency.setValueAtTime(1760, finalTime);

    const finalVol = (currentMuted && !isManualTest) ? 0 : Math.pow(currentVol, 2.2) * 0.6;
    finalGain.gain.setValueAtTime(0, finalTime);
    finalGain.gain.linearRampToValueAtTime(finalVol, finalTime + 0.01);
    finalGain.gain.setValueAtTime(finalVol, finalTime + 0.35);
    finalGain.gain.linearRampToValueAtTime(0.0001, finalTime + 0.45);

    finalOsc.connect(finalGain);
    finalGain.connect(ctx.destination);
    finalOsc.start(finalTime);
    finalOsc.stop(finalTime + 0.5);

    // Speech synthesis announcement with brighter friendly tone
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const currentTime = new Date();
        // 手動テスト時は現在の時間、自動時報時は3秒後の時間をアナウンス
        const targetTime = isManualTest ? currentTime : new Date(currentTime.getTime() + 3000);
        const targetHour = targetTime.getHours();
        const period = targetHour >= 12 ? '午後' : '午前';
        const displayHour = targetHour % 12 === 0 ? 12 : targetHour % 12;
        const utterText = `${period}${displayHour}時をお知らせします。`;

        const utterance = new SpeechSynthesisUtterance(utterText);
        utterance.lang = 'ja-JP';
        // 少し明るくクリアな声のトーン (pitch 1.25) & 聞き取りやすく爽快な速度 (rate 1.05)
        utterance.pitch = 1.25;
        utterance.rate = 1.05;
        utterance.volume = 1.0;

        if (timeSignalTimeoutRef.current) {
          clearTimeout(timeSignalTimeoutRef.current);
        }
        timeSignalTimeoutRef.current = window.setTimeout(() => {
          timeSignalTimeoutRef.current = null;
          if ((!isPowerOnRef.current && !isManualTest) || (isMutedRef.current && !isManualTest)) return;
          try {
            // 利用可能な日本語ボイス（明るい声質の女性/ナチュラルボイス優先）を取得
            const voices = window.speechSynthesis.getVoices();
            const jaVoices = voices.filter(v => v.lang.startsWith('ja') || v.lang === 'ja_JP' || v.lang.toLowerCase().includes('jp'));
            if (jaVoices.length > 0) {
              const brightVoice = jaVoices.find(v => 
                /female|woman|kyoko|nanami|haruka|sayaka|ayumi|google\s*日本語/i.test(v.name)
              );
              utterance.voice = brightVoice || jaVoices[0];
            }
            window.speechSynthesis.speak(utterance);
          } catch (err) {
            window.speechSynthesis.speak(utterance);
          }
        }, 3500);
      }
    } catch (e) {}
  };

  // ラジオ特有のチューニング時の「ザー」という砂嵐音の合成
  const initStaticNoise = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; 
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const radioFilter = ctx.createBiquadFilter();
    radioFilter.type = 'bandpass';
    radioFilter.frequency.setValueAtTime(800, ctx.currentTime);
    radioFilter.Q.setValueAtTime(2.0, ctx.currentTime);

    const staticGain = ctx.createGain();
    staticGain.gain.setValueAtTime(0, ctx.currentTime);

    source.connect(radioFilter);
    radioFilter.connect(staticGain);
    if (masterCompressorRef.current) {
      staticGain.connect(masterCompressorRef.current);
    } else if (bassFilterRef.current) {
      staticGain.connect(bassFilterRef.current);
    } else {
      staticGain.connect(ctx.destination);
    }

    source.start();

    staticSourceRef.current = source;
    staticGainRef.current = staticGain;
  };

  // 🔊 マスター音量 (volume) と 消音 (isMuted) の変更を Web Audio マスターゲインにリアルタイム反映
  useEffect(() => {
    if (musicGainRef.current && audioCtxRef.current) {
      const targetGain = getEffectiveMasterGain(volume, isMuted);
      const now = audioCtxRef.current.currentTime;
      musicGainRef.current.gain.cancelScheduledValues(now);
      musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, now);
      musicGainRef.current.gain.linearRampToValueAtTime(targetGain, now + 0.05);
    }
  }, [volume, isMuted]);

  // 🎛️ イコライザー (bass, mid, treble) 変更のリアルタイム反映
  useEffect(() => {
    if (audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (bassFilterRef.current) bassFilterRef.current.gain.setValueAtTime(bass, now);
      if (midFilterRef.current) midFilterRef.current.gain.setValueAtTime(mid, now);
      if (trebleFilterRef.current) trebleFilterRef.current.gain.setValueAtTime(treble, now);
    }
  }, [bass, mid, treble]);

  // バンド変更・チューニング切替時の実機感あふれるノイズ（スイッチ音＋ノイズバースト）再生
  const playBandSwitchNoise = (bandType: 'FM' | 'AM' | 'SW' = selectedBand) => {
    const ctx = audioCtxRef.current || initAudioEngine();
    if (!ctx || !isPowerOn) return;
    ensureCtxRunning(ctx);

    const now = ctx.currentTime;

    // 1. メカニカルスイッチクリック音（カチッ）
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(220, now);
    clickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.04);

    clickGain.gain.setValueAtTime(0.35, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);

    // 2. バンド切替時の瞬間バーストノイズ (0.25秒)
    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    if (bandType === 'AM') {
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3.5, now);
    } else if (bandType === 'SW') {
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(4.5, now);
    } else {
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(2.0, now);
    }

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.25);
  };

  // 隠しステーション (76.0 MHz) 発見時の特別なアンロック音
  const playSecretUnlockSound = () => {
    const ctx = audioCtxRef.current || initAudioEngine();
    if (!ctx || !isPowerOn) return;
    ensureCtxRunning(ctx);

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  };

  // ==========================================
  // 【Tone.js サンプラー・ドラム音源発音トリガー】
  // ==========================================

  // 1. キック（バスドラム） - Tone.js サンプル音源（フォールバック付き）
  const triggerKick = (vol = 0.5, time?: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPowerOn || isMuted) return;
    ensureCtxRunning(ctx);

    toneDrumKit.triggerKick(vol, time);
  };

  // 2. スネア / リムショット - Tone.js サンプル音源（フォールバック付き）
  const triggerSnare = (vol = 0.4, time?: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPowerOn || isMuted) return;
    ensureCtxRunning(ctx);

    toneDrumKit.triggerSnare(vol, time);
  };

  // ボサノヴァ・ジャズ用アコースティック・木製リムショット / クロススティック
  const triggerRimShot = (vol = 0.4, time?: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPowerOn || isMuted) return;
    ensureCtxRunning(ctx);

    toneDrumKit.triggerRimShot(vol, time);
  };

  // 3. ハイハット - Tone.js サンプル音源（フォールバック付き）
  const triggerHiHat = (vol = 0.3, isOpen = false, time?: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPowerOn || isMuted) return;
    ensureCtxRunning(ctx);

    toneDrumKit.triggerHiHat(vol, isOpen, time);
  };

  // ラジオ選局時のロード音（アナログチューニングノイズ・周波数シーク音）
  const playTuningNoise = (durationSec = 0.85) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPowerOn || isMuted) return;
    ensureCtxRunning(ctx);

    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.22;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + durationSec * 0.4);
    filter.frequency.exponentialRampToValueAtTime(1100, now + durationSec);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    const nVol = Math.max(0.0001, 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(nVol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    noise.connect(filter);
    filter.connect(gain);

    if (bassFilterRef.current) {
      gain.connect(bassFilterRef.current);
    } else {
      gain.connect(ctx.destination);
    }

    noise.start(now);
    noise.stop(now + durationSec + 0.01);
  };

  // 電源ON音（メカニカルスイッチ＆トランス通電ウォーミングアップ音）
  const playPowerOnAudio = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    ensureCtxRunning(ctx);
    const now = ctx.currentTime;

    // メカニカルスイッチ「カチッ」
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);

    // トランス・真空管ウォーミングアップ通電音
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = 'triangle';
    hum.frequency.setValueAtTime(50, now + 0.02);
    hum.frequency.exponentialRampToValueAtTime(120, now + 0.3);
    humGain.gain.setValueAtTime(0.001, now);
    humGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
    humGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    hum.connect(humGain);
    humGain.connect(ctx.destination);
    hum.start(now + 0.02);
    hum.stop(now + 0.46);
  };

  // 電源OFF音（スイッチ切断＆キャパシタ放電音）
  const playPowerOffAudio = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    ensureCtxRunning(ctx);
    const now = ctx.currentTime;

    // スイッチ切断音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);

    // コンデンサ放電ピッチダウン音
    const discharge = ctx.createOscillator();
    const disGain = ctx.createGain();
    discharge.type = 'sawtooth';
    discharge.frequency.setValueAtTime(160, now + 0.02);
    discharge.frequency.exponentialRampToValueAtTime(15, now + 0.42);
    disGain.gain.setValueAtTime(0.12, now + 0.02);
    disGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    discharge.connect(disGain);
    disGain.connect(ctx.destination);
    discharge.start(now + 0.02);
    discharge.stop(now + 0.43);
  };

  // 4. アコースティック・グランドピアノ和音（柔らかな打鍵ベロシティと上品なアタック）
  const triggerPianoChord = (chordNotes: number[], chordVol = 0.45, sustainSec = 1.8, time?: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPowerOn || isMuted) return;
    ensureCtxRunning(ctx);

    const now = time ?? ctx.currentTime;

    // チューニング精度
    const closestSt = STATIONS.find((st) => Math.abs(st.frequency - frequency) < 0.5);
    let tuningFactor = 1.0;
    if (closestSt) {
      const dist = Math.abs(closestSt.frequency - frequency);
      tuningFactor = Math.max(0, 1.0 - (dist / 0.5));
    }

    // 全鍵盤を完全同時に鳴らし、ビート・ドラム・ベース・メロディーと完全に同期（もたつきゼロ）
    chordNotes.forEach((freq) => {
      const oscFund = ctx.createOscillator(); // 基音（アコースティック三角波）
      const oscHarm = ctx.createOscillator(); // 明るい倍音（正弦波）
      const noteGain = ctx.createGain();

      oscFund.type = 'triangle';
      oscHarm.type = 'sine';

      // ピアノハンマー打弦時の瞬間的な微細ピッチ変動（アコースティック感）
      const startTime = now;
      oscFund.frequency.setValueAtTime(freq * 1.002, startTime);
      oscFund.frequency.exponentialRampToValueAtTime(freq, startTime + 0.015);

      oscHarm.frequency.setValueAtTime(freq * 2.001, startTime);

      // コードベロシティを抑えたマイルドな音量算出 (0.45x)
      const noteVol = Math.max(0.0001, (chordVol * tuningFactor * 0.45) / Math.sqrt(chordNotes.length));

      // ピアノのサスティンペダルを踏んだ美しいエンベロープ（素早いアタック 2ms ＋ たっぷりとしたサスティン）
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(noteVol, startTime + 0.002); // ピアノハンマー打鍵アタック（瞬時）
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + sustainSec); // サスティンペダルの自然な余韻

      // アコースティックピアノ特有の木製共鳴ボディフィルター
      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.setValueAtTime(2200 * (0.5 + 0.5 * tuningFactor), startTime);

      oscFund.connect(bodyFilter);
      oscHarm.connect(bodyFilter);
      bodyFilter.connect(noteGain);

      if (bassFilterRef.current) {
        noteGain.connect(bassFilterRef.current);
      } else {
        noteGain.connect(ctx.destination);
      }

      oscFund.start(startTime);
      oscHarm.start(startTime);
      oscFund.stop(startTime + sustainSec + 0.1);
      oscHarm.stop(startTime + sustainSec + 0.1);
      oscFund.onended = () => {
        try { oscFund.disconnect(); oscHarm.disconnect(); bodyFilter.disconnect(); noteGain.disconnect(); } catch (e) {}
      };
    });
  };

  // 4b. 92.4MHz専用 昼下がりのシティポップ・ブライトエレピ和音（DX7 / Fender Rhodes ベル鳴りエレピ）
  const triggerDaylightEPianoChord = (chordNotes: number[], chordVol = 0.46, sustainSec = 0.8, time?: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPowerOn || isMuted) return;
    ensureCtxRunning(ctx);

    const now = time ?? ctx.currentTime;
    const closestSt = STATIONS.find((st) => Math.abs(st.frequency - frequency) < 0.5);
    let tuningFactor = 1.0;
    if (closestSt) {
      const dist = Math.abs(closestSt.frequency - frequency);
      tuningFactor = Math.max(0, 1.0 - (dist / 0.5));
    }

    chordNotes.forEach((freq) => {
      // 完全同時発音でドラムやベース、トランペットとタイトに同期
      const startTime = now;

      // 1. 基音（温かみと透明感のある正弦波・三角波ハイブリッド）
      const oscBody = ctx.createOscillator();
      oscBody.type = 'sine';
      oscBody.frequency.setValueAtTime(freq, startTime);

      // 2. 昼の陽光にきらめくDX7風ベル倍音（Tine Harmonics: 2オクターブ上 + わずかなデチューン）
      const oscTine = ctx.createOscillator();
      oscTine.type = 'sine';
      oscTine.frequency.setValueAtTime(freq * 3.99, startTime);

      const tineGain = ctx.createGain();
      const bodyGain = ctx.createGain();
      const noteGain = ctx.createGain();

      const perNoteVol = Math.max(0.0001, (chordVol * tuningFactor * 0.48) / Math.sqrt(chordNotes.length));

      // ベル音のアタック（キラッと鳴って素早く減衰する鈴鳴り倍音: 瞬時アタック 1ms）
      tineGain.gain.setValueAtTime(0.0001, startTime);
      tineGain.gain.linearRampToValueAtTime(perNoteVol * 0.42, startTime + 0.001);
      tineGain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(sustainSec * 0.45, 0.35));

      // エレピ本体のエンベロープ（澄んだ持続と爽やかな抜け: 瞬時アタック 2ms）
      bodyGain.gain.setValueAtTime(0.0001, startTime);
      bodyGain.gain.linearRampToValueAtTime(perNoteVol * 0.85, startTime + 0.002);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + sustainSec);

      // 昼間の青空に抜けるブライト・ハイパス＆ハイシェルフフィルター
      const brightFilter = ctx.createBiquadFilter();
      brightFilter.type = 'peaking';
      brightFilter.frequency.setValueAtTime(2800, startTime);
      brightFilter.gain.setValueAtTime(3.5, startTime);
      brightFilter.Q.setValueAtTime(1.2, startTime);

      oscBody.connect(bodyGain);
      oscTine.connect(tineGain);
      bodyGain.connect(brightFilter);
      tineGain.connect(brightFilter);
      brightFilter.connect(noteGain);

      if (bassFilterRef.current) {
        noteGain.connect(bassFilterRef.current);
      } else {
        noteGain.connect(ctx.destination);
      }

      oscBody.start(startTime);
      oscTine.start(startTime);
      const stopTime = startTime + sustainSec + 0.08;
      oscBody.stop(stopTime);
      oscTine.stop(stopTime);

      oscBody.onended = () => {
        try {
          oscBody.disconnect();
          oscTine.disconnect();
          tineGain.disconnect();
          bodyGain.disconnect();
          brightFilter.disconnect();
          noteGain.disconnect();
        } catch (e) {}
      };
    });
  };

  // 作業用BGM向けに洗練されたソフトなチル音符の合成（サックス音響要素解析・統合版）
  const triggerSynthNote = (freq: number, type: OscillatorType, duration: number, noteVol: number, isBass = false, time?: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPowerOn || isMuted) return;
    ensureCtxRunning(ctx);

    const isSaxophone = (type === 'sawtooth');
    const now = time ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    // サックス特有の「しゃくり (Pitch Scoop / Bend-up)」の付加（アタック直後の微小なピッチの上昇）
    if (isSaxophone && !isBass) {
      osc.frequency.setValueAtTime(freq * 0.965, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.035);
    }

    // サックスの円錐管共鳴とリードの厚みを模した、オクターブ上のハーモニクスオシレーター（デュアル構成）
    let oscHarm: OscillatorNode | null = null;
    let harmGain: GainNode | null = null;
    if (isSaxophone && !isBass) {
      oscHarm = ctx.createOscillator();
      harmGain = ctx.createGain();
      oscHarm.type = 'sine';
      oscHarm.frequency.setValueAtTime(freq * 2.0, now);
      if (duration >= 0.4) {
        oscHarm.frequency.setValueAtTime(freq * 2.0 * 0.965, now);
        oscHarm.frequency.exponentialRampToValueAtTime(freq * 2.0, now + 0.035);
      }
      harmGain.gain.setValueAtTime(0.0001, now);
      harmGain.gain.linearRampToValueAtTime(noteVol * 0.35, now + 0.025);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.2);
    }

    // 表現豊かなジャズ・ビブラート（ピッチ＋アンプ揺らぎ）
    const vibThreshold = isSaxophone ? 0.35 : 0.6;
    if (duration >= vibThreshold && !isBass) {
      const vibRate = isSaxophone ? 5.2 : 4.8; // 少し艶のあるジャズ・ヴィブラート
      const vibDepth = freq * (isSaxophone ? 0.009 : 0.007); 
      const vibStart = now + (isSaxophone ? 0.12 : 0.18);
      const actualDuration = Math.max(0.1, duration * 1.2 - (isSaxophone ? 0.12 : 0.18));
      const vibSteps = 24;
      const curve = new Float32Array(vibSteps + 1);
      for (let i = 0; i <= vibSteps; i++) {
        const t = i / vibSteps;
        const sineVal = Math.sin(t * Math.PI * 2 * vibRate * actualDuration);
        curve[i] = freq + sineVal * vibDepth * Math.min(1.0, t * 1.8);
      }
      try {
        osc.frequency.setValueCurveAtTime(curve, vibStart, actualDuration);
        if (oscHarm) {
          const harmCurve = new Float32Array(vibSteps + 1);
          for (let i = 0; i <= vibSteps; i++) {
            const t = i / vibSteps;
            const sineVal = Math.sin(t * Math.PI * 2 * vibRate * actualDuration);
            harmCurve[i] = (freq * 2.0) + sineVal * (vibDepth * 2.0) * Math.min(1.0, t * 1.8);
          }
          oscHarm.frequency.setValueCurveAtTime(harmCurve, vibStart, actualDuration);
        }
      } catch (e) {}
    }

    noteGain.gain.setValueAtTime(0.0001, now);
    
    // チューニング精度
    const closestSt = STATIONS.find((st) => Math.abs(st.frequency - frequency) < 0.5);
    let tuningFactor = 1.0;
    if (closestSt) {
      const dist = Math.abs(closestSt.frequency - frequency);
      tuningFactor = Math.max(0, 1.0 - (dist / 0.5));
    }

    const finalVol = Math.max(0.0001, noteVol * tuningFactor * (isSaxophone ? 1.05 : 1.0));

    if (isBass) {
      noteGain.gain.linearRampToValueAtTime(finalVol * 0.7, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.3);
    } else {
      const attackTime = isSaxophone ? 0.016 : 0.018;
      // サックスは主役として前に出るよう適切なゲイン（0.82）で鳴らす
      noteGain.gain.linearRampToValueAtTime(finalVol * (isSaxophone ? 0.82 : 0.45), now + attackTime);
      // 自然な減衰で音がぶつ切れにならないようリリースタイムを十分に保持
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.35);
    }

    // サックスの管体フォルマント共鳴を模したダイナミック・ローパスフィルター（抜けの良い2800Hz帯）
    const cutoffFilter = ctx.createBiquadFilter();
    cutoffFilter.type = 'lowpass';
    const baseCutoff = isBass ? 220 : (isSaxophone ? 2800 : 800);
    const effectiveCutoff = baseCutoff * (0.35 + 0.65 * tuningFactor);
    cutoffFilter.frequency.setValueAtTime(effectiveCutoff * 0.75, now);
    if (isSaxophone && !isBass) {
      cutoffFilter.frequency.exponentialRampToValueAtTime(effectiveCutoff * 1.25, now + 0.035);
      cutoffFilter.frequency.exponentialRampToValueAtTime(effectiveCutoff, now + 0.25);
    } else {
      cutoffFilter.frequency.setValueAtTime(effectiveCutoff, now);
    }

    osc.connect(cutoffFilter);
    if (oscHarm && harmGain) {
      oscHarm.connect(harmGain);
      harmGain.connect(cutoffFilter);
    }
    cutoffFilter.connect(noteGain);

    if (bassFilterRef.current) {
      noteGain.connect(bassFilterRef.current);
    } else {
      noteGain.connect(ctx.destination);
    }

    const cleanupNode = registerActiveAudioNode(() => {
      try {
        osc.stop();
        osc.disconnect();
        if (oscHarm) {
          oscHarm.stop();
          oscHarm.disconnect();
        }
        noteGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        noteGain.disconnect();
      } catch (e) {}
    });

    osc.start(now);
    if (oscHarm) oscHarm.start(now);
    
    const stopTime = now + duration * 1.45;
    osc.stop(stopTime);
    if (oscHarm) oscHarm.stop(stopTime);

    osc.onended = () => {
      cleanupNode();
      try {
        osc.disconnect();
        if (oscHarm) oscHarm.disconnect();
        if (harmGain) harmGain.disconnect();
        cutoffFilter.disconnect();
        noteGain.disconnect();
      } catch (e) {}
    };
  };

  // バンド変更ハンドラー
  const handleBandChange = (newBand: 'FM' | 'AM' | 'SW') => {
    if (newBand === selectedBand) return;
    setSelectedBand(newBand);
    playBandSwitchNoise(newBand);
  };

  // 周波数チューニング変更ハンドラー
  const handleFreqChange = (newFreq: number) => {
    if (!isPowerOn) return;
    initAudioEngine();

    const roundedFreq = parseFloat(newFreq.toFixed(1));
    const closestSt = STATIONS.find((st) => Math.abs(st.frequency - roundedFreq) < 0.25);

    // チューナー周波数を即時更新
    setFrequency(roundedFreq);
    frequencyRef.current = roundedFreq;

    // チューナー手動選局時は通常再生（チューナー選択モード）
    if (activePresetPairRef.current) {
      setActivePresetPair(null);
      activePresetPairRef.current = null;
    }

    if (closestSt) {
      setTargetStationName(`${closestSt.name} (${closestSt.frequency.toFixed(1)} MHz)`);
      if (isPlaying && isPowerOn) {
        if (activeStation?.frequency !== closestSt.frequency) {
          changeTrackWithFade(0, closestSt);
        }
      } else {
        // 停止中でもチューナーで局に合わせたら、カセットデッキにもその局とその1曲目を即座に反映
        setActiveStation(closestSt);
        activeStationRef.current = closestSt;
        setCurrentTrackIndex(0);
        setCurrentTimeSec(0);
        setProgress(0);
      }
    } else {
      setTargetStationName(`${roundedFreq.toFixed(1)} MHz`);
      if (activeStation !== null) {
        // 局のない周波数帯へ移動した場合、前局の音源・オシレーター・残響・ジングルを直ちに完全消音
        stopAllAudioImmediate(true);
        setActiveStation(null);
        activeStationRef.current = null;
      }
    }

    // 隠しステーション (76.0 MHz) 到達チェック
    if (Math.abs(roundedFreq - 76.0) < 0.2) {
      if (!unlockedSecret) {
        setUnlockedSecret(true);
        playSecretUnlockSound();
      }
    }
  };

  // チューニング周波数に応じて音量比とチューニングノイズ（砂嵐音）をリアルに調整
  const tuneGains = (freq: number) => {
    if (!isPowerOn) {
      const now = audioCtxRef.current?.currentTime || 0;
      if (staticGainRef.current && audioCtxRef.current) {
        try {
          staticGainRef.current.gain.cancelScheduledValues(now);
          staticGainRef.current.gain.setValueAtTime(staticGainRef.current.gain.value, now);
          staticGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        } catch (e) {}
      }
      if (musicGainRef.current && audioCtxRef.current) {
        try {
          musicGainRef.current.gain.cancelScheduledValues(now);
          musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, now);
          musicGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        } catch (e) {}
      }
      return;
    }

    // チャンネル切り替え・曲間遷移中はゲインを外部から絶対に変更させない（混線完全遮断）
    if (isTransitioningRef.current || isFadingRef.current) {
      return;
    }

    const closestSt = STATIONS.find((st) => Math.abs(st.frequency - freq) < 0.5);
    const now = audioCtxRef.current?.currentTime || 0;
    const masterVol = getEffectiveMasterGain(volume, isMuted);

    if (!closestSt) {
      // 局のない周波数帯ではアナログ特有の心地よい「ザー」というチューニング砂嵐ノイズを出力
      if (staticGainRef.current && audioCtxRef.current) {
        const noiseFactor = selectedBand === 'AM' ? 0.09 : (selectedBand === 'SW' ? 0.12 : 0.06);
        staticGainRef.current.gain.setTargetAtTime(masterVol * noiseFactor, now, 0.08);
      }
      if (musicGainRef.current && audioCtxRef.current) {
        musicGainRef.current.gain.setTargetAtTime(0, now, 0.05);
      }
    } else {
      const dist = Math.abs(closestSt.frequency - freq);

      if (dist < 0.1) {
        // 同調完了（ノイズ消失・クリア放送）
        if (staticGainRef.current && audioCtxRef.current) {
          staticGainRef.current.gain.setTargetAtTime(0, now, 0.08);
        }
        if (musicGainRef.current && audioCtxRef.current) {
          musicGainRef.current.gain.setTargetAtTime(masterVol, now, 0.08);
        }
      } else {
        // 同調途中（BGMフェード＋周波数のズレに応じたノイズ混入）
        const ratio = (dist - 0.1) / 0.4;
        const musicVol = (1.0 - ratio) * masterVol;
        const noiseVol = ratio * masterVol * 0.05;

        if (staticGainRef.current && audioCtxRef.current) {
          staticGainRef.current.gain.setTargetAtTime(noiseVol, now, 0.1);
        }
        if (musicGainRef.current && audioCtxRef.current) {
          musicGainRef.current.gain.setTargetAtTime(musicVol, now, 0.1);
        }
      }
    }
  };

  // スリープタイマーのカウントダウン
  useEffect(() => {
    sleepTimerRef.current = sleepTimer;
  }, [sleepTimer]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (sleepTimerRef.current !== null) {
        const next = sleepTimerRef.current - 1 / 60;
        if (next <= 0) {
          setSleepTimer(null);
          setIsPowerOn(false);
          setIsPlaying(false);
        } else {
          setSleepTimer(next);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 集中タイマー（ポモドーロ 25分/50分）のカウントダウン処理
  useEffect(() => {
    if (pomodoroMode === 'off') {
      if (pomodoroTimerRef.current) clearInterval(pomodoroTimerRef.current);
      return;
    }

    pomodoroTimerRef.current = window.setInterval(() => {
      setPomodoroSecondsLeft((prev) => {
        if (prev <= 1) {
          playFocusChime();
          const targetWorkMins = focusWorkMinutesRef.current;
          if (pomodoroMode === 'work') {
            setCompletedSessions((c) => c + 1);
            setPomodoroMode('break');
            return targetWorkMins === 50 ? 10 * 60 : 5 * 60; // 50分集中時は10分休憩、25分集中時は5分休憩
          } else {
            setPomodoroMode('work');
            return targetWorkMins * 60; // 次の集中セッション
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (pomodoroTimerRef.current) clearInterval(pomodoroTimerRef.current);
    };
  }, [pomodoroMode]);


  // トラック/ステーション切り替え時のロード時間・チューニングノイズ・演奏終了/開始インターバル処理
  const isFadingRef = useRef<boolean>(false);
  const isTransitioningRef = useRef<boolean>(false);

  const changeTrackWithFade = (
    nextIdx: number,
    newStation?: Station,
    isInterTrackGap: boolean = false,
    forcePlay: boolean = false
  ) => {
    // ステーションジングル再生中の場合は、曲間自動遷移によるジングル中断・BGM誤フェードインを阻止
    if (isJinglePlayingRef.current && !newStation) {
      return;
    }

    // 1. 直前の遷移タイマーをすべてキャンセル
    transitionTimeoutsRef.current.forEach((id) => clearTimeout(id));
    transitionTimeoutsRef.current = [];

    const targetSt = newStation || activeStation || STATIONS[0];
    const isTarget760 = Math.abs(targetSt.frequency - 76.0) < 0.2;
    const isCurrent760 = Math.abs(frequency - 76.0) < 0.2;

    if (forcePlay) {
      const ctx = audioCtxRef.current || initAudioEngine();
      ensureCtxRunning(ctx);
      setIsPowerOn(true);
      setIsPlaying(true);
    }

    if (newStation !== undefined && !isInterTrackGap) {
      setActiveStation(newStation);
      setFrequency(newStation.frequency);
      frequencyRef.current = newStation.frequency;
      activeStationRef.current = newStation;
    } else if (activeStation && Math.abs(frequency - activeStation.frequency) > 0.1 && !isInterTrackGap) {
      setFrequency(activeStation.frequency);
      frequencyRef.current = activeStation.frequency;
    }

    const effectivelyPlaying = forcePlay || (isPlaying && isPowerOn);
    const targetVol = Math.max(getEffectiveMasterGain(volume, isMuted), 0.0001);

    if (!audioCtxRef.current || !musicGainRef.current || !effectivelyPlaying) {
      if (newStation !== undefined) {
        setActiveStation(newStation);
        setFrequency(newStation.frequency);
        frequencyRef.current = newStation.frequency;
        activeStationRef.current = newStation;
      }
      setTargetStationName(`${targetSt.name} (${targetSt.frequency.toFixed(1)} MHz)`);
      setCurrentTrackIndex(nextIdx);
      setCurrentTimeSec(0);
      setProgress(0);
      setIsTuning(true);
      const tId = window.setTimeout(() => {
        setIsTuning(false);
        isTransitioningRef.current = false;
        isFadingRef.current = false;
      }, 700);
      transitionTimeoutsRef.current.push(tId);
      return;
    }

    if (isInterTrackGap) {
      // ═════════════════════════════════════════════════════════════
      // 【同チャンネル内の曲間インターバル / プリセット2局交互自動遷移】
      // 心地よい余韻フェードアウトと静寂・息継ぎ空間を確保してから次曲・ペア局を開始
      // ═════════════════════════════════════════════════════════════
      isTransitioningRef.current = true;
      isFadingRef.current = true;

      // 既存のシーケンサータイマーを即座に破棄（これ以上のステップ発音を停止）
      if (stepTimerRef.current) {
        stepTimerRef.current.destroy();
        stepTimerRef.current = null;
      }

      const fadeOutDur = isCurrent760 ? 1.50 : 0.80;
      const silenceDur = (isCurrent760 || isTarget760) ? 2.00 : 1.20;
      const fadeInDur  = isTarget760 ? 1.20 : 0.40;

      // 1. 演奏中の残響やパッドを滑らかにフェードアウト
      const now = audioCtxRef.current.currentTime;
      try {
        musicGainRef.current.gain.cancelScheduledValues(now);
        musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, now);
        musicGainRef.current.gain.linearRampToValueAtTime(0.0001, now + fadeOutDur);
      } catch (e) {}

      if (isCurrent760) {
        electroHealing.fadePadChords(now, fadeOutDur);
      }

      // 2. フェードアウト完了時に旧音源ノードとモジュールを安全解放
      // ※ 重要: stopAllAudioImmediate は transitionTimeoutsRef をクリアしてしまうため呼び出してはならない
      // （呼び出すと tNext タイマーが破棄され、次曲が永久に始まらなくなるバグの原因だった）
      const tClean = window.setTimeout(() => {
        if (activeAudioNodesRef.current.length > 0) {
          activeAudioNodesRef.current.forEach((item) => {
            try { item.stop(); } catch (e) {}
          });
          activeAudioNodesRef.current = [];
        }
        try { electroHealing.stopAll(); } catch (e) {}
        try { retroMusicBox.stopAll(); } catch (e) {}
        try { retroLoungePiano.stopAll(); } catch (e) {}
        try { acousticJazzDrums.stopAll(); } catch (e) {}
        try { toneDrumKit.stopAll(); } catch (e) {}
        try { tokyoMorningBossaGuitar.stopAll(); } catch (e) {}
        try { raindropMelody.stopAll(); } catch (e) {}
      }, fadeOutDur * 1000);
      transitionTimeoutsRef.current.push(tClean);

      // 3. 静寂期間(silenceDur)が完全に満了した後に、新局・新曲インデックスへ更新して再生開始
      const totalWaitMs = (fadeOutDur + silenceDur) * 1000;
      const tNext = window.setTimeout(() => {
        if (newStation !== undefined) {
          setActiveStation(newStation);
          setFrequency(newStation.frequency);
          frequencyRef.current = newStation.frequency;
          activeStationRef.current = newStation;
        }
        setTargetStationName(`${targetSt.name} (${targetSt.frequency.toFixed(1)} MHz)`);
        setCurrentTrackIndex(nextIdx);
        setTrackIteration((prev) => prev + 1);
        setCurrentTimeSec(0);
        setProgress(0);

        // 新曲のフェードイン準備
        if (audioCtxRef.current && musicGainRef.current) {
          const nowIn = audioCtxRef.current.currentTime;
          try {
            musicGainRef.current.gain.cancelScheduledValues(nowIn);
            musicGainRef.current.gain.setValueAtTime(0.0001, nowIn);
            musicGainRef.current.gain.linearRampToValueAtTime(targetVol, nowIn + fadeInDur);
          } catch (e) {}
        }

        isTransitioningRef.current = false;
        isFadingRef.current = false;
      }, totalWaitMs);
      transitionTimeoutsRef.current.push(tNext);

    } else {
      // ═════════════════════════════════════════════════════════════
      // 【手動選局 / 早送り・トラック切り替え (Manual Tuning / Track Skip)】
      // ユーザーの明示的操作時は即座に停止＆切り替え
      // ═════════════════════════════════════════════════════════════
      stopAllAudioImmediate(false);
      isTransitioningRef.current = true;
      isFadingRef.current = true;

      setTargetStationName(`${targetSt.name} (${targetSt.frequency.toFixed(1)} MHz)`);
      setCurrentTrackIndex(nextIdx);
      setTrackIteration((prev) => prev + 1);
      setCurrentTimeSec(0);
      setProgress(0);

      setIsTuning(true);
      const tuningNoiseDur = newStation !== undefined ? 0.38 : 0.25;
      const fadeInDur = 0.35;

      playTuningNoise(tuningNoiseDur);

      const t1 = window.setTimeout(() => {
        // 新局のシーケンサー立ち上げ許可
        isTransitioningRef.current = false;
        isFadingRef.current = false;
        setIsTuning(false);

        if (audioCtxRef.current && musicGainRef.current) {
          const nowIn = audioCtxRef.current.currentTime;
          try {
            musicGainRef.current.gain.cancelScheduledValues(nowIn);
            musicGainRef.current.gain.setValueAtTime(0.0001, nowIn);
            musicGainRef.current.gain.linearRampToValueAtTime(targetVol, nowIn + fadeInDur);
          } catch (e) {}
        }
      }, tuningNoiseDur * 1000);

      transitionTimeoutsRef.current.push(t1);
    }
  };

  // 電源や周波数が変化した際の調整 & 97.5MHz(オルゴール)/101.2MHz(ラウンジピアノ)用ヒスノイズ連動
  useEffect(() => {
    if (audioCtxRef.current) {
      tuneGains(frequency);
    }
    const isNear975 = Math.abs(frequency - 97.5) < 0.45;
    const isNear1012 = Math.abs(frequency - 101.2) < 0.45;

    if (isPowerOn && isPlaying && !isMuted && isNear975) {
      retroMusicBox.setHissEnabled(true);
    } else {
      retroMusicBox.setHissEnabled(false);
    }

    if (isPowerOn && isPlaying && !isMuted && isNear1012) {
      retroLoungePiano.setHissEnabled(true);
    } else {
      retroLoungePiano.setHissEnabled(false);
    }
  }, [frequency, isPowerOn, isPlaying, isMuted]);

  // ==========================================
  // 【自動演奏チルシーケンサーコアエンジン】
  // ==========================================
  useEffect(() => {
    if (!isPlaying || !isPowerOn) {
      if (stepTimerRef.current) {
        stepTimerRef.current.destroy();
        stepTimerRef.current = null;
      }
      return;
    }

    const closestSt = STATIONS.find((st) => Math.abs(st.frequency - frequency) < 0.5);
    if (!closestSt) return;

    // 再生局とactiveStationおよび表示の確実な同期保護
    if (!activeStation || activeStation.frequency !== closestSt.frequency) {
      setActiveStation(closestSt);
      activeStationRef.current = closestSt;
      setTargetStationName(`${closestSt.name} (${closestSt.frequency.toFixed(1)} MHz)`);
    }

    // トランジション状態の安全解除 & マスターゲインの健全な復元
    isTransitioningRef.current = false;
    isFadingRef.current = false;
    if (audioCtxRef.current && musicGainRef.current) {
      const now = audioCtxRef.current.currentTime;
      const targetGain = getEffectiveMasterGain(volume, isMuted);
      const is76 = Math.abs(closestSt.frequency - 76.0) < 0.2;
      const fadeInDur = is76 ? 1.40 : 0.40;
      try {
        const curGain = musicGainRef.current.gain.value;
        musicGainRef.current.gain.cancelScheduledValues(now);
        musicGainRef.current.gain.setValueAtTime(Math.max(curGain, 0.0001), now);
        musicGainRef.current.gain.linearRampToValueAtTime(targetGain, now + fadeInDur);
      } catch (e) {}
    }

    const prog = stationAudioOverridesRef.current[closestSt.frequency] || CHORD_PROGRESSIONS[closestSt.frequency] || CHORD_PROGRESSIONS[88.1];

    // 各局のジャンル特性に最適化されたTone.jsドラムサンプルキットの設定
    if (closestSt.frequency === 101.5 || closestSt.frequency === 88.1) {
      toneDrumKit.setKit('acoustic');
    } else if (closestSt.frequency === 105.8) {
      // 105.8MHz (ROPPONGI Petrichor FM): 雨音ローファイ・ヒップホップにふさわしい重厚でパンチのあるRoland R-8実録音源
      toneDrumKit.setKit('r8');
    } else if (closestSt.frequency === 97.5) {
      // 97.5MHz (AKIHABARA CRONOS): 宵宮・ミニマルに調和する上質で自然なアコースティックドラム
      toneDrumKit.setKit('acoustic');
    } else if (closestSt.frequency === 80.0) {
      // 80.0MHz (TOKYO LO-FI BEATS): クラシック・ローファイの太いパンチ LinnDrum
      toneDrumKit.setKit('linn');
    } else if (closestSt.frequency === 92.4 || closestSt.frequency === 92.5) {
      // 92.4MHz (SHIBUYA DAYLIGHT GROOVE): パターン3(Cat・street・Twist)は生ドラムの躍動感を持つ'acoustic'、それ以外は'tr808'
      toneDrumKit.setKit(currentTrackIndex === 3 ? 'acoustic' : 'tr808');
    } else {
      toneDrumKit.setKit('r8');
    }
    
    // 92.4chの場合、テンポパターン3種類、ドラムパターン3種類、コードリズムパターン3種類から同一インデックスでペアとして選択し調和を最適化
    let selectedTempo = prog.tempo;
    let selectedDrumPattern = prog.drumPattern;
    let selectedChordSteps = [0, 10];
    let selectedPatternIdx = 0;

    if (prog.tempoPatterns && prog.drumPatterns && prog.chordRhythmPatterns && prog.tempoPatterns.length === prog.drumPatterns.length) {
      const pIdx = Math.floor(Math.random() * prog.tempoPatterns.length);
      selectedPatternIdx = pIdx;
      selectedTempo = prog.tempoPatterns[pIdx];
      selectedDrumPattern = prog.drumPatterns[pIdx];
      selectedChordSteps = prog.chordRhythmPatterns[pIdx];
    } else {
      if (prog.tempoPatterns && prog.tempoPatterns.length > 0) {
        const tIdx = Math.floor(Math.random() * prog.tempoPatterns.length);
        selectedPatternIdx = tIdx;
        selectedTempo = prog.tempoPatterns[tIdx];
      }
      if (prog.drumPatterns && prog.drumPatterns.length > 0) {
        const dIdx = Math.floor(Math.random() * prog.drumPatterns.length);
        selectedPatternIdx = dIdx;
        selectedDrumPattern = prog.drumPatterns[dIdx];
      }
      if (prog.chordRhythmPatterns && prog.chordRhythmPatterns.length > 0) {
        const cIdx = Math.floor(Math.random() * prog.chordRhythmPatterns.length);
        selectedPatternIdx = cIdx;
        selectedChordSteps = prog.chordRhythmPatterns[cIdx];
      }
    }

    let bossaPatternIndex = 0;
    if (closestSt.frequency === 101.2 || closestSt.frequency === 101.5) {
      if (currentTrackIndex === 3) {
        bossaPatternIndex = 2; // トラック3 (Bayside Twilight): パターン2 (★NEW: 80sシティポップ・カッティング)
      } else if (currentTrackIndex === 1) {
        bossaPatternIndex = 1; // トラック1 (Velvet Sax): パターン1 (ネオソウル)
      } else if (currentTrackIndex === 0 || currentTrackIndex === 2) {
        bossaPatternIndex = 0; // トラック0 (Blue Note), トラック2 (Espresso Lounge): パターン0 (ジャズラウンジ)
      } else {
        bossaPatternIndex = Math.floor(Math.random() * 3);
      }
      selectedPatternIdx = bossaPatternIndex;
      if (prog.tempoPatterns && prog.tempoPatterns[bossaPatternIndex] !== undefined) {
        selectedTempo = prog.tempoPatterns[bossaPatternIndex];
      }
      if (prog.drumPatterns && prog.drumPatterns[bossaPatternIndex] !== undefined) {
        selectedDrumPattern = prog.drumPatterns[bossaPatternIndex];
      }
      if (prog.chordRhythmPatterns && prog.chordRhythmPatterns[bossaPatternIndex] !== undefined) {
        selectedChordSteps = prog.chordRhythmPatterns[bossaPatternIndex];
      }
    } else if (closestSt.frequency === 97.5) {
      // 97.5MHz (AKIHABARA CRONOS):
      // トラック0 (Track 1: Cosmic Nebula): パターン0（オルゴール分散和音）
      // トラック1 (Track 2: Stardust Transit): パターン1（レトロ・アンビエント調）
      // トラック2 (Track 3: Digital Dreams): パターン0（オルゴール分散和音）
      // トラック3 (Track 4: Yoimiya Minimal): パターン2（宵宮の調べ × ミニマル・ポリリズム）
      // トラック4 (Track 5: Retro Quest): パターン3（★NEW: 昭和レトロRPG風・オルゴール行進曲）
      if (currentTrackIndex === 4) {
        bossaPatternIndex = 3;
      } else if (currentTrackIndex === 3) {
        bossaPatternIndex = 2;
      } else if (currentTrackIndex === 1) {
        bossaPatternIndex = 1;
      } else {
        bossaPatternIndex = 0;
      }

      selectedPatternIdx = bossaPatternIndex;
      if (prog.tempoPatterns && prog.tempoPatterns[bossaPatternIndex] !== undefined) {
        selectedTempo = prog.tempoPatterns[bossaPatternIndex];
      }
      if (prog.drumPatterns && prog.drumPatterns[bossaPatternIndex] !== undefined) {
        selectedDrumPattern = prog.drumPatterns[bossaPatternIndex];
      }
      if (prog.chordRhythmPatterns && prog.chordRhythmPatterns[bossaPatternIndex] !== undefined) {
        selectedChordSteps = prog.chordRhythmPatterns[bossaPatternIndex];
      }
    } else if (closestSt.frequency === 105.8) {
      // 105.8MHz (ROPPONGI Petrichor FM):
      // パターン0: チル雨音 (Rainy Lofi), パターン1: 水滴ラグタイム (Raindrop Ragtime), パターン2: ドビュッシー「夢」水滴アルペジオ (Rêverie de la Pluie)
      const numPatterns = prog.chordPatterns?.length || 3;
      if (currentTrackIndex === 2) {
        bossaPatternIndex = 2; // トラック2: Rêverie de la Pluie (ドビュッシー「夢」水滴分散和音アルペジオ)
      } else if (currentTrackIndex === 1 || currentTrackIndex === 3) {
        bossaPatternIndex = 1; // トラック1/3: 水滴ラグタイム (Raindrop Rag / Puddle Stomp)
      } else if (currentTrackIndex === 0) {
        bossaPatternIndex = 0; // トラック0: チル雨音 (Vinyl Rain)
      } else {
        bossaPatternIndex = Math.floor(Math.random() * numPatterns);
      }

      selectedPatternIdx = bossaPatternIndex;
      if (prog.tempoPatterns && prog.tempoPatterns[bossaPatternIndex] !== undefined) {
        selectedTempo = prog.tempoPatterns[bossaPatternIndex];
      }
      if (prog.drumPatterns && prog.drumPatterns[bossaPatternIndex] !== undefined) {
        selectedDrumPattern = prog.drumPatterns[bossaPatternIndex];
      }
      if (prog.chordRhythmPatterns && prog.chordRhythmPatterns[bossaPatternIndex] !== undefined) {
        selectedChordSteps = prog.chordRhythmPatterns[bossaPatternIndex];
      }
    } else if (Math.abs(closestSt.frequency - 76.0) < 0.2) {
      const numPatterns = prog.chordPatterns?.length || 4;
      // カセットテープの選曲トラックインデックスがある場合はそれに連動、それ以外はランダム（4パターン）
      bossaPatternIndex = (currentTrackIndex >= 0 && currentTrackIndex < numPatterns)
        ? currentTrackIndex
        : Math.floor(Math.random() * numPatterns);

      // 76.0chのドラム・リズム・テンポをパターンインデックスと完全同期
      selectedPatternIdx = bossaPatternIndex;
      if (prog.tempoPatterns && prog.tempoPatterns[bossaPatternIndex] !== undefined) {
        selectedTempo = prog.tempoPatterns[bossaPatternIndex];
      }
      if (prog.drumPatterns && prog.drumPatterns[bossaPatternIndex] !== undefined) {
        selectedDrumPattern = prog.drumPatterns[bossaPatternIndex];
      }
      if (prog.chordRhythmPatterns && prog.chordRhythmPatterns[bossaPatternIndex] !== undefined) {
        selectedChordSteps = prog.chordRhythmPatterns[bossaPatternIndex];
      }
    } else if (closestSt.frequency === 92.4) {
      // 92.4MHz (SHIBUYA DAYLIGHT GROOVE):
      // パターン0: シティポップ (Sunlit Boulevard)
      // パターン1: 12小節ブルース & サックス (Daylight Blues)
      // パターン2: サンシャイン・シティポップ (Sunshine Walk)
      // パターン3: Cat・street・Twist (Neo-Roca)
      const numPatterns = prog.chordPatterns?.length || 4;
      bossaPatternIndex = (currentTrackIndex >= 0 && currentTrackIndex < numPatterns)
        ? currentTrackIndex
        : Math.floor(Math.random() * numPatterns);

      selectedPatternIdx = bossaPatternIndex;
      if (prog.tempoPatterns && prog.tempoPatterns[bossaPatternIndex] !== undefined) {
        selectedTempo = prog.tempoPatterns[bossaPatternIndex];
      }
      if (prog.drumPatterns && prog.drumPatterns[bossaPatternIndex] !== undefined) {
        selectedDrumPattern = prog.drumPatterns[bossaPatternIndex];
      }
      if (prog.chordRhythmPatterns && prog.chordRhythmPatterns[bossaPatternIndex] !== undefined) {
        selectedChordSteps = prog.chordRhythmPatterns[bossaPatternIndex];
      }
    } else if (closestSt.frequency === 88.1) {
      // 88.1MHz (TOKYO MORNING BOSSA): トラックに応じた自然なボサノヴァ進行
      const numPatterns = prog.chordPatterns?.length || 4;
      bossaPatternIndex = (currentTrackIndex >= 0 && currentTrackIndex < numPatterns)
        ? currentTrackIndex
        : Math.floor(Math.random() * numPatterns);

      selectedPatternIdx = bossaPatternIndex;
      if (prog.tempoPatterns && prog.tempoPatterns[bossaPatternIndex] !== undefined) {
        selectedTempo = prog.tempoPatterns[bossaPatternIndex];
      }
      if (prog.drumPatterns && prog.drumPatterns[bossaPatternIndex] !== undefined) {
        selectedDrumPattern = prog.drumPatterns[bossaPatternIndex];
      }
      if (prog.chordRhythmPatterns && prog.chordRhythmPatterns[bossaPatternIndex] !== undefined) {
        selectedChordSteps = prog.chordRhythmPatterns[bossaPatternIndex];
      }
    } else {
      bossaPatternIndex = Math.floor(Math.random() * 3);
    }

    const selectedChords = (prog.chordPatterns && prog.chordPatterns[bossaPatternIndex])
      ? prog.chordPatterns[bossaPatternIndex]
      : prog.chords;

    let finalTempo = selectedTempo;
    if (Math.abs(closestSt.frequency - 76.0) < 0.2) {
      finalTempo = selectedTempo;
    } else if (closestSt.frequency === 88.1) {
      finalTempo = (bossaPatternIndex === 3) ? 76 : selectedTempo;
    } else if (closestSt.frequency === 101.2 || closestSt.frequency === 101.5) {
      finalTempo = (bossaPatternIndex === 2) ? 88 : selectedTempo;
    } else if (closestSt.frequency === 97.5) {
      finalTempo = (bossaPatternIndex === 3) ? 76 : Math.min(finalTempo, 95);
    } else if (closestSt.frequency === 105.8) {
      finalTempo = (bossaPatternIndex === 1) ? 92 : 70;
    } else if (closestSt.frequency === 92.4) {
      finalTempo = (bossaPatternIndex === 3) ? 110 : ((bossaPatternIndex === 1) ? 94 : selectedTempo);
    }

    const selectedScale = (prog.melodyScales && prog.melodyScales[bossaPatternIndex])
      ? prog.melodyScales[bossaPatternIndex]
      : prog.melodyScale;

    if (closestSt.frequency === 92.4 && bossaPatternIndex === 3) {
      toneDrumKit.setKit('acoustic');
    }

    const modifiedProg = {
      ...prog,
      chords: selectedChords,
      melodyScale: selectedScale,
      tempo: finalTempo,
      drumPattern: selectedDrumPattern,
      chordSteps: selectedChordSteps,
      patternIndex: selectedPatternIdx,
      bossaPatternIndex: bossaPatternIndex,
    };

    // ラジオ局切り替え時や再生開始時に、同じ出だしのコード階調・キーに固定されないよう、
    // 毎回完全に異なるランダムな半音シフト（キー変更: -4〜+4半音）とコード進行の動的バリエーションを適用
    const randomKeyShift = Math.floor(Math.random() * 9) - 4;
    let tempoMultiplier = 1.0;
    let semitoneShift = randomKeyShift;

    if (closestSt.frequency === 88.1 && bossaPatternIndex === 3) {
      // 88.1MHz パターン3 (★Warm Breeze - 案A: 心地よい±2〜3半音のランダム移調):
      // F Majorを中心に、温かみのあるボサノヴァ音域（-3〜+2半音: D, Eb, E, F, Gb, G Major）へ演奏毎に移調
      const warmBreezeKeyShifts = [-3, -2, -1, 0, 1, 2];
      const validShifts = warmBreezeKeyShifts.filter((s) => s !== lastWarmBreezeShiftRef.current);
      semitoneShift = validShifts[Math.floor(Math.random() * validShifts.length)];
      lastWarmBreezeShiftRef.current = semitoneShift;
      tempoMultiplier = 1.0; // 76 BPM の心地よいテンポ感は厳格に維持
    } else if (closestSt.frequency === 105.8 && bossaPatternIndex === 2) {
      // 105.8MHz パターン2 (ドビュッシー「夢」水滴分散和音アルペジオ):
      // ドビュッシーの印象派和声(Fmaj9/F Lydian)と70 BPMのチルホップ雨音テンポを厳密に維持（半音移調や意図せぬ78BPMへの加速を完全防止）
      semitoneShift = 0;
      tempoMultiplier = 1.0;
    } else if (closestSt.frequency === 105.8 && bossaPatternIndex === 1) {
      // 105.8MHz パターン1 (水滴ラグタイム): 92 BPMの軽快なテンポと親しみやすいFメジャー調を維持
      semitoneShift = 0;
      tempoMultiplier = 1.0;
    } else if (Math.abs(closestSt.frequency - 76.0) < 0.2) {
      // 76.0MHz (ELECTRO HEALING): 全トラックでそれぞれの意図された調性（Dorian, Harmonic Minor, Lydian, F Major）と
      // 固有のソルフェジオ周波数を厳密に保つため原調(0半音シフト)・規定テンポで演奏
      semitoneShift = 0;
      tempoMultiplier = 1.0;
    } else if (closestSt.frequency === 92.4 && bossaPatternIndex === 1) {
      // 92.4MHz パターン1 (Daylight Blues: 12小節ブルース & サックス):
      // ブルースのトニック(E)と 94 BPM スウィング感を完全保持
      semitoneShift = 0;
      tempoMultiplier = 1.0;
    } else if (closestSt.frequency === 92.4 && bossaPatternIndex === 3) {
      // 92.4MHz パターン3 (Cat・street・Twist (Neo-Roca)):
      // 80年代ネオロカビリーの軽快なCメジャー調と110 BPMのスウィング感を完全保持
      semitoneShift = 0;
      tempoMultiplier = 1.0;
    } else if (closestSt.frequency === 97.5) {
      // 97.5MHz (akihabara cronos): 全トラック・全パターンで毎回ランダム移調（-4〜+4半音の全9調性）を適用
      semitoneShift = randomKeyShift;
      tempoMultiplier = 1.0;
    } else if (currentTrackIndex === 1) {
      tempoMultiplier = 0.88; // ゆったりめ
      semitoneShift += -1;     
    } else if (currentTrackIndex === 2) {
      tempoMultiplier = 1.12; // リズミカル
      semitoneShift += 1;      
    }

    const pitchMultiplier = Math.pow(2, semitoneShift / 12);

    const is760Station = Math.abs(closestSt.frequency - 76.0) < 0.2;
    const isMusicBoxStation = closestSt.frequency === 97.5;
    const minAllowedTempo = is760Station ? 46 : (isMusicBoxStation ? 58 : 70);
    const maxAllowedTempo = is760Station ? 70 : (isMusicBoxStation ? 88 : (closestSt.frequency === 88.1 && bossaPatternIndex === 2 ? 125 : 110));
    let modifiedTempo = modifiedProg.tempo * tempoMultiplier;
    modifiedTempo = Math.max(minAllowedTempo, Math.min(maxAllowedTempo, modifiedTempo));
    setCurrentBpm(Math.round(modifiedTempo));
    // 楽譜 BPM 120 (四分音符 ♩=120) に基づく 16分音符 1拍 (1ステップ) のミリ秒:
    // 16分音符 1ステップ = 60,000ms / (BPM * 4) = 15,000ms / BPM
    const stepDurationMs = (15 / modifiedTempo) * 1000;
    // 32小節あたりの曲総時間 (4/4拍子: 512ステップ)
    const totalSongSteps = 512;
    setDurationSec((totalSongSteps * stepDurationMs) / 1000);

    if (stepTimerRef.current) {
      stepTimerRef.current.destroy();
      stepTimerRef.current = null;
    }

    currentRaindropBarId = -1;
    currentRaindropBarEvents = [];
    prevWarmBreezePitchRef.current = null;
    currentRagtimeBarId = -1;
    currentRagtimeBarEvents = [];
    currentYoimiyaBarId = -1;
    currentYoimiyaBarEvents = [];
    currentRetroQuestBarId = -1;
    currentRetroQuestBarEvents = [];
    lastDebussyMelodyPitch = 523.25;

    let globalStep = 0;
    const initialRandIdx = Math.floor(Math.random() * INTRO_PATTERNS.length);
    currentIntroPattern = INTRO_PATTERNS[initialRandIdx];
    const initialFreq = closestSt.frequency;
    const flowStart = getSongFlowStartMelody(modifiedProg.melodyScale, modifiedProg.chords, pitchMultiplier);
    const initialStartIdx = flowStart.startIdx;
    const initialDir = flowStart.direction;

    melodyStates[initialFreq] = {
      scaleIdx: initialStartIdx,
      direction: initialDir,
      sameDirCount: 0,
      minDirSteps: 2,
    };

    const timer = new BackgroundTimer(() => {
      // ジングル再生中・トランジション中・消音中はシーケンサーの進行を一時待機（ジングル完奏後にBGM再開）
      if (!audioCtxRef.current || !isPlaying || !isPowerOn || isTransitioningRef.current || isFadingRef.current || isJinglePlayingRef.current) return;
      if (Math.abs(closestSt.frequency - frequencyRef.current) > 0.35) {
        if (stepTimerRef.current) {
          stepTimerRef.current.destroy();
          stepTimerRef.current = null;
        }
        return;
      }
      ensureCtxRunning(audioCtxRef.current);

      const TOTAL_STEPS_PER_SONG = 512; // 32小節分
      const step16 = globalStep % 16; // 小節内ステップ (0~15)
      const totalBar = Math.floor(globalStep / 16); // 全32小節中の現在の小節 (0~31)
      const bar = totalBar % 4; // 4小節循環内の位置
      const cycle = Math.floor(globalStep / 64); // サイクル

      const isIntro = cycle === 0; // イントロ
      const isOutro = cycle >= 6;  // アウトロ（24~31小節）
      const isFinalBar = totalBar === 31; // 最終小節（フィナーレ・終息小節）

      // 最終小節（isFinalBar）およびアウトロ解決コード処理
      const chordIdx = totalBar % modifiedProg.chords.length;
      let currentChord = modifiedProg.chords[chordIdx];

      if (Math.abs(closestSt.frequency - 76.0) < 0.2) {
        const pat = modifiedProg.bossaPatternIndex ?? 0;
        if (pat === 3) {
          // 76.0MHz パターン3 (穏やかな海と波のパターン):
          // アウトロ最終4小節（totalBar 28~31）で王道の完全終止カデンツ (Fmaj9 -> Bbmaj9 -> Cadd9 -> Fmaj9) を構築し、
          // 調性豊かな美しい解決で曲を完結させる
          if (totalBar === 28) {
            currentChord = modifiedProg.chords[0]; // Fmaj9 (トニック)
          } else if (totalBar === 29) {
            currentChord = modifiedProg.chords[2]; // Bbmaj9 (サブドミナント)
          } else if (totalBar === 30) {
            currentChord = modifiedProg.chords[3]; // Cadd9 (ドミナント)
          } else if (totalBar === 31) {
            currentChord = modifiedProg.chords[0]; // Fmaj9 (トニック解決着地)
          }
        } else if (pat === 2) {
          // 76.0MHz パターン2 (Celestial Aurora / 天空・星辰の海):
          // アウトロ最終4小節（totalBar 28~31）で宇宙の調和に満ちたカデンツ (Cmaj9 -> Fmaj9 -> G6/9 -> Cmaj9) を構築
          // 最終小節31では#11 (F#) の三全音の濁りを排し、純粋なCメジャー・トニック (Cmaj9) で完全に調和解決
          if (totalBar === 28) {
            currentChord = modifiedProg.chords[0]; // Cmaj9(#11) (トニック)
          } else if (totalBar === 29) {
            currentChord = modifiedProg.chords[2]; // Fmaj9 (サブドミナント)
          } else if (totalBar === 30) {
            currentChord = modifiedProg.chords[3]; // G6/9 (ドミナント)
          } else if (totalBar === 31) {
            // 最終小節: #11(F#)を除去し、純粋なC3, E3, G3, B3, D4による澄み切ったトニック完全着地
            currentChord = {
              name: "Cmaj9",
              root: 130.81,
              notes: [130.81, 164.81, 196.00, 246.94, 293.66],
              bass: 65.41
            };
          }
        } else if (pat === 1) {
          // 76.0MHz パターン1 (Oasis Caravan / 幽玄なオアシス・隊商の旅路):
          // アウトロ最終4小節（totalBar 28~31）: Gm9 -> Cm9 -> D7(b9) -> Gm9
          if (totalBar === 28) {
            currentChord = modifiedProg.chords[0]; // Gm9 (トニック)
          } else if (totalBar === 29) {
            currentChord = modifiedProg.chords[2]; // Cm9 (サブドミナント)
          } else if (totalBar === 30) {
            currentChord = modifiedProg.chords[3]; // D7(b9) (ドミナント)
          } else if (totalBar === 31) {
            currentChord = modifiedProg.chords[0]; // Gm9 (トニック解決着地)
          }
        } else {
          // 76.0MHz パターン0 (Sanctuary / シルクロード・悠久の祈り):
          // アウトロ最終4小節（totalBar 28~31）: Dm9 -> Bbmaj7 -> Asus4(b9) -> Dm9
          if (totalBar === 28) {
            currentChord = modifiedProg.chords[0]; // Dm9 (トニック)
          } else if (totalBar === 29) {
            currentChord = modifiedProg.chords[2]; // Bbmaj7 (サブドミナント)
          } else if (totalBar === 30) {
            currentChord = modifiedProg.chords[3]; // Asus4(b9) (ドミナント)
          } else if (totalBar === 31) {
            currentChord = modifiedProg.chords[0]; // Dm9 (トニック解決着地)
          }
        }
      } else if (isFinalBar) {
        currentChord = modifiedProg.chords[0];
      }

      // シフト後のコード音構成リスト
      const shiftedChordNotes = currentChord.notes.map((n) => n * pitchMultiplier);

      // 25msの安全なルックアヘッド時間を付与し、JSタイマーの微小なブレによる頭切れ・プチプチノイズを完全に防止
      const audioNow = audioCtxRef.current.currentTime + 0.025;

      // 1. ドラム・パーカッション再生
      const is975 = closestSt.frequency === 97.5;
      const is881 = closestSt.frequency === 88.1;
      const is1058 = closestSt.frequency === 105.8;
      const is1015 = closestSt.frequency === 101.5;
      const is924 = closestSt.frequency === 92.4;
      const is760 = Math.abs(closestSt.frequency - 76.0) < 0.2;
      const bossaPat = modifiedProg.bossaPatternIndex ?? 0;

      if (is760) {
        // 76.0MHz (ELECTRO HEALING): エレクトロ・ヒーリング（太鼓・シンギングボウル・おりん・風鈴・オーシャンアルペジオ）
        if (audioCtxRef.current && bassFilterRef.current) {
          electroHealing.init(audioCtxRef.current, bassFilterRef.current);
        }

        if (bossaPat === 3) {
          // パターン3 (Ocean Swell / 穏やかな海と波のシンセヒーリング / 凪と水平線):
          // 水面のきらめき・穏やかなさざ波を描くクリスタル・マリン・トーン（分散和音アルペジオ）
          const rippleSteps = [2, 4, 6, 8, 10, 12, 14];
          const isBar30 = (totalBar === 30);
          const activeRipple = isBar30 ? [2, 4, 6] : rippleSteps;
          if (activeRipple.includes(step16) && !isFinalBar) {
            const chordNotes = shiftedChordNotes.length > 0 ? shiftedChordNotes : [174.61, 220.00, 261.63, 329.63];
            const noteIdx = (step16 / 2) % chordNotes.length;
            let noteFreq = chordNotes[noteIdx];
            while (noteFreq < 260) noteFreq *= 2;
            while (noteFreq > 900) noteFreq *= 0.5;

            const pan = (step16 % 4 === 2 ? -0.35 : 0.35);
            const ripVol = isOutro ? (isBar30 ? 0.22 : 0.30) : 0.44;
            electroHealing.triggerOceanRipple(noteFreq, ripVol, audioNow, pan);
          }

          // 4小節ごとの穏やかなアクセント（水面に静かに落ちる一滴の透明な音）
          if (step16 === 10 && totalBar % 2 === 1 && totalBar < 30 && !isFinalBar) {
            electroHealing.triggerBell('seaDrop', 0.40, audioNow);
          }
        } else if (bossaPat === 2) {
          // パターン2 (Celestial Aurora / 天空・星辰の海):
          // ドラム（打楽器）を一切排した無重力空間。963Hz天体ソルフェジオベルと星屑チャイムの煌めき
          const bellHit = modifiedProg.drumPattern.snare[step16];
          if (bellHit > 0 && !isFinalBar) {
            const bellVol = isOutro ? 0.40 : 0.55;
            electroHealing.triggerBell('celestialBell', bellVol, audioNow);
          }

          const chimeHit = modifiedProg.drumPattern.hihat[step16];
          if (chimeHit > 0 && !isFinalBar) {
            const chimeVol = isOutro ? 0.30 : 0.42;
            electroHealing.triggerBell('windChime', chimeVol, audioNow);
          }

          // 星辰の海を彩るステレオ・スターライト・クリスタルアルペジオ (Steps 2, 6, 10, 14)
          const starlightSteps = [2, 6, 10, 14];
          if (starlightSteps.includes(step16) && !isFinalBar) {
            const chordNotes = shiftedChordNotes.length > 0 ? shiftedChordNotes : [130.81, 164.81, 196.00, 246.94];
            const noteIdx = Math.floor(step16 / 2) % chordNotes.length;
            let sFreq = chordNotes[noteIdx] * 4;
            while (sFreq < 550) sFreq *= 2;
            while (sFreq > 1750) sFreq *= 0.5;
            const pan = (step16 === 2 || step16 === 10) ? -0.45 : 0.45;
            const sVol = isOutro ? 0.28 : 0.40;
            electroHealing.triggerStarlightChime(sFreq, sVol, audioNow, pan);
          }
        } else if (bossaPat === 1) {
          // パターン1 (Oasis Caravan / 幽玄なオアシス・隊商の旅路):
          // 砂漠の隊商が刻む、リズミカルな中東民族フレームドラム ＆ フィンガーシンバル (Zill)
          const kickHit = modifiedProg.drumPattern.kick[step16];
          if (kickHit > 0) {
            const drumVol = isFinalBar && step16 !== 0 ? 0 : (isOutro ? 0.62 : 0.80);
            if (drumVol > 0) {
              electroHealing.triggerFrameDrum(drumVol, 118, audioNow);
            }
          }

          const snareHit = modifiedProg.drumPattern.snare[step16];
          if (snareHit > 0 && !isFinalBar) {
            const tapVol = isOutro ? 0.45 : 0.60;
            electroHealing.triggerFrameDrum(tapVol, 165, audioNow);
          }

          const hihatHit = modifiedProg.drumPattern.hihat[step16];
          if (hihatHit > 0 && !isFinalBar) {
            const zillVol = isOutro ? 0.32 : 0.45;
            electroHealing.triggerBell('fingerCymbal', zillVol, audioNow);
          }
        } else {
          // パターン0 (Sanctuary / シルクロード・悠久の祈り):
          // 厳かな儀礼太鼓（Taiko）の大地の一打 ＆ 528Hzチベット・シンギングボウルと梵鐘
          const kickHit = modifiedProg.drumPattern.kick[step16];
          if (kickHit > 0) {
            const taikoVol = isFinalBar && step16 !== 0 ? 0 : (isOutro ? 0.65 : 0.85);
            if (taikoVol > 0) {
              electroHealing.triggerTaiko(taikoVol, audioNow);
            }
          }

          const bellHit = modifiedProg.drumPattern.snare[step16];
          if (bellHit > 0 && !isFinalBar) {
            const bellVol = isOutro ? 0.50 : 0.70;
            const isGong = (totalBar % 4 === 0 && step16 === 0);
            electroHealing.triggerBell(isGong ? 'templeGong' : 'singingBowl', bellVol, audioNow);
          }

          const chimeHit = modifiedProg.drumPattern.hihat[step16];
          if (chimeHit > 0 && !isFinalBar) {
            const chimeVol = isOutro ? 0.35 : 0.50;
            electroHealing.triggerBell('windChime', chimeVol, audioNow);
          }
        }
      } else if (is1015) {
        // 101.5MHz (GINZA MIDNIGHT CLUB): イントロからアウトロまで常に安定して鳴る小編成アコースティック・ジャズブラシ・ドラム
        const kickHit = modifiedProg.drumPattern.kick[step16];
        if (kickHit > 0) {
          let kickVol = kickHit * (isIntro ? 0.7 : (isOutro ? 0.8 : 1.0));
          if (isFinalBar && step16 !== 0) kickVol = 0;
          acousticJazzDrums.triggerKick(kickVol, audioNow);
        }

        const snareHit = modifiedProg.drumPattern.snare[step16];
        if (snareHit > 0) {
          const snareVol = snareHit * (isIntro ? 0.75 : (isOutro ? 0.85 : 1.0));
          if (isFinalBar && step16 !== 0) {
            acousticJazzDrums.triggerSnare(snareVol * 0.4, audioNow);
          } else {
            acousticJazzDrums.triggerSnare(snareVol, audioNow);
          }
        }

        const hihatHit = modifiedProg.drumPattern.hihat[step16];
        if (hihatHit > 0) {
          const isOpen = ((bossaPat === 2 && (step16 === 6 || step16 === 14)) || (bossaPat !== 2 && step16 === 14 && Math.random() > 0.5)) && !isFinalBar;
          const hhVol = hihatHit * (isIntro ? 0.65 : (isOutro ? 0.8 : 0.95)) * 0.42;
          acousticJazzDrums.triggerHiHat(hhVol, isOpen, audioNow);
        }
      } else if (is881) {
        // 88.1MHz (TOKYO MORNING BOSSA):
        // ギターの音色と完璧に同期する、本場リオの洗練されたアコースティック・ボサノヴァ・ドラム
        // （スルド低音、アコースティック木製クロススティック、滑らかなシェイカー/ハイハット）
        if (!isFinalBar) {
          // 1. キック（スルド）: 1拍目頭(0)と3拍目頭(8)のゆったり深く丸い基本拍
          if (step16 === 0 || step16 === 8) {
            const kickVol = isOutro ? 0.32 : (isIntro ? 0.38 : 0.50);
            triggerKick(kickVol, audioNow);
          }
          // 2. スネア / クロススティック: 2拍目頭(4)と4拍目頭(12)の落ち着いた木製リムショット
          // （粗いロック用スネアの鳴動を排し、ボサノヴァ専用の美しいサイドスティック打音でギターと完全同期）
          if (step16 === 4 || step16 === 12) {
            const rimVol = isOutro ? 0.28 : (isIntro ? 0.30 : 0.40);
            triggerRimShot(rimVol, audioNow);
          }
          // 3. ハイハット / シェイカー: 4分音符(0, 4, 8, 12)の安定したパルス＋控えめな8分裏(2, 6, 10, 14)の滑らかなグルーヴ
          // ビートが途切れたりずれて聞こえる原因となっていた拍抜けを解消
          if (step16 === 0 || step16 === 4 || step16 === 8 || step16 === 12) {
            const hhVol = isOutro ? 0.12 : (isIntro ? 0.14 : 0.20);
            triggerHiHat(hhVol, false, audioNow);
          } else if ((step16 === 2 || step16 === 6 || step16 === 10 || step16 === 14) && !isIntro) {
            const hhSoftVol = isOutro ? 0.06 : 0.09;
            triggerHiHat(hhSoftVol, false, audioNow);
          }
        } else if (isFinalBar && step16 === 0) {
          // 楽曲フィナーレ: 1拍目の優しい着地キックのみ発音
          triggerKick(0.28, audioNow);
        }
      } else {
        // 4/4 拍子 (1小節16ステップ: その他のチャンネル)
        const kickHit = modifiedProg.drumPattern.kick[step16];
        if (kickHit > 0 && !is975 && !is760) {
          let kickVol = kickHit;
          if (isFinalBar) {
            kickVol = (step16 === 0 ? 0.25 : 0.0); // 32小節目頭の優しい着地キック1打
          } else if (isOutro) {
            kickVol *= 0.6;
          } else if (isIntro) {
            kickVol *= 0.75; // イントロでもグルーヴを保つ
          }
          if (kickVol > 0) {
            triggerKick(kickVol, audioNow);
          }
        }

        const snareHit = modifiedProg.drumPattern.snare[step16];
        if (snareHit > 0 && !isFinalBar && !is975 && !is760) {
          const snareVol = snareHit * (isOutro ? 0.5 : (isIntro ? 0.65 : 1.0));
          triggerSnare(snareVol, audioNow);
        }

        const hihatHit = modifiedProg.drumPattern.hihat[step16];
        if (hihatHit > 0 && !isFinalBar && !is975 && !is760) { // 最終小節はハイハット消音して和音の余韻をきれいに残す
          const isOpen = step16 === 14 && Math.random() > 0.6 && !isOutro;
          const finalHihatVol = hihatHit * (isOutro ? 0.45 : 1.0) * 0.42;
          triggerHiHat(finalHihatVol, isOpen, audioNow);
        }
      }

      // 2. コード進行（ボサノヴァ・チル和音・昭和レトロオルゴール・昭和レトロラウンジピアノ）の鳴動
      if (is881) {
        if (bossaPat === 3) {
          // パターン3 (★Warm Breeze - 分散和音 F-1-3-5-3):
          // 前半: step 0(低音弦Fundamental/F), step 2(1度Root), step 4(3度), step 6(5度), step 7(3度)
          // 後半: step 8(5度ベース/F), step 10(1度Root), step 12(3度), step 14(5度または7th), step 15(3度)
          if (!isFinalBar) {
            const chordNotes = shiftedChordNotes;
            const rootNote = chordNotes[0];    // 1度 Root
            const thirdNote = chordNotes[1];   // 3度
            const fifthNote = chordNotes[2];   // 5度
            const seventhNote = chordNotes[3]; // 7度

            if (step16 === 0) {
              // 前半 step 0: 低音弦Fundamental/F
              tokyoMorningBossaGuitar.triggerNote(rootNote, isOutro ? 0.38 : 0.48, 0.45, audioNow);
            } else if (step16 === 2) {
              // 前半 step 2: 1度Root
              tokyoMorningBossaGuitar.triggerNote(rootNote, isOutro ? 0.32 : 0.42, 0.35, audioNow);
            } else if (step16 === 4) {
              // 前半 step 4: 3度
              tokyoMorningBossaGuitar.triggerNote(thirdNote, isOutro ? 0.34 : 0.44, 0.35, audioNow);
            } else if (step16 === 6) {
              // 前半 step 6: 5度
              tokyoMorningBossaGuitar.triggerNote(fifthNote, isOutro ? 0.32 : 0.40, 0.28, audioNow);
            } else if (step16 === 7) {
              // 前半 step 7: 3度
              tokyoMorningBossaGuitar.triggerNote(thirdNote, isOutro ? 0.30 : 0.38, 0.25, audioNow);
            } else if (step16 === 8) {
              // 後半 step 8: 5度ベース/F
              tokyoMorningBossaGuitar.triggerNote(fifthNote, isOutro ? 0.36 : 0.46, 0.45, audioNow);
            } else if (step16 === 10) {
              // 後半 step 10: 1度Root
              tokyoMorningBossaGuitar.triggerNote(rootNote, isOutro ? 0.32 : 0.42, 0.35, audioNow);
            } else if (step16 === 12) {
              // 後半 step 12: 3度
              tokyoMorningBossaGuitar.triggerNote(thirdNote, isOutro ? 0.34 : 0.44, 0.35, audioNow);
            } else if (step16 === 14) {
              // 後半 step 14: 5度または7th (7thの温かなボサノヴァ響き)
              tokyoMorningBossaGuitar.triggerNote(seventhNote || fifthNote, isOutro ? 0.32 : 0.42, 0.30, audioNow);
            } else if (step16 === 15) {
              // 後半 step 15: 3度
              tokyoMorningBossaGuitar.triggerNote(thirdNote, isOutro ? 0.30 : 0.38, 0.25, audioNow);
            }
          } else if (isFinalBar && step16 === 0) {
            tokyoMorningBossaGuitar.triggerChord(shiftedChordNotes, 0.50, 2.5, audioNow);
          }
        } else if (bossaPat === 2) {
          // 88ch Bossa Nova Pattern 2 Player / Converter
          // 16ステップ分割データ構造（Bass / Chord / Chord Change / Rest）と Voice Leading の分離処理
          const isEvenBar = totalBar % 2 === 1; // 0, 2, 4... は Odd Bar (Call), 1, 3, 5... は Even Bar (Response)
          const barEvents = isEvenBar ? PATTERN2_EVEN_BAR_EVENTS : PATTERN2_ODD_BAR_EVENTS;

          // 1ステップの秒数 (Tempo: 120 BPM 基準)
          const stepDurationSec = (60 / finalTempo) / 4;

          // Voice Leading (ボイシング選択): 直前小節のボイシングをもとにトップノート・内声移動が最小となる転回形を取得
          const voiceLedNotes = getVoiceLedNotes(shiftedChordNotes, prevPattern2NotesRef.current);

          // 1. ベースイベントの判定・再生
          const bassEv = barEvents.find((e) => e.step === step16 && e.type === 'bass');
          if (bassEv && !isFinalBar) {
            let bassFreq = currentChord.bass * pitchMultiplier;
            if (bassEv.bassType === 'fifth') {
              // 3拍目 (Step 8): 5度ベース音 (約1.498307倍 = 7半音上)
              bassFreq = bassFreq * 1.498307;
              if (bassFreq > 200) bassFreq *= 0.5; // 音高が高くなりすぎないよう調整
            }
            const bassVol = isOutro ? bassEv.velocity * 0.65 : bassEv.velocity * 0.85;
            triggerSynthNote(bassFreq, 'triangle', 0.45, bassVol, true, audioNow);
          }

          // 2. コード / コードチェンジ / Rest イベントの判定・再生
          const chordEv = barEvents.find(
            (e) => e.step === step16 && (e.type === 'chord' || e.type === 'chord_change')
          );

          if (chordEv && !isFinalBar) {
            let activeNotes = voiceLedNotes;

            if (chordEv.type === 'chord_change') {
              // 4拍目裏 (Step 14) で次小節のコードへシンコペーションチェンジ (食い込み先取り)
              const nextChordIdx = (totalBar + 1) % modifiedProg.chords.length;
              const nextChordRaw = modifiedProg.chords[nextChordIdx];
              const nextShiftedNotes = nextChordRaw.notes.map((n) => n * pitchMultiplier);
              // 次小節のコードに対しても直前のボイシング(voiceLedNotes)から Voice Leading を計算
              activeNotes = getVoiceLedNotes(nextShiftedNotes, voiceLedNotes);
            }

            // 直前ボイシング参照用 Ref を更新
            prevPattern2NotesRef.current = activeNotes;

            const chordVol = isOutro ? chordEv.velocity * 0.65 : chordEv.velocity * 0.85;
            const sustain = Math.min(chordEv.durationSteps * stepDurationSec * 0.75, 0.40);
            tokyoMorningBossaGuitar.triggerChord(activeNotes, chordVol, sustain, audioNow);
          } else if (isFinalBar && step16 === 0) {
            // 楽曲フィナーレのトニック解決和音
            tokyoMorningBossaGuitar.triggerChord(voiceLedNotes, 0.50, 1.8, audioNow);
          }
        } else if (bossaPat === 1) {
          // 楽譜「プロジェクト 2」アコースティックギターコードパターン (16ステップ中の 0, 1, 3, 6, 8, 9, 11, 14)
          const sheetSteps = [0, 1, 3, 6, 8, 9, 11, 14];
          const upperShiftedNotes = shiftedChordNotes;
          if (sheetSteps.includes(step16) && !isFinalBar) {
            const isTiedStep = step16 === 3 || step16 === 11;
            const chordVol = isOutro ? 0.38 : (isTiedStep ? 0.46 : 0.42);
            const sustain = isTiedStep ? 0.48 : 0.30;
            tokyoMorningBossaGuitar.triggerChord(upperShiftedNotes, chordVol, sustain, audioNow);
          } else if (isFinalBar && step16 === 0) {
            tokyoMorningBossaGuitar.triggerChord(upperShiftedNotes, 0.50, 1.8, audioNow);
          }
        } else {
          // 従来パターン (イパネマの娘風ボサノバリズム: 0, 3, 6, 10, 12, 14)
          const bossaSteps = [0, 3, 6, 10, 12, 14];
          const upperShiftedNotes = shiftedChordNotes;
          if (bossaSteps.includes(step16) && !isFinalBar) {
            const chordVol = isOutro ? 0.38 : 0.45;
            const sustain = (step16 === 3 || step16 === 12) ? 0.50 : 0.32;
            tokyoMorningBossaGuitar.triggerChord(upperShiftedNotes, chordVol, sustain, audioNow);
          } else if (isFinalBar && step16 === 0) {
            tokyoMorningBossaGuitar.triggerChord(upperShiftedNotes, 0.50, 1.8, audioNow);
          }
        }
      } else if (is975) {
        // 97.5MHz (AKIHABARA CRONOS)
        const pat = modifiedProg.bossaPatternIndex ?? 0;
        if (pat === 3) {
          // パターン3 (★NEW: 昭和レトロRPG風・オルゴール行進曲アルペジオ: ステップ 2, 6, 10, 14)
          const rpgSteps = [2, 6, 10, 14];
          const highNotes = shiftedChordNotes.map((n) => n * 2);
          if (isFinalBar) {
            if (step16 === 0) {
              retroMusicBox.triggerChord(highNotes, 0.48, 3.8, 0.018, audioNow);
            }
          } else {
            if (rpgSteps.includes(step16)) {
              const chordVol = isOutro ? 0.32 : 0.42;
              retroMusicBox.triggerChord(highNotes, chordVol, 0.45, 0.018, audioNow);
            }
          }
        } else if (pat === 2) {
          // パターン2 (★NEW: 新規追加パターン: 宵宮の調べ × ミニマル・ポリリズム 伴奏)
          // 3ステップ周期 (cycle3 = step16 % 3) のオルゴール分散和音と4拍フレームによる心地よいポリリズム
          const highNotes = shiftedChordNotes.map((n) => n * 4);
          if (isFinalBar) {
            if (step16 === 0) {
              retroMusicBox.triggerChord(highNotes, 0.46, 3.8, 0.03, audioNow);
            }
          } else {
            const cycle3 = step16 % 3;
            if (cycle3 === 0) {
              const p = highNotes[0]; // ルート高音弁
              retroMusicBox.triggerNote(p, 0.38, 1.4, audioNow);
            } else if (cycle3 === 1) {
              const p = highNotes[2 % highNotes.length]; // 5度/3度
              retroMusicBox.triggerNote(p, 0.35, 1.2, audioNow);
            } else if (cycle3 === 2 && step16 % 2 === 0) {
              const p = highNotes[highNotes.length - 1]; // トップノート
              retroMusicBox.triggerNote(p, 0.33, 1.0, audioNow);
            }
          }
        } else if (pat === 1) {
          // パターン1: レトロ・アンビエント調 オルゴール＆電子音コード (すっきりクリアな高音域)
          const ambientSteps = [0, 6, 10];
          if (isFinalBar) {
            if (step16 === 0) {
              retroMusicBox.triggerChord(shiftedChordNotes, 0.44, 3.8, 0.04, audioNow);
            }
          } else {
            if (ambientSteps.includes(step16)) {
              const chordVol = isOutro ? 0.32 : (step16 === 0 ? 0.42 : 0.36);
              retroMusicBox.triggerChord(shiftedChordNotes, chordVol, step16 === 0 ? 2.4 : 1.2, 0.03, audioNow);
            }
          }
        } else {
          // パターン0 (既存): 昭和レトロラジオ・オルゴール音源による分散和音（アルペジオ）- 全体1オクターブUP
          const arpeggioSteps = [0, 3, 6, 9, 12, 14];
          if (isFinalBar) {
            if (step16 === 0) {
              const highNotes = shiftedChordNotes.map((n) => n * 4);
              retroMusicBox.triggerChord(highNotes, 0.46, 3.6, 0.04, audioNow);
            }
          } else {
            if (arpeggioSteps.includes(step16)) {
              const noteIdx = arpeggioSteps.indexOf(step16) % shiftedChordNotes.length;
              const singlePitch = shiftedChordNotes[noteIdx] * 4; // オルゴールの高音域へ（1オクターブUP）
              const chordVol = isOutro ? 0.32 : 0.40;
              const sustain = 2.2;
              retroMusicBox.triggerNote(singlePitch, chordVol, sustain, audioNow);
            }
          }
        }
      } else if (is1015) {
        // 101.5MHz (GINZA MIDNIGHT CLUB)
        const pat = modifiedProg.bossaPatternIndex ?? 0;
        const barPhase = totalBar % 4;
        if (pat === 2) {
          // パターン2: ベイサイド・トワイライト・ハイウェイ (FM9 - Em7 - Dm9 - Cmaj9)
          // 80sシティポップ風 16分裏拍シンコペーション・ピアノカッティング: steps [2, 4, 7, 10, 12, 15]
          // メロディの抜けを最大限活かすため、和音伴奏の音量バランスを最適化 (vel 0.24〜0.34)
          if (isFinalBar) {
            if (step16 === 0) {
              retroLoungePiano.triggerChord(shiftedChordNotes, 0.38, 4.0, 0.003, audioNow);
            }
          } else {
            const cuttingSteps: { [step: number]: { vel: number; dur: number; stagger: number } } = {
              2:  { vel: 0.30, dur: 0.18, stagger: 0.012 },
              4:  { vel: 0.24, dur: 0.15, stagger: 0.010 },
              7:  { vel: 0.32, dur: 0.22, stagger: 0.015 },
              10: { vel: 0.28, dur: 0.18, stagger: 0.012 },
              12: { vel: 0.24, dur: 0.15, stagger: 0.010 },
              15: { vel: 0.34, dur: 0.25, stagger: 0.018 }
            };
            const cStep = cuttingSteps[step16];
            if (cStep) {
              const chordVol = isOutro ? cStep.vel * 0.75 : cStep.vel;
              retroLoungePiano.triggerChord(shiftedChordNotes, chordVol, cStep.dur, cStep.stagger, audioNow);
            }
          }
        } else if (pat === 1) {
          // パターン1: 大人の夜にふさわしいラグジュアリーなジャズ・ネオソウル調 (Cmaj9 - A7b9 - Dm9 - F/G)
          if (isFinalBar) {
            if (step16 === 0) {
              retroLoungePiano.triggerChord(shiftedChordNotes, 0.38, 3.8, 0.003, audioNow);
            }
          } else {
            const neoSoulSteps = [0, 6, 10];
            if (neoSoulSteps.includes(step16)) {
              const chordVol = isOutro ? 0.28 : (step16 === 0 ? 0.34 : 0.28);
              const sustain = (step16 === 0) ? 2.0 : 0.9;
              retroLoungePiano.triggerChord(shiftedChordNotes, chordVol, sustain, 0.005, audioNow);
            }
          }
        } else {
          // パターン0: サティ風ジムノペディ調（既存）
          if (isFinalBar) {
            if (step16 === 0) {
              retroLoungePiano.triggerChord(shiftedChordNotes, 0.36, 3.8, 0.003, audioNow);
            }
          } else {
            if (step16 === 0) {
              const vol = 0.28 + (Math.random() * 0.04);
              const sustain = 2.4 + (Math.random() * 0.4);
              retroLoungePiano.triggerChord(shiftedChordNotes, vol, sustain, 0.006 + (Math.random() * 0.01), audioNow);
            } else if (barPhase === 2 && step16 === 8 && !isOutro && Math.random() > 0.3) {
              const vol = 0.20 + (Math.random() * 0.03);
              retroLoungePiano.triggerChord(shiftedChordNotes, vol, 1.4, 0.008, audioNow);
            }
          }
        }
      } else if (is1058) {
        if (bossaPat === 2) {
          // 105.8MHz パターン2: ドビュッシー「夢」水泡分散和音アルペジオ (Rêverie de la Pluie)
          // 5拍目(Step 4)・7拍目(Step 6)を休符にした流麗な16ステップ分散和音アルペジオ
          if (isFinalBar) {
            if (step16 === 0) {
              aquaBubbleChords.triggerChord(shiftedChordNotes, 0.70, 4.0, audioNow);
            }
          } else {
            const arpeggioStepMap: Record<number, { noteIndex: number; vol: number; dur: number }> = {
              0:  { noteIndex: 0, vol: 0.65, dur: 1.1 },
              1:  { noteIndex: 1, vol: 0.52, dur: 0.9 },
              2:  { noteIndex: 2, vol: 0.55, dur: 0.9 },
              5:  { noteIndex: 3, vol: 0.56, dur: 0.9 },
              7:  { noteIndex: 1, vol: 0.50, dur: 0.9 },
              8:  { noteIndex: 0, vol: 0.62, dur: 1.1 },
              9:  { noteIndex: 1, vol: 0.52, dur: 0.9 },
              10: { noteIndex: 2, vol: 0.55, dur: 0.9 },
              13: { noteIndex: 3, vol: 0.56, dur: 0.9 },
              15: { noteIndex: 1, vol: 0.50, dur: 0.9 },
            };
            const stepInfo = arpeggioStepMap[step16];
            if (stepInfo) {
              const chordNotes = currentChord.notes || [currentChord.root];
              const noteFreq = (chordNotes[stepInfo.noteIndex % chordNotes.length] || chordNotes[0]) * pitchMultiplier;
              const finalVol = isOutro ? stepInfo.vol * 0.75 : stepInfo.vol;
              aquaBubbleChords.triggerChord([noteFreq], finalVol, stepInfo.dur, audioNow);
            }
          }
        } else if (bossaPat === 1) {
          // 105.8MHz パターン1 (水滴ラグタイム):
          // 基本のストライド奏法に厳格に限定
          // 左手の低音（1・3拍）に対し、和音は2拍目（Step 4）と4拍目（Step 12）のみで素早く飛び跳ねるようにスタッカート演奏
          if (isFinalBar) {
            if (step16 === 0) {
              aquaBubbleChords.triggerChord(shiftedChordNotes, 0.70, 3.5, audioNow);
            }
          } else {
            if (step16 === 4 || step16 === 12) {
              const chordVol = isOutro ? 0.46 : 0.60;
              const sustain = 0.20; // 素早く跳ねる軽快なスタッカート和音
              // 左手中音域の和音（220Hz〜520Hz）として明瞭に飛び跳ねるようボイシング最適化
              const strideVoicing = shiftedChordNotes.map((n) => (n < 220 ? n * 2 : n));
              aquaBubbleChords.triggerChord(strideVoicing, chordVol, sustain, audioNow);
            }
          }
        } else {
          // 105.8MHz パターン0 (チル雨音):
          // 既存のゆったりと水面に染み渡るアクア・バブル和音
          const activeChordSteps = modifiedProg.chordSteps || [0, 10];
          if (step16 === 0) {
            const chordVol = isFinalBar ? 0.68 : (isOutro ? 0.54 : 0.62);
            const sustain = isFinalBar ? 3.2 : (isOutro ? 2.2 : 2.0);
            aquaBubbleChords.triggerChord(shiftedChordNotes, chordVol, sustain, audioNow);
          } else if (activeChordSteps.includes(step16) && !isOutro && !isFinalBar) {
            aquaBubbleChords.triggerChord(shiftedChordNotes, 0.48, 1.5, audioNow);
          }
        }
      } else if (is924) {
        // 92.4MHz (SHIBUYA DAYLIGHT GROOVE): 都会的で軽快なポップス/ファンク系の短いホーンアクセント
        const activeChordSteps = modifiedProg.chordSteps || [0, 6, 12];
        const rootFreq = currentChord.root * pitchMultiplier;

        // コード感を決める音（3rd, 7th, 9th/テンション）を優先し、ルート重複を避けるボイシング選定
        // 半音度数: 0=Root, 3/4=3rd, 10/11=7th, 2/5/8/9=Tension, 7=5th
        const getPriorityScore = (freq: number) => {
          const semitone = ((Math.round(12 * Math.log2(freq / rootFreq)) % 12) + 12) % 12;
          if (semitone === 3 || semitone === 4) return 10; // 3rd (コードの明暗・性格を決定)
          if (semitone === 10 || semitone === 11) return 9; // 7th (ジャズ/シティポップの洗練)
          if (semitone === 2 || semitone === 5 || semitone === 8 || semitone === 9) return 8; // テンション (9th, 11th, b13th)
          if (semitone === 7) return 4; // 5th
          return 1; // Root (ベース・エレピが担うためトランペットでは重複回避)
        };

        // 周波数の重複を除去して優先度順にソート
        const uniquePitches: number[] = Array.from(new Set(shiftedChordNotes.map((f: number) => Math.round(f * 10) / 10)));
        const sortedByPriority: number[] = [...uniquePitches].sort((a: number, b: number) => getPriorityScore(b) - getPriorityScore(a));

        // ルート以外の重要音（3rd, 7th, テンション）から2〜3音を抽出
        const nonRootNotes = sortedByPriority.filter((f) => getPriorityScore(f) > 1);
        const selectedNotes = nonRootNotes.length >= 2 
          ? nonRootNotes.slice(0, 3) 
          : sortedByPriority.slice(0, 2);

        // シンセブラスが最も華やかにキレよく抜ける中高域（約350Hz〜784Hz）へ配置
        // かつ同一音域での密集濁りを防ぐためオープンボイシングに整音
        const synthBrassChordNotes = selectedNotes.map((f) => {
          let res = f;
          while (res < 350) res *= 2;
          while (res > 784) res *= 0.5;
          return Math.round(res * 10) / 10;
        }).sort((a, b) => a - b);

        // 2音以上ある場合、もし隣り合う音の間隔が全音以下（密集）なら上声を1オクターブ上げて抜けを確保
        for (let i = 1; i < synthBrassChordNotes.length; i++) {
          const intervalRatio = synthBrassChordNotes[i] / synthBrassChordNotes[i - 1];
          if (intervalRatio < 1.15 && synthBrassChordNotes[i] * 2 <= 900) {
            synthBrassChordNotes[i] = Math.round(synthBrassChordNotes[i] * 2 * 10) / 10;
          }
        }

        if (bossaPat === 3) {
          // パターン3: Cat・street・Twist (Neo-Roca) - 80s ネオロカビリー・ホローボディギター＆ホーンスタブ
          if (step16 === 0) {
            const chordVol = isFinalBar ? 0.45 : (isOutro ? 0.32 : 0.46);
            // 1. スラップバック・エコー付き Gretsch 6120 トゥワンギーギター
            shibuyaNeoRocaGuitar.triggerChord(shiftedChordNotes, chordVol, 0.16, audioNow);
            // 2. パンチの効いたジャンプ・ロカビリー・ホーンスタブ
            shibuyaSynthBrass.triggerChord(synthBrassChordNotes, chordVol * 0.45, 0.14, audioNow);
          } else if (activeChordSteps.includes(step16) && !isOutro && !isFinalBar) {
            // ネオロカビリー特有の裏拍シャープ・カッティング（チャキッ！チャキッ！）
            shibuyaNeoRocaGuitar.triggerChord(shiftedChordNotes, 0.40, 0.13, audioNow);
            if (step16 === 4 || step16 === 12) {
              // 2拍・4拍のスネアと同期するシャープなホーンアクセント
              shibuyaSynthBrass.triggerChord(synthBrassChordNotes, 0.30, 0.12, audioNow);
            }
          }
        } else if (step16 === 0) {
          const chordVol = isFinalBar ? 0.45 : (isOutro ? 0.32 : 0.38);
          const sustain = isFinalBar ? 2.5 : (isOutro ? 1.4 : 1.8);
          // 1. シティポップの核となる美しいローズ・エレピ和音（温かみと広がり、バッキングに徹する上品な音量）
          triggerDaylightEPianoChord(shiftedChordNotes, chordVol, sustain, audioNow);
          // 2. アクセントとなるキレのあるシンセブラス・スタブ（メロディーを邪魔しないスパイス音量）
          shibuyaSynthBrass.triggerChord(synthBrassChordNotes, chordVol * 0.50, 0.18, audioNow);
        } else if (activeChordSteps.includes(step16) && !isOutro && !isFinalBar) {
          // 「パッ！」と鋭く刻むシンセブラス・アクセント ＋ 軽快なエレピスタブ（メロディーの後ろでタイトに刻む）
          triggerDaylightEPianoChord(shiftedChordNotes, 0.28, 0.20, audioNow);
          shibuyaSynthBrass.triggerChord(synthBrassChordNotes, 0.26, 0.12, audioNow);
        }
      } else if (is760) {
        // 76.0MHz (ELECTRO HEALING): 雄大で温かなアンビエント・シンセパッド
        if (audioCtxRef.current && bassFilterRef.current) {
          electroHealing.init(audioCtxRef.current, bassFilterRef.current);
        }
        // 最終小節 (isFinalBar) は小節頭 (step 0) のみ発音し、途中ステップでの再発音・余韻の切断を防止
        const activePadSteps = isFinalBar ? [0] : (modifiedProg.chordSteps || [0]);
        if (activePadSteps.includes(step16)) {
          const isInitialStep = (step16 === 0);
          const padVol = isFinalBar
            ? 0.72
            : (isOutro ? 0.50 : (bossaPat === 3 ? 0.70 : (bossaPat === 2 ? 0.60 : (bossaPat === 1 ? 0.62 : 0.65))));

          let padDuration = 4.0;
          if (isFinalBar) {
            padDuration = 5.8;
          } else if (bossaPat === 3) {
            padDuration = isInitialStep ? 4.8 : 3.2;
          } else if (bossaPat === 2) {
            padDuration = (step16 === 12) ? 2.4 : 3.2; // 星辰の海: 0, 6, 12の3連符的シンセパッド浮遊
          } else if (bossaPat === 1) {
            padDuration = isInitialStep ? 3.6 : 3.2; // オアシス・キャラバン: 0, 8の2拍子系パッド
          } else {
            padDuration = 5.0; // 悠久の祈り: 1小節全音符の持続ドローンパッド
          }

          if (bossaPat === 3) {
            electroHealing.triggerOceanPadChord(shiftedChordNotes, padVol, padDuration, audioNow);
          } else {
            electroHealing.triggerPadChord(shiftedChordNotes, padVol, padDuration, audioNow);
          }
        }
      } else {
        const activeChordSteps = modifiedProg.chordSteps || [0, 10];
        if (step16 === 0) {
          const chordVol = isFinalBar ? 0.52 : (isOutro ? 0.48 : 0.52);
          const sustain = isFinalBar ? 3.2 : (isOutro ? 2.0 : 1.6);
          triggerPianoChord(shiftedChordNotes, chordVol, sustain, audioNow);
        } else if (activeChordSteps.includes(step16) && !isOutro && !isFinalBar) {
          triggerPianoChord(shiftedChordNotes, 0.32, 1.2, audioNow); // 選択されたコードリズムパターンの刻み
        }
      }

      // 3. ベースライン（88.1MHzはボサノヴァのシンコペーション＆ルート↔5度交互ベース）
      const basePitch = currentChord.bass * pitchMultiplier;
      if (is881) {
        if (bossaPat === 3) {
          // パターン3 (★Warm Breeze): ベース: step 0(ルート), step 8(5度)
          if (step16 === 0) {
            triggerSynthNote(basePitch, 'triangle', 0.45, isOutro ? 0.38 : 0.50, true, audioNow);
          } else if (step16 === 8 && !isFinalBar) {
            let fifthPitch = basePitch * 1.498307;
            if (fifthPitch > 180) fifthPitch *= 0.5;
            triggerSynthNote(fifthPitch, 'triangle', 0.40, isOutro ? 0.35 : 0.46, true, audioNow);
          }
        } else if (bossaPat === 2) {
          // パターン2は上部のbarEventsでベース発音を整理・実行済み (audioNowで同期)
        } else if (bossaPat === 1) {
          // 楽譜「プロジェクト 2」ベースパターン (0:ルート, 4:5度, 8:ルート, 12:5度)
          if (step16 === 0) {
            triggerSynthNote(basePitch, 'triangle', 0.40, 0.50, true, audioNow);
          } else if (step16 === 4 && !isOutro && !isFinalBar) {
            triggerSynthNote(basePitch * 1.498, 'triangle', 0.35, 0.45, true, audioNow);
          } else if (step16 === 8) {
            triggerSynthNote(basePitch, 'triangle', 0.40, 0.50, true, audioNow);
          } else if (step16 === 12 && !isOutro && !isFinalBar) {
            triggerSynthNote(basePitch * 1.498, 'triangle', 0.35, 0.45, true, audioNow);
          }
        } else {
          // 従来パターン (イパネマの娘風シンコペーション＆ルート↔5度交互ベース)
          const isAlternateBar = totalBar % 2 === 1;
          
          if (step16 === 0) {
            // 1拍目頭: ルート音（安定したアコースティックベース）
            triggerSynthNote(basePitch, 'triangle', 0.40, 0.50, true, audioNow);
          } else if (step16 === 3 && !isOutro && !isFinalBar) {
            // 1拍目裏: 軽やかなオクターブ/ルートの跳ね
            triggerSynthNote(basePitch * 2, 'triangle', 0.20, 0.30, true, audioNow);
          } else if (step16 === 6 && isAlternateBar && !isOutro && !isFinalBar) {
            // 2拍目裏: 5度音へのシンコペーション食い込み
            triggerSynthNote(basePitch * 1.498, 'triangle', 0.28, 0.36, true, audioNow);
          } else if (step16 === 8) {
            // 3拍目頭: 5度音
            triggerSynthNote(basePitch * 1.498, 'triangle', 0.40, 0.46, true, audioNow);
          } else if (step16 === 11 && !isAlternateBar && !isOutro && !isFinalBar) {
            // 3拍目裏: 5度音のスタッカート刻み
            triggerSynthNote(basePitch * 1.498, 'triangle', 0.20, 0.30, true, audioNow);
          } else if (step16 === 14 && !isOutro && !isFinalBar) {
            // 4拍目裏: 次の小節へつなぐ半音アプローチベース
            triggerSynthNote(basePitch * 1.059, 'triangle', 0.25, 0.32, true, audioNow);
          }
        }
      } else if (is975) {
        const pat = modifiedProg.bossaPatternIndex ?? 0;
        if (pat === 3) {
          // パターン3 (★NEW: 昭和レトロRPG風・オルゴール行進曲ベース: 1拍目ルート、3拍目5度)
          if (isFinalBar) {
            if (step16 === 0) {
              retroMusicBox.triggerNote(basePitch * 2, 0.45, 3.8, audioNow);
              triggerSynthNote(basePitch, 'sine', 3.5, 0.25, true, audioNow);
            }
          } else {
            if (step16 === 0) {
              retroMusicBox.triggerNote(basePitch * 2, 0.42, 0.7, audioNow);
              triggerSynthNote(basePitch, 'sine', 0.7, 0.24, true, audioNow);
            } else if (step16 === 8) {
              const fifthPitch = basePitch * 1.498;
              retroMusicBox.triggerNote(fifthPitch * 2, 0.38, 0.6, audioNow);
              triggerSynthNote(fifthPitch, 'sine', 0.6, 0.20, true, audioNow);
            }
          }
        } else if (pat === 2) {
          // パターン2 (★NEW: 新規追加パターン: 宵宮の調べ × ミニマル・ポリリズム 3拍周期パルス低音弁)
          if (isFinalBar) {
            if (step16 === 0) {
              retroMusicBox.triggerNote(basePitch * 4, 0.44, 3.8, audioNow);
              triggerSynthNote(basePitch, 'sine', 3.2, 0.22, true, audioNow);
            }
          } else {
            // 3拍周期パルス (step 0, 6, 12) で4/4小節の中でうねる低音弁
            if (step16 === 0) {
              retroMusicBox.triggerNote(basePitch * 4, 0.44, 1.8, audioNow);
              triggerSynthNote(basePitch, 'sine', 1.8, 0.20, true, audioNow);
            } else if (step16 === 6) {
              retroMusicBox.triggerNote(basePitch * 4, 0.38, 1.4, audioNow);
            } else if (step16 === 12) {
              retroMusicBox.triggerNote(basePitch * 4, 0.36, 1.2, audioNow);
            }
          }
        } else if (pat === 1) {
          // パターン1: レトロ・アンビエント調ベース
          if (isFinalBar) {
            if (step16 === 0) {
              retroMusicBox.triggerNote(basePitch * 2, 0.36, 3.8, audioNow);
            }
          } else {
            if (step16 === 0) {
              retroMusicBox.triggerNote(basePitch * 2, 0.38, 2.0, audioNow);
              triggerSynthNote(basePitch, 'sine', 1.8, 0.22, true);
            } else if (step16 === 8) {
              retroMusicBox.triggerNote(basePitch * 2, 0.28, 1.2, audioNow);
            }
          }
        } else {
          // パターン0 (既存)
          if (step16 === 0) {
            // 97.5MHz: 昭和レトロオルゴール低音弁の穏やかな響き（全体1オクターブUP: basePitch * 4）
            const baseVol = isFinalBar ? 0.38 : 0.30;
            retroMusicBox.triggerNote(basePitch * 4, baseVol, isFinalBar ? 3.5 : 2.5, audioNow);
          }
        }
      } else if (is1015) {
        // 101.5MHz (GINZA MIDNIGHT CLUB)
        const pat = modifiedProg.bossaPatternIndex ?? 0;
        if (pat === 2) {
          // パターン2: ベイサイド・トワイライト ドライブ感あふれるベースライン
          // bassSteps: 0 (vel 0.95), 3 (0.75), 6 (0.85), 8 (0.90), 10 (0.70, pitchOffset 2), 12 (0.85), 14 (0.80)
          if (isFinalBar) {
            if (step16 === 0) {
              retroLoungePiano.triggerNote(basePitch, 0.28, 4.0, audioNow);
              triggerSynthNote(basePitch, 'triangle', 3.5, 0.20, true);
            }
          } else {
            const bStepMap: { [step: number]: { vel: number; dur: number; pitchMul: number } } = {
              0:  { vel: 0.95, dur: 0.25, pitchMul: 1 },
              3:  { vel: 0.75, dur: 0.20, pitchMul: 1 },
              6:  { vel: 0.85, dur: 0.25, pitchMul: 1 },
              8:  { vel: 0.90, dur: 0.30, pitchMul: 1 },
              10: { vel: 0.70, dur: 0.20, pitchMul: 2 },
              12: { vel: 0.85, dur: 0.25, pitchMul: 1 },
              14: { vel: 0.80, dur: 0.20, pitchMul: 1 }
            };
            const bInfo = bStepMap[step16];
            if (bInfo) {
              const notePitch = basePitch * bInfo.pitchMul;
              const noteVol = (bInfo.vel * 0.28) * (isOutro ? 0.8 : 1.0);
              retroLoungePiano.triggerNote(notePitch, noteVol, bInfo.dur * 1.5, audioNow);
              triggerSynthNote(notePitch, 'triangle', bInfo.dur * 1.8, noteVol * 0.75, true);
            }
          }
        } else if (pat === 1) {
          // パターン1: ネオソウル調ベース
          if (isFinalBar) {
            if (step16 === 0) {
              retroLoungePiano.triggerNote(basePitch, 0.24, 3.8, audioNow);
            }
          } else {
            if (step16 === 0) {
              const baseVol = 0.26 + (Math.random() * 0.04 - 0.02);
              retroLoungePiano.triggerNote(basePitch, baseVol, 1.8, audioNow);
              triggerSynthNote(basePitch, 'triangle', 1.6, 0.18, true);
            } else if (step16 === 6 || step16 === 10) {
              retroLoungePiano.triggerNote(basePitch, 0.18, 0.7, audioNow);
              triggerSynthNote(basePitch * 1.498, 'triangle', 0.6, 0.12, true);
            }
          }
        } else {
          // パターン0: サティ風（既存）
          if (isFinalBar) {
            if (step16 === 0) {
              retroLoungePiano.triggerNote(basePitch, 0.24, 3.8, audioNow);
            }
          } else {
            // 1拍目頭 (Step 0): ルート音
            if (step16 === 0) {
              const baseVol = 0.24 + (Math.random() * 0.04 - 0.02);
              retroLoungePiano.triggerNote(basePitch, baseVol, 1.6, audioNow + (Math.random() * 0.015));
              triggerSynthNote(basePitch, 'triangle', 1.5, 0.16, true);
            }
            // 2拍目裏 (Step 6): 軽やかな5度への跳躍または経過音
            else if (step16 === 6 && !isOutro) {
              const fifthPitch = basePitch * 1.4983;
              retroLoungePiano.triggerNote(fifthPitch, 0.16, 0.8, audioNow);
              triggerSynthNote(fifthPitch, 'triangle', 0.8, 0.11, true);
            }
            // 3拍目頭 (Step 8): 5度音または安定音
            else if (step16 === 8 && !isOutro) {
              const fifthPitch = basePitch * 1.4983;
              retroLoungePiano.triggerNote(fifthPitch, 0.19, 1.2, audioNow);
              triggerSynthNote(fifthPitch, 'triangle', 1.2, 0.13, true);
            }
            // 4拍目裏 (Step 14): 次の小節へ滑らかにつなぐクロマチック・アプローチ音（半音上からのウォーキング）
            else if (step16 === 14 && !isOutro && (totalBar % 2 === 0)) {
              const approachPitch = basePitch * 1.0595; // 半音上からのアプローチ
              retroLoungePiano.triggerNote(approachPitch, 0.14, 0.6, audioNow);
              triggerSynthNote(approachPitch, 'triangle', 0.6, 0.10, true);
            }
          }
        }
      } else if (is924) {
        // 92.4MHz (SHIBUYA DAYLIGHT GROOVE): 専用ウッドベース音源（ピチカート・ダブルベース）
        if (audioCtxRef.current && bassFilterRef.current) {
          shibuyaDaylightWoodBass.init(audioCtxRef.current, bassFilterRef.current);
        }

        // アコースティック・ウッドベースの自然なピチカート低音域（E1〜A2: 約41Hz〜165Hz）に収まるようピッチ補正
        const woodBassPitch = (p: number) => {
          let res = p;
          while (res < 41) res *= 2;
          while (res > 165) res *= 0.5;
          return res;
        };
        const mainBass = woodBassPitch(basePitch);
        const fifthBass = woodBassPitch(basePitch * 1.4983); // 正確な完全5度
        const seventhBass = woodBassPitch(basePitch * 1.7818); // 短7度
        const octaveBass = mainBass * 2; // オクターブ上の跳躍ピチカート

        if (isFinalBar) {
          if (step16 === 0) {
            shibuyaDaylightWoodBass.triggerBass(mainBass, 0.78, 3.2, audioNow);
          }
        } else if (bossaPat === 3) {
          // パターン3: Cat・street・Twist (Neo-Roca) - 80s ネオロカビリー・ウォーキングスラップベース (Lee Rocker スタイル)
          const thirdBass = woodBassPitch(basePitch * 1.2599); // 長3度
          const sixthBass = woodBassPitch(basePitch * 1.6818); // 長6度
          const isBreakBar = (totalBar % 4 === 3 && totalBar < 30);

          if (isBreakBar && step16 >= 12) {
            // 4小節ごとのブレイク: マシンガン・トリプルスラップ！(タ・タ・タ・タッ！)
            if (step16 === 12) {
              shibuyaDaylightWoodBass.triggerSlapBass(octaveBass, 0.88, 0.16, audioNow);
            } else if (step16 === 13) {
              shibuyaDaylightWoodBass.triggerSlapClick(0.70, audioNow);
            } else if (step16 === 14) {
              shibuyaDaylightWoodBass.triggerSlapClick(0.70, audioNow);
            } else if (step16 === 15) {
              shibuyaDaylightWoodBass.triggerSlapClick(0.75, audioNow);
            }
          } else {
            // 王道のロカビリー・ウォーキング・スラップ (ルート -> 3rd -> 5th -> 6th ＋ 裏拍の指板ゴーストスラップ)
            if (step16 === 0) {
              // 1拍目: ルート音 + スラップ
              shibuyaDaylightWoodBass.triggerSlapBass(mainBass, 0.88, 0.28, audioNow);
            } else if (step16 === 3 && !isOutro) {
              // 1拍目裏: 指板ゴーストスラップ
              shibuyaDaylightWoodBass.triggerSlapClick(0.60, audioNow);
            } else if (step16 === 4) {
              // 2拍目: 3度音 + スラップ
              shibuyaDaylightWoodBass.triggerSlapBass(thirdBass, 0.82, 0.25, audioNow);
            } else if (step16 === 7 && !isOutro) {
              // 2拍目裏: 指板ゴーストスラップ
              shibuyaDaylightWoodBass.triggerSlapClick(0.58, audioNow);
            } else if (step16 === 8) {
              // 3拍目: 5度音 + スラップ
              shibuyaDaylightWoodBass.triggerSlapBass(fifthBass, 0.85, 0.26, audioNow);
            } else if (step16 === 11 && !isOutro) {
              // 3拍目裏: 指板ゴーストスラップ
              shibuyaDaylightWoodBass.triggerSlapClick(0.58, audioNow);
            } else if (step16 === 12) {
              // 4拍目: 6度音 + スラップ
              shibuyaDaylightWoodBass.triggerSlapBass(sixthBass, 0.82, 0.25, audioNow);
            } else if (step16 === 15 && !isOutro) {
              // 4拍目裏: 次小節アプローチの指板スラップ
              shibuyaDaylightWoodBass.triggerSlapClick(0.62, audioNow);
            }
          }
        } else if (bossaPat === 1) {
          // パターン1: 92.4MHz 本線トラック2 (Daylight Blues: 12小節ブルース・ウォーキング／ブギ低音)
          const isTurnBar = (totalBar % 12 === 11);
          if (step16 === 0) {
            // 1拍目: ルート
            shibuyaDaylightWoodBass.triggerBass(mainBass, 0.78, 0.45, audioNow);
          } else if (step16 === 4) {
            // 2拍目: 5度
            shibuyaDaylightWoodBass.triggerBass(fifthBass, 0.70, 0.35, audioNow);
          } else if (step16 === 8) {
            // 3拍目: 5度
            shibuyaDaylightWoodBass.triggerBass(fifthBass, 0.74, 0.40, audioNow);
          } else if (step16 === 12) {
            // 4拍目: 7度／ターンアラウンド経過音
            const p = isTurnBar ? octaveBass : seventhBass;
            shibuyaDaylightWoodBass.triggerBass(p, 0.68, 0.32, audioNow);
          }
        } else {
          // パターン0 & 2: 既存の軽快なシティポップ・ウッドベース
          // 1拍目(0): ルート音（ウッドベースの太く温かい指弾きピチカート・ボトム）
          if (step16 === 0) {
            shibuyaDaylightWoodBass.triggerBass(mainBass, 0.76, 0.45, audioNow);
          }
          // 2拍目裏(6): 跳ねるオクターブ上のスライド＆アクセント（シティポップ特有の軽快な跳躍）
          else if (step16 === 6 && !isOutro) {
            shibuyaDaylightWoodBass.triggerBass(octaveBass, 0.65, 0.28, audioNow);
          }
          // 3拍目(8): ルート音でボトムを再提示
          else if (step16 === 8) {
            shibuyaDaylightWoodBass.triggerBass(mainBass, 0.72, 0.40, audioNow);
          }
          // 3拍目裏(10): 安定した完全5度音のグルーヴ
          else if (step16 === 10 && !isOutro) {
            shibuyaDaylightWoodBass.triggerBass(fifthBass, 0.64, 0.30, audioNow);
          }
          // 4拍目裏(14): 次小節へのオクターブ上スタッカート
          else if (step16 === 14 && !isOutro) {
            shibuyaDaylightWoodBass.triggerBass(octaveBass, 0.60, 0.22, audioNow);
          }
        }
      } else if (is760) {
        // 76.0MHz (ELECTRO HEALING): 楽曲の個性に合わせた専用シンセベース
        if (audioCtxRef.current && bassFilterRef.current) {
          electroHealing.init(audioCtxRef.current, bassFilterRef.current);
        }

        const healingBassPitch = (p: number) => {
          let res = p;
          while (res < 40) res *= 2;
          while (res > 85) res *= 0.5;
          return res;
        };
        const rootBass = healingBassPitch(basePitch);

        if (bossaPat === 3) {
          // セット3 (Ocean Swell): 深海の温かな包容力と波の底流を描くディープオーシャン・ベース
          if (step16 === 0) {
            const bassVol = isFinalBar ? 0.70 : (isOutro ? 0.52 : 0.62);
            const bassDuration = isFinalBar ? 5.5 : 4.4;
            electroHealing.triggerDeepOceanBass(rootBass, bassVol * 0.90, bassDuration * 1.15, audioNow);
          }
        } else if (bossaPat === 2) {
          // セット2 (Celestial Aurora): 無重力空間を漂うピュアサイン・サブベース（打撃感を排除した光の浮遊底）
          if (step16 === 0) {
            const bassVol = isFinalBar ? 0.45 : (isOutro ? 0.30 : 0.38);
            const bassDuration = isFinalBar ? 5.5 : 3.8;
            triggerSynthNote(rootBass, 'sine', bassDuration, bassVol, true, audioNow);
          } else if (step16 === 8 && !isOutro && !isFinalBar) {
            // 3拍目の微細な浮遊サブ音（5度）
            triggerSynthNote(rootBass * 1.4983, 'sine', 2.6, 0.26, true, audioNow);
          }
        } else if (bossaPat === 1) {
          // セット1 (Oasis Caravan): 隊商の足取りを刻む中東風ウォーキング・ドローンベース
          if (step16 === 0) {
            // 1拍目: ルート基音
            const bassVol = isFinalBar ? 0.68 : (isOutro ? 0.48 : 0.60);
            electroHealing.triggerDroneBass(rootBass, bassVol, 2.0, audioNow);
          } else if (step16 === 10 && !isOutro && !isFinalBar) {
            // 3拍目裏 (ステップ10): 完全5度のシンコペーション低音パルス（砂漠の歩調）
            const fifthBass = rootBass * 1.4983;
            electroHealing.triggerDroneBass(fifthBass, 0.52, 1.4, audioNow);
          }
        } else {
          // セット0 (Sanctuary): チベット密教・トーラス風の超重低音ドローン（小節頭で大地を鳴動させる）
          if (step16 === 0) {
            const bassVol = isFinalBar ? 0.72 : (isOutro ? 0.52 : 0.65);
            const bassDuration = isFinalBar ? 6.0 : 4.8;
            electroHealing.triggerDroneBass(rootBass, bassVol, bassDuration, audioNow);
          }
        }
      } else if (is1058 && bossaPat === 2) {
        // 105.8MHz パターン2: 夢 (Rêverie) の水底ベース (Step 0: 0.72, Step 8: 0.58)
        if (isFinalBar) {
          if (step16 === 0) {
            triggerSynthNote(basePitch, 'triangle', 4.5, 0.65, true);
          }
        } else {
          if (step16 === 0) {
            const bVol = isOutro ? 0.55 : 0.72;
            triggerSynthNote(basePitch, 'triangle', 1.6, bVol, true);
          } else if (step16 === 8) {
            const bVol = isOutro ? 0.45 : 0.58;
            triggerSynthNote(basePitch, 'triangle', 1.2, bVol, true);
          }
        }
      } else if (is1058 && bossaPat === 1) {
        // 105.8MHz パターン1 (水滴ラグタイム): 基本ストライド奏法に厳格に限定
        // 左手の低音は1拍目（Step 0）と3拍目（Step 8）のみ。素早く跳ねるスタッカート（ブン・チャッ・ブン・チャッ）
        if (isFinalBar) {
          if (step16 === 0) {
            triggerSynthNote(basePitch, 'triangle', 3.5, 0.58, true);
          }
        } else {
          if (step16 === 0) {
            // 1拍目: ルート低音（素早く跳ねるスタッカート）
            triggerSynthNote(basePitch, 'triangle', 0.22, 0.58, true);
          } else if (step16 === 8) {
            // 3拍目: 5度低音（交互に打つストライドベース音）
            const fifthPitch = basePitch * 1.4983;
            triggerSynthNote(fifthPitch, 'triangle', 0.22, 0.52, true);
          }
        }
      } else if (step16 === 0) {
        const baseVol = isFinalBar ? 0.58 : 0.52;
        const baseDuration = isFinalBar ? 3.5 : 1.2;
        triggerSynthNote(basePitch, 'triangle', baseDuration, baseVol, true);
      } else if ((step16 === 8 || step16 === 10) && !isOutro && !isFinalBar) {
        if (Math.random() > 0.3) {
          triggerSynthNote(basePitch * (step16 === 10 ? 1.5 : 1.0), 'triangle', 0.85, 0.4, true);
        }
      }

      // 4. 情緒的なリードメロディ
      if (isFinalBar) {
        if (step16 === 0) {
          let rootPitch = (currentChord.notes[0] || currentChord.root) * pitchMultiplier; // 基本音リード
          if (is975) {
            retroMusicBox.triggerNote(rootPitch * 2, 0.44, 3.4, audioNow); // 97.5MHz: 1オクターブUP
          } else if (is1015) {
            retroLoungePiano.triggerNote(rootPitch, 0.30, 1.6, audioNow);
          } else if (is881) {
            tokyoMorningBossaGuitar.triggerNote(rootPitch * 2, 0.58, 2.5, audioNow);
          } else if (is1058) {
            raindropMelody.triggerNote(rootPitch * 2, 0.42, 3.2, audioNow); // 105.8MHz: 水滴メロディー
          } else if (is924) {
            // 92.4MHz (SHIBUYA DAYLIGHT GROOVE): サックスによる着地音
            shibuyaSaxophone.triggerNote(rootPitch, 0.52, 1.8, audioNow, true);
          } else if (is760) {
            // 76.0MHz (ELECTRO HEALING): エレクトロ・ヒーリングの荘厳な終止音
            let leadPitch = rootPitch;
            while (leadPitch > 520) leadPitch *= 0.5;
            while (leadPitch < 220) leadPitch *= 2;
            if (bossaPat === 3) {
              // 穏やかな海と波のパターン: 澄み渡る主音 F4 (349.23Hz) で純粋に着地
              electroHealing.triggerOceanLead(leadPitch, 0.76, 5.5, audioNow);
              // 水晶のような完全5度のきらめき音 (leadPitch * 1.5 = C5) を添える
              electroHealing.triggerOceanRipple(leadPitch * 1.5, 0.38, audioNow, 0);
              electroHealing.triggerBell('seaDrop', 0.45, audioNow);
            } else {
              electroHealing.triggerLead(leadPitch, 0.70, 5.0, audioNow);
              electroHealing.triggerBell('singingBowl', 0.80, audioNow);
            }
          } else {
            const waveType: OscillatorType = 'sine';
            triggerSynthNote(rootPitch, waveType, 0.35, 0.48); // 完結を着告する短音
          }
        }
      } else if (is881) {
        // 88.1MHz (TOKYO MORNING BOSSA): ユーザー指定のボサノヴァメロディ生成ルール
        if (totalBar !== currentBossaBarId || currentBossaBarPattern.length === 0) {
          currentBossaBarId = totalBar;
          currentBossaBarPattern = generateBossaMelodySteps(
            totalBar,
            currentIntroPattern,
            modifiedProg.bossaPatternIndex ?? 0
          );
        }

        const currentStep = step16;
        const stepInfo = currentBossaBarPattern.find((p) => p.step === currentStep);

        if (stepInfo) {
          let pitch: number;
          if (modifiedProg.bossaPatternIndex === 3) {
            // パターン3 (★Warm Breeze): 小節ごとの厳密なメロディ音階 & ボイスリーディング
            // 1小節目 (FM7): [F4, G4, A4, C5, D5, E5]
            // 2小節目 (Em7): [E4, G4, A4, B4, D5, E5]
            // 3小節目 (Dm9): [D4, E4, F4, G4, A4, C5, D5] ※不協和音となるB♮を排し、短3度F4と長9度E4が歌う協和音階
            // 4小節目 (CM7): [C4, D4, E4, G4, A4, B4, C5]
            const barInProg = totalBar % 4;
            // 8小節（2コーラス）の区切りでメロディを優美にブレス・新しい歌い出しへ再展開
            if (barInProg === 0 && totalBar % 8 === 0 && currentStep === currentBossaBarPattern[0]?.step) {
              prevWarmBreezePitchRef.current = null;
            }
            const warmBreezeBarScales: number[][] = [
              [349.23, 392.00, 440.00, 523.25, 587.33, 659.25],          // 1小節目: FM7
              [329.63, 392.00, 440.00, 493.88, 587.33, 659.25],          // 2小節目: Em7
              [293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33],  // 3小節目: Dm9 (B♮排除・協和音階)
              [261.63, 293.66, 329.63, 392.00, 440.00, 493.88, 523.25]   // 4小節目: CM7
            ];
            // 移調倍率 (pitchMultiplier) を適用して、転調時もコード・ベース・メロディを完全調性同期
            const currentScale = warmBreezeBarScales[barInProg].map((n) => n * pitchMultiplier);
            pitch = getWarmBreezeMelodyPitch(currentScale, prevWarmBreezePitchRef.current);
            prevWarmBreezePitchRef.current = pitch;
          } else {
            const isAnticipationStep = (currentStep === 15);
            let pitchChordNotes = shiftedChordNotes;
            if (isAnticipationStep && (modifiedProg.bossaPatternIndex === 1 || modifiedProg.bossaPatternIndex === 2)) {
              const nextChordIdx = (totalBar + 1) % modifiedProg.chords.length;
              const nextChord = modifiedProg.chords[nextChordIdx];
              pitchChordNotes = nextChord.notes.map((n) => n * pitchMultiplier);
            }

            pitch = getNextMelodyPitch(
              closestSt.frequency,
              modifiedProg.melodyScale,
              pitchChordNotes,
              pitchMultiplier
            );
          }

          // 音価: 短音中心 (0.32s) ＋ 長音 (0.95s) で強拍着地・フレーズ解決
          const duration = stepInfo.duration || (stepInfo.isLanding ? 0.95 : 0.32);
          const melVol = isOutro ? 0.44 : (stepInfo.isLanding ? 0.54 : 0.48);

          tokyoMorningBossaGuitar.triggerNote(pitch, melVol, duration, audioNow);
        }
      } else if (is1058) {
        if (bossaPat === 2) {
          // 105.8MHz パターン2: ドビュッシー「夢」印象派 雨粒即興メロディー (F Major / Lydian)
          const debussyMelodySteps: Record<number, { prob: number; vel: number; dur: number }> = {
            0:  { prob: 0.88, vel: 0.86, dur: 0.85 },
            2:  { prob: 0.65, vel: 0.72, dur: 0.40 },
            3:  { prob: 0.50, vel: 0.68, dur: 0.35 },
            4:  { prob: 0.80, vel: 0.78, dur: 0.65 },
            6:  { prob: 0.70, vel: 0.74, dur: 0.45 },
            7:  { prob: 0.50, vel: 0.66, dur: 0.35 },
            8:  { prob: 0.88, vel: 0.84, dur: 0.85 },
            10: { prob: 0.65, vel: 0.75, dur: 0.45 },
            11: { prob: 0.50, vel: 0.68, dur: 0.38 },
            12: { prob: 0.80, vel: 0.78, dur: 0.60 },
            14: { prob: 0.75, vel: 0.80, dur: 0.55 },
            15: { prob: 0.45, vel: 0.70, dur: 0.35 },
          };
          const stepMel = debussyMelodySteps[step16];
          if (stepMel && !isFinalBar && (Math.random() <= (isOutro ? stepMel.prob * 0.7 : stepMel.prob))) {
            // ドビュッシー「夢」印象派和声 完全協和スケール（不協和音防止率 100%）
            // Fmaj9:       [F, G, A, C, D, E] (Bbを完全排除し、A-Bbの短2度/短9度クラッシュを防止)
            // Dm9:         [D, E, F, G, A, C] (Bbを完全排除し、A-Bbの短2度クラッシュを防止)
            // Bbmaj7(#11): [Bb, C, D, E, F, G, A] (E音はリディアン#11、Debussy特有の幻想的浮遊感)
            // C9sus4:      [C, D, F, G, A, Bb] (E音を完全排除し、F sus4とEの短2度クラッシュを防止)
            const cName = currentChord.name || '';
            let harmonicScale: number[];
            if (cName.includes('Fmaj9') || chordIdx === 0) {
              harmonicScale = [349.23, 392.00, 440.00, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 1046.50, 1174.66];
            } else if (cName.includes('Dm9') || chordIdx === 1) {
              harmonicScale = [293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 1046.50, 1174.66];
            } else if (cName.includes('Bbmaj7') || chordIdx === 2) {
              harmonicScale = [349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 932.33, 1046.50, 1174.66];
            } else {
              // C9sus4 またはその他
              harmonicScale = [349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 698.46, 783.99, 880.00, 932.33, 1046.50, 1174.66];
            }

            const chordTones = currentChord.notes.map(n => n * pitchMultiplier);

            // 二重セーフティ：短2度・短9度（1半音・11半音の濁り）を完全除去
            const safePitches = harmonicScale.filter(s => {
              const testFreq = s * pitchMultiplier;
              return !chordTones.some(ct => {
                const semitones = Math.abs(12 * Math.log2(testFreq / ct));
                const semitoneMod = Math.round(semitones) % 12;
                const diffFromSemitone = Math.abs(semitones - Math.round(semitones));
                return (semitoneMod === 1 || semitoneMod === 11) && diffFromSemitone < 0.25;
              });
            });

            const pool = safePitches.length > 0 ? safePitches : harmonicScale;

            // ドビュッシーらしい流麗な旋律線：直前の音程 (lastDebussyMelodyPitch) に近い音階音を優先選択
            const sortedByDistance = [...pool].sort((a, b) => Math.abs(a * pitchMultiplier - lastDebussyMelodyPitch) - Math.abs(b * pitchMultiplier - lastDebussyMelodyPitch));
            const pickPool = (Math.random() < 0.22 || sortedByDistance.length <= 2)
              ? pool
              : sortedByDistance.slice(0, Math.min(3, sortedByDistance.length));

            let pitch = pickPool[Math.floor(Math.random() * pickPool.length)] * pitchMultiplier;

            // 15%の確率で高音オクターブ跳躍（水滴の跳ね返り、上限1180Hzに制限して耳触りの良さを保持）
            if (Math.random() < 0.15 && pitch * 2 <= 1180) {
              pitch *= 2;
            }

            lastDebussyMelodyPitch = pitch;

            const finalVol = (isOutro ? 0.36 : 0.46) * (stepMel.vel / 0.8);
            raindropMelody.triggerNote(pitch, finalVol, stepMel.dur, audioNow);
          }
        } else if (bossaPat === 1) {
          // 105.8MHz パターン1 (水滴ラグタイム): 雨粒音源（raindropMelody）による軽快なシンコペーション・ラグタイム
          if (totalBar !== currentRagtimeBarId || currentRagtimeBarEvents.length === 0) {
            currentRagtimeBarId = totalBar;
            currentRagtimeBarEvents = generateRagtimeMelodyEvents(totalBar, isIntro, isOutro);
          }

          const ragEvent = currentRagtimeBarEvents.find((e) => e.step === step16);
          if (ragEvent) {
            const ragPitch = getNextRagtimePitch(
              currentChord.notes,
              pitchMultiplier,
              ragEvent.isSparkle,
              ragEvent.duration > 0.45
            );

            const finalVol = Math.max(0.01, (isOutro ? 0.38 : 0.48) * ragEvent.volMultiplier);
            raindropMelody.triggerNote(
              ragPitch,
              finalVol,
              ragEvent.duration,
              audioNow
            );
          }
        } else {
          // 105.8MHz パターン0 (チル雨音): 雨音のイメージで紡ぐ、ランダムで心地よい雨粒リズムメロディ
          if (totalBar !== currentRaindropBarId || currentRaindropBarEvents.length === 0) {
            currentRaindropBarId = totalBar;
            currentRaindropBarEvents = generateRaindropBarEvents(totalBar, isIntro, isOutro);
          }

          const dropEvent = currentRaindropBarEvents.find((e) => e.step === step16);
          if (dropEvent) {
            const raindropPitch = getNextRaindropPitch(
              modifiedProg.melodyScale,
              shiftedChordNotes,
              pitchMultiplier,
              dropEvent.isSparkle
            );

            const finalVol = Math.max(0.01, (isOutro ? 0.32 : 0.42) * dropEvent.volMultiplier);
            raindropMelody.triggerNote(
              raindropPitch,
              finalVol,
              dropEvent.duration,
              audioNow
            );
          }
        }
      } else {
        const patIdx = modifiedProg.patternIndex || 0;
        let melodyTriggerCondition = false;
        if (patIdx === 0) {
          // パターン0: ステディ / スタンダード (表拍・王道の刻み)
          melodyTriggerCondition = (step16 % 2 === 0) || (bar % 2 === 1 && step16 % 4 === 2);
        } else if (patIdx === 1) {
          // パターン1: レイドバック / シンコペーション (裏拍・オフビート中心)
          melodyTriggerCondition = (step16 % 2 === 1) || (step16 === 2 || step16 === 6 || step16 === 10 || step16 === 14);
        } else {
          // パターン2: メロウ / シャッフル (細かいステップ刻みや躍動感のある展開)
          melodyTriggerCondition = (step16 === 0 || step16 === 3 || step16 === 7 || step16 === 10 || step16 === 12);
        }

        let shouldPlayMelody = false;
        if (is760) {
          if (bossaPat === 3) {
            // 76.0MHz パターン3 (波音シンセヒーリング / 碧海の呼吸):
            // 寄せては返す波の満ち引きに同調する、透明感と安らぎに満ちたオーシャン・メロディ
            if (totalBar >= 28) {
              // --- アウトロ（最後の4小節: 小節28~31）の調性メロディ終息ロジック ---
              if (totalBar === 28) {
                // 小節28 (Fmaj9): 水平線へ穏やかに還るフレーズ (ステップ 0, 6)
                shouldPlayMelody = (step16 === 0 || step16 === 6);
              } else if (totalBar === 29) {
                // 小節29 (Bbmaj9): 優しいサブドミナントのさざ波 (ステップ 4, 10)
                shouldPlayMelody = (step16 === 4 || step16 === 10);
              } else if (totalBar === 30) {
                // 小節30 (Cadd9): ドミナントからトニックへの導入 (ステップ 2 のみ発音)
                // ※ステップ4以降はあえて静寂（休符）にして引き波を作り、
                // 次小節の終止音（Fmaj9の着地）への予兆とする
                shouldPlayMelody = (step16 === 2);
              } else if (isFinalBar || totalBar >= 31) {
                // 小節31 (isFinalBar): step16 === 0 で主音 F4 (349.23Hz) に美しく完全終止着地
                shouldPlayMelody = (step16 === 0);
              } else {
                shouldPlayMelody = false;
              }
            } else {
              const barPhase = totalBar % 4;
              let waveMelodySteps = [0, 6, 12];
              if (barPhase === 0) {
                waveMelodySteps = [4, 10]; // 寄せる波間から現れる静かな旋律
              } else if (barPhase === 1) {
                waveMelodySteps = [0, 6, 12]; // 水平線に広がる陽光
              } else if (barPhase === 2) {
                waveMelodySteps = [2, 8]; // 深い海の静けさと包容力
              } else {
                waveMelodySteps = [0, 6]; // 穏やかな引き波の余韻
              }
              shouldPlayMelody = waveMelodySteps.includes(step16) && !isFinalBar;
              if (totalBar === 0 && step16 < 8) {
                shouldPlayMelody = false; // 最初の小節はまず波の音のうねりを堪能させる
              }
            }
          } else {
            // 76.0MHz (SILK ROAD HEALING): 喜太郎シルクロード風のゆったりと息づく幽玄なメロディ
            // 4小節単位で雄大に展開する東洋的・瞑想的フレーズ構成
            const barPhase = totalBar % 4;
            let healingMelodySteps = [0, 6, 12];
            if (barPhase === 0) {
              healingMelodySteps = [2, 8]; // 静かな祈りの呼びかけ
            } else if (barPhase === 1) {
              healingMelodySteps = [0, 6, 10]; // 地平線を見渡す旋律
            } else if (barPhase === 2) {
              healingMelodySteps = [0, 4, 8, 12]; // 感情の高まり・星空の広がり
            } else {
              healingMelodySteps = [0, 6]; // 余韻を残して静寂に還る
            }
            shouldPlayMelody = healingMelodySteps.includes(step16) && !isFinalBar;

            // イントロ小節（最初の2小節）はシンセパッドと鐘の響きを主役に空間をゆったりと保つ
            if (totalBar === 0 && step16 !== 8) {
              shouldPlayMelody = false;
            }
          }
        } else if (is924 && bossaPat === 1) {
          // 92.4MHz パターン1: 12小節ブルース・サックスソロ
          // １つ目のパターンのようにメロディーのリズムを細かく躍動させる（8分音符＋シャッフル16分音符の細かな動き）
          // 基本の8分音符グリッド (0, 2, 4, 6, 8, 10, 12, 14) をベースに、
          // シャッフル・ブルースリック特有の裏拍 (3, 7, 11, 15 や 1, 5, 9, 13) を織り交ぜて細かく動かす
          const isEightBeat = (step16 % 2 === 0);
          const isBluesSwingStep = (step16 % 4 === 3 || step16 === 1 || step16 === 5 || step16 === 9 || step16 === 13);
          
          // 4小節単位の起承転結を演出し、フレーズ末尾（4小節目ステップ14~15）に自然なブレス（息継ぎ）を挟む
          const barPhase = totalBar % 4;
          const isBreath = (barPhase === 3 && (step16 === 14 || step16 === 15)) && Math.random() < 0.60;
          
          if (isBreath) {
            shouldPlayMelody = false;
          } else {
            // １つ目のパターンのように細かくリズミカルに音符を連続して鳴らす
            shouldPlayMelody = (isEightBeat || (isBluesSwingStep && Math.random() > 0.40)) && !isFinalBar && (Math.random() > 0.08);
          }
          if (isFinalBar && step16 === 0) {
            shouldPlayMelody = true; // 楽曲フィナーレのトニック着地音
          }
        } else if (is975 && (modifiedProg.bossaPatternIndex ?? 0) === 2) {
          // 宵宮の調べ（97.5MHz パターン2: 和モダン・動的生成ミニマルポリリズム）
          // 毎小節、新しく生成された和風リズムイベント配列を走査
          if (totalBar !== currentYoimiyaBarId || currentYoimiyaBarEvents.length === 0) {
            currentYoimiyaBarId = totalBar;
            currentYoimiyaBarEvents = generateYoimiyaBarEvents(totalBar, isIntro, isOutro);
          }

          const yoimiyaEvent = currentYoimiyaBarEvents.find((e) => e.step === step16);
          shouldPlayMelody = !!yoimiyaEvent;
          if (isFinalBar && step16 === 0) {
            shouldPlayMelody = true; // 宵宮の調べ フィナーレ着地音
          }
        } else if (is975 && (modifiedProg.bossaPatternIndex ?? 0) === 3) {
          // Retro Quest（97.5MHz パターン3: 昭和レトロRPG風・動的生成ランダムメロディ）
          if (totalBar !== currentRetroQuestBarId || currentRetroQuestBarEvents.length === 0) {
            currentRetroQuestBarId = totalBar;
            currentRetroQuestBarEvents = generateRetroQuestBarEvents(totalBar, isIntro, isOutro);
          }

          const rqEvent = currentRetroQuestBarEvents.find((e) => e.step === step16);
          shouldPlayMelody = !!rqEvent;
          if (isFinalBar && step16 === 0) {
            shouldPlayMelody = true; // 楽曲フィナーレのトニック着地音
          }
        } else if (is1015) {
          // 101.5MHz (GINZA MIDNIGHT CLUB): メロディステップを確実にトリガー（間引き・ステップ欠損の防止）
          const pat = modifiedProg.bossaPatternIndex ?? 0;
          if (pat === 2) {
            // パターン2: ベイサイド・トワイライト・ハイウェイ (80sシティポップピアノ)
            // Aメロ: steps [0, 2, 5, 12, 13] / Bメロ: steps [0, 2, 5, 7, 10, 12, 13]
            const isBSection = (bar >= 2);
            const mSteps = isBSection ? [0, 2, 5, 7, 10, 12, 13] : [0, 2, 5, 12, 13];
            shouldPlayMelody = mSteps.includes(step16) && !isOutro;
          } else if (pat === 1) {
            // パターン1: ネオソウル
            const isBSection = (bar >= 2);
            const aMeloSteps = [0, 3, 7, 9, 12];
            const bMeloSteps = [0, 2, 6, 9, 11, 14];
            const activeSteps = isBSection ? bMeloSteps : aMeloSteps;
            shouldPlayMelody = activeSteps.includes(step16) && !isOutro;
          } else {
            // パターン0: サティ風ジムノペディ
            const barPhase = totalBar % 4;
            shouldPlayMelody = (step16 === 6 || step16 === 12 || (barPhase === 3 && step16 === 4)) && !isOutro;
          }
          if (isFinalBar && (step16 === 0 || step16 === 4)) {
            shouldPlayMelody = true;
          }
        } else if (is760) {
          // 76.0MHz (ELECTRO HEALING): セットごとの個性的なメロディ・リズム配置
          const pat = modifiedProg.bossaPatternIndex ?? 0;
          if (pat === 3) {
            // セット3: Ocean Swell（穏やかな海と波のうねり）- 広大でゆったりとしたフレーズ
            if (totalBar >= 28) {
              shouldPlayMelody = (step16 === 0 || (totalBar <= 29 && step16 === 4));
            } else {
              const oceanSteps = [0, 6, 8, 12];
              shouldPlayMelody = oceanSteps.includes(step16) && !isOutro;
            }
          } else if (pat === 2) {
            // セット2: Celestial Aurora（星辰の海）- 星屑が流れるような5音のきらめき
            if (totalBar >= 28) {
              // アウトロ終結部（28~31小節）: Cmaj9 -> Fmaj9 -> G6/9 -> Cmaj9のカデンツ旋律
              // 最終小節31は小節頭(step 0)のみ鳴らし、途中で切断せず悠久に響かせる
              shouldPlayMelody = (step16 === 0 || (totalBar < 31 && step16 === 8));
            } else {
              const auroraSteps = [0, 4, 8, 11, 14];
              shouldPlayMelody = auroraSteps.includes(step16) && !isOutro;
            }
          } else if (pat === 1) {
            // セット1: Oasis Caravan（隊商の旅路）- 中東・砂漠のキャラバンを思わせるシンコペーション旋律
            if (totalBar >= 28) {
              shouldPlayMelody = (step16 === 0);
            } else {
              const caravanSteps = (totalBar % 4 === 3)
                ? [0, 4, 8, 12]
                : [0, 3, 6, 8, 10, 14];
              shouldPlayMelody = caravanSteps.includes(step16) && !isOutro;
            }
          } else {
            // セット0: Sanctuary（悠久の祈り）- チベット僧院の荘厳な読経・息の長い祈祷リード
            if (totalBar >= 28) {
              shouldPlayMelody = (step16 === 0);
            } else {
              const sanctuarySteps = [0, 6, 10];
              shouldPlayMelody = sanctuarySteps.includes(step16) && !isOutro;
            }
          }
          if (isFinalBar && step16 === 0) {
            shouldPlayMelody = true; // 楽曲フィナーレのトニック着地音（小節頭ステップ0のみ）
          }
        } else {
          shouldPlayMelody = melodyTriggerCondition || (Math.random() > 0.65);

          // 最初の2小節 (totalBar === 0 または 1) はイントロバリエーションパターンを反映
          if (totalBar === 0 || totalBar === 1) {
            if (totalBar === 0) {
              if (currentIntroPattern.rhythm === 'rest' && step16 < 6 && step16 !== 4) {
                shouldPlayMelody = false;
              } else if (currentIntroPattern.rhythm === 'long' && step16 !== 0 && step16 !== 6 && step16 !== 8 && step16 !== 12) {
                shouldPlayMelody = false;
              } else if (currentIntroPattern.rhythm === 'motif' && step16 !== 0 && step16 !== 2 && step16 !== 4 && step16 !== 8 && step16 !== 10) {
                shouldPlayMelody = false;
              }
            } else {
              if (currentIntroPattern.rhythm === 'rest' && step16 < 6) {
                shouldPlayMelody = false;
              } else if (currentIntroPattern.rhythm === 'long' && step16 !== 0 && step16 !== 8) {
                shouldPlayMelody = false;
              } else if (currentIntroPattern.rhythm === 'motif' && step16 !== 0 && step16 !== 2 && step16 !== 4) {
                shouldPlayMelody = false;
              }
            }

            if (currentIntroPattern.density === 'sparse' && Math.random() > (totalBar === 0 ? 0.6 : 0.4)) {
              shouldPlayMelody = false;
            } else if (currentIntroPattern.density === 'active_end' && totalBar === 1 && step16 < 10) {
              if (Math.random() > 0.3) shouldPlayMelody = false;
            }
          }
        }

        if (shouldPlayMelody) {
          let pitch = getNextMelodyPitch(
            closestSt.frequency,
            modifiedProg.melodyScale,
            shiftedChordNotes,
            pitchMultiplier
          ) * 2; // メロディを1オクターブ上へ
          
          if (is975) {
            const pat = modifiedProg.bossaPatternIndex ?? 0;
            if (pat === 3) {
              // 97.5MHz パターン3 (★Retro Quest: 昭和レトロRPG風・オルゴール動的生成ランダムメロディ)
              const rqEvent = currentRetroQuestBarEvents.find((e) => e.step === step16);
              let rqPitch = pitch; // getNextMelodyPitchで計算済みの動的ピッチ (shiftedScale & chordNotes & pitchMultiplier反映)

              // 澄み渡るオルゴールの中高域レンジ（350Hz〜1200Hz）に整音
              while (rqPitch < 350) rqPitch *= 2;
              while (rqPitch > 1200) rqPitch *= 0.5;

              // アクセント拍での跳躍
              if (rqEvent?.isAccent && rqPitch < 620) {
                rqPitch *= 1.5;
                while (rqPitch > 1250) rqPitch *= 0.5;
              }

              // フィナーレ小節（isFinalBar）の頭は主音Aへ美しくトニック完全着地
              if (isFinalBar && step16 === 0) {
                rqPitch = 440.00 * pitchMultiplier;
              }

              const melVol = (0.50 * (rqEvent?.volMultiplier ?? 1.0)) + (Math.random() * 0.04 - 0.02);
              const noteDuration = isFinalBar 
                ? 4.5 
                : (rqEvent?.duration ?? 0.85);

              // オルゴール前打音（装飾音）がある場合、微小な先行音を鳴らして可憐な余韻を演出
              if (rqEvent?.hasGraceNote && !isFinalBar && !isOutro) {
                retroMusicBox.triggerNote(rqPitch * 1.5, melVol * 0.55, 0.35, audioNow - 0.025);
              }

              retroMusicBox.triggerNote(rqPitch, melVol, noteDuration, audioNow);
              triggerSynthNote(rqPitch * 0.5, 'sine', noteDuration * 0.6, melVol * 0.28, true, audioNow);
            } else if (pat === 2) {
              // 97.5MHz パターン2 (★宵宮の調べ: 常に動的生成される和モダン・ペンタトニック旋律)
              // 固定音の反復ではなく、ヨナ抜き/都節スケール(Aマイナー・ペンタトニック)を動的ウォーキングし、
              // 和音コードトーンとの調和・不協和音クレンジングを行いながら、毎小節・毎サイクルで表情を変え続ける。
              const yoimiyaEvent = currentYoimiyaBarEvents.find((e) => e.step === step16);
              let orientalMelPitch = pitch; // getNextMelodyPitchで計算済みの動的ピッチ (shiftedScale & chordNotes反映)

              // 音域調整（中高域の澄み渡る和音・鐘の響き）
              while (orientalMelPitch < 330) orientalMelPitch *= 2;
              while (orientalMelPitch > 980) orientalMelPitch *= 0.5;

              // 転の小節 (Gコード等) やアクセント時の高音跳躍
              if (yoimiyaEvent?.isHighRegister && orientalMelPitch < 550) {
                orientalMelPitch *= 1.5;
                while (orientalMelPitch > 1050) orientalMelPitch *= 0.5;
              }

              // フィナーレ小節（isFinalBar）の頭は主音Aへ美しくトニック完全着地
              if (isFinalBar && step16 === 0) {
                orientalMelPitch = 440.00 * pitchMultiplier;
              }

              const melVol = 0.46 * (yoimiyaEvent?.volMultiplier ?? 1.0) + (Math.random() * 0.04 - 0.02);
              const isBSection = (bar >= 2);
              const noteDuration = isFinalBar 
                ? 4.2 
                : (yoimiyaEvent?.duration ?? (isBSection ? 1.4 : 1.8));

              // 97.5MHz: 昭和レトロラジオ・オルゴール音源 ＋ 鈴・鐘の正弦波倍音
              retroMusicBox.triggerNote(orientalMelPitch, melVol, noteDuration, audioNow);
              triggerSynthNote(orientalMelPitch * 0.5, 'sine', noteDuration * 0.7, melVol * 0.35, true, audioNow);
            } else if (pat === 1) {
              // 97.5MHz パターン1 (レトロ・アンビエント調): 指定の16ステップリズム配列 (Aメロ用 / Bメロ用)
              const aMeloArray = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0];
              const bMeloArray = [1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0];
              const isBSection = (bar >= 2);
              const activeArray = isBSection ? bMeloArray : aMeloArray;

              if (activeArray[step16] === 1 && !isOutro) {
                const melVol = 0.42 + (Math.random() * 0.06 - 0.03);
                const noteDuration = isBSection ? 1.4 : 1.8;
                retroMusicBox.triggerNote(pitch * 2, melVol, noteDuration, audioNow);
                triggerSynthNote(pitch, 'sine', noteDuration * 0.7, melVol * 0.4, false, audioNow);
              } else if (isFinalBar && step16 === 0) {
                retroMusicBox.triggerNote(pitch * 2, 0.40, 4.2, audioNow);
              }
            } else {
              // パターン0 (既存): 昭和レトロラジオ・オルゴール音源によるノスタルジックな旋律（全体1オクターブUP: pitch * 2）
              const melVol = isOutro ? 0.38 : 0.46;
              const noteDuration = (totalBar === 0 || totalBar === 1) && currentIntroPattern.rhythm === 'long' ? 2.2 : 1.8;
              retroMusicBox.triggerNote(pitch * 2, melVol, noteDuration, audioNow);
            }
          } else if (is1015) {
            const pat = modifiedProg.bossaPatternIndex ?? 0;
            // ピアノメロディの明瞭化・音域最適化:
            // 和音伴奏（130Hz〜400Hz）に埋もれないよう、メロディの歌う中高音域（520Hz〜1350Hz: C5〜F6）へ確実にシフト
            let pianoMelPitch = pitch;
            while (pianoMelPitch < 520) pianoMelPitch *= 2;
            while (pianoMelPitch > 1350) pianoMelPitch *= 0.5;

            if (pat === 2) {
              // 101.5MHz パターン2 (★NEW: ベイサイド・トワイライト・ハイウェイ 80sシティポップ風ピアノ旋律)
              // melodySteps: 0 (vel 0.64), 2 (0.89), 5 (0.50), 12 (1.0), 13 (0.99)
              const isBSection = (bar >= 2);
              const mStepMap: { [step: number]: { vel: number; dur: number } } = isBSection
                ? { 0: { vel: 0.78, dur: 0.40 }, 2: { vel: 0.95, dur: 0.44 }, 5: { vel: 0.72, dur: 0.48 }, 7: { vel: 0.85, dur: 0.38 }, 10: { vel: 0.88, dur: 0.42 }, 12: { vel: 1.00, dur: 0.54 }, 13: { vel: 0.95, dur: 0.40 } }
                : { 0: { vel: 0.75, dur: 0.38 }, 2: { vel: 0.92, dur: 0.42 }, 5: { vel: 0.70, dur: 0.50 }, 12: { vel: 1.00, dur: 0.55 }, 13: { vel: 0.96, dur: 0.42 } };

              const mInfo = mStepMap[step16];
              if (mInfo && !isOutro) {
                // 伴奏に埋もれず輪郭がくっきり浮き出るメロディ音量 (0.68〜0.88)
                const melVol = Math.min(0.88, mInfo.vel * 0.76 + 0.14);
                const humanOffset = (Math.random() * 0.016 - 0.008);
                // 1. 本格アコースティックグランドピアノ実録サンプルのクリアなハンマーアタック
                retroLoungePiano.triggerNote(pianoMelPitch, melVol, mInfo.dur * 1.3, audioNow + humanOffset);
                // 2. 80年代シティポップ特有のきらびやかなエレピ/Tineベルの透明な倍音レイヤー (sine) を重ねて輪郭を鮮明化
                triggerSynthNote(pianoMelPitch, 'sine', mInfo.dur * 0.9, melVol * 0.28, false, audioNow + humanOffset);
              } else if (isFinalBar && step16 === 0) {
                retroLoungePiano.triggerNote(pianoMelPitch, 0.48, 4.2, audioNow);
                triggerSynthNote(pianoMelPitch, 'sine', 3.5, 0.22, false, audioNow);
              }
            } else if (pat === 1) {
              // 101.5MHz パターン1 (ラグジュアリーなジャズ・ネオソウル調)
              const isBSection = (bar >= 2);
              const aMeloSteps = [0, 3, 7, 9, 12];
              const bMeloSteps = [0, 2, 6, 9, 11, 14];
              const activeSteps = isBSection ? bMeloSteps : aMeloSteps;

              if (activeSteps.includes(step16) && !isOutro) {
                const melVol = 0.70 + (Math.random() * 0.08 - 0.04);
                const noteDuration = isBSection ? 1.1 : 1.4;
                const humanOffset = (Math.random() * 0.02 - 0.01);
                retroLoungePiano.triggerNote(pianoMelPitch, melVol, noteDuration, audioNow + humanOffset);
                triggerSynthNote(pianoMelPitch, 'sine', noteDuration * 0.75, melVol * 0.22, false, audioNow + humanOffset);
              } else if (isFinalBar && step16 === 0) {
                retroLoungePiano.triggerNote(pianoMelPitch, 0.45, 4.2, audioNow);
                triggerSynthNote(pianoMelPitch, 'sine', 3.5, 0.20, false, audioNow);
              }
            } else {
              // パターン0 (サティ風ジムノペディ調)
              const barPhase = totalBar % 4;
              const isSatieStep = (step16 === 6 || step16 === 12 || (barPhase === 3 && step16 === 4));
              if (isSatieStep && !isOutro) {
                const melVol = 0.65 + (Math.random() * 0.08 - 0.04);
                const noteDuration = 1.8 + (Math.random() * 0.4);
                const humanOffset = (Math.random() * 0.02 - 0.01);
                retroLoungePiano.triggerNote(pianoMelPitch, melVol, noteDuration, audioNow + humanOffset);
                triggerSynthNote(pianoMelPitch, 'sine', noteDuration * 0.8, melVol * 0.20, false, audioNow + humanOffset);
              } else if (isFinalBar && step16 === 4) {
                retroLoungePiano.triggerNote(pianoMelPitch, 0.42, 4.2, audioNow);
                triggerSynthNote(pianoMelPitch, 'sine', 3.5, 0.18, false, audioNow);
              }
            }
          } else if (is924) {
            // 92.4MHz (SHIBUYA DAYLIGHT GROOVE): メロウで艶やかなサックス・メロディー
            const pat = modifiedProg.bossaPatternIndex ?? 0;
            if (pat === 1) {
              // 12小節ブルース・サックス（ブルーノートBb入り、細かなパッセージで疾走）
              let saxPitch = pitch * 0.5; // パターン0同様、中高域の抜けの良い音域で演奏
              while (saxPitch < 196) saxPitch *= 2;
              while (saxPitch > 660) saxPitch *= 0.5;

              // １つ目のパターンのように細かく動くため、音の長さを歯切れよくタイトに（スタッカート〜スラー）
              const isAccent = (step16 % 4 === 0 || step16 === 6 || step16 === 14);
              const melVol = isOutro ? 0.60 : (isAccent ? 0.88 : 0.74);
              // 細かい連続音でも重なりすぎず歯切れよく抜けるよう長さを調整 (0.22s〜0.34s)
              const noteDuration = isAccent ? 0.34 : 0.22;
              // 小節頭や大きなアクセント時のみビブラートをかけ、細かい動きはキレよく演奏
              const applyVibrato = isAccent && (step16 === 0 || step16 === 8);
              shibuyaSaxophone.triggerNote(saxPitch, melVol, noteDuration, audioNow, applyVibrato);
            } else if (pat === 3) {
              // パターン3: Cat・street・Twist (Neo-Roca) - 80s ネオロカビリー・サックス ＆ トゥワンギーギター・コール＆レスポンス
              const isResponseBar = (totalBar % 2 === 1); // 奇数小節: ギターの合いの手
              const twistSteps: Record<number, { pitchOffset: number; velocity: number; duration: number }> = {
                0:  { pitchOffset: 2, velocity: 0.95, duration: 0.38 },
                2:  { pitchOffset: 1, velocity: 0.82, duration: 0.30 },
                4:  { pitchOffset: 1, velocity: 0.98, duration: 0.44 },
                6:  { pitchOffset: 1, velocity: 0.80, duration: 0.30 },
                8:  { pitchOffset: 2, velocity: 0.88, duration: 0.36 },
                10: { pitchOffset: 1, velocity: 0.85, duration: 0.32 },
                12: { pitchOffset: 2, velocity: 1.00, duration: 0.46 },
                14: { pitchOffset: 1, velocity: 0.78, duration: 0.30 }
              };
              const mInfo = twistSteps[step16];
              if (mInfo && !isOutro) {
                let saxPitch = pitch * (mInfo.pitchOffset === 2 ? 1.0 : 0.5);
                while (saxPitch < 220) saxPitch *= 2;
                while (saxPitch > 660) saxPitch *= 0.5;
                const applyVibrato = (step16 === 4 || step16 === 12);
                shibuyaSaxophone.triggerNote(saxPitch, mInfo.velocity, mInfo.duration, audioNow, applyVibrato);

                // レスポンス小節（奇数小節）の合いの手で、Gretsch 6120 トゥワンギーギターのスラップバック・チョーキングリックが応える！
                if (isResponseBar && (step16 === 8 || step16 === 12)) {
                  shibuyaNeoRocaGuitar.triggerLickNote(saxPitch * 1.5, 0.62, 0.22, audioNow + 0.04, step16 === 12);
                }
              } else if (isFinalBar && step16 === 0) {
                shibuyaSaxophone.triggerNote(261.63, 0.85, 3.2, audioNow, true);
                shibuyaNeoRocaGuitar.triggerChord([261.63, 329.63, 392.00, 440.00], 0.55, 0.55, audioNow);
              }
            } else {
              // パターン0 & 2 (シティポップ): 軽快でタイトなサックスメロディー
              const saxPitch = pitch * 0.5;
              const isAccent = (step16 % 4 === 0 || step16 === 6 || step16 === 14);
              const melVol = isOutro ? 0.60 : (isAccent ? 0.88 : 0.74);
              const noteDuration = isAccent ? 0.52 : 0.36;
              shibuyaSaxophone.triggerNote(saxPitch, melVol, noteDuration, audioNow, false);
            }
          } else if (is760) {
            // 76.0MHz (ELECTRO HEALING): エレクトロ・ヒーリング・リード
            let melPitch = pitch;
            if (bossaPat === 3) {
              if (totalBar >= 28) {
                // アウトロ終結部（28~31小節）での調性カデンツ着地音（F Major 完全終止ライン）
                if (totalBar === 28) {
                  // 小節28 (Fmaj9): 第3音 A4 (440Hz) -> 第5音 C5 (523.25Hz)
                  melPitch = (step16 === 0) ? 440.00 : 523.25;
                } else if (totalBar === 29) {
                  // 小節29 (Bbmaj9): 第3音 D4 (293.66Hz) -> 第1音 Bb4 (466.16Hz)
                  melPitch = (step16 === 4) ? 293.66 : 466.16;
                } else if (totalBar === 30) {
                  // 小節30 (Cadd9): 第5音 G4 (392.00Hz)
                  // ※次小節頭の主音 F4 (349.23Hz) への優美な解決の予兆
                  melPitch = 392.00;
                } else if (isFinalBar || totalBar >= 31) {
                  // 小節31 (isFinalBar): 完全終止の主音 F4 (349.23Hz) で静かに着地
                  melPitch = 349.23;
                }
              } else {
                // 穏やかな海と波のイメージ: 260Hz〜580Hzの透明で伸びやかな音域（ピュア・オーシャンリード）
                while (melPitch > 580) melPitch *= 0.5;
                while (melPitch < 260) melPitch *= 2;
              }
              const isLongStep = (step16 === 0 || step16 === 6 || step16 === 8 || step16 === 12);
              const melVol = isOutro ? (isFinalBar ? 0.58 : 0.46) : (isLongStep ? 0.60 : 0.50);
              // 小節30では次小節（終止小節31）の着地音と被らないよう、小節内で美しく減衰
              const duration = isFinalBar ? 4.8 : (totalBar === 30 ? 1.4 : (isLongStep ? 2.2 : 1.4));
              electroHealing.triggerOceanLead(melPitch, melVol, duration, audioNow);
            } else if (bossaPat === 2) {
              // セット2 (Celestial Aurora): 星辰・オーロラの輝きを描くクリスタル・セレスティアルリード
              if (totalBar >= 28) {
                // アウトロ終結部（28~31小節）のカデンツ終止ライン (Cmaj9 -> Fmaj9 -> G6/9 -> Cmaj9)
                if (totalBar === 28) {
                  // 小節28 (Cmaj9): 第3音 E5 (659.25Hz) -> 第5音 G5 (783.99Hz)
                  melPitch = (step16 === 0) ? 659.25 : 783.99;
                } else if (totalBar === 29) {
                  // 小節29 (Fmaj9): 第3音 A5 (880.00Hz) -> 第5音 C5 (523.25Hz)
                  melPitch = (step16 === 0) ? 880.00 : 523.25;
                } else if (totalBar === 30) {
                  // 小節30 (G6/9): 第5音 D5 (587.33Hz) -> 導音 B4 (493.88Hz)
                  // ※次小節頭の主音 C5 (523.25Hz) への完璧な導音解決
                  melPitch = (step16 === 0) ? 587.33 : 493.88;
                } else if (isFinalBar || totalBar >= 31) {
                  // 小節31 (isFinalBar): 完全終止の主音 C5 (523.25Hz) で静謐に完全着地
                  melPitch = 523.25;
                }
              } else {
                // 高域のきらめき（約380Hz〜1050Hz）
                while (melPitch > 1050) melPitch *= 0.5;
                while (melPitch < 380) melPitch *= 2;
              }
              const isLandingStep = (isFinalBar || (totalBar >= 28 && step16 === 0));
              const melVol = isOutro ? (isFinalBar ? 0.55 : 0.44) : (step16 === 0 ? 0.56 : 0.48);
              // 小節30の導音B4は次小節のC5と被らないよう短め(1.4s)、最終小節の着地音は悠久の5.5s
              const duration = isFinalBar ? 5.5 : (totalBar === 30 && step16 === 8 ? 1.4 : (isLandingStep ? 2.8 : 1.8));
              electroHealing.triggerCelestialLead(melPitch, melVol, duration, audioNow);
            } else if (bossaPat === 1) {
              // セット1 (Oasis Caravan): ネイ／リード調のオアシス・キャラバンリード
              if (totalBar >= 28) {
                if (totalBar === 28) {
                  melPitch = 392.00; // G4 (トニック)
                } else if (totalBar === 29) {
                  melPitch = 523.25; // C5 (サブドミナント)
                } else if (totalBar === 30) {
                  melPitch = 440.00; // A4 (ドミナント導音アプローチ)
                } else if (isFinalBar || totalBar >= 31) {
                  melPitch = 392.00; // G4 (完全終止トニック着地)
                }
              } else {
                // 中東・シルクロードの情熱的な節回し（約220Hz〜680Hz）
                while (melPitch > 680) melPitch *= 0.5;
                while (melPitch < 220) melPitch *= 2;
              }
              const isAccent = (step16 === 0 || step16 === 8);
              const hasGrace = (step16 === 3 || step16 === 10);
              const melVol = isOutro ? (isFinalBar ? 0.55 : 0.46) : (isAccent ? 0.64 : 0.54);
              const duration = isFinalBar ? 5.0 : (isAccent ? 1.15 : 0.68);
              electroHealing.triggerOasisLead(melPitch, melVol, duration, audioNow, hasGrace);
            } else {
              // セット0 (Sanctuary): チベット密教・古刹の祈り（深遠な尺八／バンブーフルートリード）
              if (totalBar >= 28) {
                if (totalBar === 28) {
                  melPitch = 293.66; // D4 (トニック)
                } else if (totalBar === 29) {
                  melPitch = 349.23; // F4
                } else if (totalBar === 30) {
                  melPitch = 440.00; // A4 (ドミナント5度音)
                } else if (isFinalBar || totalBar >= 31) {
                  melPitch = 293.66; // D4 (完全終止トニック着地)
                }
              } else {
                // 悠久の持続音（約196Hz〜587Hz）
                while (melPitch > 587) melPitch *= 0.5;
                while (melPitch < 196) melPitch *= 2;
              }
              const isLongStep = (step16 === 0 || step16 === 6 || step16 === 10);
              const melVol = isOutro ? (isFinalBar ? 0.55 : 0.46) : (isLongStep ? 0.62 : 0.52);
              const duration = isFinalBar ? 5.5 : (isLongStep ? 2.4 : 1.6);
              electroHealing.triggerLead(melPitch, melVol, duration, audioNow);
            }
          } else {
            const waveType: OscillatorType = 'sine';
            const melVol = isOutro ? 0.45 : 0.52;
            const noteDuration = (totalBar === 0 || totalBar === 1) && currentIntroPattern.rhythm === 'long' ? 0.9 : 0.28;
            triggerSynthNote(pitch, waveType, noteDuration, melVol);
          }
        }
      }

      // プログレス＆経過時間更新（32小節の1曲時間、4ステップ毎に更新して負荷を軽減）
      if (globalStep % 4 === 0 || globalStep === TOTAL_STEPS_PER_SONG - 1) {
        const currentTrackSec = (globalStep * stepDurationMs) / 1000;
        setCurrentTimeSec(currentTrackSec);
        setProgress(globalStep / TOTAL_STEPS_PER_SONG);
      }

      // --- 曲がきれいに終わるタイミング（ステップ511＝32小節目末）での次曲スムーズ自動移行 ---
      if (globalStep >= TOTAL_STEPS_PER_SONG - 1) {
        // 新曲の即時発音を防止し、確実に無音期間を確保するためにタイマーをクリア
        if (stepTimerRef.current) {
          stepTimerRef.current.destroy();
          stepTimerRef.current = null;
        }

        // 新しい曲の開始時にイントロパターンを再抽選・状態初期化
        const randIdx = Math.floor(Math.random() * INTRO_PATTERNS.length);
        currentIntroPattern = INTRO_PATTERNS[randIdx];
        const freqLoop = closestSt.frequency;
        const flowStartLoop = getSongFlowStartMelody(prog.melodyScale, prog.chords, pitchMultiplier);
        const startIdxLoop = flowStartLoop.startIdx;
        const dirLoop = flowStartLoop.direction;

        melodyStates[freqLoop] = {
          scaleIdx: startIdxLoop,
          direction: dirLoop,
          sameDirCount: 0,
          minDirSteps: 2,
        };

        if (!isFadingRef.current) {
          if (activePresetPairRef.current) {
            // プリセットペア交互ランダム再生モード：2局を交互に自動選局し、各局のトラックからランダム再生
            const mode = activePresetPairRef.current;
            const pair = PRESET_PAIRS[mode].frequencies;
            const curFreq = closestSt.frequency;
            let nextFreq: number;
            if (Math.abs(curFreq - pair[0]) < 0.2) {
              nextFreq = pair[1];
            } else if (Math.abs(curFreq - pair[1]) < 0.2) {
              nextFreq = pair[0];
            } else {
              nextFreq = Math.random() < 0.5 ? pair[0] : pair[1];
            }

            const nextSt = STATIONS.find((s) => Math.abs(s.frequency - nextFreq) < 0.1);
            if (nextSt) {
              const nextTrackIdx = getNextPresetPairTrackIndex(nextSt, currentTrackIndex);
              addDebugLog('tuner', `Preset pair [${mode}] auto-alternating to: ${nextSt.name} (${nextSt.frequency.toFixed(1)} MHz) Track #${nextTrackIdx + 1} (${nextSt.tracks[nextTrackIdx]?.title || 'Track'})`, 'info');
              changeTrackWithFade(nextTrackIdx, nextSt, true);
            } else {
              const total = closestSt.tracks.length;
              const nextIdx = (currentTrackIndex + 1) % total;
              changeTrackWithFade(nextIdx, closestSt, true);
            }
          } else if (isRandomStationModeRef.current) {
            // ランダムch再生モード：次のランダムなラジオ局へ自動チューニング
            tuneToRandomStation(true);
          } else {
            // 同じチャンネル内でも曲と曲の間に心地よい無音インターバルを挟んで次曲へ移行
            const total = closestSt.tracks.length;
            const nextIdx = (currentTrackIndex + 1) % total;
            changeTrackWithFade(nextIdx, closestSt, true);
          }
        }
        return;
      } else {
        globalStep = globalStep + 1;
      }
    }, stepDurationMs);

    stepTimerRef.current = timer;
    timer.start();

    return () => {
      if (stepTimerRef.current) {
        stepTimerRef.current.destroy();
        stepTimerRef.current = null;
      }
      stopAllAudioImmediate(false);
    };
  }, [isPlaying, isPowerOn, frequency, currentTrackIndex, trackIteration]);

  const handlePlayPause = () => {
    if (!isPowerOn) return;
    initAudioEngine();
    if (!isPlaying) {
      // 再生開始時、activeStationとfrequencyを厳格に一致させる
      let targetSt = activeStation;
      const closestSt = STATIONS.find((st) => Math.abs(st.frequency - frequency) < 0.25);
      if (!targetSt && closestSt) {
        targetSt = closestSt;
        setActiveStation(closestSt);
        activeStationRef.current = closestSt;
      } else if (targetSt && (!closestSt || closestSt.frequency !== targetSt.frequency)) {
        setFrequency(targetSt.frequency);
        frequencyRef.current = targetSt.frequency;
      } else if (!targetSt) {
        targetSt = STATIONS[0];
        setActiveStation(targetSt);
        activeStationRef.current = targetSt;
        setFrequency(targetSt.frequency);
        frequencyRef.current = targetSt.frequency;
      }
      setTargetStationName(`${targetSt.name} (${targetSt.frequency.toFixed(1)} MHz)`);

      // 曲開始前の無音ローディング（バッファリング）時間を設ける
      setIsTuning(true);
      if (audioCtxRef.current && musicGainRef.current) {
        try {
          const now = audioCtxRef.current.currentTime;
          const curr = musicGainRef.current.gain.value;
          musicGainRef.current.gain.cancelScheduledValues(now);
          musicGainRef.current.gain.setValueAtTime(Math.max(curr, 0.0001), now);
          musicGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.02);
        } catch (e) {}
      }

      addDebugLog('audio', `Starting playback for ${targetSt?.name || 'station'}`, 'info');

      // 既存の未完了タイマーがあれば確実にリセット
      transitionTimeoutsRef.current.forEach((tId) => clearTimeout(tId));
      transitionTimeoutsRef.current = [];

      const innerTId = window.setTimeout(() => {
        playTuningNoise(0.35);
        const playTId = window.setTimeout(() => {
          setIsTuning(false);
          setIsPlaying(true);
        }, 400);
        transitionTimeoutsRef.current.push(playTId);
      }, 500);

      transitionTimeoutsRef.current.push(innerTId);
    } else {
      stopAllAudioImmediate(true);
      setIsPlaying(false);
      addDebugLog('audio', 'Playback paused by user', 'info');
    }
  };

  const handlePrevStation = () => {
    initAudioEngine();
    if (!isPowerOn) setIsPowerOn(true);
    const currentIdx = activeStation ? STATIONS.findIndex((s) => s.frequency === activeStation.frequency) : 0;
    const prevIdx = (currentIdx - 1 + STATIONS.length) % STATIONS.length;
    const nextSt = STATIONS[prevIdx];
    if (activePresetPairRef.current) {
      setActivePresetPair(null);
      activePresetPairRef.current = null;
    }
    addDebugLog('tuner', `Previous station selected: ${nextSt.name} (${nextSt.frequency.toFixed(1)} MHz)`, 'info');
    if (isPlaying && isPowerOn) {
      changeTrackWithFade(0, nextSt);
    } else {
      setFrequency(nextSt.frequency);
      frequencyRef.current = nextSt.frequency;
      setActiveStation(nextSt);
      activeStationRef.current = nextSt;
      setTargetStationName(`${nextSt.name} (${nextSt.frequency.toFixed(1)} MHz)`);
      setCurrentTrackIndex(0);
      setCurrentTimeSec(0);
      setProgress(0);
    }
  };

  const handleNextStation = () => {
    initAudioEngine();
    if (!isPowerOn) setIsPowerOn(true);
    const currentIdx = activeStation ? STATIONS.findIndex((s) => s.frequency === activeStation.frequency) : 0;
    const nextIdx = (currentIdx + 1) % STATIONS.length;
    const nextSt = STATIONS[nextIdx];
    if (activePresetPairRef.current) {
      setActivePresetPair(null);
      activePresetPairRef.current = null;
    }
    addDebugLog('tuner', `Next station selected: ${nextSt.name} (${nextSt.frequency.toFixed(1)} MHz)`, 'info');
    if (isPlaying && isPowerOn) {
      changeTrackWithFade(0, nextSt);
    } else {
      setFrequency(nextSt.frequency);
      frequencyRef.current = nextSt.frequency;
      setActiveStation(nextSt);
      activeStationRef.current = nextSt;
      setTargetStationName(`${nextSt.name} (${nextSt.frequency.toFixed(1)} MHz)`);
      setCurrentTrackIndex(0);
      setCurrentTimeSec(0);
      setProgress(0);
    }
  };

  const handleStop = () => {
    stopAllAudioImmediate(true);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTimeSec(0);
    addDebugLog('audio', 'Playback stopped and reset', 'info');
  };

  // 早送り(F.FWD)処理：再生中の局内で次の曲（トラック）へ進める＆テープ高速回転演出
  const handleFastForward = () => {
    if (!isPowerOn || !activeStation) return;
    setIsFastForwarding(true);
    setTimeout(() => setIsFastForwarding(false), 800);

    const total = activeStation.tracks.length;
    const nextIdx = (currentTrackIndex + 1) % total;
    addDebugLog('audio', `Fast-forwarding to track #${nextIdx + 1}: ${activeStation.tracks[nextIdx]?.title}`, 'info');
    changeTrackWithFade(nextIdx);
  };

  const togglePower = () => {
    if (powerAnimState !== null) return;

    if (!isPowerOn) {
      // 電源ON処理：通電音・CRT&真空管ウォームアップアニメーション
      initAudioEngine();
      playPowerOnAudio();
      setPowerAnimState('powering_on');
      setIsPowerOn(true);
      const targetSt = activeStation || STATIONS[0];
      if (targetSt) {
        setTargetStationName(`${targetSt.name} (${targetSt.frequency.toFixed(1)} MHz)`);
      }
      setIsTuning(true);
      addDebugLog('system', 'Main power turned ON (warmup sequence initiated)', 'success');
      setTimeout(() => {
        setPowerAnimState(null);
        setIsTuning(false);
      }, 700);
    } else {
      // 電源OFF処理：放電音・CRT収縮シャットダウンアニメーション
      stopAllAudioImmediate(true);
      playPowerOffAudio();
      setPowerAnimState('powering_off');
      addDebugLog('system', 'Main power turned OFF (all audio and CRT discharge)', 'warn');
      setTimeout(() => {
        setIsPowerOn(false);
        setIsPlaying(false);
        setPowerAnimState(null);
      }, 550);
    }
  };

  const handleFavoriteToggle = () => {
    if (!activeStation) return;
    const freq = activeStation.frequency;
    if (favorites.includes(freq)) {
      setFavorites(favorites.filter((f) => f !== freq));
    } else {
      setFavorites([...favorites, freq]);
    }
  };

  // ⌨️ キーボードショートカットのグローバル登録
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // フォーム入力中はショートカット操作をスキップ
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (isFocusMode) {
          setIsFocusMode(false);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevStation();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextStation();
          break;
        case 'ArrowUp':
          e.preventDefault();
          {
            const step = e.shiftKey ? 0.1 : 0.02;
            setVolume((v) => Math.min(1.0, Math.round((v + step) * 100) / 100));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          {
            const step = e.shiftKey ? 0.1 : 0.02;
            setVolume((v) => Math.max(0.0, Math.round((v - step) * 100) / 100));
          }
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          handleFastForward();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setIsFocusMode((prev) => !prev);
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePower();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setVolume((v) => (v === 0 ? 0.85 : 0));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFocusMode,
    isPowerOn,
    isPlaying,
    activeStation,
    currentTrackIndex,
    powerAnimState,
  ]);

  const setSleepTimerInMinutes = (mins: number | null) => {
    setSleepTimer(mins);
  };

  // ワンタップ選局 3つのモード ON/OFF切り替えハンドラー
  const togglePresetPairMode = (mode: 'cafe' | 'daytime' | 'sleep', targetSpecificFreq?: number) => {
    // 既にONのモードを再度タップした場合はOFFにして通常再生（チューナー選択）に戻す
    if (activePresetPairRef.current === mode && targetSpecificFreq === undefined) {
      setActivePresetPair(null);
      activePresetPairRef.current = null;
      presetPairTrackHistoryRef.current = {
        lastTrackByFreq: {},
        lastPatternByFreq: {},
        decks: {},
      };
      addDebugLog('tuner', `ワンタップ選局 [${PRESET_PAIRS[mode].name}] をOFFにしました（通常再生・チューナー選択）`, 'info');
      return;
    }

    // OFFからONに切り替え（または特定局を指定してON）
    applyPresetPair(mode, targetSpecificFreq);
  };

  // ワンタップ選局モードON（2局1組・自動交代）適用処理
  const applyPresetPair = (mode: 'cafe' | 'daytime' | 'sleep', targetSpecificFreq?: number) => {
    const ctx = audioCtxRef.current || initAudioEngine();
    ensureCtxRunning(ctx);
    if (!isPowerOn) setIsPowerOn(true);
    if (!isPlaying) setIsPlaying(true);

    setIsRandomStationMode(false);
    isRandomStationModeRef.current = false;
    setIsTimeAutoSearch(false);

    const pairFreqs = PRESET_PAIRS[mode].frequencies;
    const curFreq = frequencyRef.current;
    let targetFreq: number;

    if (targetSpecificFreq !== undefined && pairFreqs.some((f) => Math.abs(f - targetSpecificFreq) < 0.1)) {
      targetFreq = targetSpecificFreq;
    } else {
      // 現在の周波数がペアのどちらかならその局のままON、どちらでもなければランダムにどちらか選ぶ
      if (Math.abs(curFreq - pairFreqs[0]) < 0.25) {
        targetFreq = pairFreqs[0];
      } else if (Math.abs(curFreq - pairFreqs[1]) < 0.25) {
        targetFreq = pairFreqs[1];
      } else {
        targetFreq = Math.random() < 0.5 ? pairFreqs[0] : pairFreqs[1];
      }
    }

    setActivePresetPair(mode);
    activePresetPairRef.current = mode;

    // EQの自動最適化
    if (mode === 'cafe') {
      setBass(2);
      setMid(0);
      setTreble(2);
    } else if (mode === 'daytime') {
      setBass(3);
      setMid(1);
      setTreble(2);
    } else if (mode === 'sleep') {
      setBass(4);
      setMid(-2);
      setTreble(-1);
    }

    const targetSt = STATIONS.find((s) => Math.abs(s.frequency - targetFreq) < 0.1);
    if (targetSt) {
      const nextTrackIdx = getNextPresetPairTrackIndex(targetSt, currentTrackIndex);
      addDebugLog('tuner', `ワンタップ選局 [${PRESET_PAIRS[mode].name}] ON: ${targetSt.name} (${targetSt.frequency.toFixed(1)} MHz) Track #${nextTrackIdx + 1} (${targetSt.tracks[nextTrackIdx]?.title || 'Track'}) [2局自動交代]`, 'info');
      if (isPlaying && isPowerOn) {
        if (Math.abs(frequencyRef.current - targetFreq) >= 0.1 || activeStation?.frequency !== targetSt.frequency) {
          changeTrackWithFade(nextTrackIdx, targetSt, false, true);
        }
      } else {
        setFrequency(targetFreq);
        frequencyRef.current = targetFreq;
        setActiveStation(targetSt);
        activeStationRef.current = targetSt;
        setTargetStationName(`${targetSt.name} (${targetSt.frequency.toFixed(1)} MHz)`);
        setCurrentTrackIndex(nextTrackIdx);
        setCurrentTimeSec(0);
        setProgress(0);
      }
    }
  };

  // ペア局への即時手動スワップ切り替え処理
  const swapPresetPairStation = () => {
    const mode = activePresetPairRef.current;
    if (!mode) return;
    const pairFreqs = PRESET_PAIRS[mode].frequencies;
    const curFreq = frequencyRef.current;
    const nextFreq = Math.abs(curFreq - pairFreqs[0]) < 0.25 ? pairFreqs[1] : pairFreqs[0];
    applyPresetPair(mode, nextFreq);
  };

  // 時間帯（朝・昼・晩）に応じた選局チューニング処理
  const tuneToTimeSlot = (freq: number) => {
    const ctx = audioCtxRef.current || initAudioEngine();
    ensureCtxRunning(ctx);
    setIsPowerOn(true);
    setIsPlaying(true);

    const st = STATIONS.find((s) => s.frequency === freq);
    if (st) {
      changeTrackWithFade(0, st, false, true);
    }
  };

  const autoSearchCurrentTimeSlot = () => {
    const info = getTimeSlotInfo();
    tuneToTimeSlot(info.recommendedFreq);
  };

  // ランダムラジオch選局処理（forcePlay: true で停止中や電源OFFからでも確実に演奏を開始）
  const tuneToRandomStation = (forcePlay: boolean = true) => {
    const ctx = audioCtxRef.current || initAudioEngine();
    ensureCtxRunning(ctx);
    if (forcePlay) {
      setIsPowerOn(true);
      setIsPlaying(true);
    }

    if (activePresetPairRef.current) {
      setActivePresetPair(null);
      activePresetPairRef.current = null;
    }

    const currentFreq = frequencyRef.current;
    const otherStations = STATIONS.filter((s) => s.frequency !== currentFreq);
    const candidates = otherStations.length > 0 ? otherStations : STATIONS;
    const randomSt = candidates[Math.floor(Math.random() * candidates.length)];

    if (randomSt) {
      const randomTrackIdx = Math.floor(Math.random() * randomSt.tracks.length);
      changeTrackWithFade(randomTrackIdx, randomSt, false, forcePlay || (isPlaying && isPowerOn));
    }
  };

  // 曲毎シャッフルのトグル切替ハンドラー（有効化時は直ちにランダム選局で演奏を開始）
  const handleToggleRandomStationMode = () => {
    const nextVal = !isRandomStationMode;
    setIsRandomStationMode(nextVal);
    isRandomStationModeRef.current = nextVal;
    if (nextVal) {
      setIsTimeAutoSearch(false);
      setActivePresetPair(null);
      activePresetPairRef.current = null;
      tuneToRandomStation(true);
    }
  };

  // 朝・昼・晩 時間帯リアルタイム自動連動の定期監視
  useEffect(() => {
    if (!isTimeAutoSearch) return;

    const checkAndAutoTune = () => {
      const info = getTimeSlotInfo();
      if (frequency !== info.recommendedFreq) {
        tuneToTimeSlot(info.recommendedFreq);
      }
    };

    checkAndAutoTune();
    const interval = setInterval(checkAndAutoTune, 15000);
    return () => clearInterval(interval);
  }, [isTimeAutoSearch, frequency, isPlaying, isPowerOn]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatSleepDisplay = (sleepMins: number | null) => {
    if (sleepMins === null) return 'OFF';
    const m = Math.floor(sleepMins);
    const s = Math.round((sleepMins - m) * 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 ${
      theme === 'wood' 
        ? 'bg-gradient-to-br from-stone-900 via-stone-950 to-neutral-900 text-stone-100' 
        : theme === 'silver'
          ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-900 text-slate-100'
          : 'bg-gradient-to-br from-fuchsia-950 via-slate-950 to-pink-950 text-pink-100'
    }`}>
      {/* 告知ヘッダー */}
      <header className="mb-4 text-center max-w-xl px-4 flex flex-col items-center">
        <div className="flex items-center justify-center gap-2">
          <Radio className={`w-6 h-6 animate-pulse ${theme === 'candypop' ? 'text-pink-400' : 'text-emerald-500'}`} />
          <h1 className="text-2xl font-sans tracking-tight font-bold">Retoro Sound Station</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
            theme === 'candypop' 
              ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {theme === 'candypop' ? 'Candy POP Edition 🍭' : 'Work & Focus Edition'}
          </span>
        </div>
      </header>

      {/* メインラジオ筐体 */}
      <div 
        id="radio-chassis"
        className={`w-full max-w-4xl rounded-2xl shadow-2xl border transition-all duration-500 overflow-hidden relative ${
          theme === 'wood'
            ? 'bg-stone-800 border-stone-700 shadow-amber-950/20'
            : theme === 'silver'
              ? 'bg-[linear-gradient(135deg,#cbd5e1_0%,#f1f5f9_20%,#e2e8f0_40%,#94a3b8_65%,#cbd5e1_85%,#f8fafc_100%)] text-slate-900 border-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/80'
              : 'bg-slate-900/90 border-pink-500/40 shadow-pink-500/20 ring-1 ring-pink-500/30'
        }`}
      >
        {theme === 'wood' && (
          <div className="h-10 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 border-b border-stone-900 px-3 sm:px-4 flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-700 border border-amber-900 shadow-inner" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-200/90 hidden md:inline">VINTAGE WOOD CHASSIS</span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-200/90 md:hidden">WOOD</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFocusMode(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold tracking-wider bg-amber-700 hover:bg-amber-600 text-amber-100 border border-amber-600 transition-all shadow-sm cursor-pointer"
                title="ミニマル作業集中画面を開く"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">集中画面</span>
              </button>

              {/* 上部メイン電源ボタン ＆ ツールチップ */}
              <div className="relative group shrink-0">
                <button
                  onClick={togglePower}
                  aria-label={isPowerOn ? '電源を切る' : '電源を入れる'}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-[11px] font-bold tracking-wider transition-all duration-300 shadow-md cursor-pointer ${
                    isPowerOn 
                      ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-950/40 ring-1 ring-rose-400' 
                      : 'bg-stone-800 text-amber-200/70 hover:bg-stone-700 hover:text-white border border-stone-700'
                  }`}
                >
                  <Power className={`w-3.5 h-3.5 ${isPowerOn ? 'animate-pulse' : ''}`} />
                  <span>{isPowerOn ? 'POWER ON' : 'POWER OFF'}</span>
                </button>
                {/* ツールチップ */}
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                  <div className="w-2 h-2 bg-stone-900 rotate-45 -mb-1 border-t border-l border-stone-700" />
                  <div className="bg-stone-900 text-stone-200 text-[10px] font-mono px-2.5 py-1 rounded shadow-xl border border-stone-700 whitespace-nowrap">
                    {isPowerOn ? 'クリックして電源OFF（消音）' : 'クリックして電源ON（BGM再生開始）'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {theme === 'silver' && (
          /* ヘアライン加工（Brushed Silver Aluminum）トップアクセントバー */
          <div className="h-10 bg-[repeating-linear-gradient(90deg,#94a3b8_0px,#cbd5e1_2px,#f1f5f9_4px,#94a3b8_6px)] border-b border-slate-400/80 shadow-inner flex items-center justify-between px-3 sm:px-4 gap-2 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[9px] font-mono font-extrabold tracking-widest text-slate-900 uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] hidden md:inline shrink-0">✨ BRUSHED SILVER ALUMINUM</span>
              <span className="text-[9px] font-mono font-extrabold tracking-widest text-slate-900 uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] md:hidden shrink-0">✨ SILVER</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFocusMode(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold tracking-wider bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-500 transition-all shadow-sm cursor-pointer"
                title="ミニマル作業集中画面を開く"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">集中画面</span>
              </button>

              {/* 上部メイン電源ボタン ＆ ツールチップ */}
              <div className="relative group shrink-0">
                <button
                  onClick={togglePower}
                  aria-label={isPowerOn ? '電源を切る' : '電源を入れる'}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-[11px] font-extrabold tracking-wider transition-all duration-300 shadow-md cursor-pointer ${
                    isPowerOn 
                      ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-950/40 ring-1 ring-rose-400' 
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-600'
                  }`}
                >
                  <Power className={`w-3.5 h-3.5 ${isPowerOn ? 'text-rose-200 animate-pulse' : ''}`} />
                  <span>{isPowerOn ? 'POWER ON' : 'POWER OFF'}</span>
                </button>
                {/* ツールチップ */}
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                  <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1 border-t border-l border-slate-700" />
                  <div className="bg-slate-900 text-slate-100 text-[10px] font-mono px-2.5 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap">
                    {isPowerOn ? 'クリックして電源OFF（消音）' : 'クリックして電源ON（BGM再生開始）'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {theme === 'candypop' && (
          <div className="h-10 bg-gradient-to-r from-pink-600 via-purple-500 to-cyan-500 border-b border-pink-400/30 px-3 sm:px-4 flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] font-mono font-extrabold tracking-widest text-white drop-shadow-sm hidden md:inline shrink-0">🍭 CANDY POP EDITION</span>
              <span className="text-[10px] font-mono font-extrabold tracking-widest text-white drop-shadow-sm md:hidden shrink-0">🍭 CANDY</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFocusMode(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold tracking-wider bg-pink-600 hover:bg-pink-500 text-white border border-pink-400 transition-all shadow-sm cursor-pointer"
                title="ミニマル作業集中画面を開く"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">集中画面</span>
              </button>

              {/* 上部メイン電源ボタン ＆ ツールチップ */}
              <div className="relative group">
                <button
                  onClick={togglePower}
                  aria-label={isPowerOn ? '電源を切る' : '電源を入れる'}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-[11px] font-bold tracking-wider transition-all duration-300 shadow-md cursor-pointer ${
                    isPowerOn 
                      ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-950/40 ring-1 ring-pink-300' 
                      : 'bg-slate-900/90 text-pink-200 hover:bg-slate-800 hover:text-white border border-pink-500/40'
                  }`}
                >
                  <Power className={`w-3.5 h-3.5 ${isPowerOn ? 'animate-pulse' : ''}`} />
                  <span>{isPowerOn ? 'POWER ON' : 'POWER OFF'}</span>
                </button>
                {/* ツールチップ */}
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                  <div className="w-2 h-2 bg-slate-950 rotate-45 -mb-1 border-t border-l border-pink-500/40" />
                  <div className="bg-slate-950 text-pink-100 text-[10px] font-mono px-2.5 py-1 rounded shadow-xl border border-pink-500/40 whitespace-nowrap">
                    {isPowerOn ? 'クリックして電源OFF（消音）' : 'クリックして電源ON（BGM再生開始）'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* メイン内部コンテンツ (均等・美しく高さが揃ったグリッドレイアウト) */}
        <div className="p-4 sm:p-5 flex flex-col gap-5">
          {/* サウンドアナライザー (12カラム全幅・フルサイズワイド表示) */}
          <div className="w-full">
            <div className={`p-3 rounded-xl border backdrop-blur-sm h-40 sm:h-48 flex flex-col overflow-hidden transition-all ${
              theme === 'candypop'
                ? 'bg-slate-950/80 border-pink-500/30'
                : theme === 'silver'
                  ? 'bg-slate-950/90 border-slate-700 text-slate-100 shadow-lg'
                  : 'bg-black/50 border-stone-800'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1.5 px-1 shrink-0 gap-0.5 sm:gap-0">
                <span className={`text-[9px] sm:text-[10px] font-mono tracking-wider font-bold truncate max-w-full ${
                  theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-stone-300'
                }`}>ANALOG SPECTRA ANALYSER</span>
                <span className={`text-[9px] sm:text-[10px] font-mono font-bold truncate max-w-full ${theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-400' : 'text-emerald-400'}`}>64-BAND REALTIME WIDE SPECTRUM</span>
              </div>
              <div className="flex-grow w-full relative min-h-0 overflow-hidden">
                <Visualizer 
                  analyser={analyserRef.current} 
                  isPlaying={isPowerOn && isPlaying} 
                  color={theme === 'candypop' ? 'candypop' : theme === 'silver' ? 'cyan' : 'emerald'} 
                  isTuning={isTuning}
                  isPowerOn={isPowerOn}
                  powerAnimState={powerAnimState}
                  targetStationName={targetStationName}
                  pomodoroMode={pomodoroMode}
                  isEcoMode={isEcoMode}
                />
              </div>
            </div>
          </div>

          {/* 上段：カセットデッキ (7) ＆ FREQUENCY TUNING DIAL (5) - 高さを完全水平同期 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* カセットデッキ（アニメーション＆ボタン） */}
            <div className="lg:col-span-7 flex flex-col">
              <TapeDeck
                title={isJinglePlaying ? '📻 STATION JINGLE: Prime Time Gold' : (currentTrack ? currentTrack.title : (activeStation ? activeStation.name : '曲選択中'))}
                artist={isJinglePlaying ? 'Retro Sound Station (30-Min Special)' : (currentTrack ? (activeStation?.name && currentTrack.artist.includes(activeStation.name) ? currentTrack.artist : (activeStation?.name ? `${currentTrack.artist} (${activeStation.name})` : currentTrack.artist)) : (activeStation ? activeStation.genre : 'Retro Chill FM'))}
                isPlaying={isPlaying || isJinglePlaying}
                isRewinding={false}
                isFastForwarding={isFastForwarding}
                onPlayPause={handlePlayPause}
                onStop={handleStop}
                onPrev={handlePrevStation}
                onNext={handleNextStation}
                onFastForward={handleFastForward}
                progress={progress}
                currentTimeSec={currentTimeSec}
                durationSec={durationSec}
                currentBpm={currentBpm}
                theme={theme}
                className="h-full"
              />
            </div>

            {/* チューナー・同調セクション */}
            <div className="lg:col-span-5 flex flex-col">
              <RadioTuner 
                currentFreq={frequency}
                onFreqChange={handleFreqChange}
                stations={STATIONS}
                activeStation={activeStation}
                theme={theme}
                selectedBand={selectedBand}
                onBandChange={handleBandChange}
                isFavorite={favorites.includes(frequency)}
                onFavoriteToggle={handleFavoriteToggle}
                isPowerOn={isPowerOn}
                isPlaying={isPlaying}
                className="h-full flex flex-col justify-between"
              />
            </div>
          </div>

          {/* 下段：コントロールタブパネル (7) ＆ 3-BAND ANALOG EQUALIZER (5) - 高さを完全水平同期 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 下部コントロールタブパネル（高さ自動/280px固定・内側パネル統一デザイン） */}
            <div className="lg:col-span-7 flex flex-col">
              <div className={`rounded-xl border flex flex-col shadow-lg transition-all h-auto sm:h-[280px] overflow-y-auto sm:overflow-hidden ${
                theme === 'candypop'
                  ? 'bg-slate-900/90 border-pink-500/30'
                  : theme === 'silver'
                    ? 'bg-slate-900/90 border-slate-700'
                    : 'bg-stone-900/80 border-stone-800'
              }`}>
                {/* タブ切り替えヘッダー */}
                <div className={`flex border-b text-[11px] sm:text-xs font-mono font-bold shrink-0 h-[36px] ${
                  theme === 'candypop' 
                    ? 'border-pink-500/30 bg-slate-900/80' 
                    : theme === 'silver'
                      ? 'border-slate-700 bg-slate-900/90'
                      : 'border-stone-800 bg-stone-900/60'
                }`}>
                  <button
                    onClick={() => setActiveControlTab('tuning')}
                    className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                      activeControlTab === 'tuning'
                        ? theme === 'candypop'
                          ? 'border-pink-400 text-pink-300 bg-pink-500/10'
                          : theme === 'silver'
                            ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                            : 'border-amber-400 text-amber-300 bg-amber-500/10'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>ランダム・時間帯切替</span>
                  </button>

                  <button
                    onClick={() => setActiveControlTab('presets')}
                    className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                      activeControlTab === 'presets'
                        ? theme === 'candypop'
                          ? 'border-pink-400 text-pink-300 bg-pink-500/10'
                          : theme === 'silver'
                            ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                            : 'border-amber-400 text-amber-300 bg-amber-500/10'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>プリセット再生</span>
                  </button>

                  <button
                    onClick={() => setActiveControlTab('timers')}
                    className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                      activeControlTab === 'timers'
                        ? theme === 'candypop'
                          ? 'border-pink-400 text-pink-300 bg-pink-500/10'
                          : theme === 'silver'
                            ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                            : 'border-amber-400 text-amber-300 bg-amber-500/10'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>タイマー＆集中</span>
                  </button>
                </div>

                {/* タブコンテンツエリア (高さ自動計算・上下50%均等パネル配置) */}
                <div className="p-2.5 flex-1 overflow-hidden flex flex-col justify-between gap-2">

                {/* ===== TAB 1: 📻 ランダム・時間帯切替 ===== */}
                {activeControlTab === 'tuning' && (
                  <div className="h-full flex flex-col justify-between gap-2 animate-fadeIn">
                    {/* 1. ラジオch ランダム選局 (パネル1) */}
                    <div className={`flex-1 rounded-lg border p-2 flex flex-col justify-between transition-all ${
                      theme === 'candypop'
                        ? 'bg-slate-950/80 border-pink-500/30'
                        : theme === 'silver'
                          ? 'bg-slate-950/90 border-slate-700 text-slate-100 shadow-md'
                          : 'bg-stone-950/70 border-stone-800/80'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-1 border-stone-800/60 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Shuffle className={`w-3.5 h-3.5 ${theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-amber-400'}`} />
                          <span className={`text-[10px] font-mono font-bold tracking-wider ${
                            theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-amber-400'
                          }`}>
                            ラジオch シャッフル選局 (RANDOM CH)
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-stone-300 bg-black/40 px-1.5 py-0.5 rounded border border-stone-800">
                          全{STATIONS.length}局
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 my-auto">
                        <button
                          onClick={() => tuneToRandomStation(true)}
                          className={`py-1.5 px-2.5 rounded text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                            theme === 'candypop'
                              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-500 hover:to-pink-400'
                              : theme === 'silver'
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold'
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>即時ランダム選局</span>
                        </button>

                        <button
                          onClick={handleToggleRandomStationMode}
                          className={`px-2 py-1.5 rounded text-[10px] font-mono transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                            isRandomStationMode
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-inner font-bold'
                              : 'bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isRandomStationMode ? 'bg-amber-400 animate-ping' : 'bg-stone-600'}`} />
                          <span>曲毎ラジオ自動シャッフル: {isRandomStationMode ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. 時間帯別自動連動・選曲 (パネル2) */}
                    <div className={`flex-1 rounded-lg border p-2 flex flex-col justify-between transition-all ${
                      theme === 'candypop'
                        ? 'bg-slate-950/80 border-pink-500/30'
                        : theme === 'silver'
                          ? 'bg-slate-950/90 border-slate-700 text-slate-100 shadow-md'
                          : 'bg-stone-950/70 border-stone-800/80'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-1 border-stone-800/60 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">⏰</span>
                          <span className={`text-[10px] font-mono font-bold tracking-wider ${
                            theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-amber-400'
                          }`}>
                            時間帯別オート選曲 (TIME SLOT AUTO SEARCH)
                          </span>
                        </div>
                        <div className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                          theme === 'candypop'
                            ? 'bg-pink-500/20 text-pink-200 border-pink-500/40'
                            : theme === 'silver'
                              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          <span>{getTimeSlotInfo().icon}</span>
                          <span>{getTimeSlotInfo().label}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 my-auto">
                        <button
                          onClick={autoSearchCurrentTimeSlot}
                          className={`py-1.5 px-2.5 rounded text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                            theme === 'candypop'
                              ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white hover:from-pink-400 hover:to-amber-400'
                              : theme === 'silver'
                                ? 'bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300'
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>現時刻の推奨chに自動チューニング</span>
                        </button>

                        <button
                          onClick={() => {
                            const nextVal = !isTimeAutoSearch;
                            setIsTimeAutoSearch(nextVal);
                            if (nextVal) setIsRandomStationMode(false);
                          }}
                          className={`px-2 py-1.5 rounded text-[10px] font-mono transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                            isTimeAutoSearch
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-inner font-bold'
                              : 'bg-black/40 text-stone-300 border-stone-800 hover:text-stone-100'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isTimeAutoSearch ? 'bg-amber-400 animate-ping' : 'bg-stone-600'}`} />
                          <span>時間帯連動モード: {isTimeAutoSearch ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                  {/* ===== TAB 2: 🎛️ プリセット再生 (ワンタップ選局 3つのモード ON/OFF) ===== */}
                  {activeControlTab === 'presets' && (() => {
                    const activeMode = activePresetPair;
                    const isAnyModeOn = activeMode !== null;
                    const pairInfo = isAnyModeOn ? PRESET_PAIRS[activeMode] : null;
                    const otherFreq = pairInfo
                      ? (Math.abs(frequency - pairInfo.frequencies[0]) < 0.25 
                          ? pairInfo.frequencies[1] 
                          : pairInfo.frequencies[0])
                      : null;

                    return (
                      <div className="h-full flex flex-col justify-between gap-1.5 animate-fadeIn">
                        {/* メイン: ワンタップ選局 3つのモード ON/OFF */}
                        <div className={`flex-1 rounded-lg border p-1.5 sm:p-2 flex flex-col justify-between transition-all min-h-0 ${
                          theme === 'candypop'
                            ? 'bg-slate-950/80 border-pink-500/30'
                            : theme === 'silver'
                              ? 'bg-slate-950/90 border-slate-700 text-slate-100 shadow-md'
                              : 'bg-stone-950/70 border-stone-800/80'
                        }`}>
                          {/* ヘッダー */}
                          <div className="flex items-center justify-between border-b pb-1 border-stone-800/60 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">🎛️</span>
                              <span className={`text-[10px] font-mono font-bold tracking-wider ${
                                theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-amber-400'
                              }`}>
                                ワンタップ選局（3つのモード ON / OFF）
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isAnyModeOn ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[8.5px] sm:text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>{pairInfo?.name} モード ON (2局自動交代)</span>
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActivePresetPair(null);
                                      activePresetPairRef.current = null;
                                      presetPairTrackHistoryRef.current = {
                                        lastTrackByFreq: {},
                                        lastPatternByFreq: {},
                                        decks: {},
                                      };
                                    }}
                                    className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 cursor-pointer"
                                    title="通常再生に戻す"
                                  >
                                    OFFにする
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[8.5px] sm:text-[9px] font-mono text-stone-400 bg-stone-800/40 px-1.5 py-0.5 rounded border border-stone-700/50 flex items-center gap-1">
                                  <Radio className="w-2.5 h-2.5 text-amber-400/80" />
                                  <span>通常再生: チューナー選択</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 3つのワンタップ選局カード */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 my-auto">
                            {/* 1. カフェ: 88.1ch & 101.5ch */}
                            <div
                              onClick={() => togglePresetPairMode('cafe')}
                              className={`p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-1 relative overflow-hidden group select-none shadow-sm ${
                                activeMode === 'cafe'
                                  ? theme === 'candypop'
                                    ? 'bg-pink-950/50 border-pink-400 ring-2 ring-pink-500/60 shadow-pink-500/20'
                                    : theme === 'silver'
                                      ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20'
                                      : 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-amber-500/20'
                                  : theme === 'candypop'
                                    ? 'bg-slate-900/70 hover:bg-slate-800/80 border-pink-500/30 hover:border-pink-400/60'
                                    : theme === 'silver'
                                      ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700 hover:border-amber-400/50'
                                      : 'bg-stone-900/60 hover:bg-stone-800/80 border-stone-800 hover:border-amber-500/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className={`p-1 rounded shrink-0 group-hover:scale-110 transition-transform ${
                                    activeMode === 'cafe'
                                      ? 'bg-amber-500 text-stone-950 font-bold'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    <Coffee className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-xs font-bold text-stone-100">カフェ</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePresetPairMode('cafe');
                                  }}
                                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                                    activeMode === 'cafe'
                                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/80 shadow-emerald-500/20'
                                      : 'bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-600'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${activeMode === 'cafe' ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                                  {activeMode === 'cafe' ? 'ON' : 'OFF'}
                                </button>
                              </div>

                              <div className="text-[9px] font-mono text-stone-400 truncate mt-0.5">
                                ボサノヴァ ⇄ ジャズ
                              </div>

                              <div className="grid grid-cols-2 gap-1 mt-1 text-[8.5px] font-mono">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyPresetPair('cafe', 88.1);
                                  }}
                                  className={`px-1.5 py-0.5 rounded border truncate text-center transition-colors cursor-pointer ${
                                    activeMode === 'cafe' && Math.abs(frequency - 88.1) < 0.25
                                      ? 'bg-amber-500/30 text-amber-200 border-amber-400/70 font-bold ring-1 ring-amber-400/40'
                                      : 'bg-black/30 text-stone-400 border-stone-800/70 hover:border-amber-500/50 hover:text-amber-300'
                                  }`}
                                >
                                  88.1ch {activeMode === 'cafe' && Math.abs(frequency - 88.1) < 0.25 && '•ON'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyPresetPair('cafe', 101.5);
                                  }}
                                  className={`px-1.5 py-0.5 rounded border truncate text-center transition-colors cursor-pointer ${
                                    activeMode === 'cafe' && Math.abs(frequency - 101.5) < 0.25
                                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/70 font-bold ring-1 ring-emerald-400/40'
                                      : 'bg-black/30 text-stone-400 border-stone-800/70 hover:border-emerald-500/50 hover:text-emerald-300'
                                  }`}
                                >
                                  101.5ch {activeMode === 'cafe' && Math.abs(frequency - 101.5) < 0.25 && '•ON'}
                                </button>
                              </div>
                            </div>

                            {/* 2. デイタイム: 92.4ch & 105.8ch */}
                            <div
                              onClick={() => togglePresetPairMode('daytime')}
                              className={`p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-1 relative overflow-hidden group select-none shadow-sm ${
                                activeMode === 'daytime'
                                  ? theme === 'candypop'
                                    ? 'bg-fuchsia-950/50 border-fuchsia-400 ring-2 ring-fuchsia-500/60 shadow-fuchsia-500/20'
                                    : theme === 'silver'
                                      ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-500/20'
                                      : 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/20'
                                  : theme === 'candypop'
                                    ? 'bg-slate-900/70 hover:bg-slate-800/80 border-pink-500/30 hover:border-pink-400/60'
                                    : theme === 'silver'
                                      ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700 hover:border-cyan-400/50'
                                      : 'bg-stone-900/60 hover:bg-stone-800/80 border-stone-800 hover:border-emerald-500/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className={`p-1 rounded shrink-0 group-hover:scale-110 transition-transform ${
                                    activeMode === 'daytime'
                                      ? 'bg-cyan-400 text-slate-950 font-bold'
                                      : 'bg-cyan-500/20 text-cyan-300'
                                  }`}>
                                    <Sun className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-xs font-bold text-stone-100">デイタイム</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePresetPairMode('daytime');
                                  }}
                                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                                    activeMode === 'daytime'
                                      ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/80 shadow-cyan-500/20'
                                      : 'bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-600'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${activeMode === 'daytime' ? 'bg-cyan-400 animate-pulse' : 'bg-stone-500'}`} />
                                  {activeMode === 'daytime' ? 'ON' : 'OFF'}
                                </button>
                              </div>

                              <div className="text-[9px] font-mono text-stone-400 truncate mt-0.5">
                                シティポップ ⇄ 雨音チルホップ
                              </div>

                              <div className="grid grid-cols-2 gap-1 mt-1 text-[8.5px] font-mono">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyPresetPair('daytime', 92.4);
                                  }}
                                  className={`px-1.5 py-0.5 rounded border truncate text-center transition-colors cursor-pointer ${
                                    activeMode === 'daytime' && Math.abs(frequency - 92.4) < 0.25
                                      ? 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400/70 font-bold ring-1 ring-fuchsia-400/40'
                                      : 'bg-black/30 text-stone-400 border-stone-800/70 hover:border-fuchsia-500/50 hover:text-fuchsia-300'
                                  }`}
                                >
                                  92.4ch {activeMode === 'daytime' && Math.abs(frequency - 92.4) < 0.25 && '•ON'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyPresetPair('daytime', 105.8);
                                  }}
                                  className={`px-1.5 py-0.5 rounded border truncate text-center transition-colors cursor-pointer ${
                                    activeMode === 'daytime' && Math.abs(frequency - 105.8) < 0.25
                                      ? 'bg-sky-500/30 text-sky-200 border-sky-400/70 font-bold ring-1 ring-sky-400/40'
                                      : 'bg-black/30 text-stone-400 border-stone-800/70 hover:border-sky-500/50 hover:text-sky-300'
                                  }`}
                                >
                                  105.8ch {activeMode === 'daytime' && Math.abs(frequency - 105.8) < 0.25 && '•ON'}
                                </button>
                              </div>
                            </div>

                            {/* 3. おやすみ: 76.0ch & 97.5ch */}
                            <div
                              onClick={() => togglePresetPairMode('sleep')}
                              className={`p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-1 relative overflow-hidden group select-none shadow-sm ${
                                activeMode === 'sleep'
                                  ? theme === 'candypop'
                                    ? 'bg-indigo-950/50 border-indigo-400 ring-2 ring-indigo-500/60 shadow-indigo-500/20'
                                    : theme === 'silver'
                                      ? 'bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-400/50 shadow-indigo-500/20'
                                      : 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/50 shadow-indigo-500/20'
                                  : theme === 'candypop'
                                    ? 'bg-slate-900/70 hover:bg-slate-800/80 border-pink-500/30 hover:border-pink-400/60'
                                    : theme === 'silver'
                                      ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700 hover:border-indigo-400/50'
                                      : 'bg-stone-900/60 hover:bg-stone-800/80 border-stone-800 hover:border-indigo-500/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className={`p-1 rounded shrink-0 group-hover:scale-110 transition-transform ${
                                    activeMode === 'sleep'
                                      ? 'bg-indigo-400 text-slate-950 font-bold'
                                      : 'bg-indigo-500/20 text-indigo-300'
                                  }`}>
                                    <Moon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-xs font-bold text-stone-100">おやすみ</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePresetPairMode('sleep');
                                  }}
                                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                                    activeMode === 'sleep'
                                      ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/80 shadow-indigo-500/20'
                                      : 'bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-600'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${activeMode === 'sleep' ? 'bg-indigo-400 animate-pulse' : 'bg-stone-500'}`} />
                                  {activeMode === 'sleep' ? 'ON' : 'OFF'}
                                </button>
                              </div>

                              <div className="text-[9px] font-mono text-stone-400 truncate mt-0.5">
                                エレクトロヒーリング ⇄ レトロアンビエント
                              </div>

                              <div className="grid grid-cols-2 gap-1 mt-1 text-[8.5px] font-mono">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyPresetPair('sleep', 76.0);
                                  }}
                                  className={`px-1.5 py-0.5 rounded border truncate text-center transition-colors cursor-pointer ${
                                    activeMode === 'sleep' && Math.abs(frequency - 76.0) < 0.25
                                      ? 'bg-teal-500/30 text-teal-200 border-teal-400/70 font-bold ring-1 ring-teal-400/40'
                                      : 'bg-black/30 text-stone-400 border-stone-800/70 hover:border-teal-500/50 hover:text-teal-300'
                                  }`}
                                >
                                  76.0ch {activeMode === 'sleep' && Math.abs(frequency - 76.0) < 0.25 && '•ON'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyPresetPair('sleep', 97.5);
                                  }}
                                  className={`px-1.5 py-0.5 rounded border truncate text-center transition-colors cursor-pointer ${
                                    activeMode === 'sleep' && Math.abs(frequency - 97.5) < 0.25
                                      ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/70 font-bold ring-1 ring-indigo-400/40'
                                      : 'bg-black/30 text-stone-400 border-stone-800/70 hover:border-indigo-500/50 hover:text-indigo-300'
                                  }`}
                                >
                                  97.5ch {activeMode === 'sleep' && Math.abs(frequency - 97.5) < 0.25 && '•ON'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 下部ステータスバー */}
                          {isAnyModeOn && pairInfo && otherFreq !== null ? (
                            <div className="rounded border border-amber-500/30 bg-black/60 p-1.5 flex items-center justify-between gap-2 text-[10px] font-mono shrink-0 shadow-inner">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs animate-spin-slow">🔄</span>
                                <div className="truncate">
                                  <span className="font-bold text-amber-300 mr-1.5">
                                    【{pairInfo.name} モード: ON】
                                  </span>
                                  <span className="text-stone-300">
                                    放送中: {frequency.toFixed(1)}MHz ⇄ 曲終了でペア局 ({otherFreq.toFixed(1)}MHz) へ自動交代
                                  </span>
                                </div>
                              </div>
                              <div className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                                自動交代待機中
                              </div>
                            </div>
                          ) : (
                            <div className="rounded border border-stone-800 bg-black/50 p-1.5 flex items-center justify-between gap-2 text-[10px] font-mono shrink-0 shadow-inner">
                              <div className="flex items-center gap-1.5 min-w-0 text-stone-300">
                                <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <div className="truncate">
                                  <span className="font-bold text-amber-300 mr-1.5">
                                    【通常再生: チューナー選択】
                                  </span>
                                  <span className="text-stone-400">
                                    現在 {frequency.toFixed(1)}MHz を固定再生中。上のモードをタップすると2局自動交代がONになります。
                                  </span>
                                </div>
                              </div>
                              <div className="text-[9px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800 shrink-0">
                                ダイヤル選局中
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ===== TAB 3: ⏱️ タイマー ＆ 集中 ===== */}
                  {activeControlTab === 'timers' && (
                    <div className="h-full flex flex-col justify-between gap-2 animate-fadeIn">
                      {/* Row 1: ポモドーロタイマー & スリープタイマー */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* ポモドーロタイマー */}
                        <div className={`border rounded-lg p-2 flex flex-col justify-between transition-all ${
                          theme === 'candypop'
                            ? 'bg-slate-950/80 border-pink-500/30'
                            : theme === 'silver'
                              ? 'bg-slate-950/90 border-slate-700 text-slate-100 shadow-md'
                              : 'bg-stone-950/70 border-stone-800/80'
                        }`}>
                          <div className="flex items-center justify-between border-b pb-1 border-stone-800/60 shrink-0">
                            <span className={`text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                              pomodoroMode === 'work'
                                ? 'text-amber-400'
                                : pomodoroMode === 'break'
                                  ? 'text-emerald-400'
                                  : theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-stone-300'
                            }`}>
                              <Clock className={`w-3.5 h-3.5 ${
                                pomodoroMode === 'work' ? 'text-amber-400' : pomodoroMode === 'break' ? 'text-emerald-400' : 'text-stone-400'
                              }`} />
                              <span>
                                {pomodoroMode === 'work' ? `${focusWorkMinutes}分集中中` : pomodoroMode === 'break' ? '休憩中' : '集中タイマー (ポモドーロ)'}
                              </span>
                            </span>
                            <div className={`text-xs font-mono font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                              pomodoroMode === 'work'
                                ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse'
                                : pomodoroMode === 'break'
                                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse'
                                  : theme === 'candypop'
                                    ? 'bg-pink-950/80 text-pink-300 border-pink-500/40'
                                    : theme === 'silver'
                                      ? 'bg-slate-900 text-cyan-300 border-slate-700'
                                      : 'text-stone-300 bg-black/60 border-stone-800'
                            }`}>
                              {formatTimer(pomodoroSecondsLeft)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 my-auto">
                            {pomodoroMode === 'off' ? (
                              <div className="grid grid-cols-2 gap-1.5 flex-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFocusWorkMinutes(25);
                                    setPomodoroMode('work');
                                    setPomodoroSecondsLeft(25 * 60);
                                  }}
                                  className={`py-1 px-1.5 text-xs font-mono font-bold rounded transition-all shadow-sm text-center cursor-pointer ${
                                    theme === 'candypop'
                                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-400 hover:to-purple-400'
                                      : theme === 'silver'
                                        ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  }`}
                                  title="作業25分 / 休憩5分のポモドーロ集中サイクルを開始"
                                >
                                  25分集中
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFocusWorkMinutes(50);
                                    setPomodoroMode('work');
                                    setPomodoroSecondsLeft(50 * 60);
                                  }}
                                  className={`py-1 px-1.5 text-xs font-mono font-bold rounded transition-all shadow-sm text-center cursor-pointer ${
                                    theme === 'candypop'
                                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-400 hover:to-indigo-400'
                                      : theme === 'silver'
                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold'
                                        : 'bg-teal-600 hover:bg-teal-500 text-white'
                                  }`}
                                  title="作業50分 / 休憩10分のロング集中サイクルを開始"
                                >
                                  50分集中
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPomodoroMode('off');
                                    setPomodoroSecondsLeft(focusWorkMinutes * 60);
                                  }}
                                  className={`flex-1 py-1 text-xs font-mono rounded border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                    theme === 'candypop'
                                      ? 'bg-slate-900 text-pink-300 border-pink-500/40 hover:bg-slate-800'
                                      : theme === 'silver'
                                        ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
                                        : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                                  }`}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> リセット
                                </button>
                              </div>
                            )}

                            <div className={`text-[10px] font-mono px-1.5 py-1 rounded border whitespace-nowrap ${
                              theme === 'candypop'
                                ? 'bg-slate-900 text-pink-300 border-pink-500/30'
                                : theme === 'silver'
                                  ? 'bg-slate-900 text-slate-300 border-slate-700'
                                  : 'text-stone-400 bg-stone-900/80 border-stone-800'
                            }`}>
                              完了: {completedSessions}回
                            </div>
                          </div>
                        </div>

                        {/* スリープタイマー */}
                        <div className={`border rounded-lg p-2 flex flex-col justify-between transition-all ${
                          theme === 'candypop'
                            ? 'bg-slate-950/80 border-pink-500/30'
                            : theme === 'silver'
                              ? 'bg-slate-950/90 border-slate-700 text-slate-100 shadow-md'
                              : 'bg-stone-950/70 border-stone-800/80'
                        }`}>
                          <div className="flex items-center justify-between border-b pb-1 border-stone-800/60 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <Clock className={`w-3.5 h-3.5 ${theme === 'candypop' ? 'text-yellow-400' : theme === 'silver' ? 'text-cyan-400' : 'text-amber-400'}`} />
                              <span className={`text-[10px] font-mono font-bold ${
                                theme === 'candypop' ? 'text-yellow-300' : theme === 'silver' ? 'text-cyan-300' : 'text-stone-300'
                              }`}>スリープタイマー</span>
                            </div>
                            <div className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                              theme === 'candypop'
                                ? sleepTimer !== null ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' : 'bg-slate-900 text-pink-400/50 border border-pink-900/40'
                                : theme === 'silver'
                                  ? sleepTimer !== null ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-700'
                                  : sleepTimer !== null
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-black/60 text-slate-400 border border-slate-800'
                            }`}>
                              {formatSleepDisplay(sleepTimer)}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-1 my-auto">
                            <button
                              onClick={() => setSleepTimerInMinutes(null)}
                              className={`py-1 rounded text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                                sleepTimer === null
                                  ? theme === 'candypop' ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                  : theme === 'candypop' ? 'bg-slate-900 border-pink-900/40 text-pink-300/70 hover:text-pink-100' : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-stone-100'
                              }`}
                            >
                              OFF
                            </button>
                            {[15, 30, 60].map((mins) => (
                              <button
                                key={mins}
                                onClick={() => setSleepTimerInMinutes(mins)}
                                className={`py-1 rounded text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                                  sleepTimer !== null && Math.round(sleepTimer) === mins
                                    ? theme === 'candypop' ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                    : theme === 'candypop' ? 'bg-slate-900 border-pink-900/40 text-pink-300/70 hover:text-pink-100' : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-stone-100'
                                }`}
                              >
                                {mins}分
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: ラジオ時報 & ミニマル作業集中表示モード */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* 30分毎シグナル: ステーションジングル / 時報 */}
                        <div className={`border rounded-lg p-2 flex flex-col justify-between transition-all ${
                          theme === 'candypop'
                            ? 'bg-slate-950/80 border-pink-500/30'
                            : theme === 'silver'
                              ? 'bg-slate-950/90 border-slate-700 text-slate-100 shadow-md'
                              : 'bg-stone-950/70 border-stone-800/80'
                        }`}>
                          <div className="flex items-center justify-between border-b pb-1 border-stone-800/60 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <Radio className={`w-3.5 h-3.5 ${isJinglePlaying ? 'text-amber-400 animate-pulse' : theme === 'candypop' ? 'text-pink-400' : theme === 'silver' ? 'text-cyan-400' : 'text-amber-400'}`} />
                              <span className={`text-[10px] font-mono font-bold ${
                                theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-stone-300'
                              }`}>正時時報 & 30分ジングル</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                isJingleEnabled
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-stone-900 text-stone-500 border border-stone-800'
                              }`}>
                                ジングル:{isJingleEnabled ? 'ON' : 'OFF'}
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                isTimeSignalEnabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-stone-900 text-stone-500 border border-stone-800'
                              }`}>
                                時報:{isTimeSignalEnabled ? 'ON' : 'OFF'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 my-auto pt-1">
                            {/* ジングル ON / OFF ボタン */}
                            <button
                              onClick={() => {
                                const nextState = !isJingleEnabled;
                                setIsJingleEnabled(nextState);
                                if (!nextState && isJinglePlaying) {
                                  stopStationJingle();
                                }
                              }}
                              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-mono font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                                isJingleEnabled
                                  ? theme === 'candypop'
                                    ? 'bg-pink-600/30 border-pink-500 text-pink-200 shadow-sm'
                                    : theme === 'silver'
                                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200 shadow-sm'
                                      : 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-sm'
                                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                              }`}
                              title="毎時30分のステーションジングル(Prime Time Gold)の自動送出をON/OFF"
                            >
                              <Radio className={`w-3.5 h-3.5 ${isJingleEnabled ? (theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-amber-300') : 'text-stone-500'}`} />
                              <span>{isJingleEnabled ? 'ジングル ON' : 'ジングル OFF'}</span>
                            </button>

                            {/* 時報 ON / OFF ボタン */}
                            <button
                              onClick={() => setIsTimeSignalEnabled(!isTimeSignalEnabled)}
                              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-mono font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                                isTimeSignalEnabled
                                  ? theme === 'candypop'
                                    ? 'bg-pink-600/30 border-pink-500 text-pink-200 shadow-sm'
                                    : theme === 'silver'
                                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200 shadow-sm'
                                      : 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-sm'
                                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                              }`}
                              title="正時(00分)のラジオ時報アナウンス音の自動送出をON/OFF"
                            >
                              <Bell className={`w-3.5 h-3.5 ${isTimeSignalEnabled ? (theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-amber-300') : 'text-stone-500'}`} />
                              <span>{isTimeSignalEnabled ? '時報 ON' : '時報 OFF'}</span>
                            </button>

                          </div>
                        </div>

                        {/* ミニマル作業集中表示モード */}
                        <div className={`rounded-lg border p-2 flex items-center justify-between gap-2 transition-all ${
                          theme === 'candypop'
                            ? 'bg-slate-950/80 border-pink-500/30'
                            : theme === 'silver'
                              ? 'bg-slate-950/90 border-slate-700 text-slate-100 shadow-md'
                              : 'bg-stone-950/70 border-stone-800/80'
                        }`}>
                          <div className="flex items-center gap-2 px-1">
                            <div className={`p-1.5 rounded-md border ${
                              theme === 'candypop'
                                ? 'bg-pink-500/10 border-pink-500/30 text-pink-300'
                                : theme === 'silver'
                                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}>
                              <Eye className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <div className={`text-xs font-mono font-bold ${theme === 'candypop' ? 'text-pink-200' : 'text-stone-200'}`}>
                                ミニマル集中画面
                              </div>
                              <div className="text-[10px] font-mono text-stone-400">
                                フルスクリーンで没頭
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setIsFocusMode(true)}
                            className={`py-1.5 px-3 rounded-md text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0 ${
                              theme === 'candypop'
                                ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white'
                                : theme === 'silver'
                                  ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>全画面</span>
                          </button>
                        </div>
                      </div>

                      {/* 省電力・高パフォーマンスモード (ECO MODE) */}
                      <div className={`rounded-lg border p-2 flex items-center justify-between gap-2 transition-all shrink-0 ${
                        theme === 'candypop'
                          ? 'bg-slate-950/80 border-pink-500/30'
                          : theme === 'silver'
                            ? 'bg-slate-950/90 border-slate-700 text-slate-100 shadow-md'
                            : 'bg-stone-950/70 border-stone-800/80'
                      }`}>
                        <div className="flex items-center gap-2 px-1 min-w-0">
                          <div className={`p-1.5 rounded-md border shrink-0 ${
                            isEcoMode
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-stone-800/60 border-stone-700 text-stone-400'
                          }`}>
                            <Zap className="w-4 h-4" />
                          </div>
                          <div className="text-left min-w-0">
                            <div className={`text-xs font-mono font-bold truncate flex items-center gap-1.5 ${theme === 'candypop' ? 'text-pink-200' : 'text-stone-200'}`}>
                              <span>省電力・高パフォーマンス</span>
                              {isEcoMode && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/40">ECO ON</span>}
                            </div>
                            <div className="text-[10px] font-mono text-stone-400 truncate">
                              ビジュアライザー軽量化・ブラウザ負荷軽減
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsEcoMode(!isEcoMode)}
                          className={`py-1.5 px-3 rounded-md text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0 border ${
                            isEcoMode
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                              : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{isEcoMode ? '有効 (Eco)' : '通常'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* 右下: イコライザー (3-BAND EQUALIZER) （高さ280px固定・コントロールタブパネルと完全統一） */}
            <div className="lg:col-span-5 flex flex-col">
              <Equalizer 
                bass={bass} 
                onBassChange={setBass} 
                mid={mid} 
                onMidChange={setMid} 
                treble={treble} 
                onTrebleChange={setTreble} 
                theme={theme}
                className="h-[280px]"
              />
            </div>
          </div>
        </div>

        {/* 最下部：テーマ セパレート・コントロールバー */}
        <div className={`p-3.5 border-t flex flex-wrap items-center justify-between gap-3 backdrop-blur-md transition-all ${
          theme === 'candypop'
            ? 'bg-slate-950/90 border-pink-500/30'
            : theme === 'silver'
              ? 'bg-slate-950/95 border-slate-800'
              : 'bg-black/70 border-stone-900'
        }`}>
          {/* テーマ (THEME) ボタン群 */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className={`flex items-center gap-1.5 mr-1 text-[11px] font-mono font-bold tracking-wider ${
              theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-amber-400'
            }`}>
              <Palette className="w-3.5 h-3.5" />
              <span>テーマ:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTheme('wood')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  theme === 'wood'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>🪵</span>
                <span>ウォルナット</span>
              </button>

              <button
                onClick={() => setTheme('silver')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  theme === 'silver'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>✨</span>
                <span>シルバー</span>
              </button>

              <button
                onClick={() => setTheme('candypop')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  theme === 'candypop'
                    ? 'bg-pink-500/30 border-pink-400 text-pink-200 shadow-sm'
                    : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>🍬</span>
                <span>Candy POP</span>
              </button>
            </div>
          </div>

          {/* テーマの隣：ON AIR ランプ ＆ ステーション名 */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* ON AIR LAMP */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-extrabold tracking-widest transition-all ${
              isPowerOn && isPlaying
                ? 'bg-red-950/90 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse'
                : 'bg-stone-900/80 border-stone-800 text-stone-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isPowerOn && isPlaying 
                  ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' 
                  : 'bg-stone-600'
              }`} />
              <span>{isPowerOn && isPlaying ? 'ON AIR' : 'OFF AIR'}</span>
            </div>

            {/* 放送中のラジオステーション名 */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-mono transition-all ${
              theme === 'candypop' 
                ? 'bg-slate-950/80 border-pink-500/30 text-pink-200' 
                : theme === 'silver' 
                  ? 'bg-slate-900/90 border-slate-700 text-slate-200' 
                  : 'bg-stone-950/90 border-stone-800 text-stone-300'
            }`}>
              <Radio className={`w-3.5 h-3.5 shrink-0 ${
                isPowerOn && isPlaying 
                  ? `${theme === 'candypop' ? 'text-pink-400' : theme === 'silver' ? 'text-cyan-400' : 'text-amber-400'} animate-pulse` 
                  : 'text-stone-600'
              }`} />
              <span className={`font-bold truncate ${
                theme === 'candypop' ? 'text-pink-300' : theme === 'silver' ? 'text-cyan-300' : 'text-amber-300'
              }`}>
                {activeStation ? activeStation.name : '放送オフ'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ===== ミニマル作業集中画面 (DEEP FOCUS OVERLAY) ===== */}
      {isFocusMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto font-mono text-slate-100 animate-fadeIn">
          {/* 上部ヘッダーバー */}
          <div className="w-full max-w-4xl flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Eye className="w-4 h-4 animate-pulse" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-bold tracking-wider text-emerald-400 flex items-center gap-2">
                  <span>DEEP FOCUS WORKSPACE</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-bold">キーボード <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-300 border border-slate-700 rounded text-xs">ESC</kbd> または右上のボタンで戻る</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFocusMode(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                title="通常画面に戻る (ESC)"
              >
                <Minimize2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">通常画面に戻る</span>
                <span className="sm:hidden">通常画面</span>
              </button>
            </div>
          </div>

          {/* 中央メインタイマー & スペクトラム・アナライザー */}
          <div className="w-full max-w-3xl flex flex-col items-center my-auto py-6 gap-6">
            {/* ポモドーロタイマー大画面 */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border inline-flex items-center gap-2 ${
                pomodoroMode === 'work' 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                  : pomodoroMode === 'break'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700'
              }`}>
                {pomodoroMode === 'work' ? (
                  <>
                    <Flame className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                    <span>作業集中時間 (WORK SESSION)</span>
                  </>
                ) : pomodoroMode === 'break' ? (
                  <>
                    <Coffee className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>リフレッシュ休憩 (BREAK TIME)</span>
                  </>
                ) : (
                  <>
                    <Timer className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>タイマー待機中 (POMODORO)</span>
                  </>
                )}
              </div>

              {/* 超大型クロック */}
              <div className="text-6xl sm:text-8xl font-mono font-extrabold tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] my-2">
                {formatTimer(pomodoroSecondsLeft)}
              </div>

              {/* タイマー開始・停止・プリセット操作群（全デバイスで一貫したSVGアイコンボタン） */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                {pomodoroMode === 'off' ? (
                  <>
                    <button
                      onClick={() => {
                        setPomodoroMode('work');
                        setPomodoroSecondsLeft(25 * 60);
                      }}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Play className="w-4 h-4 fill-current shrink-0" />
                      <span>25分集中スタート</span>
                    </button>
                    <button
                      onClick={() => {
                        setPomodoroMode('work');
                        setPomodoroSecondsLeft(50 * 60);
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      title="50分ディープフォーカス"
                    >
                      <Flame className="w-4 h-4 shrink-0" />
                      <span>50分集中</span>
                    </button>
                    <button
                      onClick={() => {
                        setPomodoroMode('break');
                        setPomodoroSecondsLeft(5 * 60);
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      title="5分リフレッシュ休憩"
                    >
                      <Coffee className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>5分休憩</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setPomodoroMode('off');
                      setPomodoroSecondsLeft(25 * 60);
                    }}
                    className="px-4 py-2 sm:py-2.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 active:scale-95 text-rose-300 border border-rose-700/60 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>タイマーリセット</span>
                  </button>
                )}

                <span className="text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 flex items-center gap-1.5 shrink-0">
                  <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>完了: {completedSessions} セッション</span>
                </span>
              </div>
            </div>

            {/* ミニスペクトラムアナライザー Visualizer */}
            <div className="w-full h-36 sm:h-48 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-2xl relative p-2 flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 text-[9px] sm:text-[10px] text-slate-400 font-bold px-1 gap-0.5 sm:gap-0 shrink-0">
                <span className="flex items-center gap-1.5 truncate max-w-full">
                  <Sliders className="w-3 h-3 text-emerald-400 shrink-0" />
                  ANALOG SPECTRA ANALYSER
                </span>
                <span className="text-cyan-400 text-[9px] sm:text-[10px] truncate max-w-full flex items-center gap-1">
                  <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
                  {activeStation ? activeStation.name : '放送中'} ({frequency.toFixed(1)} MHz)
                </span>
              </div>
              <div className="w-full flex-grow relative min-h-0 overflow-hidden">
                <Visualizer 
                  analyser={analyserRef.current} 
                  isPlaying={isPowerOn && isPlaying} 
                  color={theme === 'candypop' ? 'candypop' : theme === 'silver' ? 'cyan' : 'emerald'} 
                  isTuning={isTuning}
                  isPowerOn={isPowerOn}
                  powerAnimState={powerAnimState}
                  targetStationName={targetStationName}
                  pomodoroMode={pomodoroMode}
                  isEcoMode={isEcoMode}
                />
              </div>
            </div>

            {/* トラック・再生コントロール ＆ ランダム選局シャッフル */}
            <div className="w-full flex flex-col gap-3">
              {/* シャッフル・ランダム選局バー */}
              <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-200">ラジオ自動シャッフル・ランダム選局</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => tuneToRandomStation(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                    title="現在の放送局からランダムに切り替え"
                  >
                    <Shuffle className="w-3.5 h-3.5 shrink-0" />
                    <span>即時ランダム選局</span>
                  </button>
                  <button
                    onClick={handleToggleRandomStationMode}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border cursor-pointer active:scale-95 shrink-0 ${
                      isRandomStationMode
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-inner font-bold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                    title="曲終了ごとに自動で別の局に移動"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isRandomStationMode ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    <span>曲毎シャッフル: {isRandomStationMode ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* 再生コントロール */}
              <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* 左側: 再生ボタン & トラック情報 */}
                <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
                  <button
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? '一時停止' : '再生'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-lg shrink-0 cursor-pointer active:scale-95 ${
                      isPlaying 
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    }`}
                    title={isPlaying ? '一時停止 (Space)' : '再生 (Space)'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current shrink-0" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5 shrink-0" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-amber-300 truncate flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{currentTrack ? currentTrack.title : 'Chillout Work BGM'}</span>
                    </div>
                    <div className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{activeStation?.name || 'Radio Broadcast'} • {frequency.toFixed(1)}MHz</span>
                    </div>
                  </div>
                </div>

                {/* 右側: 選局・次曲・消音ボタン群（スマートフォンでもはみ出さず美しく整列） */}
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0 w-full md:w-auto">
                  <button
                    onClick={handlePrevStation}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                    title="前の局へ切り替え (←キー)"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>前の局</span>
                  </button>
                  <button
                    onClick={handleNextStation}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                    title="次の局へ切り替え (→キー)"
                  >
                    <span>次の局</span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                  </button>
                  <button
                    onClick={handleFastForward}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 hover:text-amber-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                    title="次のトラックへスキップ (Nキー)"
                  >
                    <FastForward className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>次の曲</span>
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0 ${
                      isMuted
                        ? 'bg-rose-950/70 border-rose-600/70 text-rose-300 hover:bg-rose-900/70'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title={isMuted ? 'ミュート解除 (Mキー)' : 'ミュート (Mキー)'}
                    aria-label={isMuted ? '消音解除' : '消音'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 shrink-0 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 shrink-0 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* フッター情報 */}
          <div className="w-full max-w-4xl text-center text-xs text-slate-500 border-t border-slate-900 pt-3 flex items-center justify-center gap-2">
            <Radio className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Retro Chill FM • Focus Minimal Workspace</span>
          </div>
        </div>
      )}

      {/* フッター */}
      <footer className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-stone-500 font-mono pb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm pt-2 text-stone-300 font-mono">
          <span className="px-2 py-1 bg-stone-900 border border-stone-800 text-amber-400 font-bold rounded shadow-sm flex items-center gap-1">
            ⌨️ キーボードショートカット
          </span>
          <span className="inline-flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
            <kbd className="px-1.5 py-0.5 bg-stone-800 text-amber-300 font-bold rounded border border-stone-700 shadow-inner text-xs">Space</kbd> 再生/停止
          </span>
          <span className="text-stone-600">•</span>
          <span className="inline-flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
            <kbd className="px-1.5 py-0.5 bg-stone-800 text-amber-300 font-bold rounded border border-stone-700 shadow-inner text-xs">← / →</kbd> 選局
          </span>
          <span className="text-stone-600">•</span>
          <span className="inline-flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
            <kbd className="px-1.5 py-0.5 bg-stone-800 text-amber-300 font-bold rounded border border-stone-700 shadow-inner text-xs">↑ / ↓</kbd> 音量
          </span>
          <span className="text-stone-600">•</span>
          <span className="inline-flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
            <kbd className="px-1.5 py-0.5 bg-stone-800 text-amber-300 font-bold rounded border border-stone-700 shadow-inner text-xs">N</kbd> 次曲
          </span>
          <span className="text-stone-600">•</span>
          <span className="inline-flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
            <kbd className="px-1.5 py-0.5 bg-stone-800 text-amber-300 font-bold rounded border border-stone-700 shadow-inner text-xs">F</kbd> 作業集中画面
          </span>
          <span className="text-stone-600">•</span>
          <span className="inline-flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
            <kbd className="px-1.5 py-0.5 bg-stone-800 text-amber-300 font-bold rounded border border-stone-700 shadow-inner text-xs">P</kbd> 電源
          </span>
          <span className="text-stone-600">•</span>
          <span className="inline-flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
            <kbd className="px-1.5 py-0.5 bg-stone-800 text-amber-300 font-bold rounded border border-stone-700 shadow-inner text-xs">M</kbd> 消音
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] pt-0.5">
          <Info className="w-3 h-3 text-stone-500" />
          <span>ポモドーロタイマー（25分作業＋5分休憩）を活用して快適な作業リズムを作りましょう。</span>
        </div>
      </footer>

    </div>
  );
}
