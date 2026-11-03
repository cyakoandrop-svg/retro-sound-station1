import * as Tone from 'tone';

/**
 * 昭和レトロ 夜のラウンジ・アコースティックピアノ音源 設定パラメータ
 * ピアニストが夜のラウンジで静かに演奏している、本物のアコースティックピアノの響き
 * 全ての音響・空間・ラジオ特性を後から微調整・カスタマイズ可能な設計
 */
export interface RetroLoungePianoConfig {
  // 1. ピアノ音源 (Tone.Sampler / Acoustic Piano Samples)
  piano: {
    volume: number; // dB (-3 ~ +3 dB)
    attack: number; // 0.0s (リアルサンプル)
    release: number; // 1.6s ~ 2.4s (自然なダンパー減衰)
    curve: 'linear' | 'exponential';
    randomDetuneCents: number; // 1.2 ~ 2.5 cents (アコースティックピアノの微小な調律揺らぎ)
  };

  // 2. ピアノ本体・木製響板・胴鳴り共鳴 (Piano Body & Soundboard Resonance)
  body: {
    woodResonanceFreq: number; // 320 Hz (木製キャビネット・響板のふくよかな胴鳴り)
    woodResonanceQ: number; // 1.3
    woodResonanceGain: number; // +3.0 dB
    lowWarmthFreq: number; // 180 Hz (低域の豊かさと弦の厚み)
    lowWarmthGain: number; // +2.0 dB
    highRollOffFreq: number; // 5800 Hz (高域の耳障りさを抑える丸みのあるウォームトーン)
  };

  // 3. 夜の小さなラウンジ空間音響 (Night Lounge Room Acoustic Reverb & Early Reflections)
  room: {
    enabled: boolean;
    reverbDecay: number; // 0.72s (小規模ラウンジの親密でタイトな空間減衰)
    preDelay: number; // 0.005s (5ms: 壁からの素早い自然な初期反射)
    wet: number; // 0.075 (音の芯を残しつつ適度な奥行きを感じる控えめな残響感)
    earlyReflectionsEnabled: boolean; // 初期反射（壁面・卓上の反射音）
    earlyReflectionsGain: number; // 初期反射ゲイン (0.08 ~ 0.12)
    earlyReflectionsDelayTime: number; // 初期反射ディレイタイム (0.016s = 16ms)
    reverbHighDampFreq: number; // 2600 Hz (高域の反射を抑えるローパスダンピングフィルター)
    roomAirNoiseVolume: number; // -45 dB (打鍵時・空間の微細なルームノイズ/空気感)
    highOvertoneDampGain: number; // -2.5 dB (高音域倍音・反射のダンピング)
  };

  // 4. 昭和レトロラジオ音響DSP (Showa Vintage Radio Processor)
  radio: {
    enabled: boolean;
    lowCutFreq: number; // 180 Hz (レトロ受信機の低域帯域制限)
    highCutFreq: number; // 5200 Hz (温かみのあるスピーカー高域ロールオフ)
    midPresenceFreq: number; // 1350 Hz (ラジオ特有のノスタルジックな中域強調)
    midPresenceQ: number; // 1.1
    midPresenceGain: number; // +2.2 dB
    saturationAmount: number; // 0.04 (真空管アンプ・トランスの温かいサチュレーション)
    compressorThreshold: number; // -18 dB (放送用コンプレッション)
    compressorRatio: number; // 2.6
    compressorAttack: number; // 0.02s
    compressorRelease: number; // 0.22s
    flutterRate: number; // 0.28 Hz (アナログ電波・テープの微細なフラッター)
    flutterDepth: number; // 0.014
    hissVolume: number; // -48 dB (穏やかなヴィンテージラジオノイズ)
    masterVolume: number; // 0 dB
  };
}

