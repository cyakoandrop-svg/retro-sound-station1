import * as Tone from 'tone';

/**
 * 88.1MHz「TOKYO morning bossa」専用 アコースティック・ギター音源エンジン
 * (Tone.js公式サンプラー音源 [nbrosowsky/tonejs-instruments] ＋ リアルタイム・アコースティックギター合成)
 */

export interface TokyoMorningBossaGuitarConfig {
  guitar: {
    volume: number;
    attack: number;
    release: number;
    bodyResonanceFreq: number;
    presenceFreq: number;
    airSparkleFreq: number;
  };
  room: {
    enabled: boolean;
    reverbDecay: number;
    preDelay: number;
    wet: number;
  };
  dsp: {
    masterVolume: number;
    lowCut: number;
  };
}

export const DEFAULT_TOKYO_MORNING_BOSSA_GUITAR_CONFIG: TokyoMorningBossaGuitarConfig = {
  guitar: {
    volume: 0.85,
    attack: 0.003,
    release: 0.55,
    bodyResonanceFreq: 380,
    presenceFreq: 3400,
    airSparkleFreq: 7500,
  },
  room: {
    enabled: true,
    reverbDecay: 1.2,
    preDelay: 0.004,
    wet: 0.16,
  },
  dsp: {
    masterVolume: 0.0,
    lowCut: 90,
  },
};

class TokyoMorningBossaGuitarEngine {
  private config: TokyoMorningBossaGuitarConfig = { ...DEFAULT_TOKYO_MORNING_BOSSA_GUITAR_CONFIG };
  private isInitialized = false;
  private rawContext: AudioContext | null = null;

  // Tone.js Sampler for acoustic guitar
  private guitarSampler: Tone.Sampler | null = null;
  private samplerLoaded = false;

  // Audio Routing Nodes
  private guitarBus: Tone.Gain | null = null;
  private roomBus: Tone.Gain | null = null;
  private roomReverb: Tone.Reverb | null = null;
  private reverbDampFilter: Tone.Filter | null = null;
  private dspLowCut: Tone.Filter | null = null;
  private masterOutput: Tone.Gain | null = null;
  private destinationNode: AudioNode | null = null;

  /**
   * 出力先オーディオノードの動的切り替え（サウンドラボ／ラジオ本体バスへの接続変更）
   */
  public setDestination(node: AudioNode) {
    this.destinationNode = node;
    if (this.masterOutput) {
      try {
        this.masterOutput.disconnect();
        Tone.connect(this.masterOutput, node);
      } catch (e) {
        console.warn('tokyoMorningBossaGuitar setDestination warning:', e);
      }
    }
  }

