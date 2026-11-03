import * as Tone from 'tone';

export type DrumKitType = 'acoustic' | 'r8' | 'linn' | 'tr808' | 'cr78' | 'kit3';

export interface ToneDrumKitConfig {
  kit: DrumKitType;
  volume: number; // dB
  lowBoost: number; // dB
  midPresence: number; // dB
  highDamp: number; // dB
}

export const DEFAULT_TONE_DRUM_CONFIG: ToneDrumKitConfig = {
  kit: 'r8',
  volume: -1.0,
  lowBoost: 3.5,
  midPresence: 1.0,
  highDamp: -1.0,
};

const KIT_BASE_URLS: Record<DrumKitType, string> = {
  r8: 'https://tonejs.github.io/audio/drum-samples/R8/',
  linn: 'https://tonejs.github.io/audio/drum-samples/LINN/',
  acoustic: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/',
  tr808: 'https://tonejs.github.io/audio/drum-samples/Kit8/',
  cr78: 'https://tonejs.github.io/audio/drum-samples/CR78/',
  kit3: 'https://tonejs.github.io/audio/drum-samples/Kit3/',
};

// General MIDI standard drum mapping for Tone.Sampler
const DRUM_SAMPLE_URLS: Record<string, string> = {
  C1: 'kick.mp3',
  D1: 'snare.mp3',
  'F#1': 'hihat.mp3',
  A1: 'tom1.mp3',
  B1: 'tom2.mp3',
  C2: 'tom3.mp3',
};

class ToneDrumKitEngine {
  private config: ToneDrumKitConfig = { ...DEFAULT_TONE_DRUM_CONFIG };
  private isInitialized = false;
  private currentKit: DrumKitType = 'acoustic';

  // Multi-kit Tone.Sampler cache for instant latency-free kit switching
  private samplers: Map<DrumKitType, Tone.Sampler> = new Map();
  private loadedKits: Set<DrumKitType> = new Set();

  // Tone.js nodes
  private drumBus: Tone.Gain | null = null;
  private drumEq: Tone.EQ3 | null = null;
  private drumComp: Tone.Compressor | null = null;
  private masterOutput: Tone.Gain | null = null;
  private destinationNode: AudioNode | null = null;
  private rawContext: AudioContext | null = null;

  public init(audioCtx: AudioContext, destinationNode?: AudioNode) {
    if (destinationNode) {
      this.destinationNode = destinationNode;
    }

    if (this.isInitialized && this.rawContext === audioCtx) {
      if (destinationNode && this.masterOutput) {
        try {
          this.masterOutput.disconnect();
          Tone.connect(this.masterOutput, destinationNode);
        } catch (e) {}
      }
      return;
    }

    this.rawContext = audioCtx;

    try {
      if (Tone.getContext().rawContext !== audioCtx) {
        Tone.setContext(audioCtx);
      }

      this.drumBus = new Tone.Gain(1.0);

      // ドラム専用スタジオEQ: ふくよかな低音胴鳴りとヴィンテージな耳当たりの良さを両立
      this.drumEq = new Tone.EQ3({
        low: this.config.lowBoost,
        mid: this.config.midPresence,
        high: this.config.highDamp,
        lowFrequency: 180,
        highFrequency: 4500,
      });

      // ドラム専用スタジオコンプレッサー: アタックのパンチを残しつつ音像をまとめる
      this.drumComp = new Tone.Compressor({
        threshold: -16,
        ratio: 3.2,
        attack: 0.008,
        release: 0.15,
      });

      this.masterOutput = new Tone.Gain(Tone.dbToGain(this.config.volume));

      this.drumBus.chain(this.drumEq, this.drumComp, this.masterOutput);

      if (this.destinationNode) {
        Tone.connect(this.masterOutput, this.destinationNode);
      } else {
        this.masterOutput.toDestination();
      }

      // プライマリキットの即時初期化
      this.getOrCreateSampler(this.config.kit);

      // 他の主要キットをバックグラウンドで先読み（プリロード）し、局切り替え時のラグをゼロ化
      const allKits: DrumKitType[] = ['r8', 'linn', 'acoustic', 'tr808', 'cr78', 'kit3'];
      allKits.forEach((kit) => {
        if (kit !== this.config.kit) {
          setTimeout(() => {
            this.getOrCreateSampler(kit);
          }, 300);
        }
      });

      this.isInitialized = true;
    } catch (e) {
      console.warn('ToneDrumKitEngine init warning:', e);
    }
  }