export const DEFAULT_RETRO_LOUNGE_PIANO_CONFIG: RetroLoungePianoConfig = {
  piano: {
    volume: 1.0, // ピアノ音量を少し引き上げ (-2.0 dB -> 1.0 dB)
    attack: 0.0,
    release: 1.25, // 電子音にならず自然に消え入るアコースティックダンパー減衰
    curve: 'exponential',
    randomDetuneCents: 1.6,
  },
  body: {
    woodResonanceFreq: 330,
    woodResonanceQ: 1.25,
    woodResonanceGain: 2.6,
    lowWarmthFreq: 190,
    lowWarmthGain: 1.6,
    highRollOffFreq: 5600,
  },
  room: {
    enabled: true,
    reverbDecay: 0.72, // Decayを短縮: 0.72s (大ホール感を排除し、親密な小ラウンジのタイトな響き)
    preDelay: 0.005, // Pre-delayを短縮: 0.005s (5ms)
    wet: 0.075, // Wetを少し下げる: 0.075 (音の芯と透明感を保つ)
    earlyReflectionsEnabled: true, // 初期反射を少し感じる (壁面の反射音を付加)
    earlyReflectionsGain: 0.09, // 自然に溶け込む初期反射ゲイン
    earlyReflectionsDelayTime: 0.016, // 16ms (近接した木製壁やテーブルの初期反射)
    reverbHighDampFreq: 2600, // 高域の反射を抑えるダンピングフィルター (2600Hz)
    highOvertoneDampGain: -2.5, // 高音域倍音のダンピング (-2.5 dB)
    roomAirNoiseVolume: -45, // 打鍵時の微細なルームノイズ・空気感 (-45 dB)
  },
  radio: {
    enabled: true,
    lowCutFreq: 180,
    highCutFreq: 5000,
    midPresenceFreq: 1380,
    midPresenceQ: 1.15,
    midPresenceGain: 1.8,
    saturationAmount: 0.032,
    compressorThreshold: -18,
    compressorRatio: 2.4,
    compressorAttack: 0.018,
    compressorRelease: 0.20,
    flutterRate: 0.28,
    flutterDepth: 0.014,
    hissVolume: -48,
    masterVolume: -1.0,
  },
};

/**
 * 昭和レトロ 夜のラウンジ・アコースティックピアノ音響エンジン
 * 
 * アーキテクチャ:
 * Piano (Tone.Sampler - 実際のアコースティックグランドピアノ録音サンプル)
 *  -> Piano Body / Resonance (木製響板・低域ウォームス・高域ウォームフィルタ)
 *  -> Room Reverb (夜の小さなラウンジの自然な空間反射)
 *  -> Radio DSP (昭和レトロラジオ帯域制限 + 真空管サチュレーション + コンプレッサー + フラッター)
 *  -> Output
 */
class RetroLoungePianoEngine {
  private config: RetroLoungePianoConfig = { ...DEFAULT_RETRO_LOUNGE_PIANO_CONFIG };
  private isInitialized = false;
  private isSamplerLoaded = false;

  // 1. Piano 音源ノード (Tone.Sampler)
  private pianoSampler: Tone.Sampler | null = null;
  // サンプル未読み込み時/ロード中の安全なフォールバック用ポリシンセ
  private fallbackSynth: Tone.PolySynth<Tone.Synth> | null = null;

  // 2. Piano Body / Resonance ノード
  private bodyResonanceFilter: Tone.BiquadFilter | null = null;
  private lowWarmthFilter: Tone.BiquadFilter | null = null;
  private highRollOffFilter: Tone.Filter | null = null;
  private highOvertoneDampFilter: Tone.BiquadFilter | null = null;
  private bodyBus: Tone.Gain | null = null;

  // 3. Room Reverb ノード & ルームノイズ/空気感 & 初期反射
  private roomBus: Tone.Gain | null = null;
  private roomReverb: Tone.Reverb | null = null;
  private reverbDampFilter: Tone.Filter | null = null;
  private earlyReflectionsDelay: Tone.FeedbackDelay | null = null;
  private earlyReflectionsFilter: Tone.Filter | null = null;
  private earlyReflectionsGain: Tone.Gain | null = null;
  private keyAirSynth: Tone.NoiseSynth | null = null;
  private keyAirFilter: Tone.Filter | null = null;
  private keyAirGain: Tone.Gain | null = null;
  private lastKeyAirTime: number = 0;

