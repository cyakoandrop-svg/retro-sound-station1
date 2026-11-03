import * as Tone from 'tone';

/**
 * 昭和レトロラジオ・オルゴール音源 設定パラメータ
 * 後から各音響特性を細かくチューニング・カスタマイズ可能な設計
 */
export interface RetroMusicBoxConfig {
  // 1. 爪が金属板（弁）を弾く瞬間のアタック成分 (MetalSynth)
  pluck: {
    enabled: boolean;
    volume: number; // dB (-24 ~ -12 dB)
    harmonicity: number; // 4.5 ~ 6.5 (硬質な金属アタック)
    modulationIndex: number; // 18 ~ 32
    resonance: number; // 800 ~ 1400 Hz
    octaves: number; // 1.2 ~ 2.0
    decay: number; // 0.03 ~ 0.07s (極めて短いアタック)
  };

  // 2. 金属弁（リード）の本体響き音 (FMSynth)
  body: {
    volume: number; // dB (-6 ~ 0 dB)
    harmonicity: number; // 3.01 ~ 5.02 (金属板特有の非整数倍音・鐘系ハーモニクス)
    modulationIndex: number; // 3.5 ~ 6.0
    carrierType: 'sine' | 'triangle';
    modulatorType: 'sine';
    attack: number; // 0.002s (素早い立ち上がり)
    decay: number; // 1.8 ~ 2.6s (澄んだ余韻の減衰)
    sustain: number; // 0.0 (オルゴール特有の打弦後即減衰)
    release: number; // 1.2s
    modAttack: number; // 0.001s
    modDecay: number; // 0.35s (高次倍音が早く減衰し、甘い基音が残る)
    modSustain: number; // 0.02
    modRelease: number; // 0.4s
    randomDetuneCents: number; // 2.5 ~ 4.0 cents (手回し・個体差の微細なピッチ揺らぎ)
  };

  // 3. 木製オルゴール箱の共鳴 & アコースティック残響
  chamber: {
    filterFreq: number; // 850 Hz (木製キャビネットの胴鳴り)
    filterQ: number; // 1.2
    filterGain: number; // +2.5 dB
    reverbDecay: number; // 1.3s
    reverbPreDelay: number; // 0.015s
    reverbWet: number; // 0.22 (小部屋・箱内の密やかな響き)
  };

  // 4. 昭和レトロラジオ音響特性 (AM/真空管ラジオ再現チェーン)
  radio: {
    lowCutFreq: number; // 280 Hz (AMラジオ帯域の低域カット)
    highCutFreq: number; // 4200 Hz (古いスピーカーの丸みのある高域カット)
    midPresenceFreq: number; // 1600 Hz (レトロラジオ特有のノスタルジックな中域強調)
    midPresenceQ: number; // 1.4
    midPresenceGain: number; // +3.0 dB
    saturationAmount: number; // 0.06 (真空管・トランジスタの穏やかな温かい歪み)
    compressorThreshold: number; // -18 dB (放送用コンプ感)
    compressorRatio: number; // 3.2
    compressorAttack: number; // 0.012s
    compressorRelease: number; // 0.16s
    flutterRate: number; // 0.38 Hz (ラジオ電波・テープの微細な揺らぎ)
    flutterDepth: number; // 0.025 (心地よいレトロ感)
    hissVolume: number; // -44 dB (微弱なレトロラジオのヒスノイズ)
    masterVolume: number; // 0 dB
  };
}

export const DEFAULT_RETRO_MUSIC_BOX_CONFIG: RetroMusicBoxConfig = {
  pluck: {
    enabled: true,
    volume: -15,
    harmonicity: 5.2,
    modulationIndex: 22,
    resonance: 1100,
    octaves: 1.5,
    decay: 0.045,
  },
  body: {
    volume: -3,
    harmonicity: 3.015,
    modulationIndex: 4.8,
    carrierType: 'sine',
    modulatorType: 'sine',
    attack: 0.002,
    decay: 2.3,
    sustain: 0.0,
    release: 1.4,
    modAttack: 0.001,
    modDecay: 0.38,
    modSustain: 0.03,
    modRelease: 0.45,
    randomDetuneCents: 3.2,
  },
  chamber: {
    filterFreq: 820,
    filterQ: 1.1,
    filterGain: 2.2,
    reverbDecay: 1.35,
    reverbPreDelay: 0.012,
    reverbWet: 0.20,
  },
  radio: {
    lowCutFreq: 260,
    highCutFreq: 4100,
    midPresenceFreq: 1550,
    midPresenceQ: 1.3,
    midPresenceGain: 2.8,
    saturationAmount: 0.055,
    compressorThreshold: -16,
    compressorRatio: 3.0,
    compressorAttack: 0.015,
    compressorRelease: 0.18,
    flutterRate: 0.35,
    flutterDepth: 0.022,
    hissVolume: -45,
    masterVolume: 0,
  },
};