  public setDestination(node: AudioNode) {
    this.destinationNode = node;
    if (this.masterOutput) {
      try {
        this.masterOutput.disconnect();
        Tone.connect(this.masterOutput, node);
      } catch (e) {
        console.warn('ToneDrumKitEngine setDestination warning:', e);
      }
    }
  }

  public setKit(kit: DrumKitType) {
    if (this.currentKit === kit) return;
    this.currentKit = kit;
    this.config.kit = kit;
    this.applyKitDSPs(kit);
    this.getOrCreateSampler(kit);
  }

  private applyKitDSPs(kit: DrumKitType) {
    if (!this.drumEq || !this.masterOutput || !this.drumComp) return;
    try {
      if (kit === 'cr78') {
        // Roland CR-78: 初期アナログ音源特有の軽さ・低域不足を根本から解消
        // 太いアナログサチュレーション感、低域のパンチ胴鳴り(+6.5dB)、スネア/アタックの輪郭(+2.8dB)
        this.drumEq.low.rampTo(6.5, 0.05);
        this.drumEq.mid.rampTo(2.8, 0.05);
        this.drumEq.high.rampTo(0.0, 0.05);
        this.drumComp.threshold.rampTo(-20, 0.05);
        this.drumComp.ratio.rampTo(3.8, 0.05);
        this.masterOutput.gain.rampTo(Tone.dbToGain(2.5), 0.05); // ヴィンテージ音源の出力ゲイン補正
      } else {
        this.drumEq.low.rampTo(this.config.lowBoost, 0.05);
        this.drumEq.mid.rampTo(this.config.midPresence, 0.05);
        this.drumEq.high.rampTo(this.config.highDamp, 0.05);
        this.drumComp.threshold.rampTo(-16, 0.05);
        this.drumComp.ratio.rampTo(3.2, 0.05);
        this.masterOutput.gain.rampTo(Tone.dbToGain(this.config.volume), 0.05);
      }
    } catch (e) {}
  }

  public getKit(): DrumKitType {
    return this.currentKit;
  }

  public isLoaded(kit?: DrumKitType): boolean {
    const targetKit = kit || this.currentKit;
    return this.loadedKits.has(targetKit);
  }

  private getOrCreateSampler(kit: DrumKitType): Tone.Sampler | null {
    if (this.samplers.has(kit)) {
      return this.samplers.get(kit)!;
    }

    const baseUrl = KIT_BASE_URLS[kit] || KIT_BASE_URLS.acoustic;

    try {
      const sampler = new Tone.Sampler({
        urls: DRUM_SAMPLE_URLS,
        baseUrl: baseUrl,
        attack: 0,
        release: 0.8,
        onload: () => {
          this.loadedKits.add(kit);
        },
      });

      if (this.drumBus) {
        sampler.connect(this.drumBus);
      }

      this.samplers.set(kit, sampler);
      return sampler;
    } catch (e) {
      console.warn(`ToneDrumKitEngine loadKit failed for ${kit}:`, e);
      return null;
    }
  }

  private getActiveSampler(): Tone.Sampler | null {
    return this.samplers.get(this.currentKit) || null;
  }

  /**
   * バスドラム (KICK)
   * Tone.jsのサンプラー実録サンプル発音（未ロード時は高品質なシンセキックに自動フォールバック）
   */
  public triggerKick(velocity = 0.5, time?: number) {
    const now = time !== undefined ? Math.max(time, (this.rawContext?.currentTime ?? 0)) : (this.rawContext?.currentTime || Tone.now());
    const scaledVel = Math.min(1.0, Math.max(0.1, velocity));

    const sampler = this.getActiveSampler();
    if (sampler && (this.loadedKits.has(this.currentKit) || sampler.loaded)) {
      try {
        const velMultiplier = this.currentKit === 'cr78' ? 1.4 : 1.0;
        sampler.triggerAttackRelease('C1', 0.45, now, Math.min(1.0, scaledVel * velMultiplier));
        // CR-78など初期アナログ音源の軽さ・低域不足を解消し、深いサブベースの胴鳴りと胸を突くパンチを付加
        if (this.currentKit === 'cr78') {
          this.triggerSubBassThump(scaledVel * 1.25, now);
        }
        return;
      } catch (e) {}
    }

    // フォールバック: Web Audioシンセキック
    this.fallbackSynthKick(scaledVel, now);
  }

