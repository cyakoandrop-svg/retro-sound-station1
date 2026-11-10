import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Volume2
} from 'lucide-react';
import { acousticJazzDrums } from '../audio/acousticJazzDrums';
import { toneDrumKit } from '../audio/toneDrumKit';
import { retroLoungePiano } from '../audio/retroLoungePiano';
import { tokyoMorningBossaGuitar } from '../audio/tokyoMorningBossaGuitar';
import { shibuyaDaylightWoodBass } from '../audio/shibuyaDaylightWoodBass';
import { shibuyaSynthBrass } from '../audio/shibuyaSynthBrass';
import { shibuyaSaxophone } from '../audio/shibuyaSaxophone';
import { aquaBubbleChords } from '../audio/aquaBubbleChords';
import { raindropMelody } from '../audio/raindropMelody';
import { electroHealing } from '../audio/electroHealing';
import { retroMusicBox } from '../audio/retroMusicBox';
import * as Tone from 'tone';
import { SoundSlotPattern, ChordNoteData, RhythmStepTrigger } from '../types/soundSlot';
import { debussy_reverie_raindropPattern } from '../audio/slots/builtinSlots';
import { SlotCartridgeManager } from './SlotCartridgeManager';

interface SoundLabAuditionProps {
  audioCtx: AudioContext | null;
  bassFilter: BiquadFilterNode | null;
  isMainRadioPlaying: boolean;
  onEnsureAudioContext?: () => AudioContext;
}

// 全チャンネル音源定義
export type SoundLabChannel = 'musicbox' | 'piano' | 'guitar' | 'sax' | 'raindrop' | 'ambient';

export interface SoundLabChannelDef {
  id: SoundLabChannel;
  name: string;
  station: string;
  frequency: string;
  desc: string;
  badge: string;
}

export const SOUND_LAB_CHANNELS: SoundLabChannelDef[] = [
  { id: 'musicbox', name: '🎵 97.5 秋葉原オルゴール', station: 'akihabara cronos', frequency: '97.5MHz', badge: '97.5ch', desc: '昭和レトロオルゴール音源。澄み渡る金属弁と可憐な打鍵' },
  { id: 'piano', name: '🎹 101.5 銀座ピアノ', station: 'GINZA CLUB', frequency: '101.5MHz', badge: '101.5ch', desc: 'Rhodes / エレピの温かみとジャズの洗練されたコード感' },
  { id: 'guitar', name: '🎸 88.1 ボサギター', station: 'TOKYO MORNING', frequency: '88.1MHz', badge: '88.1ch', desc: 'ナイロン弦ボサノヴァギターの軽快な爪弾きと温もり' },
  { id: 'sax', name: '🎷 92.4 渋谷サックス＆ブラス', station: 'SHIBUYA GROOVE', frequency: '92.4MHz', badge: '92.4ch', desc: '艶やかなサックス旋律と華やかなシティポップ・シンセブラス' },
  { id: 'raindrop', name: '🌧️ 105.8 六本木アクア', station: 'ROPPONGI Petrichor', frequency: '105.8MHz', badge: '105.8ch', desc: '水滴マリンバの可憐な打鍵とアクアバブル・リバーブ' },
  { id: 'ambient', name: '✨ 76.0 シルクロード', station: 'ELECTRO HEALING', frequency: '76.0MHz', badge: '76.0ch', desc: '深く包み込む瞑想アンビエントパッドと風鈴ベル' },
];

// 各チャンネル共通のトリガー発音ヘルパー関数
const triggerSoundNote = (
  ch: SoundLabChannel,
  freq: number,
  vol: number,
  dur: number,
  now: number,
  isLegato = false
) => {
  switch (ch) {
    case 'piano':
      retroLoungePiano.triggerNote(freq, Math.min(0.92, vol * 1.15), dur * 1.3, now);
      break;
    case 'guitar':
      tokyoMorningBossaGuitar.triggerNote(freq, vol * 0.9, dur, now);
      break;
    case 'sax':
      shibuyaSaxophone.triggerNote(freq, vol * 0.9, dur, now, isLegato);
      break;
    case 'raindrop':
      raindropMelody.triggerNote(freq, vol * 0.9, dur, now);
      break;
    case 'ambient':
      electroHealing.triggerLead(freq, vol * 0.85, dur * 1.5, now);
      break;
    case 'musicbox':
    default:
      retroMusicBox.triggerNote(freq, vol, dur, now);
      break;
  }
};

