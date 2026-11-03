import * as Tone from 'tone';

/**
 * 105.8MHz「ROPPONGI Petrichor FM」専用 メタリック・レインドロップ音色エンジン
 * 
 * サウンドコンセプト：
 * 「雨粒が金属に当たって跳ね返るような音色（Metallic Raindrop & Rebound Bounce）」
 * 
 * 特徴：
 * 1. 【金属着水アタック・チーン/ピーン (Metallic Ping & Ting Transient)】:
 *    - トタン屋根や金属手すり、ベル、ウインドチャイムに雨粒が落ちた瞬間の「ピーン」「カラン」という澄んだ金属衝撃音
 *    - 瞬時アタック（1ms）による精密なリズム感とクリアな輪郭
 * 2. 【雨粒の跳ね返りマイクロ・バウンス (Rebound Droplet Bounce)】:
 *    - 金属面に当たった雨粒がパッと弾け跳ぶ、+28ms後の微小なセカンド・リバウンド音（跳ね返りの水滴）
 * 3. 【クリスタル金属共鳴・チャイム倍音 (Metallic Chime & Glass Harmonics)】:
 *    - 完全純正倍音（オクターブ 2.0x, 完全12度 3.0x, 2オクターブ 4.0x）＋金属光沢シマー倍音（5.0x）
 *    - 不協和音のない澄み切った高音の響き
 * 4. 【水滴の潤いと雨音残響 (Rainy Metal Acoustic Space)】:
 *    - 金属の明るい抜け（7200Hzカットオフ）と、雨の街に広がるみずみずしいエコー・リバーブ
 */

export interface RaindropMelodyConfig {
  // 1. メイン水滴・金属基音
  droplet: {
    volume: number;        // dB
    attack: number;        // 0.001s (瞬時アタック)
    decay: number;         // 0.80s (自然な減衰)
    sustain: number;       // 0.005 (打楽器的な粒立ち)
    release: number;       // 0.45s
    pitchGlideAmount: number; // 1.025 (微小な着水ピッチスウィープ)
    pitchGlideDuration: number; // 0.005s (5ms)
  };

  // 2. 金属衝撃音 ＆ チャイム倍音
  metallic: {
    enabled: boolean;
    metalTingGain: number;   // 0.28 (金属着水時の「ピーン」というアタック)
    metalChimeGain: number;  // 0.18 (金属チャイム倍音)
    ringRatio1: number;      // 2.0x (オクターブ金属倍音)
    ringGain1: number;       // 0.16
    ringDecay1: number;      // 0.22s
    ringRatio2: number;      // 3.0x (完全12度・クリスタル倍音)
    ringGain2: number;       // 0.10
    ringDecay2: number;      // 0.14s
    ringRatio3: number;      // 4.0x (超高域の金属シマー)
    ringGain3: number;       // 0.06
    ringDecay3: number;      // 0.08s
    reboundEnabled: boolean; // 雨粒の跳ね返り（リバウンド）
    reboundDelay: number;    // 0.028s (28ms後の跳ね返り)
    reboundGain: number;     // 0.26 (跳ね返り水滴の音量)
  };

  // 3. 波紋ゆらぎ
  ripple: {
    enabled: boolean;
    rate: number;          // 6.5 Hz
    depth: number;         // 0.05
  };

  // 4. 金属雨音空間（リバーブ ＆ ディレイ）
  space: {
    cutoff: number;        // 7200 Hz (金属のクリアな光沢を活かす)
    delayTime: number;     // 0.22s
    delayFeedback: number; // 0.16
    delayWet: number;      // 0.10
    reverbDecay: number;   // 2.5s
    reverbWet: number;     // 0.28
  };
}

export const DEFAULT_RAINDROP_CONFIG: RaindropMelodyConfig = {
  droplet: {
    volume: 0.0,
    attack: 0.004,
    decay: 0.80,
    sustain: 0.005,
    release: 0.45,
    pitchGlideAmount: 1.025,
    pitchGlideDuration: 0.005,
  },
  metallic: {
    enabled: true,
    metalTingGain: 0.28,
    metalChimeGain: 0.18,
    ringRatio1: 2.0,
    ringGain1: 0.16,
    ringDecay1: 0.22,
    ringRatio2: 3.0,
    ringGain2: 0.10,
    ringDecay2: 0.14,
    ringRatio3: 4.0,
    ringGain3: 0.06,
    ringDecay3: 0.08,
    reboundEnabled: true,
    reboundDelay: 0.028,
    reboundGain: 0.26,
  },
  ripple: {
    enabled: true,
    rate: 6.5,
    depth: 0.05,
  },
  space: {
    cutoff: 7200,
    delayTime: 0.22,
    delayFeedback: 0.16,
    delayWet: 0.10,
    reverbDecay: 2.5,
    reverbWet: 0.28,
  },
};