/**
 * 昭和レトロラジオ・オルゴール音響エンジン
 */
class RetroMusicBoxEngine {
  private config: RetroMusicBoxConfig = { ...DEFAULT_RETRO_MUSIC_BOX_CONFIG };
  private isInitialized = false;

  // Tone.js ノード群
  private bodySynth: Tone.PolySynth<Tone.FMSynth> | null = null;
  private pluckSynth: Tone.PolySynth<Tone.MetalSynth> | null = null;
  private chamberFilter: Tone.BiquadFilter | null = null;
  private reverb: Tone.Reverb | null = null;

  // 昭和レトロラジオ音響チェーン
  private radioLowCut: Tone.Filter | null = null;
  private radioHighCut: Tone.Filter | null = null;
  private radioMidPresence: Tone.BiquadFilter | null = null;
  private saturation: Tone.Distortion | null = null;
  private compressor: Tone.Compressor | null = null;
  private vibrato: Tone.Vibrato | null = null;
  private hissNoise: Tone.Noise | null = null;
  private hissFilter: Tone.Filter | null = null;
  private hissGain: Tone.Gain | null = null;
  private masterOutput: Tone.Gain | null = null;

  /**
   * エンジンの初期化
   */
  public init(context?: AudioContext, destinationNode?: AudioNode) {
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

      // 1. 爪アタック音源 (MetalSynth) - 金属板を爪・ピンが弾く瞬間
      this.pluckSynth = new Tone.PolySynth(Tone.MetalSynth, {
        envelope: {
          attack: 0.003,
          decay: conf.pluck.decay,
          release: 0.02,
        },
        harmonicity: conf.pluck.harmonicity,
        modulationIndex: conf.pluck.modulationIndex,
        resonance: conf.pluck.resonance,
        octaves: conf.pluck.octaves,
        volume: conf.pluck.volume,
      });

      // 2. 金属弁（リード）本体音源 (FMSynth)
      this.bodySynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: conf.body.harmonicity,
        modulationIndex: conf.body.modulationIndex,
        oscillator: {
          type: conf.body.carrierType,
        },
        envelope: {
          attack: conf.body.attack,
          decay: conf.body.decay,
          sustain: conf.body.sustain,
          release: conf.body.release,
        },
        modulation: {
          type: conf.body.modulatorType,
        },
        modulationEnvelope: {
          attack: conf.body.modAttack,
          decay: conf.body.modDecay,
          sustain: conf.body.modSustain,
          release: conf.body.modRelease,
        },
        volume: conf.body.volume,
      });

      // 3. 木製オルゴール箱共鳴 (Chamber Resonant Filter + Reverb)
      this.chamberFilter = new Tone.BiquadFilter({
        frequency: conf.chamber.filterFreq,
        type: 'peaking',
        Q: conf.chamber.filterQ,
        gain: conf.chamber.filterGain,
      });

      this.reverb = new Tone.Reverb({
        decay: conf.chamber.reverbDecay,
        preDelay: conf.chamber.reverbPreDelay,
        wet: conf.chamber.reverbWet,
      });

      // 4. 昭和レトロラジオ音響チェーン (Showa Vintage Radio Processor)
      // AM低域カット
      this.radioLowCut = new Tone.Filter({
        frequency: conf.radio.lowCutFreq,
        type: 'highpass',
        rolloff: -24,
      });

      // レトロスピーカー高域丸みロールオフ
      this.radioHighCut = new Tone.Filter({
        frequency: conf.radio.highCutFreq,
        type: 'lowpass',
        rolloff: -24,
      });

      // ラジオ箱鳴り中域プレゼンス
      this.radioMidPresence = new Tone.BiquadFilter({
        frequency: conf.radio.midPresenceFreq,
        type: 'peaking',
        Q: conf.radio.midPresenceQ,
        gain: conf.radio.midPresenceGain,
      });

      // 真空管・ゲルマニウムトランジスタ風の穏やかなサチュレーション
      this.saturation = new Tone.Distortion({
        distortion: conf.radio.saturationAmount,
        wet: 0.65,
      });

      // 放送局・ラジオ受信機コンプレッサー
      this.compressor = new Tone.Compressor({
        threshold: conf.radio.compressorThreshold,
        ratio: conf.radio.compressorRatio,
        attack: conf.radio.compressorAttack,
        release: conf.radio.compressorRelease,
      });

      // レトロラジオ・アナログテープの微細なフラッター揺らぎ (Wow/Flutter)
      this.vibrato = new Tone.Vibrato({
        frequency: conf.radio.flutterRate,
        depth: conf.radio.flutterDepth,
      });

      // 昭和ラジオの極小ヒスノイズ
      this.hissNoise = new Tone.Noise({
        type: 'pink',
      });
      this.hissFilter = new Tone.Filter({
        frequency: 2400,
        type: 'bandpass',
        Q: 1.8,
      });
      this.hissGain = new Tone.Gain(Tone.dbToGain(conf.radio.hissVolume));

      this.hissNoise.connect(this.hissFilter);
      this.hissFilter.connect(this.hissGain);

      // マスター出力ゲイン
      this.masterOutput = new Tone.Gain(Tone.dbToGain(conf.radio.masterVolume));

      // --- シグナルルーティング構築 ---
      // [Pluck + Body] -> chamberFilter -> reverb -> radioLowCut -> radioHighCut -> radioMidPresence -> saturation -> compressor -> vibrato -> masterOutput
      this.pluckSynth.connect(this.chamberFilter);
      this.bodySynth.connect(this.chamberFilter);

      this.chamberFilter.connect(this.reverb);
      this.reverb.connect(this.radioLowCut);
      this.radioLowCut.connect(this.radioHighCut);
      this.radioHighCut.connect(this.radioMidPresence);
      this.radioMidPresence.connect(this.saturation);
      this.saturation.connect(this.compressor);
      this.compressor.connect(this.vibrato);
      this.vibrato.connect(this.masterOutput);

      // ヒスノイズもマスター出力に合流
      this.hissGain.connect(this.masterOutput);

      // 外部接続先（指定ノード、またはTone.Destination）
      if (destinationNode) {
        Tone.connect(this.masterOutput, destinationNode);
      } else {
        this.masterOutput.toDestination();
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('RetroMusicBoxEngine init warning:', e);
    }
  }

  /**
   * チャンネル変更や演奏停止時、すべての発音・余韻を即座に完全遮断
   */
  private ensureActive(now: number) {
    if (this.masterOutput && this.masterOutput.gain.value < 0.01) {
      try {
        this.masterOutput.gain.cancelScheduledValues(now);
        this.masterOutput.gain.setValueAtTime(Math.max(this.masterOutput.gain.value, 0.0001), now);
        this.masterOutput.gain.linearRampToValueAtTime(1.0, now + 0.015);
      } catch (e) {}
    }
  }

  public stopAll() {
    try {
      this.bodySynth?.releaseAll();
      this.pluckSynth?.releaseAll();
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
   * 出力先オーディオノードの切り替え（サウンドラボ／ラジオ本体バスへの接続変更）
   */
  public setDestination(node: AudioNode) {
    if (this.masterOutput) {
      try {
        this.masterOutput.disconnect();
        Tone.connect(this.masterOutput, node);
      } catch (e) {}
    }
  }

  /**
   * 設定の更新（後からパラメータを動的に調整可能）
   */
  public updateConfig(newConfig: Partial<RetroMusicBoxConfig>) {
    this.config = {
      ...this.config,
      ...newConfig,
      pluck: { ...this.config.pluck, ...(newConfig.pluck || {}) },
      body: { ...this.config.body, ...(newConfig.body || {}) },
      chamber: { ...this.config.chamber, ...(newConfig.chamber || {}) },
      radio: { ...this.config.radio, ...(newConfig.radio || {}) },
    };

    if (!this.isInitialized) return;

    try {
      const conf = this.config;
      if (this.pluckSynth) {
        this.pluckSynth.set({
          volume: conf.pluck.volume,
          harmonicity: conf.pluck.harmonicity,
          modulationIndex: conf.pluck.modulationIndex,
          resonance: conf.pluck.resonance,
          octaves: conf.pluck.octaves,
        });
      }
      if (this.bodySynth) {
        this.bodySynth.set({
          volume: conf.body.volume,
          harmonicity: conf.body.harmonicity,
          modulationIndex: conf.body.modulationIndex,
          envelope: {
            attack: conf.body.attack,
            decay: conf.body.decay,
            sustain: conf.body.sustain,
            release: conf.body.release,
          },
        });
      }
      if (this.chamberFilter) {
        this.chamberFilter.frequency.value = conf.chamber.filterFreq;
        this.chamberFilter.gain.value = conf.chamber.filterGain;
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
      if (this.masterOutput) this.masterOutput.gain.value = Tone.dbToGain(conf.radio.masterVolume);
    } catch (e) {
      console.warn('RetroMusicBox updateConfig warning:', e);
    }
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): RetroMusicBoxConfig {
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
   * 昭和レトロラジオ・オルゴールの単音発音
   * @param freq 周波数 (Hz) または 音名 (例: "C5")
   * @param velocity ベロシティ (0.0 ~ 1.0)
   * @param duration 持続時間 (秒)
   * @param time 発音タイミング (秒, オプション)
   */
  public triggerNote(
    freq: number | string,
    velocity: number = 0.5,
    duration: number = 2.0,
    time?: number
  ) {
    if (!this.isInitialized || !this.bodySynth) {
      this.init();
    }

    try {
      const rawCtx = Tone.getContext().rawContext as AudioContext | undefined;
      const now = time ?? rawCtx?.currentTime ?? Tone.now();
      this.ensureActive(now);

      // 各音程ごとにわずかに異なる倍音感とごく微細なピッチ・音量揺らぎを付与（完全に均一なデジタル音にしない）
      const conf = this.config;
      const detuneCents = (Math.random() * 2 - 1) * conf.body.randomDetuneCents;
      const velVariance = velocity * (0.92 + Math.random() * 0.16);

      // 1. 爪アタック音（ピンが弁を弾く瞬間）のトリガー
      if (conf.pluck.enabled && this.pluckSynth) {
        // 音程に応じたアタック音のトリガー
        const attackVol = Math.max(0.05, Math.min(1.0, velVariance * 0.75));
        this.pluckSynth.triggerAttackRelease(freq, conf.pluck.decay, now, attackVol);
      }

      // 2. 金属弁・オルゴール本体音（FMSynth）のトリガー
      if (this.bodySynth) {
        const numericFreq = typeof freq === 'number' ? freq : Tone.Frequency(freq).toFrequency();
        // 微細なデチューンを適用した周波数
        const detunedFreq = numericFreq * Math.pow(2, detuneCents / 1200);

        this.bodySynth.triggerAttackRelease(
          detunedFreq,
          duration,
          now,
          Math.max(0.05, Math.min(1.0, velVariance))
        );
      }
    } catch (e) {
      console.warn('triggerNote error:', e);
    }
  }

  /**
   * 昭和レトロラジオ・オルゴールの複数和音/アルペジオ発音
   */
  public triggerChord(
    frequencies: number[],
    velocity: number = 0.45,
    duration: number = 2.2,
    strumSpreadSec: number = 0.015,
    time?: number
  ) {
    if (!this.isInitialized) {
      this.init();
    }

    const rawCtx = Tone.getContext().rawContext as AudioContext | undefined;
    const baseTime = time ?? rawCtx?.currentTime ?? Tone.now();
    frequencies.forEach((freq, idx) => {
      const noteTime = baseTime + idx * strumSpreadSec;
      const noteVel = velocity * (0.85 + (idx / frequencies.length) * 0.25);
      this.triggerNote(freq, noteVel, duration, noteTime);
    });
  }
}

// シングルトンインスタンスのエクスポート
export const retroMusicBox = new RetroMusicBoxEngine();