const triggerSoundChord = (
  ch: SoundLabChannel,
  notes: number[],
  vol: number,
  dur: number,
  stagger: number,
  now: number
) => {
  switch (ch) {
    case 'piano':
      retroLoungePiano.triggerChord(notes, vol * 0.70, dur * 1.0, stagger, now);
      break;
    case 'guitar':
      tokyoMorningBossaGuitar.triggerChord(notes, vol * 0.9, dur, now);
      break;
    case 'sax':
      shibuyaSynthBrass.triggerChord(notes, vol * 0.85, dur, now);
      break;
    case 'raindrop':
      aquaBubbleChords.triggerChord(notes, vol * 0.9, dur * 1.2, now);
      break;
    case 'ambient':
      electroHealing.triggerPadChord(notes, vol * 0.85, dur * 1.8, now);
      break;
    case 'musicbox':
    default:
      retroMusicBox.triggerChord(notes, vol, dur, stagger, now);
      break;
  }
};

const triggerSoundBass = (
  ch: SoundLabChannel,
  freq: number,
  vol: number,
  dur: number,
  now: number
) => {
  switch (ch) {
    case 'ambient':
      electroHealing.triggerDroneBass(freq, vol * 0.85, dur * 1.5, now);
      break;
    case 'piano':
    case 'guitar':
    case 'sax':
    case 'raindrop':
      shibuyaDaylightWoodBass.triggerBass(freq, vol * 0.95, dur, now);
      break;
    case 'musicbox':
    default:
      retroMusicBox.triggerNote(freq, vol, dur, now);
      break;
  }
};

