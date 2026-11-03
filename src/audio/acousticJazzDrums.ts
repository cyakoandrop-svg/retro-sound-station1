import * as Tone from 'tone';
import { toneDrumKit } from './toneDrumKit';

/**
 * 昭和レトロ 晩の銀座ラウンジ・アコースティック小編成ジャズドラム音源 設定パラメータ
 * 
 * コンセプト：
 * 「晩の銀座。小さな個室で静かに集中している。
 * 隣の小さなラウンジから、控えめなジャズドラムとピアノが聞こえてくる。」
 * 「静かなピアノの後ろで、ブラシが小さく動いている」
 */
export interface AcousticJazzDrumsConfig {
  // 1. アコースティック・フェルトビーター・バスドラム (KICK)
  kick: {
    volume: number; // dB (-12 ~ -6 dB: 控えめで温かい)
    startFreq: number; // 78 Hz (電子ドラムの120Hz急峻アタックを排除し、自然な低音の膨らみ)
    endFreq: number; // 46 Hz (ブーミーにならない上品な低域)
    attack: number; // 0.012s (柔らかく丸いアタック)
    decay: number; // 0.12s (短くタイトな減衰)
    filterCutoff: number; // 160 Hz (丸みのあるアコースティック低域フィルター)
  };

  // 2. ブラシスネア / タップ＆スウィープ (SNARE)
  snare: {
    volume: number; // dB (-14 ~ -8 dB: ピアノより奥に定位)
    brushAttack: number; // 0.016s (「シャッ」「シュッ」という柔らかなブラシの立ち上がり)
    brushDecay: number; // 0.14s (ブラシがドラムヘッドを撫でる自然な擦過音)
    bandpassFreq1: number; // 1350 Hz (ブラシワイヤーの温かい中域)
    bandpassFreq2: number; // 2400 Hz (微細な擦れ倍音)
    bodyFreq: number; // 220 Hz (木製シェルの極めて控えめな胴鳴り)
    bodyGain: number; // -18 dB (目立たせない微かな空気感)
  };

  // 3. アコースティック・ダークハイハット (HI-HAT)
  hihat: {
    volume: number; // dB (-16 ~ -10 dB: 前に出ない乾いた刻み)
    closedDecay: number; // 0.038s (小さく乾いたアコースティックハット)
    openDecay: number; // 0.11s (控えめなハーフオープン・スウィッシュ)
    bandpassFreq: number; // 4200 Hz (電子的な7000Hz以上のギラつきを排除)
    highRollOff: number; // 5800 Hz (高域を丸めて耳当たりを優しく)
  };

  // 4. 同室ラウンジ空間音響 (Night Lounge Room Acoustic)
  room: {
    enabled: boolean;
    reverbDecay: number; // 0.72s (ピアノと完全に一致する小ラウンジのタイトな減衰)
    preDelay: number; // 0.005s (5ms: 素早い初期反射)
    wet: number; // 0.075 (音が遠くに引っ込まず、適度な近接感と温もり)
    earlyReflectionsGain: number; // 0.08 (卓上・壁面の初期反射)
    reverbHighDampFreq: number; // 2400 Hz (高域反射のダンピング)
  };

  // 5. ラジオ音響＆ダイナミクス (Radio DSP & Dynamics)
  radio: {
    enabled: boolean;
    lowCutFreq: number; // 140 Hz (余分な低域の濁りをカット)
    highCutFreq: number; // 4800 Hz (ヴィンテージスピーカーの温かみ)
    midPresenceFreq: number; // 1400 Hz
    midPresenceGain: number; // +1.5 dB
    masterVolume: number; // dB (-4.5 dB: ピアノの奥で鳴る適切なバランス)
  };
}