  public init(audioCtx: AudioContext, destinationNode?: AudioNode) {
    if (destinationNode) {
      this.setDestination(destinationNode);
    }
    if (this.isInitialized && this.rawContext === audioCtx) return;

    this.rawContext = audioCtx;
    const conf = this.config;

    try {
      if (Tone.getContext().rawContext !== audioCtx) {
        Tone.setContext(audioCtx);
      }

      this.guitarBus = new Tone.Gain(1.0);
      this.roomBus = new Tone.Gain(1.0);

      // tonejs-instruments公式のguitar-acousticサンプラーを読み込み
      if (!this.guitarSampler) {
        this.guitarSampler = new Tone.Sampler({
          urls: {
            "F4": "F4.mp3",
            "F#2": "Fs2.mp3",
            "F#3": "Fs3.mp3",
            "F#4": "Fs4.mp3",
            "G2": "G2.mp3",
            "G3": "G3.mp3",
            "G4": "G4.mp3",
            "G#2": "Gs2.mp3",
            "G#3": "Gs3.mp3",
            "G#4": "Gs4.mp3",
            "A2": "A2.mp3",
            "A3": "A3.mp3",
            "A4": "A4.mp3",
            "A#2": "As2.mp3",
            "A#3": "As3.mp3",
            "A#4": "As4.mp3",
            "B2": "B2.mp3",
            "B3": "B3.mp3",
            "B4": "B4.mp3",
            "C3": "C3.mp3",
            "C4": "C4.mp3",
            "C5": "C5.mp3",
            "C#3": "Cs3.mp3",
            "C#4": "Cs4.mp3",
            "C#5": "Cs5.mp3",
            "D2": "D2.mp3",
            "D3": "D3.mp3",
            "D4": "D4.mp3",
            "D5": "D5.mp3",
            "D#2": "Ds2.mp3",
            "D#3": "Ds3.mp3",
            "E2": "E2.mp3",
            "E3": "E3.mp3",
            "E4": "E4.mp3",
            "F2": "F2.mp3",
            "F3": "F3.mp3"
          },
          baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
          onload: () => {
            this.samplerLoaded = true;
            try {
              const buffersMap = (this.guitarSampler as any)?._buffers?._buffers;
              if (buffersMap instanceof Map) {
                buffersMap.forEach((toneBuf: any, key: any) => {
                  if (!toneBuf) return;
                  const rawBuf = toneBuf.get?.() as AudioBuffer | undefined;
                  if (!rawBuf) return;
                  const channelData = rawBuf.getChannelData(0);
                  let maxVal = 0;
                  const checkLimit = Math.min(channelData.length, Math.floor(rawBuf.sampleRate * 0.12));
                  for (let i = 0; i < checkLimit; i++) {
                    const v = Math.abs(channelData[i]);
                    if (v > maxVal) maxVal = v;
                  }
                  if (maxVal < 0.001) return;
                  const thresh = maxVal * 0.05;
                  let startSample = 0;
                  for (let i = 0; i < checkLimit; i++) {
                    if (Math.abs(channelData[i]) > thresh) {
                      startSample = Math.max(0, i - Math.floor(rawBuf.sampleRate * 0.001));
                      break;
                    }
                  }
                  if (startSample > 0 && typeof toneBuf.slice === 'function') {
                    const startTimeSec = startSample / rawBuf.sampleRate;
                    const sliced = toneBuf.slice(startTimeSec, toneBuf.duration);
                    buffersMap.set(key, sliced);
                  }
                });
              }
            } catch (err) {
              console.warn('Trim guitar sample leading silence error:', err);
            }
            console.log("🎸 88.1chアコースティックギター音源（tonejs-instrumentsサンプラー）の読み込み・アタック補正完了！");
          }
        });
        
        // ギターバスへルーティング
        if (this.guitarBus) {
          this.guitarSampler.connect(this.guitarBus);
        }
      }

      // 1. カフェ・ルームリバーブ
      if (conf.room.enabled) {
        this.roomReverb = new Tone.Reverb({
          decay: conf.room.reverbDecay,
          preDelay: conf.room.preDelay,
          wet: conf.room.wet,
        });

        this.reverbDampFilter = new Tone.Filter({
          frequency: 8000,
          type: 'lowpass',
        });

        this.guitarBus.connect(this.roomReverb);
        this.roomReverb.connect(this.reverbDampFilter);
        this.reverbDampFilter.connect(this.roomBus);
      } else {
        this.guitarBus.connect(this.roomBus);
      }

      // 2. ローカットDSP
      this.dspLowCut = new Tone.Filter({
        frequency: conf.dsp.lowCut,
        type: 'highpass',
        rolloff: -12,
      });

      this.masterOutput = new Tone.Gain(Tone.dbToGain(conf.dsp.masterVolume));

      this.roomBus.connect(this.dspLowCut);
      this.dspLowCut.connect(this.masterOutput);

      const targetDest = destinationNode || this.destinationNode;
      if (targetDest) {
        Tone.connect(this.masterOutput, targetDest);
      } else {
        this.masterOutput.toDestination();
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('TokyoMorningBossaGuitarEngine init warning:', e);
    }
  }

  /**
   * チャンネル変更や演奏停止時、すべての発音・余韻を即座に完全遮断
   */
  private ensureActive(now: number) {
    if (this.masterOutput && this.masterOutput.gain.value < 0.01) {
      try {
        const targetGain = Tone.dbToGain(this.config.dsp.masterVolume);
        this.masterOutput.gain.cancelScheduledValues(now);
        this.masterOutput.gain.setValueAtTime(Math.max(this.masterOutput.gain.value, 0.0001), now);
        this.masterOutput.gain.linearRampToValueAtTime(targetGain, now + 0.015);
      } catch (e) {}
    }
  }

  public stopAll() {
    try {
      this.guitarSampler?.releaseAll();
      if (this.masterOutput) {
        const now = Tone.now();
        const curr = this.masterOutput.gain.value;
        this.masterOutput.gain.cancelScheduledValues(now);
        this.masterOutput.gain.setValueAtTime(Math.max(curr, 0.0001), now);
        this.masterOutput.gain.linearRampToValueAtTime(0.0001, now + 0.02);
      }
    } catch (e) {}
  }

  /**
   * 周波数をTone.jsのノート名（例: "C4", "F#3"）に変換
   */
  private freqToNoteName(freq: number): string {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    const noteName = notes[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${noteName}${octave}`;
  }

  /**
   * Web Audio API によるアコースティックギター弦物理モデリング（サンプラー読み込み前または併用）
   */
  private triggerSynthesizedGuitar(freq: number, volume: number, duration: number, time: number) {
    if (!this.rawContext) return;
    const ctx = this.rawContext;
    const startTime = time;

    // 1. 基音（Triangle波形: アコースティックギター弦のピッキング）
    const oscFund = ctx.createOscillator();
    oscFund.type = 'triangle';
    oscFund.frequency.setValueAtTime(freq * 1.008, startTime);
    oscFund.frequency.exponentialRampToValueAtTime(freq, startTime + 0.025);

    // 2. 高次倍音（Sine波形: 明るいスチール弦・ナイロン弦の鳴り）
    const oscHarm = ctx.createOscillator();
    oscHarm.type = 'sine';
    oscHarm.frequency.setValueAtTime(freq * 2.001, startTime);

    // 3. 指先・ピックのアタックノイズ
    const pickBufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.008));
    const pickBuffer = ctx.createBuffer(1, pickBufferSize, ctx.sampleRate);
    const pickData = pickBuffer.getChannelData(0);
    for (let i = 0; i < pickBufferSize; i++) {
      pickData[i] = (Math.random() * 2 - 1) * (1 - i / pickBufferSize);
    }
    const pickSource = ctx.createBufferSource();
    pickSource.buffer = pickBuffer;

    const pickFilter = ctx.createBiquadFilter();
    pickFilter.type = 'bandpass';
    pickFilter.frequency.setValueAtTime(2200, startTime);
    pickFilter.Q.setValueAtTime(2.2, startTime);

    const pickGain = ctx.createGain();
    const pVol = Math.max(0.0001, volume * 0.35);
    pickGain.gain.setValueAtTime(0.0001, startTime);
    pickGain.gain.linearRampToValueAtTime(pVol, startTime + 0.002);
    pickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.012);

    pickSource.connect(pickFilter);
    pickFilter.connect(pickGain);

    // 4. アコースティック木製ボディ共鳴
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.setValueAtTime(3200, startTime);
    bodyFilter.frequency.exponentialRampToValueAtTime(1600, startTime + duration * 0.6);

    const noteGain = ctx.createGain();
    const peakVol = Math.max(0.0001, volume * 0.7);
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(peakVol, startTime + 0.004);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscFund.connect(bodyFilter);
    oscHarm.connect(bodyFilter);
    pickGain.connect(bodyFilter);
    bodyFilter.connect(noteGain);

    if (this.guitarBus) {
      Tone.connect(noteGain, this.guitarBus);
    } else {
      noteGain.connect(ctx.destination);
    }

    pickSource.start(startTime);
    oscFund.start(startTime);
    oscHarm.start(startTime);

    oscFund.stop(startTime + duration + 0.05);
    oscHarm.stop(startTime + duration + 0.05);

    oscFund.onended = () => {
      try {
        oscFund.disconnect();
        oscHarm.disconnect();
        pickSource.disconnect();
        pickFilter.disconnect();
        pickGain.disconnect();
        bodyFilter.disconnect();
        noteGain.disconnect();
      } catch (e) {}
    };
  }

  /**
   * アコースティックギター単音の鳴動
   */
  public triggerNote(freq: number, volume = 0.5, duration = 0.45, time?: number) {
    if (!this.rawContext) return;
    const now = time ?? this.rawContext.currentTime;
    this.ensureActive(now);
    const cleanDuration = Math.min(duration, 1.2); // メロディや単音の自然な響きを確保しつつ過剰な持続を防止

    try {
      if (this.guitarSampler && this.samplerLoaded) {
        const noteName = this.freqToNoteName(freq);
        const samplerVel = Math.min(1.0, volume * 1.5);
        this.guitarSampler.triggerAttackRelease(noteName, cleanDuration, now, samplerVel);
      } else {
        // サンプラーロード中やオフライン時は高品位な物理モデリングギターを即時発音
        this.triggerSynthesizedGuitar(freq, volume, cleanDuration, now);
      }
    } catch (err) {
      this.triggerSynthesizedGuitar(freq, volume, cleanDuration, now);
    }
  }

  /**
   * アコースティックギターのボサノヴァ・コードストローク（ポロロンと自然な爪・指の分散ストラム）
   */
  public triggerChord(notes: number[], volume = 0.5, sustain = 0.45, time?: number) {
    if (!this.rawContext) return;
    const now = time ?? this.rawContext.currentTime;
    this.ensureActive(now);

    try {
      const sortedNotes = [...notes].sort((a, b) => a - b);
      const notesCount = sortedNotes.length;
      const cleanSustain = Math.min(sustain, 0.42);

      sortedNotes.forEach((freq) => {
        // ボサノヴァの指弾き（プランキング）の完全同時発音（ビートと完全に同期し、もたつきを解消）
        const noteTime = now;

        const velocityVariation = 1.0 + (Math.random() * 0.04 - 0.02);
        const perNoteVol = (volume * velocityVariation) / Math.sqrt(notesCount * 0.75);
        const stringDecay = cleanSustain;

        this.triggerNote(freq, perNoteVol, stringDecay, noteTime);
      });
    } catch (e) {}
  }
}

export const tokyoMorningBossaGuitar = new TokyoMorningBossaGuitarEngine();