export default function SoundLabAudition({ audioCtx, bassFilter, isMainRadioPlaying, onEnsureAudioContext }: SoundLabAuditionProps) {
  // ── 外部演奏カートリッジ・スロットステート ──
  const [currentSlot, setCurrentSlot] = useState<SoundSlotPattern>(debussy_reverie_raindropPattern);
  const currentSlotRef = useRef<SoundSlotPattern>(currentSlot);
  currentSlotRef.current = currentSlot;

  // 共通トランスポート
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [labVolume, setLabVolume] = useState<number>(85);
  const [currentBar, setCurrentBar] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Refs
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;
  const labVolumeRef = useRef(labVolume);
  labVolumeRef.current = labVolume;

  const timerRef = useRef<number | null>(null);
  const stepCountRef = useRef<number>(0);
  const masterGainRef = useRef<GainNode | null>(null);
  const localAudioCtxRef = useRef<AudioContext | null>(null);


  // 音源エンジンの初期化（メインラジオの状態に関わらず音が出るよう、独立して destination に接続）
  const initEngines = (explicitCtx?: AudioContext) => {
    let ctx = explicitCtx || audioCtx || localAudioCtxRef.current;
    if (!ctx && onEnsureAudioContext) {
      ctx = onEnsureAudioContext();
    }
    if (!ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AudioCtx();
    }
    localAudioCtxRef.current = ctx;

    try {
      if (Tone.getContext().rawContext !== ctx) {
        Tone.setContext(ctx);
      }
    } catch (e) {}

    try {
      if (!masterGainRef.current || masterGainRef.current.context !== ctx) {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(labVolumeRef.current / 100, ctx.currentTime);

        // 独立したマスター・リミッター（クリッピング防止・歪み防止）
        const labLimiter = ctx.createDynamicsCompressor();
        labLimiter.threshold.setValueAtTime(-3, ctx.currentTime);
        labLimiter.knee.setValueAtTime(10, ctx.currentTime);
        labLimiter.ratio.setValueAtTime(12, ctx.currentTime);
        labLimiter.attack.setValueAtTime(0.003, ctx.currentTime);
        labLimiter.release.setValueAtTime(0.20, ctx.currentTime);

        gain.connect(labLimiter);
        labLimiter.connect(ctx.destination);
        masterGainRef.current = gain;
      }

      const dest = masterGainRef.current;
      acousticJazzDrums.init(ctx, dest);
      acousticJazzDrums.setDestination(dest);
      toneDrumKit.init(ctx, dest);
      toneDrumKit.setDestination(dest);

      retroLoungePiano.init(ctx, dest);
      retroLoungePiano.setDestination(dest);

      tokyoMorningBossaGuitar.init(ctx, dest);
      tokyoMorningBossaGuitar.setDestination(dest);

      shibuyaDaylightWoodBass.init(ctx, dest);
      shibuyaDaylightWoodBass.setDestination(dest);

      shibuyaSynthBrass.init(ctx, dest);
      shibuyaSynthBrass.setDestination(dest);

      shibuyaSaxophone.init(ctx, dest);
      shibuyaSaxophone.setDestination(dest);

      aquaBubbleChords.init(ctx, dest);
      aquaBubbleChords.setDestination(dest);

      raindropMelody.init(ctx, dest);
      raindropMelody.setDestination(dest);

      electroHealing.init(ctx, dest);
      electroHealing.setDestination(dest);
      
      // オルゴール音源の初期化＆サウンドラボ出力へ接続
      retroMusicBox.init(ctx, dest);
      retroMusicBox.setDestination(dest);
    } catch (e) {
      console.warn('Failed to initialize engines for SoundLab:', e);
    }
  };

  // 音量変更
  useEffect(() => {
    const ctx = localAudioCtxRef.current || audioCtx;
    if (masterGainRef.current && ctx) {
      masterGainRef.current.gain.setTargetAtTime(labVolume / 100, ctx.currentTime, 0.05);
    }
  }, [labVolume, audioCtx]);

  // 音源プリセット変更時のエンジン再初期化＆再接続
  useEffect(() => {
    const ctx = localAudioCtxRef.current || audioCtx;
    if (ctx) {
      initEngines(ctx);
    }
  }, [currentSlot.channel]);

  // クリーンアップ / 停止
  const stopAudition = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
    setCurrentBar(0);
    stepCountRef.current = 0;

    // オルゴール発音の停止
    try {
      retroMusicBox.stopAll();
    } catch (e) {}

    // ラジオ本体側が使用する音源バス（bassFilter）へ戻しておく
    const ctx = localAudioCtxRef.current || audioCtx;
    if (ctx && bassFilter) {
      try {
        acousticJazzDrums.setDestination(bassFilter);
        toneDrumKit.setDestination(bassFilter);
        retroLoungePiano.setDestination(bassFilter);
        tokyoMorningBossaGuitar.setDestination(bassFilter);
        shibuyaDaylightWoodBass.setDestination(bassFilter);
        shibuyaSynthBrass.setDestination(bassFilter);
        shibuyaSaxophone.setDestination(bassFilter);
        aquaBubbleChords.setDestination(bassFilter);
        raindropMelody.setDestination(bassFilter);
        electroHealing.setDestination(bassFilter);
        retroMusicBox.setDestination(bassFilter);
      } catch (e) {}
    }
  };

  useEffect(() => {
    return () => {
      stopAudition();
    };
  }, []);

  // ノート指定（周波数数値、MIDIノート番号、"C4"などの音名表記）を周波数(Hz)に変換
  const parseNoteToPitch = (noteVal: any): number | null => {
    if (typeof noteVal === 'number' && !isNaN(noteVal) && noteVal > 0) {
      if (noteVal >= 100) return noteVal; // 周波数Hzと判定
      if (noteVal >= 12 && noteVal <= 127) { // MIDIノート番号と判定
        return 440 * Math.pow(2, (noteVal - 69) / 12);
      }
    }
    if (typeof noteVal === 'string') {
      const match = noteVal.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
      if (match) {
        const name = match[1].toUpperCase();
        const accidental = match[2];
        const octave = parseInt(match[3], 10);
        const semitoneMap: Record<string, number> = {
          C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
          'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
        };
        const key = name + accidental;
        const semitone = semitoneMap[key] !== undefined ? semitoneMap[key] : semitoneMap[name];
        if (semitone !== undefined) {
          const midi = (octave + 1) * 12 + semitone;
          return 440 * Math.pow(2, (midi - 69) / 12);
        }
      }
    }
    return null;
  };

  // 各音源チャンネルの固有レンジ（FMラジオ本編と完全同一の最適帯域）へ調音
  const fitPitchToChannelRange = (pitch: number, ch: SoundLabChannel): number => {
    let p = pitch;
    let minHz = 240;
    let maxHz = 620;

    switch (ch) {
      case 'ambient':
        // 76.0MHz ELECTRO HEALING: 哀愁と包容力に満ちた東洋的シルクロード・リード（240Hz〜620Hz）
        minHz = 240;
        maxHz = 620;
        break;
      case 'guitar':
        // 88.1MHz TOKYO MORNING BOSSA: アコースティックギター（220Hz〜660Hz）
        minHz = 220;
        maxHz = 660;
        break;
      case 'sax':
        // 92.4MHz SHIBUYA GROOVE: 艶やかなサックス（196Hz〜660Hz）
        minHz = 196;
        maxHz = 660;
        break;
      case 'musicbox':
        // 97.5MHz 秋葉原オルゴール: 昭和レトロオルゴール澄明帯域（350Hz〜1050Hz）
        minHz = 350;
        maxHz = 1050;
        break;
      case 'piano':
        // 101.5MHz 銀座ピアノ: 歌うピアノ＆エレピ中高域（440Hz〜1200Hz）
        minHz = 440;
        maxHz = 1200;
        break;
      case 'raindrop':
        // 105.8MHz 六本木アクア: 水滴マリンバ（440Hz〜1320Hz）
        minHz = 440;
        maxHz = 1320;
        break;
      default:
        minHz = 260;
        maxHz = 750;
        break;
    }

    while (p < minHz) p *= 2;
    while (p > maxHz) p *= 0.5;
    return p;
  };

  // メロディ生成ウォーカー状態（FMラジオ放送と同様の滑らかで歌う旋律線エンジン）
  const melodyWalkerRef = useRef<{
    scaleIdx: number;
    direction: 1 | -1;
    sameDirCount: number;
    minDirSteps: number;
    history: number[];
  }>({
    scaleIdx: 3,
    direction: 1,
    sameDirCount: 0,
    minDirSteps: 2,
    history: []
  });

  // スロットのスケール定義と和音から、ユーザー定義メロディを正確に再現するピッチ決定
  const resolveMelodyPitch = (
    slot: SoundSlotPattern,
    currentChord: ChordNoteData,
    melodyTrigger: RhythmStepTrigger,
    step16: number,
    _barIndex: number,
    melodyCh: SoundLabChannel
  ): number => {
    const scale = slot.melodyScale && slot.melodyScale.length > 0 ? slot.melodyScale : null;
    const chordNotes = currentChord.notes || [];

    // 0. 明示的なランダム・即興生成指定 (random: true または randomWalk: true)
    if (melodyTrigger.random === true || melodyTrigger.randomWalk === true) {
      if (scale && scale.length > 0) {
        const state = melodyWalkerRef.current;
        const scaleLen = scale.length;

        // ドビュッシー風水滴ランダムウォーク: 自然な隣接進行(55%)と3度〜4度の跳躍(45%)
        const r = Math.random();
        const stepDist = r < 0.55 ? 1 : (r < 0.85 ? 2 : 3);
        if (Math.random() < 0.45) {
          state.direction = (state.direction * -1) as (1 | -1);
        }

        let nextIdx = state.scaleIdx + state.direction * stepDist;
        if (nextIdx >= scaleLen) {
          nextIdx = scaleLen - (Math.random() < 0.5 ? 1 : 2);
          state.direction = -1;
        } else if (nextIdx < 0) {
          nextIdx = (Math.random() < 0.5 ? 0 : 1);
          state.direction = 1;
        }
        state.scaleIdx = Math.max(0, Math.min(scaleLen - 1, nextIdx));

        let chosenPitch = scale[state.scaleIdx];

        // 現コードとの完全協和チェック（濁る短2度・短9度を排除）
        if (chordNotes.length > 0) {
          const isDissonant = (p: number) => {
            return chordNotes.some((chordPitch) => {
              const semitones = Math.abs(12 * Math.log2(p / chordPitch));
              const semitoneMod = Math.round(semitones) % 12;
              const diffFromSemitone = Math.abs(semitones - Math.round(semitones));
              return (semitoneMod === 1 || semitoneMod === 11) && diffFromSemitone < 0.25;
            });
          };

          if (isDissonant(chosenPitch)) {
            for (const offset of [1, -1, 2, -2, 3, -3]) {
              const altIdx = Math.max(0, Math.min(scaleLen - 1, state.scaleIdx + offset));
              const altPitch = scale[altIdx];
              if (!isDissonant(altPitch)) {
                chosenPitch = altPitch;
                state.scaleIdx = altIdx;
                break;
              }
            }
          }
        }

        return fitPitchToChannelRange(chosenPitch, melodyCh);
      }
    }

    // 0.1 候補音名プール (notes: string[]) からのランダム選定
    if (Array.isArray(melodyTrigger.notes) && melodyTrigger.notes.length > 0) {
      const chosen = melodyTrigger.notes[Math.floor(Math.random() * melodyTrigger.notes.length)];
      const parsed = parseNoteToPitch(chosen);
      if (parsed !== null) return fitPitchToChannelRange(parsed, melodyCh);
    }

    // 1. 明示的なピッチ周波数直接指定 (pitch: number)
    if (typeof (melodyTrigger as any).pitch === 'number' && (melodyTrigger as any).pitch > 0) {
      return fitPitchToChannelRange((melodyTrigger as any).pitch, melodyCh);
    }

    // 2. 明示的なノート指定 (note: MIDI番号 または "C4" 音名文字列)
    if ((melodyTrigger as any).note !== undefined) {
      const parsed = parseNoteToPitch((melodyTrigger as any).note);
      if (parsed !== null) return fitPitchToChannelRange(parsed, melodyCh);
    }

    // 3. 明示的なスケール音番号指定 (scaleIndex)
    if (scale && typeof (melodyTrigger as any).scaleIndex === 'number') {
      const sIdx = Math.abs(Math.floor((melodyTrigger as any).scaleIndex)) % scale.length;
      return fitPitchToChannelRange(scale[sIdx], melodyCh);
    }

    // 4. pitchOffset が指定されている場合（カートリッジのメロディー定義）
    // 例: pitchOffset = 2 (オクターブ上), 1 (同音), 1.498 (5度), 2.247 (9th) など
    if (melodyTrigger.pitchOffset !== undefined && melodyTrigger.pitchOffset > 0) {
      const rootBase = currentChord.bass || (currentChord.notes && currentChord.notes[0]) || 220;
      let calculatedPitch = rootBase * melodyTrigger.pitchOffset;

      // もしスロットにスケール定義があれば、最も近いスケール音（オクターブ展開含む）にスナップさせて調性を完璧に保つ
      if (scale && scale.length > 0) {
        let bestPitch = scale[0];
        let minDiff = Infinity;
        for (const sNote of scale) {
          for (const mult of [0.5, 1.0, 2.0, 4.0]) {
            const candidate = sNote * mult;
            const diff = Math.abs(Math.log2(candidate / calculatedPitch));
            if (diff < minDiff) {
              minDiff = diff;
              bestPitch = candidate;
            }
          }
        }
        if (minDiff < 0.25) {
          calculatedPitch = bestPitch;
        }
      }

      return fitPitchToChannelRange(calculatedPitch, melodyCh);
    }

    // 5. コード構成音
    if (chordNotes.length > 0) {
      const idx = (step16 / 2) % chordNotes.length;
      return fitPitchToChannelRange(chordNotes[Math.floor(idx)], melodyCh);
    }

    // 6. スロットに melodyScale があり、ステップに一切音程指定がない場合のフォールバック（FMラジオ風ランダムウォーカー）
    if (scale && scale.length > 0) {
      const state = melodyWalkerRef.current;
      const scaleLen = scale.length;

      if (state.direction === 1 && state.scaleIdx >= scaleLen - 1) {
        state.direction = -1;
        state.sameDirCount = 0;
        state.minDirSteps = Math.floor(Math.random() * 3) + 2;
      } else if (state.direction === -1 && state.scaleIdx <= 0) {
        state.direction = 1;
        state.sameDirCount = 0;
        state.minDirSteps = Math.floor(Math.random() * 3) + 2;
      } else if (state.sameDirCount >= state.minDirSteps && Math.random() < 0.35) {
        state.direction = (state.direction * -1) as (1 | -1);
        state.sameDirCount = 0;
        state.minDirSteps = Math.floor(Math.random() * 3) + 2;
      }

      const stepDist = Math.random() < 0.20 ? 2 : 1;
      let nextIdx = state.scaleIdx + state.direction * stepDist;

      if (nextIdx >= scaleLen) {
        nextIdx = scaleLen - 1;
        state.direction = -1;
      } else if (nextIdx < 0) {
        nextIdx = 0;
        state.direction = 1;
      }

      state.scaleIdx = nextIdx;
      state.sameDirCount += 1;
      state.history.push(nextIdx);
      if (state.history.length > 8) state.history.shift();

      let chosenPitch = scale[nextIdx];

      if (chordNotes.length > 0) {
        const isDissonant = (p: number) => {
          return chordNotes.some((chordPitch) => {
            const semitones = Math.abs(12 * Math.log2(p / chordPitch));
            const semitoneMod = Math.round(semitones) % 12;
            const diffFromSemitone = Math.abs(semitones - Math.round(semitones));
            return (semitoneMod === 1 || semitoneMod === 11) && diffFromSemitone < 0.25;
          });
        };

        if (isDissonant(chosenPitch)) {
          for (const offset of [1, -1, 2, -2]) {
            const altIdx = Math.max(0, Math.min(scaleLen - 1, nextIdx + offset));
            const altPitch = scale[altIdx];
            if (!isDissonant(altPitch)) {
              chosenPitch = altPitch;
              state.scaleIdx = altIdx;
              break;
            }
          }
        }
      }

      return fitPitchToChannelRange(chosenPitch, melodyCh);
    }

    // 7. ベース音基準
    if (currentChord.bass) {
      return fitPitchToChannelRange(currentChord.bass * 2, melodyCh);
    }

    return fitPitchToChannelRange(440, melodyCh);
  };

  // ════════════════════════════════════════════════════════════════
  // 0. 外部スロット・演奏データカートリッジ 1ステップ演奏ロジック
  // ════════════════════════════════════════════════════════════════
  const playCartridgeStep = (ctx: AudioContext, step16: number, barIndex: number) => {
    const slot = currentSlotRef.current;
    if (!slot || !slot.chords.length) return;

    const currentChord = slot.chords[barIndex % slot.chords.length];
    const now = ctx.currentTime;

    // パート別の音源チャンネル（個別指定があれば優先、なければマスターチャンネル）
    const bassCh = (slot.partChannels?.bass || slot.channel) as SoundLabChannel;
    const chordCh = (slot.partChannels?.chords || slot.channel) as SoundLabChannel;
    const melodyCh = (slot.partChannels?.melody || slot.channel) as SoundLabChannel;

    // パート別ミュート判定
    const isBassMuted = slot.partMutes?.bass === true;
    const isChordMuted = slot.partMutes?.chords === true;
    const isMelodyMuted = slot.partMutes?.melody === true;

    // 小節頭（ステップ0）でコードが切り替わるとき、アンビエントパッドの不要な残響を速やかに解放
    if (step16 === 0) {
      electroHealing.fadePadChords(now, 0.15);
    }

    // 1. ベース発音（和音との不協和音・唸りを防ぐ専用低音調音）
    if (!isBassMuted) {
      const bassTrigger = slot.bassSteps.find(b => b.step === step16);
      if (bassTrigger && currentChord.bass) {
        let basePitch = currentChord.bass * (bassTrigger.pitchOffset || 1.0);

        // 各音源チャンネルの最適ベース帯域にクランプ（FMラジオ本編と同一基準）
        if (bassCh === 'ambient') {
          // 76.0MHz (ELECTRO HEALING): 40Hz〜85Hz（大地のように深く響くサブ低音ドローン）
          while (basePitch < 40) basePitch *= 2;
          while (basePitch > 85) basePitch *= 0.5;
        } else if (bassCh === 'musicbox') {
          // 97.5MHz (秋葉原オルゴール): 110Hz〜260Hz（可聴域の穏やかな低音弁）
          while (basePitch < 110) basePitch *= 2;
          while (basePitch > 260) basePitch *= 0.5;
        } else {
          // 88.1 / 92.4 / 101.5 / 105.8: 41Hz〜160Hz（アコースティック・ウッドベースの自然なピチカート帯域）
          while (basePitch < 41) basePitch *= 2;
          while (basePitch > 160) basePitch *= 0.5;
        }

        const vol = (bassTrigger.velocity ?? 0.85);
        const dur = bassTrigger.duration ?? 0.8;
        triggerSoundBass(bassCh, basePitch, vol, dur, now);
      }
    }

    // 2. 和音発音（コード演奏 / 分散和音アルペジオ）
    if (!isChordMuted) {
      const chordTrigger = slot.chordSteps.find(c => c.step === step16);
      if (chordTrigger && currentChord.notes?.length) {
        const vol = chordTrigger.velocity ?? 0.75;
        const dur = chordTrigger.duration ?? 0.5;
        const stagger = chordTrigger.stagger ?? 0.015;

        // 和音構成音の周波数配列を昇順に整音
        let voicedNotes = [...currentChord.notes].sort((a, b) => a - b);
        // 和音全体が過度に低音（140Hz未満）の場合のみ全体をオクターブ上げて調音関係を保つ
        while (Math.min(...voicedNotes) < 140) {
          voicedNotes = voicedNotes.map(n => n * 2);
        }

        // コードの分散和音（アルペジオ）指定 (noteIndex) または一括和音発音
        if (typeof chordTrigger.noteIndex === 'number') {
          const rawIdx = chordTrigger.noteIndex;
          const idx = Math.abs(Math.floor(rawIdx)) % voicedNotes.length;
          const oct = chordTrigger.octaveShift ?? 0;
          const singlePitch = voicedNotes[idx] * Math.pow(2, oct);
          triggerSoundChord(chordCh, [singlePitch], vol, dur, 0, now);
        } else if (Array.isArray(chordTrigger.noteIndices) && chordTrigger.noteIndices.length > 0) {
          const selectedPitches = chordTrigger.noteIndices.map((i: number) => {
            const idx = Math.abs(Math.floor(i)) % voicedNotes.length;
            return voicedNotes[idx];
          });
          triggerSoundChord(chordCh, selectedPitches, vol, dur, stagger, now);
        } else {
          // 従来の全音一括和音発音
          triggerSoundChord(chordCh, voicedNotes, vol, dur, stagger, now);
        }
      }
    }

    // 3. メロディ発音
    if (!isMelodyMuted) {
      const melodyTrigger = slot.melodySteps.find(m => m.step === step16);
      if (melodyTrigger) {
        // 確率的発音チェック（雨の滴のように不規則に舞い落ちる）
        let shouldPlay = true;
        if (typeof melodyTrigger.probability === 'number') {
          if (Math.random() > melodyTrigger.probability) {
            shouldPlay = false;
          }
        }

        if (shouldPlay) {
          let vol = melodyTrigger.velocity ?? 0.8;
          let dur = melodyTrigger.duration ?? 0.5;
          let pitch = resolveMelodyPitch(slot, currentChord, melodyTrigger, step16, barIndex, melodyCh);

          // raindrop (水滴) やランダム演奏時のオーガニックなゆらぎ (ベロシティと持続時間)
          if (melodyTrigger.random || melodyCh === 'raindrop') {
            const velJitter = 0.85 + Math.random() * 0.30;
            vol = Math.max(0.2, Math.min(1.0, vol * velJitter));
            const durJitter = 0.85 + Math.random() * 0.30;
            dur = Math.max(0.1, dur * durJitter);

            // きらめく水滴のオクターブ跳躍（isSparkle指定またはランダム確率18%）
            if (melodyTrigger.isSparkle || (melodyCh === 'raindrop' && Math.random() < 0.18)) {
              if (pitch * 2 <= 1400) {
                pitch *= 2;
              }
            }
          }

          triggerSoundNote(melodyCh, pitch, Math.min(1.0, vol * 1.12), dur, now);
        }
      }
    }

    // 4. ドラム・鐘の音発音 (秋葉原オルゴール 'musicbox' では一切ドラムを発音しない)
    const isMusicBox = slot.channel === 'musicbox' || slot.partChannels?.melody === 'musicbox';
    const isDrumsMuted = slot.partMutes?.drums === true || isMusicBox;
    if (!isDrumsMuted && slot.drumSteps && slot.drumSteps.length > 0) {
      const drumTriggers = slot.drumSteps.filter(d => d.step === step16);
      const isAcousticOrLofi = slot.channel === 'piano' || slot.channel === 'raindrop' || slot.channel === 'guitar' || slot.channel === 'ambient';
      drumTriggers.forEach(d => {
        const dVol = d.velocity ?? 0.75;
        if (d.type === 'kick') {
          if (isAcousticOrLofi) {
            acousticJazzDrums.triggerKick(dVol, now);
          } else {
            toneDrumKit.triggerKick(dVol, now);
          }
        } else if (d.type === 'snare') {
          if (isAcousticOrLofi) {
            acousticJazzDrums.triggerSnare(dVol, now);
          } else {
            toneDrumKit.triggerSnare(dVol, now);
          }
        } else if (d.type === 'hihat_closed' || d.type === 'hihat') {
          if (isAcousticOrLofi) {
            acousticJazzDrums.triggerHiHat(dVol, false, now);
          } else {
            toneDrumKit.triggerHiHat(dVol, false, now);
          }
        } else if (d.type === 'hihat_open') {
          if (isAcousticOrLofi) {
            acousticJazzDrums.triggerHiHat(dVol, true, now);
          } else {
            toneDrumKit.triggerHiHat(dVol, true, now);
          }
        } else if (d.type === 'taiko' || d.type === 'deepTaiko') {
          // 和太鼓（深い木胴の打音）
          electroHealing.triggerTaiko(dVol, now);
        } else if (d.type === 'templeGong' || d.type === 'gong') {
          // 寺院の鐘（梵鐘 110Hz）: 厳かな低音の鐘の響き
          electroHealing.triggerBell('templeGong', dVol * 0.95, now);
        } else if (d.type === 'singingBowl' || d.type === 'rin') {
          // チベットシンギングボウル・おりん（528Hz）: 透明な倍音
          electroHealing.triggerBell('singingBowl', dVol * 0.9, now);
        } else if (d.type === 'windChime' || d.type === 'chime') {
          // 風鈴 / クリスタルチャイム（1320Hz）
          electroHealing.triggerBell('windChime', dVol * 0.85, now);
        } else if (d.type === 'oceanChime' || d.type === 'seaDrop') {
          // 碧海水滴・クリスタルベル
          electroHealing.triggerBell('seaDrop', dVol * 0.85, now);
        } else if (d.type === 'bell') {
          // 鐘の音: 4小節に1回の小節頭(0)では厳かな寺院の梵鐘(templeGong)、その他は澄み渡るおりん(singingBowl)
          const isGong = (barIndex % 4 === 0 && step16 === 0);
          if (isGong) {
            electroHealing.triggerBell('templeGong', dVol * 0.95, now);
          } else {
            electroHealing.triggerBell('singingBowl', dVol * 0.85, now);
          }
        }
      });
    }
  };

  // ════════════════════════════════════════════════════════════════
  // 1. ループタイマーの開始 (Audition Start)
  // ════════════════════════════════════════════════════════════════
  const startAudition = async () => {
    let ctx = audioCtx || localAudioCtxRef.current;
    if (!ctx && onEnsureAudioContext) {
      ctx = onEnsureAudioContext();
    }
    if (!ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AudioCtx();
    }
    localAudioCtxRef.current = ctx;

    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      try {
        await ctx.resume();
      } catch (e) {}
    }

    try {
      if (Tone.getContext().rawContext !== ctx) {
        Tone.setContext(ctx);
      }
      await Tone.start();
    } catch (e) {}

    initEngines(ctx);

    setIsPlaying(true);
    stepCountRef.current = 0;

    const sLen = currentSlotRef.current.melodyScale?.length || 8;
    melodyWalkerRef.current = {
      scaleIdx: Math.floor(sLen / 2),
      direction: 1,
      sameDirCount: 0,
      minDirSteps: 2,
      history: []
    };

    const currentBpm = currentSlotRef.current.bpm;
    const stepDurationMs = (15 / currentBpm) * 1000;

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      const activeCtx = localAudioCtxRef.current || audioCtx;
      if (!activeCtx) return;

      const numBars = currentSlotRef.current.chords.length || 4;

      const totalSteps = stepCountRef.current;
      const step16 = totalSteps % 16;
      const barIdx = Math.floor(totalSteps / 16) % numBars;

      setCurrentStep(step16);
      setCurrentBar(barIdx);

      playCartridgeStep(activeCtx, step16, barIdx);

      stepCountRef.current = (totalSteps + 1) % (16 * numBars);
    }, stepDurationMs);
  };

  // BPM変更時のタイマー追従
  useEffect(() => {
    if (isPlayingRef.current && timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      const currentBpm = currentSlot.bpm;
      const stepDurationMs = (15 / currentBpm) * 1000;
      timerRef.current = window.setInterval(() => {
        const activeCtx = localAudioCtxRef.current || audioCtx;
        if (!activeCtx) return;

        const numBars = currentSlotRef.current.chords.length || 4;

        const totalSteps = stepCountRef.current;
        const step16 = totalSteps % 16;
        const barIdx = Math.floor(totalSteps / 16) % numBars;

        setCurrentStep(step16);
        setCurrentBar(barIdx);

        playCartridgeStep(activeCtx, step16, barIdx);

        stepCountRef.current = (totalSteps + 1) % (16 * numBars);
      }, stepDurationMs);
    }
  }, [currentSlot.bpm]);

  const togglePlay = () => {
    if (isPlaying) {
      stopAudition();
    } else {
      startAudition();
    }
  };

  return (
    <div className="space-y-4 font-sans text-stone-200">
      {/* 1. ヘッダー & ボリュームバー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-lg gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold font-mono text-xs flex items-center gap-1.5">
            💾 JSON演奏データ読込・再生 (JSON Sound Player)
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
            7 CHANNELS READY
          </span>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          {isMainRadioPlaying && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-400 text-[10px] font-mono">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>本番ラジオ放送中 (同時視聴可能)</span>
            </div>
          )}

          {/* 音量スライダー */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Volume2 className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-400 text-[11px]">Lab Vol:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={labVolume}
              onChange={(e) => setLabVolume(parseInt(e.target.value, 10))}
              className="w-20 sm:w-24 accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
            />
            <span className="w-7 text-right font-bold text-stone-300 text-[11px]">{labVolume}%</span>
          </div>
        </div>
      </div>

      {/* 2. 外部演奏カートリッジ・スロット管理環境 (Cartridge Lab) */}
      <SlotCartridgeManager
        currentSlot={currentSlot}
        onLoadSlot={(newSlot) => {
          setCurrentSlot(newSlot);
          currentSlotRef.current = newSlot;
          const ctx = localAudioCtxRef.current || audioCtx;
          if (ctx) {
            initEngines(ctx);
          }
          const sLen = newSlot.melodyScale?.length || 8;
          melodyWalkerRef.current = {
            scaleIdx: Math.floor(sLen / 2),
            direction: 1,
            sameDirCount: 0,
            minDirSteps: 2,
            history: []
          };
          // 再生中の場合は即座に新しいBPMとコード構成でシームレスに同期再スタート
          if (isPlayingRef.current && ctx) {
            if (timerRef.current !== null) {
              window.clearInterval(timerRef.current);
            }
            stepCountRef.current = 0;
            setCurrentStep(0);
            setCurrentBar(0);
            const newBpm = newSlot.bpm || 80;
            const stepDurationMs = (15 / newBpm) * 1000;
            timerRef.current = window.setInterval(() => {
              const activeCtx = localAudioCtxRef.current || audioCtx;
              if (!activeCtx) return;
              const numBars = currentSlotRef.current.chords?.length || 4;
              const totalSteps = stepCountRef.current;
              const step16 = totalSteps % 16;
              const barIdx = Math.floor(totalSteps / 16) % numBars;
              setCurrentStep(step16);
              setCurrentBar(barIdx);
              playCartridgeStep(activeCtx, step16, barIdx);
              stepCountRef.current = (totalSteps + 1) % (16 * numBars);
            }, stepDurationMs);
          }
        }}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        currentStep={currentStep}
        currentBar={currentBar}
      />
    </div>
  );
}