export const DEFAULT_ACOUSTIC_JAZZ_DRUMS_CONFIG: AcousticJazzDrumsConfig = {
  kick: {
    volume: -9.5,
    startFreq: 76,
    endFreq: 46,
    attack: 0.012,
    decay: 0.11,
    filterCutoff: 160,
  },
  snare: {
    volume: -10.0,
    brushAttack: 0.016,
    brushDecay: 0.13,
    bandpassFreq1: 1350,
    bandpassFreq2: 2400,
    bodyFreq: 220,
    bodyGain: -18,
  },
  hihat: {
    volume: -12.5,
    closedDecay: 0.038,
    openDecay: 0.11,
    bandpassFreq: 4100,
    highRollOff: 5600,
  },
  room: {
    enabled: true,
    reverbDecay: 0.72,
    preDelay: 0.005,
    wet: 0.075,
    earlyReflectionsGain: 0.08,
    reverbHighDampFreq: 2400,
  },
  radio: {
    enabled: true,
    lowCutFreq: 140,
    highCutFreq: 4800,
    midPresenceFreq: 1400,
    midPresenceGain: 1.5,
    masterVolume: -4.0,
  },
};

/**
 * 昭和レトロ 晩の銀座ラウンジ・アコースティック小編成ジャズドラムエンジン
 */
class AcousticJazzDrumsEngine {
  private config: AcousticJazzDrumsConfig = { ...DEFAULT_ACOUSTIC_JAZZ_DRUMS_CONFIG };
  private isInitialized = false;

  // ルーティング・ノード
  private drumBus: Tone.Gain | null = null;
  private roomBus: Tone.Gain | null = null;
  private roomReverb: Tone.Reverb | null = null;
  private reverbDampFilter: Tone.Filter | null = null;
  private earlyReflectionsDelay: Tone.FeedbackDelay | null = null;
  private earlyReflectionsGain: Tone.Gain | null = null;

  // Radio DSP
  private radioLowCut: Tone.Filter | null = null;
  private radioHighCut: Tone.Filter | null = null;
  private radioMidPresence: Tone.BiquadFilter | null = null;
  private masterOutput: Tone.Gain | null = null;
  private destinationNode: AudioNode | null = null;