export class RaindropMelodyEngine {
  private config: RaindropMelodyConfig = { ...DEFAULT_RAINDROP_CONFIG };
  private isInitialized = false;
  private rawContext: AudioContext | null = null;

  private outputBus: Tone.Gain | null = null;
  private destinationNode: AudioNode | null = null;
  private mainFilter: Tone.Filter | null = null;
  private feedbackDelay: Tone.FeedbackDelay | null = null;
  private reverb: Tone.Reverb | null = null;
  private limiter: Tone.Limiter | null = null;

  /**
   * 出力先オーディオノードの動的切り替え（サウンドラボ／ラジオ本体バスへの接続変更）
   */
  public setDestination(node: AudioNode) {
    this.destinationNode = node;
    if (this.outputBus) {
      try {
        this.outputBus.disconnect();
        Tone.connect(this.outputBus, node);
      } catch (e) {
        console.warn('raindropMelody setDestination warning:', e);
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

      this.outputBus = new Tone.Gain(Tone.dbToGain(conf.droplet.volume));

      // 金属の明るい輝きと雨粒の透明感を際立たせるローパスフィルター
      this.mainFilter = new Tone.Filter({
        frequency: conf.space.cutoff,
        type: 'lowpass',
        rolloff: -12,
      });

      // 雨粒の波紋エコー
      this.feedbackDelay = new Tone.FeedbackDelay({
        delayTime: conf.space.delayTime,
        feedback: conf.space.delayFeedback,
        wet: conf.space.delayWet,
      });

      // 潤いのある雨音空間リバーブ
      this.reverb = new Tone.Reverb({
        decay: conf.space.reverbDecay,
        preDelay: 0.008,
        wet: conf.space.reverbWet,
      });

      // クリッピング防止リミッター
      this.limiter = new Tone.Limiter(-0.5);

      // チェーン接続: mainFilter -> feedbackDelay -> reverb -> limiter -> outputBus
      this.mainFilter.connect(this.feedbackDelay);
      this.feedbackDelay.connect(this.reverb);
      this.reverb.connect(this.limiter);
      this.limiter.connect(this.outputBus);

      const targetDest = destinationNode || this.destinationNode;
      if (targetDest) {
        this.outputBus.connect(targetDest as any);
      } else {
        this.outputBus.toDestination();
      }

      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to initialize RaindropMelodyEngine:', e);
    }
  }

  /**
   * チャンネル変更や演奏停止時、すべての発音・水滴ディレイ余韻を即座に完全遮断
   */
  private ensureActive(now: number) {
    if (this.outputBus && this.outputBus.gain.value < 0.01) {
      try {
        this.outputBus.gain.cancelScheduledValues(now);
        this.outputBus.gain.setValueAtTime(Math.max(this.outputBus.gain.value, 0.0001), now);
        this.outputBus.gain.linearRampToValueAtTime(1.0, now + 0.015);
      } catch (e) {}
    }
  }

  public stopAll() {
    try {
      if (this.outputBus) {
        const now = Tone.now();
        const curr = this.outputBus.gain.value;
        this.outputBus.gain.cancelScheduledValues(now);
        this.outputBus.gain.setValueAtTime(Math.max(curr, 0.0001), now);
        this.outputBus.gain.linearRampToValueAtTime(0.0001, now + 0.02);
      }
    } catch (e) {}
  }

  /**
   * 雨粒が金属に当たって跳ね返る単音の生成・トリガー
   */
  public triggerNote(
    frequency: number,
    velocity: number = 0.5,
    duration: number = 0.8,
    time?: number
  ) {
    if (!this.isInitialized || !this.rawContext || !this.mainFilter) {
      return;
    }

    try {
      const now = time !== undefined ? time : Tone.now();
      this.ensureActive(now);
      const conf = this.config;
      const effectiveVel = Math.max(0.08, Math.min(1.0, velocity));

      // 1. 基音（水滴の潤いと芯のあるトーン）
      const baseFreq = frequency;
      const startFreq = baseFreq * (1.0 / conf.droplet.pitchGlideAmount);
      const oscCore = new Tone.Oscillator(startFreq, 'sine');

      // ピッチエンベロープ（5msの瞬時スウィープで水滴の着水輪郭を形成）
      oscCore.frequency.setValueAtTime(startFreq, now);
      oscCore.frequency.exponentialRampToValueAtTime(
        baseFreq,
        now + conf.droplet.pitchGlideDuration
      );

      // 余韻に微小な波紋ゆらぎ
      if (conf.ripple.enabled && duration > 0.35) {
        const rippleStart = now + 0.04;
        const rippleDur = Math.max(0.1, duration - 0.04);
        const steps = 16;
        const curve: number[] = [];
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const sineMod = Math.sin(t * Math.PI * 2 * conf.ripple.rate * rippleDur);
          const modAmount = baseFreq * (conf.ripple.depth * 0.015) * Math.sin(t * Math.PI);
          curve.push(baseFreq + sineMod * modAmount);
        }
        try {
          oscCore.frequency.setValueCurveAtTime(curve, rippleStart, rippleDur);
        } catch (e) {}
      }

      // 基音音量エンベロープ（瞬時アタック ＋ 自然な減衰）
      const envCore = new Tone.AmplitudeEnvelope({
        attack: conf.droplet.attack,
        decay: Math.max(0.2, Math.min(duration, conf.droplet.decay)),
        sustain: conf.droplet.sustain,
        release: conf.droplet.release,
      });

      const gainCore = new Tone.Gain(effectiveVel * 0.58);
      oscCore.connect(envCore);
      envCore.connect(gainCore);
      gainCore.connect(this.mainFilter);

      oscCore.start(now);
      envCore.triggerAttack(now);
      const coreStop = now + duration + conf.droplet.release + 0.1;
      envCore.triggerRelease(now + duration);
      oscCore.stop(coreStop);

      // 2. 金属着水アタック（Metallic Ting & Ping）
      if (conf.metallic.enabled) {
        // (A) 金属衝突の「ピーン」という高周波トランジェント
        const tingFreq = Math.min(8500, Math.max(2800, baseFreq * 3.5));
        const oscTing = new Tone.Oscillator(tingFreq, 'triangle');
        const envTing = new Tone.AmplitudeEnvelope({
          attack: 0.0005,
          decay: 0.035, // 35msのクリスピーな金属ヒット
          sustain: 0.0,
          release: 0.01,
        });
        const gainTing = new Tone.Gain(effectiveVel * conf.metallic.metalTingGain);

        oscTing.connect(envTing);
        envTing.connect(gainTing);
        gainTing.connect(this.mainFilter);

        oscTing.start(now);
        envTing.triggerAttack(now);
        envTing.triggerRelease(now + 0.035);
        oscTing.stop(now + 0.06);

        // (B) 金属チャイム倍音1 (2.0x オクターブ共鳴)
        const oscRing1 = new Tone.Oscillator(baseFreq * conf.metallic.ringRatio1, 'sine');
        const envRing1 = new Tone.AmplitudeEnvelope({
          attack: 0.001,
          decay: conf.metallic.ringDecay1,
          sustain: 0.0,
          release: 0.04,
        });
        const gainRing1 = new Tone.Gain(effectiveVel * conf.metallic.ringGain1);

        oscRing1.connect(envRing1);
        envRing1.connect(gainRing1);
        gainRing1.connect(this.mainFilter);

        oscRing1.start(now);
        envRing1.triggerAttack(now);
        envRing1.triggerRelease(now + conf.metallic.ringDecay1);
        oscRing1.stop(now + conf.metallic.ringDecay1 + 0.08);

        // (C) 金属チャイム倍音2 (3.0x 完全12度クリスタル共鳴)
        const oscRing2 = new Tone.Oscillator(baseFreq * conf.metallic.ringRatio2, 'sine');
        const envRing2 = new Tone.AmplitudeEnvelope({
          attack: 0.0008,
          decay: conf.metallic.ringDecay2,
          sustain: 0.0,
          release: 0.03,
        });
        const gainRing2 = new Tone.Gain(effectiveVel * conf.metallic.ringGain2);

        oscRing2.connect(envRing2);
        envRing2.connect(gainRing2);
        gainRing2.connect(this.mainFilter);

        oscRing2.start(now);
        envRing2.triggerAttack(now);
        envRing2.triggerRelease(now + conf.metallic.ringDecay2);
        oscRing2.stop(now + conf.metallic.ringDecay2 + 0.06);

        // (D) 金属シマー倍音3 (4.0x 2オクターブ金属光沢)
        const oscRing3 = new Tone.Oscillator(baseFreq * conf.metallic.ringRatio3, 'sine');
        const envRing3 = new Tone.AmplitudeEnvelope({
          attack: 0.0005,
          decay: conf.metallic.ringDecay3,
          sustain: 0.0,
          release: 0.02,
        });
        const gainRing3 = new Tone.Gain(effectiveVel * conf.metallic.ringGain3);

        oscRing3.connect(envRing3);
        envRing3.connect(gainRing3);
        gainRing3.connect(this.mainFilter);

        oscRing3.start(now);
        envRing3.triggerAttack(now);
        envRing3.triggerRelease(now + conf.metallic.ringDecay3);
        oscRing3.stop(now + conf.metallic.ringDecay3 + 0.05);

        // 3. 雨粒の跳ね返りマイクロ・バウンス (Rebound Droplet Bounce)
        // 金属面に当たった雨粒がパッと跳ねる（+28ms後にわずかに高めの微小水滴が鳴る）
        if (conf.metallic.reboundEnabled) {
          const reboundTime = now + conf.metallic.reboundDelay;
          const bounceFreq = baseFreq * 2.0; // オクターブ上の跳ね返り雫（協和度100%）
          const oscBounce = new Tone.Oscillator(bounceFreq, 'sine');
          const envBounce = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.12,
            sustain: 0.0,
            release: 0.03,
          });
          const gainBounce = new Tone.Gain(effectiveVel * conf.metallic.reboundGain);

          oscBounce.connect(envBounce);
          envBounce.connect(gainBounce);
          gainBounce.connect(this.mainFilter);

          oscBounce.start(reboundTime);
          envBounce.triggerAttack(reboundTime);
          envBounce.triggerRelease(reboundTime + 0.12);
          oscBounce.stop(reboundTime + 0.18);

          setTimeout(() => {
            try {
              oscBounce.dispose();
              envBounce.dispose();
              gainBounce.dispose();
            } catch (e) {}
          }, (duration + 0.8) * 1000);
        }

        setTimeout(() => {
          try {
            oscTing.dispose();
            envTing.dispose();
            gainTing.dispose();
            oscRing1.dispose();
            envRing1.dispose();
            gainRing1.dispose();
            oscRing2.dispose();
            envRing2.dispose();
            gainRing2.dispose();
            oscRing3.dispose();
            envRing3.dispose();
            gainRing3.dispose();
          } catch (e) {}
        }, (duration + 1.0) * 1000);
      }

