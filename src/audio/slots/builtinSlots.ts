import { SoundSlotPattern } from '../../types/soundSlot';
import { INITIAL_EMPTY_SLOT } from './initialSlot';

/**
 * ═══════════════════════════════════════════════════════════════════
 * サウンドラボ 公式演奏カートリッジ・プリセット集 (BUILTIN_STATION_SLOTS)
 * 
 * FMラジオ本線6チャンネル（76.0 / 88.1 / 92.4 / 97.5 / 101.5 / 105.8）
 * で実際に放送・実装されている音源ソース＆和声進行と100%整合した
 * 正統なプリセットカートリッジ群。
 * 
 * 1. 105.8MHz: Rêverie de la Pluie (六本木アクア / 水滴雨音チルホップ)
 * 2. 101.5MHz: Bayside Twilight Highway (銀座ピアノ / シティポップ・ローズ)
 * 3. 97.5MHz:  Retro Quest (秋葉原オルゴール / 昭和レトロRPG風行進曲)
 * 4. 92.4MHz:  Sunlit Boulevard (渋谷サックス＆ブラス / シティポップ)
 * 5. 88.1MHz:  Café da Manhã (ボサギター / モーニング・ボサノヴァ)
 * 6. 76.0MHz:  Sanctuary (シルクロード / 悠久の瞑想アンビエント)
 * ═══════════════════════════════════════════════════════════════════
 */