  // 4. Radio DSP ノード
  private radioLowCut: Tone.Filter | null = null;
  private radioHighCut: Tone.Filter | null = null;
  private radioMidPresence: Tone.BiquadFilter | null = null;
  private saturation: Tone.Distortion | null = null;
  private compressor: Tone.Compressor | null = null;
  private vibrato: Tone.Vibrato | null = null;
  private hissNoise: Tone.Noise | null = null;
  private hissFilter: Tone.Filter | null = null;
  private hissGain: Tone.Gain | null = null;

  // 5. Output マスター
  private radioBypassGain: Tone.Gain | null = null;
  private radioWetGain: Tone.Gain | null = null;
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
        console.warn('retroLoungePiano setDestination warning:', e);
      }
    }
  }

  /**
   * エンジンの初期化
   */
  public init(context?: AudioContext, destinationNode?: AudioNode) {
    if (destinationNode) {
      this.setDestination(destinationNode);
    }
    if (this.isInitialized && this.masterOutput && (!context || Tone.getContext().rawContext === context)) {
      return;
    }

    try {
      if (context && Tone.getContext().rawContext !== context) {
        Tone.setContext(context);
      }
      try {
        Tone.getContext().lookAhead = 0.04;
      } catch (e) {}

      const conf = this.config;

      // =========================================================
      // 2. Piano Body / Resonance (木製響板・胴鳴り共鳴)
      // =========================================================
      this.bodyBus = new Tone.Gain(1.0);

      this.bodyResonanceFilter = new Tone.BiquadFilter({
        frequency: conf.body.woodResonanceFreq,
        type: 'peaking',
        Q: conf.body.woodResonanceQ,
        gain: conf.body.woodResonanceGain,
      });

      this.lowWarmthFilter = new Tone.BiquadFilter({
        frequency: conf.body.lowWarmthFreq,
        type: 'lowshelf',
        gain: conf.body.lowWarmthGain,
      });

      this.highRollOffFilter = new Tone.Filter({
        frequency: conf.body.highRollOffFreq,
        type: 'lowpass',
        rolloff: -12,
      });

      // 高音域倍音のダンピングフィルター (-2.5 dB の穏やかなシェルフ減衰)
      this.highOvertoneDampFilter = new Tone.BiquadFilter({
        frequency: 3400,
        type: 'highshelf',
        gain: conf.room.highOvertoneDampGain,
      });

      // Body フィルタチェーン
      this.bodyBus.connect(this.lowWarmthFilter);
      this.lowWarmthFilter.connect(this.bodyResonanceFilter);
      this.bodyResonanceFilter.connect(this.highRollOffFilter);
      this.highRollOffFilter.connect(this.highOvertoneDampFilter);

      // =========================================================
      // 3. Room Reverb & 初期反射 (Early Reflections) & 高域反射ダンピング
      // =========================================================
      this.roomBus = new Tone.Gain(1.0);

      // (1) メイン・リバーブ (短めDecay 0.72s / 短めPre-delay 5ms / 控えめWet 0.075)
      this.roomReverb = new Tone.Reverb({
        decay: conf.room.reverbDecay,
        preDelay: conf.room.preDelay,
        wet: conf.room.wet,
      });

      // (2) 高域反射ダンピングフィルター (2600Hz ローパスフィルターで残響の高域ギラつきを抑えて温かみを付加)
      this.reverbDampFilter = new Tone.Filter({
        frequency: conf.room.reverbHighDampFreq,
        type: 'lowpass',
        rolloff: -12,
      });

      this.highOvertoneDampFilter.connect(this.roomReverb);
      this.roomReverb.connect(this.reverbDampFilter);
      this.reverbDampFilter.connect(this.roomBus);

      // (3) 初期反射 (Early Reflections: 16ms の近接木製壁・卓上反射を少し感じるチューニング)
      this.earlyReflectionsDelay = new Tone.FeedbackDelay({
        delayTime: conf.room.earlyReflectionsDelayTime,
        feedback: 0.10,
        wet: 1.0,
      });
      this.earlyReflectionsFilter = new Tone.Filter({
        frequency: conf.room.reverbHighDampFreq,
        type: 'lowpass',
        rolloff: -12,
      });
      this.earlyReflectionsGain = new Tone.Gain(
        conf.room.earlyReflectionsEnabled ? conf.room.earlyReflectionsGain : 0.0
      );

      this.highOvertoneDampFilter.connect(this.earlyReflectionsDelay);
      this.earlyReflectionsDelay.connect(this.earlyReflectionsFilter);
      this.earlyReflectionsFilter.connect(this.earlyReflectionsGain);
      this.earlyReflectionsGain.connect(this.roomBus);

      // 打鍵時の微細なルームノイズ・空気感 (Key Action & Acoustic Room Air Noise)
      this.keyAirFilter = new Tone.Filter({
        frequency: 1350,
        type: 'bandpass',
        Q: 1.0,
      });
      this.keyAirGain = new Tone.Gain(Tone.dbToGain(conf.room.roomAirNoiseVolume));
      this.keyAirSynth = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: {
          attack: 0.015,
          decay: 0.22,
          sustain: 0.0,
          release: 0.12,
        },
      });
      this.keyAirSynth.connect(this.keyAirFilter);
      this.keyAirFilter.connect(this.keyAirGain);
      this.keyAirGain.connect(this.roomReverb);

      // =========================================================
      // 4. Radio DSP (昭和レトロラジオ音響チェーン)
      // =========================================================
      this.radioLowCut = new Tone.Filter({
        frequency: conf.radio.lowCutFreq,
        type: 'highpass',
        rolloff: -24,
      });

      this.radioHighCut = new Tone.Filter({
        frequency: conf.radio.highCutFreq,
        type: 'lowpass',
        rolloff: -24,
      });

      this.radioMidPresence = new Tone.BiquadFilter({
        frequency: conf.radio.midPresenceFreq,
        type: 'peaking',
        Q: conf.radio.midPresenceQ,
        gain: conf.radio.midPresenceGain,
      });

      this.saturation = new Tone.Distortion({
        distortion: conf.radio.saturationAmount,
        wet: 0.45,
      });

      this.compressor = new Tone.Compressor({
        threshold: conf.radio.compressorThreshold,
        ratio: conf.radio.compressorRatio,
        attack: conf.radio.compressorAttack,
        release: conf.radio.compressorRelease,
      });

      this.vibrato = new Tone.Vibrato({
        frequency: conf.radio.flutterRate,
        depth: conf.radio.flutterDepth,
      });

      // 昭和ラジオ微細ヒスノイズ
      this.hissNoise = new Tone.Noise({
        type: 'pink',
      });
      this.hissFilter = new Tone.Filter({
        frequency: 2200,
        type: 'bandpass',
        Q: 1.6,
      });
      this.hissGain = new Tone.Gain(Tone.dbToGain(conf.radio.hissVolume));

      this.hissNoise.connect(this.hissFilter);
      this.hissFilter.connect(this.hissGain);

      // =========================================================
      // 5. ルーティング & 出力ゲイン
      // =========================================================
      this.radioWetGain = new Tone.Gain(conf.radio.enabled ? 1.0 : 0.0);
      this.radioBypassGain = new Tone.Gain(conf.radio.enabled ? 0.0 : 1.0);
      this.masterOutput = new Tone.Gain(Tone.dbToGain(conf.radio.masterVolume));

      // [Room Bus 出力] -> Radio DSP チェーン -> radioWetGain -> masterOutput
      this.roomBus.connect(this.radioLowCut);
      this.radioLowCut.connect(this.radioHighCut);
      this.radioHighCut.connect(this.radioMidPresence);
      this.radioMidPresence.connect(this.saturation);
      this.saturation.connect(this.compressor);
      this.compressor.connect(this.vibrato);
      this.vibrato.connect(this.radioWetGain);
      this.radioWetGain.connect(this.masterOutput);

      // バイパスルート
      this.roomBus.connect(this.radioBypassGain);
      this.radioBypassGain.connect(this.masterOutput);

      // ヒスノイズ
      this.hissGain.connect(this.radioWetGain);

      // =========================================================
      // 1. Piano (Tone.Sampler - Salamander Grand Piano 実録サンプル)
      // =========================================================
      // 世界中で使われている高品位アコースティック・グランドピアノ（Salamander）の実音サンプル
      const sampleBaseUrl = 'https://tonejs.github.io/audio/salamander/';
      this.pianoSampler = new Tone.Sampler({
        urls: {
          A0: 'A0.mp3',
          C1: 'C1.mp3',
          'D#1': 'Ds1.mp3',
          'F#1': 'Fs1.mp3',
          A1: 'A1.mp3',
          C2: 'C2.mp3',
          'D#2': 'Ds2.mp3',
          'F#2': 'Fs2.mp3',
          A2: 'A2.mp3',
          C3: 'C3.mp3',
          'D#3': 'Ds3.mp3',
          'F#3': 'Fs3.mp3',
          A3: 'A3.mp3',
          C4: 'C4.mp3',
          'D#4': 'Ds4.mp3',
          'F#4': 'Fs4.mp3',
          A4: 'A4.mp3',
          C5: 'C5.mp3',
          'D#5': 'Ds5.mp3',
          'F#5': 'Fs5.mp3',
          A5: 'A5.mp3',
          C6: 'C6.mp3',
          'D#6': 'Ds6.mp3',
          'F#6': 'Fs6.mp3',
          A6: 'A6.mp3',
          C7: 'C7.mp3',
          'D#7': 'Ds7.mp3',
          'F#7': 'Fs7.mp3',
          A7: 'A7.mp3',
          C8: 'C8.mp3',
        },
        release: conf.piano.release,
        baseUrl: sampleBaseUrl,
        volume: conf.piano.volume,
        onload: () => {
          this.isSamplerLoaded = true;
        },
      });

      // ロード中やネットワーク切断時のためのフォールバック用シンセ
      this.fallbackSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle8' },
        envelope: {
          attack: 0.005,
          decay: 1.4,
          sustain: 0.02,
          release: 0.9,
        },
        volume: -4,
      });

      // Piano 出力を Body Bus に接続
      this.pianoSampler.connect(this.bodyBus);
      this.fallbackSynth.connect(this.bodyBus);

      // 外部接続先（指定ノード、またはTone.Destination）
      const targetDest = destinationNode || this.destinationNode;
      if (targetDest) {
        Tone.connect(this.masterOutput, targetDest);
      } else {
        this.masterOutput.toDestination();
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('RetroLoungePianoEngine init warning:', e);
    }
  }

  /**
   * チャンネル変更や演奏停止時、すべての発音・ピアノ残響を即座に完全遮断
   */
  private ensureActive(now: number) {
    if (this.masterOutput && this.masterOutput.gain.value < 0.01) {
      try {
        const targetGain = Tone.dbToGain(this.config.radio.masterVolume);
        this.masterOutput.gain.cancelScheduledValues(now);
        this.masterOutput.gain.setValueAtTime(Math.max(this.masterOutput.gain.value, 0.0001), now);
        this.masterOutput.gain.linearRampToValueAtTime(targetGain, now + 0.015);
      } catch (e) {}
    }
  }

  public stopAll() {
    try {
      this.pianoSampler?.releaseAll();
      this.fallbackSynth?.releaseAll();
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
   * 設定の動的更新（後からパラメータをリアルタイム調整可能）
   */
  public updateConfig(newConfig: Partial<RetroLoungePianoConfig>) {
    this.config = {
      ...this.config,
      ...newConfig,
      piano: { ...this.config.piano, ...(newConfig.piano || {}) },
      body: { ...this.config.body, ...(newConfig.body || {}) },
      room: { ...this.config.room, ...(newConfig.room || {}) },
      radio: { ...this.config.radio, ...(newConfig.radio || {}) },
    };

    if (!this.isInitialized) return;

    try {
      const conf = this.config;
      if (this.pianoSampler) {
        this.pianoSampler.volume.value = conf.piano.volume;
      }
      if (this.bodyResonanceFilter) {
        this.bodyResonanceFilter.frequency.value = conf.body.woodResonanceFreq;
        this.bodyResonanceFilter.Q.value = conf.body.woodResonanceQ;
        this.bodyResonanceFilter.gain.value = conf.body.woodResonanceGain;
      }
      if (this.lowWarmthFilter) {
        this.lowWarmthFilter.frequency.value = conf.body.lowWarmthFreq;
        this.lowWarmthFilter.gain.value = conf.body.lowWarmthGain;
      }
      if (this.highRollOffFilter) {
        this.highRollOffFilter.frequency.value = conf.body.highRollOffFreq;
      }
      if (this.highOvertoneDampFilter) {
        this.highOvertoneDampFilter.gain.value = conf.room.highOvertoneDampGain;
      }
      if (this.keyAirGain) {
        this.keyAirGain.gain.value = Tone.dbToGain(conf.room.roomAirNoiseVolume);
      }
      if (this.roomReverb) {
        this.roomReverb.decay = conf.room.reverbDecay;
        this.roomReverb.preDelay = conf.room.preDelay;
        this.roomReverb.wet.value = conf.room.wet;
      }
      if (this.reverbDampFilter) {
        this.reverbDampFilter.frequency.value = conf.room.reverbHighDampFreq;
      }
      if (this.earlyReflectionsDelay) {
        this.earlyReflectionsDelay.delayTime.value = conf.room.earlyReflectionsDelayTime;
      }
      if (this.earlyReflectionsFilter) {
        this.earlyReflectionsFilter.frequency.value = conf.room.reverbHighDampFreq;
      }
      if (this.earlyReflectionsGain) {
        this.earlyReflectionsGain.gain.value = conf.room.earlyReflectionsEnabled ? conf.room.earlyReflectionsGain : 0.0;
      }
      if (this.radioLowCut) this.radioLowCut.frequency.value = conf.radio.lowCutFreq;
      if (this.radioHighCut) this.radioHighCut.frequency.value = conf.radio.highCutFreq;
      if (this.radioMidPresence) {
        this.radioMidPresence.frequency.value = conf.radio.midPresenceFreq;
        this.radioMidPresence.gain.value = conf.radio.midPresenceGain;
      }
      if (this.saturation) this.saturation.distortion = conf.radio.saturationAmount;
      if (this.compressor) {
        this.compressor.threshold.value = conf.radio.compressorThreshold;
        this.compressor.ratio.value = conf.radio.compressorRatio;
      }
      if (this.vibrato) {
        this.vibrato.frequency.value = conf.radio.flutterRate;
        this.vibrato.depth.value = conf.radio.flutterDepth;
      }
      if (this.hissGain) this.hissGain.gain.value = Tone.dbToGain(conf.radio.hissVolume);
      if (this.radioWetGain) this.radioWetGain.gain.value = conf.radio.enabled ? 1.0 : 0.0;
      if (this.radioBypassGain) this.radioBypassGain.gain.value = conf.radio.enabled ? 0.0 : 1.0;
      if (this.masterOutput) this.masterOutput.gain.value = Tone.dbToGain(conf.radio.masterVolume);
    } catch (e) {
      console.warn('RetroLoungePiano updateConfig warning:', e);
    }
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): RetroLoungePianoConfig {
    return { ...this.config };
  }

  /**
   * ヒスノイズの開始/停止
   */
  public setHissEnabled(enabled: boolean) {
    if (!this.hissNoise) return;
    try {
      if (enabled && this.hissNoise.state !== 'started') {
        this.hissNoise.start();
      } else if (!enabled && this.hissNoise.state === 'started') {
        this.hissNoise.stop();
      }
    } catch (e) {}
  }

  /**
   * 昭和レトロ 夜のラウンジ・アコースティックピアノの単音発音
   * Velocityに応じて実音サンプルの表現力・音量をダイナミックに変化
   * @param freq 周波数 (Hz) または 音名 (例: "C4")
   * @param velocity ベロシティ (0.0 ~ 1.0)
   * @param duration 持続時間 (秒)
   * @param time 発音タイミング (秒, オプション)
   */
  public triggerNote(
    freq: number | string,
    velocity: number = 0.32,
    duration: number = 0.85,
    time?: number
  ) {
    if (!this.isInitialized || !this.pianoSampler) {
      this.init();
    }

    try {
      const rawCtx = Tone.getContext().rawContext as AudioContext | undefined;
      const now = time ?? rawCtx?.currentTime ?? Tone.now();
      this.ensureActive(now);
      const conf = this.config;

      // 人間味あふれるわずかなピッチ揺らぎ (cents) とベロシティ微小ばらつき
      const detuneCents = (Math.random() * 2 - 1) * conf.piano.randomDetuneCents;
      const numericFreq = typeof freq === 'number' ? freq : Tone.Frequency(freq).toFrequency();
      const detunedFreq = numericFreq * Math.pow(2, detuneCents / 1200);

      // Velocity に応じたダイナミックカーブ（弱タッチは丸く静か、強タッチは豊かな響き）
      const clampedVel = Math.max(0.06, Math.min(0.9, velocity));
      const velVariance = clampedVel * (0.95 + Math.random() * 0.10);

      // Tone.Sampler (実録アコースティックピアノ音源) による発音
      if (this.pianoSampler && (this.isSamplerLoaded || this.pianoSampler.loaded)) {
        this.pianoSampler.triggerAttackRelease(
          detunedFreq,
          duration,
          now,
          Math.max(0.06, Math.min(1.0, velVariance))
        );
      } else if (this.fallbackSynth) {
        // サンプル読み込み中の一時的フォールバック
        this.fallbackSynth.triggerAttackRelease(
          detunedFreq,
          duration,
          now,
          Math.max(0.06, Math.min(1.0, velVariance * 0.75))
        );
      }

      // 打鍵時の微細なルームノイズ・空気感（夜の静かなラウンジのアンビエンス）
      if (this.keyAirSynth && conf.room.enabled && (now - this.lastKeyAirTime > 0.08)) {
        try {
          this.lastKeyAirTime = now;
          const airVel = Math.min(0.22, Math.max(0.04, velVariance * 0.28));
          this.keyAirSynth.triggerAttackRelease(0.12, now, airVel);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('RetroLoungePiano triggerNote error:', e);
    }
  }

  /**
   * 昭和レトロ 夜のラウンジ・アコースティックピアノの和音発音
   * 各鍵盤が完全に同時ではなく、ピアニストの指の自然な時間差（数ミリ秒〜十数ミリ秒のストラム差）を許容して発音
   * @param frequencies 周波数配列 (Hz)
   * @param velocity 和音ベロシティ (0.0 ~ 1.0)
   * @param duration 和音持続時間 (秒)
   * @param baseStrumSpreadSec ノート間の分散時間（秒、デフォルト 0.003s = 3ms）
   * @param time 発音タイミング (秒, オプション)
   */
  public triggerChord(
    frequencies: number[],
    velocity: number = 0.32,
    duration: number = 0.95,
    baseStrumSpreadSec: number = 0.003,
    time?: number
  ) {
    if (!this.isInitialized) {
      this.init();
    }

    const rawCtx = Tone.getContext().rawContext as AudioContext | undefined;
    const baseTime = time ?? rawCtx?.currentTime ?? Tone.now();
    const count = frequencies.length;

    frequencies.forEach((freq, idx) => {
      // 鍵盤の発音タイミング（指定の微小ストローク分散を反映）
      const noteTime = baseTime + (idx * Math.max(0, baseStrumSpreadSec));

      // 高音部（トップノート）と低音部（ボトムノート）の自然なボイシングバランス
      // トップノートをわずかに立たせ、内声部は優しく支える
      const isTopNote = idx === count - 1;
      const isBottomNote = idx === 0;
      let voiceBalance = 0.90;
      if (isTopNote) voiceBalance = 1.05;
      else if (isBottomNote) voiceBalance = 0.98;
      else voiceBalance = 0.88;

      const noteVel = velocity * voiceBalance * (0.95 + Math.random() * 0.10);

      this.triggerNote(freq, noteVel, duration, noteTime);
    });
  }
}

// シングルトンインスタンスのエクスポート
export const retroLoungePiano = new RetroLoungePianoEngine();