      setTimeout(() => {
        try {
          oscCore.dispose();
          envCore.dispose();
          gainCore.dispose();
        } catch (e) {}
      }, (duration + 1.5) * 1000);

    } catch (e) {
      console.error('Error in RaindropMelodyEngine.triggerNote:', e);
    }
  }

  public getConfig(): RaindropMelodyConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<RaindropMelodyConfig>) {
    this.config = {
      ...this.config,
      ...newConfig,
      droplet: { ...this.config.droplet, ...newConfig.droplet },
      metallic: { ...this.config.metallic, ...newConfig.metallic },
      ripple: { ...this.config.ripple, ...newConfig.ripple },
      space: { ...this.config.space, ...newConfig.space },
    };

    if (this.outputBus) {
      this.outputBus.gain.setValueAtTime(
        Tone.dbToGain(this.config.droplet.volume),
        Tone.now()
      );
    }
    if (this.mainFilter) {
      this.mainFilter.frequency.setValueAtTime(this.config.space.cutoff, Tone.now());
    }
    if (this.feedbackDelay) {
      this.feedbackDelay.delayTime.setValueAtTime(this.config.space.delayTime, Tone.now());
      this.feedbackDelay.feedback.setValueAtTime(this.config.space.delayFeedback, Tone.now());
      this.feedbackDelay.wet.setValueAtTime(this.config.space.delayWet, Tone.now());
    }
    if (this.reverb) {
      this.reverb.decay = this.config.space.reverbDecay;
      this.reverb.wet.setValueAtTime(this.config.space.reverbWet, Tone.now());
    }
  }

  public dispose() {
    try {
      this.mainFilter?.dispose();
      this.feedbackDelay?.dispose();
      this.reverb?.dispose();
      this.limiter?.dispose();
      this.outputBus?.dispose();
      this.isInitialized = false;
    } catch (e) {}
  }
}

export const raindropMelody = new RaindropMelodyEngine();