  // Web Audio Context 参照
  private rawContext: AudioContext | null = null;

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
        console.warn('acousticJazzDrums setDestination warning:', e);
      }
    }
    toneDrumKit.setDestination(node);
    this.ensureActive();
  }

  /**
   * エンジンの初期化
   */
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

      // ドラム全体のサミングバス
      this.drumBus = new Tone.Gain(1.0);
      this.roomBus = new Tone.Gain(1.0);

      // 1. Room Reverb (ピアノと同じ小ラウンジ音響)
      this.roomReverb = new Tone.Reverb({
        decay: conf.room.reverbDecay,
        preDelay: conf.room.preDelay,
        wet: conf.room.wet,
      });

      this.reverbDampFilter = new Tone.Filter({
        frequency: conf.room.reverbHighDampFreq,
        type: 'lowpass',
        rolloff: -12,
      });

      this.drumBus.connect(this.roomReverb);
      this.roomReverb.connect(this.reverbDampFilter);
      this.reverbDampFilter.connect(this.roomBus);

      // 2. 初期反射 (Early Reflections: 16ms)
      this.earlyReflectionsDelay = new Tone.FeedbackDelay({
        delayTime: 0.016,
        feedback: 0.08,
        wet: 1.0,
      });
      this.earlyReflectionsGain = new Tone.Gain(conf.room.earlyReflectionsGain);

      this.drumBus.connect(this.earlyReflectionsDelay);
      this.earlyReflectionsDelay.connect(this.earlyReflectionsGain);
      this.earlyReflectionsGain.connect(this.roomBus);

      // 3. Radio DSP (周波数バランス調整)
      this.radioLowCut = new Tone.Filter({
        frequency: conf.radio.lowCutFreq,
        type: 'highpass',
        rolloff: -12,
      });

      this.radioHighCut = new Tone.Filter({
        frequency: conf.radio.highCutFreq,
        type: 'lowpass',
        rolloff: -12,
      });

      this.radioMidPresence = new Tone.BiquadFilter({
        frequency: conf.radio.midPresenceFreq,
        type: 'peaking',
        Q: 1.2,
        gain: conf.radio.midPresenceGain,
      });

      this.masterOutput = new Tone.Gain(Tone.dbToGain(conf.radio.masterVolume));

      this.roomBus.connect(this.radioLowCut);
      this.radioLowCut.connect(this.radioHighCut);
      this.radioHighCut.connect(this.radioMidPresence);
      this.radioMidPresence.connect(this.masterOutput);

      const targetDest = destinationNode || this.destinationNode;
      if (targetDest) {
        Tone.connect(this.masterOutput, targetDest);
      } else {
        this.masterOutput.toDestination();
      }

      // Tone.js 実録アコースティックドラムサンプラーの初期化＆設定
      toneDrumKit.init(audioCtx, destinationNode || undefined);
      toneDrumKit.setKit('acoustic');

      this.isInitialized = true;
    } catch (e) {
      console.warn('AcousticJazzDrumsEngine init warning:', e);
    }
  }

  /**
   * チャンネル変更や演奏停止時、すべてのドラム発音・余韻を即座に完全遮断
   */
  public ensureActive(time?: number) {
    const now = time !== undefined ? time : (this.rawContext?.currentTime || Tone.now());
    if (this.masterOutput) {
      try {
        const targetGain = Tone.dbToGain(this.config.radio.masterVolume);
        this.masterOutput.gain.cancelScheduledValues(now);
        this.masterOutput.gain.setValueAtTime(targetGain, now);
      } catch (e) {}
    }
  }

  public stopAll() {
    try {
      toneDrumKit.stopAll();
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
   * KICK: 柔らかく丸いフェルトビーター・アコースティックバスドラム (Tone.js サンプル音源優先)
   */
  public triggerKick(velocity = 0.5, time?: number) {
    const now = time ?? this.rawContext?.currentTime ?? Tone.now();
    this.ensureActive(now);

    // Tone.js公式アコースティックドラムサンプラーを優先発音
    if (toneDrumKit.isLoaded('acoustic')) {
      toneDrumKit.setKit('acoustic');
      toneDrumKit.triggerKick(velocity * 0.9, time);
      return;
    }

    if (!this.rawContext || !this.drumBus) return;
    const conf = this.config.kick;

    // 適切なジャズドラム音量範囲に調整
    const scaledVel = Math.min(1.0, Math.max(0.1, velocity));

    try {
      const osc = this.rawContext.createOscillator();
      const gain = this.rawContext.createGain();
      const filter = this.rawContext.createBiquadFilter();

      osc.type = 'sine';
      // 自然なピッチドロップ（急峻なドンではなく、ふっくらとした立ち上がり）
      osc.frequency.setValueAtTime(conf.startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(conf.endFreq, now + conf.decay);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(conf.filterCutoff, now);

      const targetGain = scaledVel * Tone.dbToGain(conf.volume);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + conf.attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + conf.decay + 0.02);

      osc.connect(filter);
      filter.connect(gain);

      // Tone.js の drumBus へ接続
      Tone.connect(gain, this.drumBus);

      osc.start(now);
      osc.stop(now + conf.decay + 0.05);

      osc.onended = () => {
        try {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * SNARE: ブラシによる柔らかな擦過音・スウィープ＆タップ (Tone.js サンプル音源優先)
   */
  public triggerSnare(velocity = 0.5, time?: number) {
    const now = time ?? this.rawContext?.currentTime ?? Tone.now();
    this.ensureActive(now);

    if (toneDrumKit.isLoaded('acoustic')) {
      toneDrumKit.setKit('acoustic');
      toneDrumKit.triggerSnare(velocity * 0.9, time);
      return;
    }

    if (!this.rawContext || !this.drumBus) return;
    const conf = this.config.snare;

    // 適切なジャズブラス・スネア音量範囲に調整
    const scaledVel = Math.min(1.0, Math.max(0.1, velocity));

    try {
      // 1. ブラシノイズ生成
      const bufferDuration = conf.brushDecay + 0.05;
      const bufferSize = Math.floor(this.rawContext.sampleRate * bufferDuration);
      const buffer = this.rawContext.createBuffer(1, bufferSize, this.rawContext.sampleRate);
      const data = buffer.getChannelData(0);

      // ブラシ特有の不均一なワイヤー擦過感の生成
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // わずかなグレイン（不規則な粒子感）
        data[i] = white * (0.8 + 0.2 * Math.sin(i * 0.05));
      }

      const noiseSource = this.rawContext.createBufferSource();
      noiseSource.buffer = buffer;

      // デュアルバンドパスフィルター（温かい中域ブラシと微細な擦れ音）
      const bp1 = this.rawContext.createBiquadFilter();
      bp1.type = 'bandpass';
      bp1.frequency.setValueAtTime(conf.bandpassFreq1, now);
      bp1.Q.setValueAtTime(1.1, now);

      const bp2 = this.rawContext.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.frequency.setValueAtTime(conf.bandpassFreq2, now);
      bp2.Q.setValueAtTime(1.3, now);

      const brushGain = this.rawContext.createGain();
      const targetGain = scaledVel * Tone.dbToGain(conf.volume);

      // 柔らかなブラシのアタックと自然な減衰
      brushGain.gain.setValueAtTime(0.0001, now);
      brushGain.gain.linearRampToValueAtTime(targetGain, now + conf.brushAttack);
      brushGain.gain.exponentialRampToValueAtTime(0.0001, now + conf.brushDecay);

      noiseSource.connect(bp1);
      noiseSource.connect(bp2);
      bp1.connect(brushGain);
      bp2.connect(brushGain);

      // 2. 極めて控えめな木製シェルの微弱トーン
      const bodyOsc = this.rawContext.createOscillator();
      const bodyGainNode = this.rawContext.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(conf.bodyFreq, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(conf.bodyFreq * 0.7, now + 0.06);

      const bodyVol = targetGain * Tone.dbToGain(conf.bodyGain);
      bodyGainNode.gain.setValueAtTime(0.0001, now);
      bodyGainNode.gain.linearRampToValueAtTime(bodyVol, now + 0.008);
      bodyGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      bodyOsc.connect(bodyGainNode);

      // サミング
      Tone.connect(brushGain, this.drumBus);
      Tone.connect(bodyGainNode, this.drumBus);

      noiseSource.start(now);
      bodyOsc.start(now);
      noiseSource.stop(now + bufferDuration);
      bodyOsc.stop(now + 0.08);

      noiseSource.onended = () => {
        try {
          noiseSource.disconnect();
          bp1.disconnect();
          bp2.disconnect();
          brushGain.disconnect();
          bodyOsc.disconnect();
          bodyGainNode.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * HI-HAT / RIDE TAP: 小さく乾いたアコースティックハイハット＆ソフトタップ (Tone.js サンプル音源優先)
   */
  public triggerHiHat(velocity = 0.3, isOpen = false, time?: number) {
    const now = time ?? this.rawContext?.currentTime ?? Tone.now();
    this.ensureActive(now);

    if (toneDrumKit.isLoaded('acoustic')) {
      toneDrumKit.setKit('acoustic');
      toneDrumKit.triggerHiHat(velocity * 0.9, isOpen, time);
      return;
    }

    if (!this.rawContext || !this.drumBus) return;
    const conf = this.config.hihat;

    // 適切なジャズハイハット音量範囲に調整
    const scaledVel = Math.min(1.0, Math.max(0.05, velocity));
    const decayTime = isOpen ? conf.openDecay : conf.closedDecay;

    try {
      const bufferDuration = decayTime + 0.04;
      const bufferSize = Math.floor(this.rawContext.sampleRate * bufferDuration);
      const buffer = this.rawContext.createBuffer(1, bufferSize, this.rawContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.rawContext.createBufferSource();
      noise.buffer = buffer;

      // バンドパス + 高域ロールオフ（耳障りな高音のキラつき・シャリシャリ感をカット）
      const bpFilter = this.rawContext.createBiquadFilter();
      bpFilter.type = 'bandpass';
      bpFilter.frequency.setValueAtTime(conf.bandpassFreq, now);
      bpFilter.Q.setValueAtTime(1.6, now);

      const lpFilter = this.rawContext.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.setValueAtTime(conf.highRollOff, now);

      const gain = this.rawContext.createGain();
      const targetGain = scaledVel * Tone.dbToGain(conf.volume);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

      noise.connect(bpFilter);
      bpFilter.connect(lpFilter);
      lpFilter.connect(gain);

      Tone.connect(gain, this.drumBus);

      noise.start(now);
      noise.stop(now + bufferDuration);

      noise.onended = () => {
        try {
          noise.disconnect();
          bpFilter.disconnect();
          lpFilter.disconnect();
          gain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }
}

export const acousticJazzDrums = new AcousticJazzDrumsEngine();