// 1. 105.8MHz 六本木アクア: ドビュッシー「夢」水滴分散和音アルペジオ
export const debussy_reverie_raindropPattern: SoundSlotPattern = {
  id: 'debussy-reverie-raindrop',
  title: '105.8MHz 六本木アクア・Rêverie de la Pluie',
  description: 'ドビュッシーのピアノ名曲「夢 (Rêverie)」の流麗なコード・アルペジオ（水泡分散和音）と印象派和声を取り入れた105.8MHz楽曲。アクアバブル和音が水底から水面へ絶え間なく波打ちながらアルペジオを奏で、その上に水滴マリンバの澄んだ旋律が幻想的に響き渡ります。',
  version: '1.0.0',
  author: '105.8MHz ROPPONGI Petrichor',
  styleId: 'cascade',
  channel: 'raindrop',
  partChannels: {
    melody: 'raindrop',
    chords: 'raindrop',
    bass: 'raindrop'
  },
  bpm: 70,
  chords: [
    {
      name: 'Fmaj9',
      notes: [174.61, 220.00, 261.63, 329.63, 392.00],
      bass: 87.31
    },
    {
      name: 'Dm9',
      notes: [146.83, 174.61, 220.00, 261.63, 329.63],
      bass: 73.42
    },
    {
      name: 'Bbmaj7(#11)',
      notes: [116.54, 146.83, 174.61, 220.00, 329.63],
      bass: 58.27
    },
    {
      name: 'C9sus4',
      notes: [130.81, 174.61, 196.00, 233.08, 293.66],
      bass: 65.41
    }
  ],
  bassSteps: [
    { step: 0, velocity: 0.72, duration: 1.6, pitchOffset: 1 },
    { step: 8, velocity: 0.58, duration: 1.2, pitchOffset: 1 }
  ],
  chordSteps: [
    { step: 0, noteIndex: 0, velocity: 0.65, duration: 1.1 },
    { step: 1, noteIndex: 1, velocity: 0.52, duration: 0.9 },
    { step: 2, noteIndex: 2, velocity: 0.55, duration: 0.9 },
    { step: 5, noteIndex: 3, velocity: 0.56, duration: 0.9 },
    { step: 7, noteIndex: 1, velocity: 0.50, duration: 0.9 },
    { step: 8, noteIndex: 0, velocity: 0.62, duration: 1.1 },
    { step: 9, noteIndex: 1, velocity: 0.52, duration: 0.9 },
    { step: 10, noteIndex: 2, velocity: 0.55, duration: 0.9 },
    { step: 13, noteIndex: 3, velocity: 0.56, duration: 0.9 },
    { step: 15, noteIndex: 1, velocity: 0.50, duration: 0.9 }
  ],
  melodySteps: [
    { step: 0, random: true, probability: 0.88, velocity: 0.86, duration: 0.85 },
    { step: 2, random: true, probability: 0.65, velocity: 0.72, duration: 0.40 },
    { step: 3, random: true, probability: 0.50, velocity: 0.68, duration: 0.35 },
    { step: 4, random: true, probability: 0.80, velocity: 0.78, duration: 0.65 },
    { step: 6, random: true, probability: 0.70, velocity: 0.74, duration: 0.45 },
    { step: 7, random: true, probability: 0.50, velocity: 0.66, duration: 0.35 },
    { step: 8, random: true, probability: 0.88, velocity: 0.84, duration: 0.85 },
    { step: 10, random: true, probability: 0.65, velocity: 0.75, duration: 0.45 },
    { step: 11, random: true, probability: 0.50, velocity: 0.68, duration: 0.38 },
    { step: 12, random: true, probability: 0.80, velocity: 0.78, duration: 0.60 },
    { step: 14, random: true, probability: 0.75, velocity: 0.80, duration: 0.55 },
    { step: 15, random: true, probability: 0.45, velocity: 0.70, duration: 0.35 }
  ],
  melodyScale: [
    349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 659.25,
    698.46, 783.99, 880.00, 932.33, 1046.50, 1174.66, 1318.51
  ],
  drumSteps: [
    { step: 0, type: 'kick', velocity: 0.65 },
    { step: 0, type: 'hihat_closed', velocity: 0.32 },
    { step: 2, type: 'hihat_closed', velocity: 0.20 },
    { step: 4, type: 'snare', velocity: 0.55 },
    { step: 4, type: 'hihat_closed', velocity: 0.30 },
    { step: 6, type: 'kick', velocity: 0.62 },
    { step: 6, type: 'hihat_closed', velocity: 0.20 },
    { step: 8, type: 'hihat_closed', velocity: 0.32 },
    { step: 10, type: 'kick', velocity: 0.60 },
    { step: 10, type: 'hihat_closed', velocity: 0.20 },
    { step: 12, type: 'snare', velocity: 0.55 },
    { step: 12, type: 'hihat_closed', velocity: 0.30 },
    { step: 14, type: 'hihat_open', velocity: 0.26 }
  ],
  drumPatternDescription: '105.8MHz六本木本線直系 チルホップ雨音ビート (キック: 0, 6, 10拍 / スネア: 4, 12拍 / 8分刻みハイハット)',
  melodyRules: {
    concept: 'ドビュッシー「夢」風の分散和音アルペジオの上を舞い落ちる、雨粒のオーガニックな即興マリンバ旋律',
    rhythmRule: '5拍目・7拍目を休符にして息遣いを持たせた流麗な分散和音アルペジオ（0→1→2→3→4の上昇頂点から休符・余韻へ）と、確率発音（45%〜88%）の即興雨滴メロディー',
    dynamicsRule: '雫が水面に落ちるような繊細な打鍵（ベロシティゆらぎ 0.65〜0.88, 余韻 0.35〜0.85s, 15%オクターブ跳躍）',
    scaleRule: 'F Major / Lydian 印象派和声 [Fmaj9 → Dm9 → Bbmaj7(#11) → C9sus4] からコード協和音を動的に選択 (不協和音防止率 100%)'
  },
  partMutes: {
    melody: false,
    chords: false,
    bass: false,
    drums: false
  }
};