  /**
   * スネアドラム (SNARE)
   * Tone.jsのサンプラー実録サンプル発音（未ロード時は高品質なシンセスネアに自動フォールバック）
   */
  public triggerSnare(velocity = 0.5, time?: number) {
    const now = time !== undefined ? Math.max(time, (this.rawContext?.currentTime ?? 0)) : (this.rawContext?.currentTime || Tone.now());
    const scaledVel = Math.min(1.0, Math.max(0.1, velocity));

    const sampler = this.getActiveSampler();
    if (sampler && (this.loadedKits.has(this.currentKit) || sampler.loaded)) {
      try {
        const velMultiplier = this.currentKit === 'cr78' ? 1.35 : 1.0;
        sampler.triggerAttackRelease('D1', 0.35, now, Math.min(1.0, scaledVel * velMultiplier));
        // CR-78の高音に偏ったスネアに温かい木製胴鳴りとパンチ・スナップを付加
        if (this.currentKit === 'cr78') {
          this.triggerSnareBodyReinforcement(scaledVel * 1.2, now);
        }
        return;
      } catch (e) {}
    }

    // フォールバック: Web Audioシンセスネア
    this.fallbackSynthSnare(scaledVel, now);
  }

  /**
   * ハイハット (HI-HAT)
   * Tone.jsのサンプラー実録サンプル発音（クローズ／オープン対応）
   */
  public triggerHiHat(velocity = 0.3, isOpen = false, time?: number) {
    const now = time !== undefined ? Math.max(time, (this.rawContext?.currentTime ?? 0)) : (this.rawContext?.currentTime || Tone.now());
    const scaledVel = Math.min(1.0, Math.max(0.05, velocity));

    const sampler = this.getActiveSampler();
    if (sampler && (this.loadedKits.has(this.currentKit) || sampler.loaded)) {
      try {
        // クローズドは短くタイトに、オープンは豊かな余韻を持たせて発音
        const dur = isOpen ? 0.45 : 0.08;
        const velMultiplier = this.currentKit === 'cr78' ? 1.35 : 1.0;
        sampler.triggerAttackRelease('F#1', dur, now, Math.min(1.0, scaledVel * (isOpen ? 0.95 : 1.0) * velMultiplier));
        if (this.currentKit === 'cr78') {
          this.triggerHiHatMetallicBody(scaledVel * 0.75, isOpen, now);
        }
        return;
      } catch (e) {}
    }

    // フォールバック: Web Audioシンセハイハット
    this.fallbackSynthHiHat(scaledVel, isOpen, now);
  }