// 2. 101.5MHz 銀座ピアノ: ベイサイド・トワイライト・ハイウェイ
export const bayside_twilight_highwayPattern: SoundSlotPattern = {
  id: 'custom-station-bayside-twilight',
  title: '101.5MHz 銀座ピアノ・Bayside Twilight Highway',
  description: '101.5MHz GINZA MIDNIGHT CLUB 本線直系。都会の夜景を駆け抜ける80sシティポップ・ローズエレピと洗練されたジャズコード進行。裏拍シンコペーションの軽快なカッティングとアコースティックブラシビート。',
  version: '1.0.0',
  author: 'Tokyo Bayside Players',
  styleId: 'chill',
  channel: 'piano',
  partChannels: {
    melody: 'piano',
    chords: 'piano',
    bass: 'piano'
  },
  bpm: 88,
  chords: [
    {
      name: 'FM9',
      notes: [174.61, 220.00, 261.63, 329.63, 392.00],
      bass: 87.31
    },
    {
      name: 'Em7',
      notes: [164.81, 196.00, 246.94, 293.66],
      bass: 82.41
    },
    {
      name: 'Dm9',
      notes: [146.83, 174.61, 220.00, 261.63, 329.63],
      bass: 73.42
    },
    {
      name: 'Cmaj9',
      notes: [130.81, 164.81, 196.00, 246.94, 293.66],
      bass: 65.41
    }
  ],
  bassSteps: [
    { step: 0, velocity: 0.95, duration: 0.25, pitchOffset: 1 },
    { step: 3, velocity: 0.75, duration: 0.20, pitchOffset: 1 },
    { step: 6, velocity: 0.85, duration: 0.25, pitchOffset: 1 },
    { step: 8, velocity: 0.90, duration: 0.30, pitchOffset: 1 },
    { step: 10, velocity: 0.70, duration: 0.20, pitchOffset: 2 },
    { step: 12, velocity: 0.85, duration: 0.25, pitchOffset: 1 },
    { step: 14, velocity: 0.80, duration: 0.20, pitchOffset: 1 }
  ],
  chordSteps: [
    { step: 2, velocity: 0.80, duration: 0.18, stagger: 0.012 },
    { step: 4, velocity: 0.65, duration: 0.15, stagger: 0.010 },
    { step: 7, velocity: 0.85, duration: 0.22, stagger: 0.015 },
    { step: 10, velocity: 0.75, duration: 0.18, stagger: 0.012 },
    { step: 12, velocity: 0.60, duration: 0.15, stagger: 0.010 },
    { step: 15, velocity: 0.90, duration: 0.25, stagger: 0.018 }
  ],
  melodySteps: [
    { step: 0, pitchOffset: 1, velocity: 0.64, duration: 0.37 },
    { step: 2, pitchOffset: 1, velocity: 0.89, duration: 0.40 },
    { step: 5, pitchOffset: 1, velocity: 0.50, duration: 0.49 },
    { step: 12, pitchOffset: 1, velocity: 1.00, duration: 0.53 },
    { step: 13, pitchOffset: 1, velocity: 0.99, duration: 0.39 }
  ],
  melodyScale: [
    261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88,
    523.25, 587.33, 659.26, 698.46, 783.99, 880.00, 987.77, 1046.50
  ],
  drumSteps: [
    { step: 0, type: 'kick', velocity: 0.95 },
    { step: 2, type: 'hihat_closed', velocity: 0.65 },
    { step: 4, type: 'snare', velocity: 0.90 },
    { step: 6, type: 'hihat_open', velocity: 0.75 },
    { step: 8, type: 'kick', velocity: 0.85 },
    { step: 10, type: 'kick', velocity: 0.75 },
    { step: 11, type: 'hihat_closed', velocity: 0.60 },
    { step: 12, type: 'snare', velocity: 0.92 },
    { step: 14, type: 'hihat_open', velocity: 0.80 }
  ],
  drumPatternDescription: 'タイトな4つ打ちキック変形と2拍4拍の鋭いスネア、ステップ6および14のオープンハイハットが醸し出す爽快なダンサブル・グルーヴ。',
  partMutes: {
    melody: false,
    chords: false,
    bass: false,
    drums: false
  }
};
export const CUSTOM_STATION_PATTERN = bayside_twilight_highwayPattern;

// 3. 97.5MHz 秋葉原オルゴール: 昭和レトロRPG風行進曲
export const musicbox_retro_questPattern: SoundSlotPattern = {
  id: 'akihabara-retro-quest',
  title: '97.5MHz 秋葉原オルゴール・Retro Quest',
  description: 'akihabara cronos (97.5MHz) 本線直系。昭和レトロRPGの城下町やフィールドを想起させる、哀愁と勇壮さを併せ持つ可憐なオルゴール行進曲。アルペジオの澄み渡る金属弁と端正な2拍子ベース。',
  version: '1.0.0',
  author: 'akihabara cronos 97.5MHz',
  styleId: 'cascade',
  channel: 'musicbox',
  partChannels: {
    melody: 'musicbox',
    chords: 'musicbox',
    bass: 'musicbox'
  },
  bpm: 76,
  chords: [
    {
      name: 'Am',
      notes: [110.00, 130.81, 164.81, 220.00],
      bass: 110.00
    },
    {
      name: 'Dm7',
      notes: [146.83, 174.61, 220.00, 261.63],
      bass: 73.42
    },
    {
      name: 'E7',
      notes: [164.81, 207.65, 246.94, 293.66],
      bass: 82.41
    },
    {
      name: 'Am',
      notes: [110.00, 130.81, 164.81, 220.00],
      bass: 110.00
    }
  ],
  bassSteps: [
    { step: 0, pitchOffset: 1.0, velocity: 0.90, duration: 0.70 },
    { step: 8, pitchOffset: 1.498, velocity: 0.82, duration: 0.60 }
  ],
  chordSteps: [
    { step: 2, velocity: 0.75, duration: 0.45, stagger: 0.018 },
    { step: 6, velocity: 0.70, duration: 0.45, stagger: 0.018 },
    { step: 10, velocity: 0.75, duration: 0.45, stagger: 0.018 },
    { step: 14, velocity: 0.70, duration: 0.45, stagger: 0.018 }
  ],
  melodySteps: [
    { step: 0, pitchOffset: 1.0, velocity: 0.74, duration: 0.86 },
    { step: 6, pitchOffset: 1.0, velocity: 1.00, duration: 0.79 },
    { step: 9, pitchOffset: 1.0, velocity: 0.65, duration: 0.67 },
    { step: 10, pitchOffset: 1.0, velocity: 0.84, duration: 0.91 },
    { step: 12, pitchOffset: 2.0, velocity: 0.89, duration: 0.70 }
  ],
  melodyScale: [
    261.63, 293.66, 329.63, 349.23, 415.30, 440.00, 493.88,
    523.25, 587.33, 659.26, 698.46, 830.61, 880.00, 987.77, 1046.50
  ],
  drumSteps: [],
  drumPatternDescription: 'ドラムなし（秋葉原オルゴールの澄んだ独奏）',
  partMutes: {
    melody: false,
    chords: false,
    bass: false,
    drums: true
  }
};
export const musicbox_style_waq4Pattern = musicbox_retro_questPattern;

// 4. 92.4MHz 渋谷サックス＆ブラス: サンリット・ブールバード (シティポップ)
export const shibuya_sunlit_boulevardPattern: SoundSlotPattern = {
  id: 'shibuya-sunlit-boulevard',
  title: '92.4MHz 渋谷サックス・Sunlit Boulevard',
  description: '92.4MHz SHIBUYA DAYLIGHT GROOVE 本線直系。青空とビル群に響く艶やかなサックス、華やかなシンセブラススタブ、弾むウッドベースのシティポップ・グルーヴ。都会の昼下がりを彩る爽快なサウンド。',
  version: '1.0.0',
  author: 'SHIBUYA DAYLIGHT GROOVE',
  styleId: 'chill',
  channel: 'sax',
  partChannels: {
    melody: 'sax',
    chords: 'sax',
    bass: 'sax'
  },
  bpm: 106,
  chords: [
    {
      name: 'Emaj7',
      notes: [164.81, 207.65, 246.94, 311.13],
      bass: 82.41
    },
    {
      name: 'F#m7',
      notes: [185.00, 220.00, 261.63, 293.66],
      bass: 92.50
    },
    {
      name: 'G#m7',
      notes: [207.65, 246.94, 293.66, 329.63],
      bass: 103.83
    },
    {
      name: 'C#m7',
      notes: [138.59, 164.81, 207.65, 246.94],
      bass: 69.30
    }
  ],
  bassSteps: [
    { step: 0, pitchOffset: 1.0, velocity: 0.90, duration: 0.35 },
    { step: 6, pitchOffset: 1.0, velocity: 0.78, duration: 0.25 },
    { step: 10, pitchOffset: 1.498, velocity: 0.85, duration: 0.30 },
    { step: 14, pitchOffset: 1.0, velocity: 0.72, duration: 0.20 }
  ],
  chordSteps: [
    { step: 0, velocity: 0.80, duration: 0.35, stagger: 0.012 },
    { step: 6, velocity: 0.70, duration: 0.25, stagger: 0.012 },
    { step: 12, velocity: 0.75, duration: 0.30, stagger: 0.012 }
  ],
  melodySteps: [
    { step: 2, pitchOffset: 2.0, velocity: 0.85, duration: 0.40 },
    { step: 4, pitchOffset: 2.247, velocity: 0.88, duration: 0.35 },
    { step: 8, pitchOffset: 2.5, velocity: 0.92, duration: 0.45 },
    { step: 11, pitchOffset: 2.0, velocity: 0.80, duration: 0.30 },
    { step: 14, pitchOffset: 2.247, velocity: 0.82, duration: 0.35 }
  ],
  melodyScale: [
    185.00, 207.65, 220.00, 246.94, 277.18, 329.63, 370.00, 415.30, 440.00, 493.88, 554.37, 659.25
  ],
  drumSteps: [
    { step: 0, type: 'kick', velocity: 0.75 },
    { step: 0, type: 'hihat_closed', velocity: 0.35 },
    { step: 2, type: 'hihat_closed', velocity: 0.22 },
    { step: 4, type: 'snare', velocity: 0.70 },
    { step: 4, type: 'hihat_closed', velocity: 0.35 },
    { step: 6, type: 'kick', velocity: 0.65 },
    { step: 6, type: 'hihat_closed', velocity: 0.22 },
    { step: 8, type: 'hihat_closed', velocity: 0.35 },
    { step: 10, type: 'kick', velocity: 0.70 },
    { step: 10, type: 'hihat_closed', velocity: 0.22 },
    { step: 12, type: 'snare', velocity: 0.70 },
    { step: 12, type: 'hihat_closed', velocity: 0.35 },
    { step: 14, type: 'hihat_open', velocity: 0.32 }
  ],
  drumPatternDescription: '92.4MHz渋谷本線直系 シティポップ・グルーヴ (キック: 0, 6, 10拍 / スネア: 4, 12拍 / 16分ハイハット刻み)',
  partMutes: {
    melody: false,
    chords: false,
    bass: false,
    drums: false
  }
};