  /**
   * クロススティック / リムショット (RIMSHOT / SIDESTICK)
   * ボサノヴァ・ジャズでアコースティックギターと完璧に調和する、乾いた木製シェル・フープの打音
   */
  public triggerRimShot(velocity = 0.4, time?: number) {
    const now = time !== undefined ? Math.max(time, (this.rawContext?.currentTime ?? 0)) : (this.rawContext?.currentTime || Tone.now());
    const scaledVel = Math.min(1.0, Math.max(0.05, velocity));

    if (!this.rawContext || !this.drumBus) return;
    try {
      // 1. フープの金属・木製アタッククリック
      const clickBuffer = this.rawContext.createBuffer(1, Math.floor(this.rawContext.sampleRate * 0.035), this.rawContext.sampleRate);
      const data = clickBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.rawContext.sampleRate * 0.005));
      }
      const clickSource = this.rawContext.createBufferSource();
      clickSource.buffer = clickBuffer;

      const clickFilter = this.rawContext.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(2400, now);
      clickFilter.Q.setValueAtTime(2.2, now);

      const clickGain = this.rawContext.createGain();
      clickGain.gain.setValueAtTime(0.0001, now);
      clickGain.gain.linearRampToValueAtTime(scaledVel * 0.55, now + 0.001);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

      clickSource.connect(clickFilter);
      clickFilter.connect(clickGain);
      Tone.connect(clickGain, this.drumBus);

      // 2. 木製スネアシェルの上品な共鳴トーン (430Hz)
      const woodOsc = this.rawContext.createOscillator();
      const woodGain = this.rawContext.createGain();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(420, now);
      woodOsc.frequency.exponentialRampToValueAtTime(280, now + 0.038);

      woodGain.gain.setValueAtTime(0.0001, now);
      woodGain.gain.linearRampToValueAtTime(scaledVel * 0.35, now + 0.002);
      woodGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

      woodOsc.connect(woodGain);
      Tone.connect(woodGain, this.drumBus);

      clickSource.start(now);
      woodOsc.start(now);
      clickSource.stop(now + 0.04);
      woodOsc.stop(now + 0.04);

      clickSource.onended = () => {
        try {
          clickSource.disconnect();
          clickFilter.disconnect();
          clickGain.disconnect();
          woodOsc.disconnect();
          woodGain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * タム (TOM: 1=High, 2=Mid, 3=Low)
   */
  public triggerTom(tomIndex: 1 | 2 | 3 = 1, velocity = 0.5, time?: number) {
    const now = time !== undefined ? Math.max(time, (this.rawContext?.currentTime ?? 0)) : (this.rawContext?.currentTime || Tone.now());
    const scaledVel = Math.min(1.0, Math.max(0.1, velocity));

    const sampler = this.getActiveSampler();
    if (sampler && (this.loadedKits.has(this.currentKit) || sampler.loaded)) {
      try {
        const noteMap: Record<number, string> = { 1: 'C2', 2: 'B1', 3: 'A1' };
        const note = noteMap[tomIndex] || 'A1';
        sampler.triggerAttackRelease(note, 0.45, now, scaledVel);
        return;
      } catch (e) {}
    }
  }

  public stopAll() {
    try {
      this.samplers.forEach((sampler) => {
        try {
          sampler.releaseAll();
        } catch (e) {}
      });
    } catch (e) {}
  }

  /**
   * サブベース・ボディ補強 (Sub-Bass Thump & Punch)
   * CR-78など初期アナログ音源の軽さ・低域不足を根本解決。
   * 胸を突くアタックパンチ(150Hz->52Hz)と深みのあるアナログ低音胴鳴りを付加
   */
  private triggerSubBassThump(vel: number, now: number) {
    if (!this.rawContext || !this.drumBus) return;
    try {
      const ctx = this.rawContext;

      // 1. パンチ・オシレーター (150Hz -> 52Hzの力強いピッチエンベロープ)
      const oscPunch = ctx.createOscillator();
      const gainPunch = ctx.createGain();
      oscPunch.type = 'sine';
      oscPunch.frequency.setValueAtTime(150, now);
      oscPunch.frequency.exponentialRampToValueAtTime(52, now + 0.22);

      const targetGainPunch = Math.min(1.0, vel * 1.15);
      gainPunch.gain.setValueAtTime(0.0001, now);
      gainPunch.gain.linearRampToValueAtTime(targetGainPunch, now + 0.003);
      gainPunch.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

      oscPunch.connect(gainPunch);
      Tone.connect(gainPunch, this.drumBus);

      // 2. 超低域サブベース (58Hz -> 38Hzの重厚な空気感・胴鳴り)
      const oscSub = ctx.createOscillator();
      const gainSub = ctx.createGain();
      const subFilter = ctx.createBiquadFilter();
      oscSub.type = 'triangle'; // 三角波で適度な第2次倍音・アナログ感を付与
      oscSub.frequency.setValueAtTime(58, now);
      oscSub.frequency.exponentialRampToValueAtTime(38, now + 0.28);

      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(150, now);

      gainSub.gain.setValueAtTime(0.0001, now);
      gainSub.gain.linearRampToValueAtTime(vel * 0.95, now + 0.005);
      gainSub.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      oscSub.connect(subFilter);
      subFilter.connect(gainSub);
      Tone.connect(gainSub, this.drumBus);

      oscPunch.start(now);
      oscSub.start(now);
      oscPunch.stop(now + 0.28);
      oscSub.stop(now + 0.34);

      oscPunch.onended = () => {
        try {
          oscPunch.disconnect();
          gainPunch.disconnect();
          oscSub.disconnect();
          subFilter.disconnect();
          gainSub.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * スネア・ウッドボディ＆スナップ補強 (Snare Body & Snap Reinforcement)
   * 高域に偏りがちなCR-78スネアに温かみのある中低域胴鳴りと、歯切れの良いアナログスナップを付加
   */
  private triggerSnareBodyReinforcement(vel: number, now: number) {
    if (!this.rawContext || !this.drumBus) return;
    try {
      const ctx = this.rawContext;

      // 1. レゾナント・トーン (220Hz -> 110Hzのウッディな胴鳴り)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vel * 0.90, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      Tone.connect(gain, this.drumBus);

      // 2. アナログスナップ・ホワイトノイズ（CR-78の極短ノイズに豊かなスナップの余韻を付加）
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.20), ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2600, now);
      noiseFilter.Q.setValueAtTime(1.6, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(vel * 0.75, now + 0.001);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      Tone.connect(noiseGain, this.drumBus);

      osc.start(now);
      noiseSource.start(now);
      osc.stop(now + 0.23);
      noiseSource.stop(now + 0.20);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
          noiseSource.disconnect();
          noiseFilter.disconnect();
          noiseGain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  /**
   * CR-78ハイハット・メタリックシマー補強
   */
  private triggerHiHatMetallicBody(vel: number, isOpen: boolean, now: number) {
    if (!this.rawContext || !this.drumBus) return;
    try {
      const ctx = this.rawContext;
      const dur = isOpen ? 0.35 : 0.07;
      const bufferSize = Math.floor(ctx.sampleRate * (dur + 0.02));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      const decayConst = isOpen ? 0.08 : 0.015;
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decayConst));
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6500, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vel * 0.65, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      source.connect(filter);
      filter.connect(gain);
      Tone.connect(gain, this.drumBus);

      source.start(now);
      source.stop(now + dur + 0.01);

      source.onended = () => {
        try {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  // --- サンプル読み込み前／オフライン時のシームレスなシンセフォールバック ---

  private fallbackSynthKick(vel: number, now: number) {
    if (!this.rawContext || !this.drumBus) return;
    try {
      const osc = this.rawContext.createOscillator();
      const gain = this.rawContext.createGain();
      const filter = this.rawContext.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);

      const targetGain = vel * 0.85;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      Tone.connect(gain, this.drumBus);

      osc.start(now);
      osc.stop(now + 0.16);

      osc.onended = () => {
        try {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  private fallbackSynthSnare(vel: number, now: number) {
    if (!this.rawContext || !this.drumBus) return;
    try {
      const bufferSize = Math.floor(this.rawContext.sampleRate * 0.12);
      const buffer = this.rawContext.createBuffer(1, bufferSize, this.rawContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.rawContext.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.rawContext.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400, now);
      noiseFilter.Q.setValueAtTime(1.2, now);

      const noiseGain = this.rawContext.createGain();
      const nVol = vel * 0.55;
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(nVol, now + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);

      const toneOsc = this.rawContext.createOscillator();
      toneOsc.type = 'triangle';
      toneOsc.frequency.setValueAtTime(180, now);
      toneOsc.frequency.exponentialRampToValueAtTime(65, now + 0.08);

      const toneGain = this.rawContext.createGain();
      const tVol = vel * 0.42;
      toneGain.gain.setValueAtTime(0.0001, now);
      toneGain.gain.linearRampToValueAtTime(tVol, now + 0.002);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      toneOsc.connect(toneGain);

      Tone.connect(noiseGain, this.drumBus);
      Tone.connect(toneGain, this.drumBus);

      noise.start(now);
      toneOsc.start(now);
      noise.stop(now + 0.14);
      toneOsc.stop(now + 0.09);

      noise.onended = () => {
        try {
          noise.disconnect();
          noiseFilter.disconnect();
          noiseGain.disconnect();
          toneOsc.disconnect();
          toneGain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }

  private fallbackSynthHiHat(vel: number, isOpen: boolean, now: number) {
    if (!this.rawContext || !this.drumBus) return;
    try {
      const duration = isOpen ? 0.16 : 0.045;
      const bufferSize = Math.floor(this.rawContext.sampleRate * duration);
      const buffer = this.rawContext.createBuffer(1, bufferSize, this.rawContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.rawContext.createBufferSource();
      noise.buffer = buffer;

      const filter = this.rawContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6500, now);

      const gain = this.rawContext.createGain();
      const hVol = vel * 0.42;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(hVol, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      Tone.connect(gain, this.drumBus);

      noise.start(now);
      noise.stop(now + duration + 0.01);

      noise.onended = () => {
        try {
          noise.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch (e) {}
      };
    } catch (e) {}
  }
}

export const toneDrumKit = new ToneDrumKitEngine();