// 5. 88.1MHz ボサギター: カフェ・ダ・マニャン (モーニング・ボサノヴァ)
export const tokyo_morning_bossaPattern: SoundSlotPattern = {
  id: 'tokyo-morning-bossa',
  title: '88.1MHz ボサギター・Café da Manhã',
  description: '88.1MHz TOKYO MORNING 本線直系。心地よい朝の陽だまりに寄り添う、ナイロン弦ギターの流麗な爪弾きと温もりあるボサノヴァ・クラシック進行。スルドと木製リムショットの穏やかなリズム。',
  version: '1.0.0',
  author: 'TOKYO MORNING BOSSA',
  styleId: 'chill',
  channel: 'guitar',
  partChannels: {
    melody: 'guitar',
    chords: 'guitar',
    bass: 'guitar'
  },
  bpm: 82,
  chords: [
    {
      name: 'Fmaj7',
      notes: [174.61, 220.00, 261.63, 329.63],
      bass: 87.31
    },
    {
      name: 'G7',
      notes: [196.00, 246.94, 293.66, 349.23],
      bass: 98.00
    },
    {
      name: 'Gm7',
      notes: [196.00, 233.08, 293.66, 349.23],
      bass: 98.00
    },
    {
      name: 'C7',
      notes: [130.81, 164.81, 196.00, 233.08],
      bass: 65.41
    }
  ],
  bassSteps: [
    { step: 0, pitchOffset: 1.0, velocity: 0.85, duration: 0.45 },
    { step: 6, pitchOffset: 1.498, velocity: 0.75, duration: 0.30 },
    { step: 8, pitchOffset: 1.498, velocity: 0.85, duration: 0.40 },
    { step: 14, pitchOffset: 1.059, velocity: 0.70, duration: 0.25 }
  ],
  chordSteps: [
    { step: 0, velocity: 0.75, duration: 0.35, stagger: 0.015 },
    { step: 3, velocity: 0.78, duration: 0.45, stagger: 0.015 },
    { step: 6, velocity: 0.72, duration: 0.35, stagger: 0.015 },
    { step: 10, velocity: 0.70, duration: 0.35, stagger: 0.015 },
    { step: 12, velocity: 0.75, duration: 0.45, stagger: 0.015 },
    { step: 14, velocity: 0.72, duration: 0.35, stagger: 0.015 }
  ],
  melodySteps: [
    { step: 0, pitchOffset: 2.0, velocity: 0.80, duration: 0.60 },
    { step: 4, pitchOffset: 2.247, velocity: 0.75, duration: 0.35 },
    { step: 7, pitchOffset: 2.5, velocity: 0.85, duration: 0.45 },
    { step: 10, pitchOffset: 2.247, velocity: 0.78, duration: 0.35 },
    { step: 13, pitchOffset: 2.0, velocity: 0.82, duration: 0.40 }
  ],
  melodyScale: [
    174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33, 659.25
  ],
  drumSteps: [
    { step: 0, type: 'kick', velocity: 0.55 },
    { step: 0, type: 'hihat_closed', velocity: 0.22 },
    { step: 4, type: 'snare', velocity: 0.48 },
    { step: 4, type: 'hihat_closed', velocity: 0.22 },
    { step: 8, type: 'kick', velocity: 0.52 },
    { step: 8, type: 'hihat_closed', velocity: 0.22 },
    { step: 12, type: 'snare', velocity: 0.48 },
    { step: 12, type: 'hihat_closed', velocity: 0.22 }
  ],
  drumPatternDescription: '88.1MHz東京モーニング本線直系 ボサノヴァ・スルド＆木製リムショット (スルド: 0, 8拍 / リム: 4, 12拍)',
  partMutes: {
    melody: false,
    chords: false,
    bass: false,
    drums: false
  }
};

// 6. 76.0MHz シルクロード: サンクチュアリ (悠久の瞑想アンビエント)
export const electro_healing_sanctuaryPattern: SoundSlotPattern = {
  id: 'electro-healing-sanctuary',
  title: '76.0MHz シルクロード・Sanctuary',
  description: '76.0MHz ELECTRO HEALING 本線直系。悠久のシルクロードを巡る祈りの旋律、大地に響く和太鼓、澄み渡るチベットシンギングボウルと梵鐘、深遠なアンビエントパッド。心身を調和へ導くヒーリング空間。',
  version: '1.0.0',
  author: 'ELECTRO HEALING',
  styleId: 'oriental',
  channel: 'ambient',
  partChannels: {
    melody: 'ambient',
    chords: 'ambient',
    bass: 'ambient'
  },
  bpm: 54,
  chords: [
    {
      name: 'F#m7',
      notes: [185.00, 220.00, 277.18, 329.63],
      bass: 92.50
    },
    {
      name: 'E',
      notes: [164.81, 207.65, 246.94, 329.63],
      bass: 82.41
    },
    {
      name: 'Dmaj7',
      notes: [146.83, 185.00, 220.00, 277.18],
      bass: 73.42
    },
    {
      name: 'C#m7',
      notes: [138.59, 164.81, 207.65, 246.94],
      bass: 69.30
    }
  ],
  bassSteps: [
    { step: 0, pitchOffset: 1.0, velocity: 0.85, duration: 3.5 }
  ],
  chordSteps: [
    { step: 0, velocity: 0.80, duration: 2.8 },
    { step: 8, velocity: 0.70, duration: 2.8 }
  ],
  melodySteps: [
    { step: 0, pitchOffset: 2.0, velocity: 0.85, duration: 1.8 },
    { step: 6, pitchOffset: 2.247, velocity: 0.75, duration: 1.2 },
    { step: 10, pitchOffset: 2.5, velocity: 0.80, duration: 1.5 }
  ],
  melodyScale: [
    138.59, 164.81, 185.00, 207.65, 220.00, 246.94, 277.18, 329.63, 370.00, 415.30, 440.00, 493.88, 554.37
  ],
  drumSteps: [
    { step: 0, type: 'taiko', velocity: 0.75 },
    { step: 6, type: 'windChime', velocity: 0.40 },
    { step: 8, type: 'templeGong', velocity: 0.70 },
    { step: 14, type: 'windChime', velocity: 0.40 }
  ],
  drumPatternDescription: '76.0MHzエレクトロヒーリング本線直系 瞑想和太鼓＆寺院の梵鐘・おりん・風鈴',
  partMutes: {
    melody: false,
    chords: false,
    bass: false,
    drums: false
  }
};

/**
 * サウンドラボで即時試聴・切替可能な公式カートリッジ一覧
 * （FM本線6局に対応する6カートリッジ ＋ 初期空セッションスロット）
 */
export const BUILTIN_STATION_SLOTS: SoundSlotPattern[] = [
  debussy_reverie_raindropPattern,       // 105.8MHz 六本木アクア
  bayside_twilight_highwayPattern,       // 101.5MHz 銀座ピアノ
  musicbox_retro_questPattern,           // 97.5MHz 秋葉原オルゴール
  shibuya_sunlit_boulevardPattern,       // 92.4MHz 渋谷サックス＆ブラス
  tokyo_morning_bossaPattern,            // 88.1MHz ボサギター
  electro_healing_sanctuaryPattern,      // 76.0MHz シルクロード・アンビエント
  INITIAL_EMPTY_SLOT
];
