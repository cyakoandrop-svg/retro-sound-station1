/**
 * 76.0MHz「ELECTRO HEALING」（旧 76.0MHz）専用
 * エレクトロ・ヒーリング（Electro Healing）音源エンジン
 * 
 * 超時空の精神と肉体を癒やす、幽玄で雄大なアナログシンセサイザー、
 * 伸びやかに歌うエレクトロ・リード、空間に溶け込む極上のアンビエント・ストリングスパッド、
 * そして心を浄化するチベット・シンギングボウルやりん、厳かな未来儀礼太鼓の響きを生成。
 */

export interface ElectroHealingConfig {
  masterVolume: number;
}

export const DEFAULT_ELECTRO_HEALING_CONFIG: ElectroHealingConfig = {
  masterVolume: 0.85,
};

export class ElectroHealingEngine {
  private audioCtx: AudioContext | null = null;
  private destinationNode: AudioNode | null = null;
  private isInitialized = false;

  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private droneBassGain: GainNode | null = null;
  private percussionGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private leadGain: GainNode | null = null;
  private waveGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // 和音・メロディ・低音の重複発音および急激な音量増幅を防止するアクティブゲイン追跡
  private activePadGains: GainNode[] = [];
  private activeLeadGain: GainNode | null = null;
  private activeBassGain: GainNode | null = null;

  // ディレイ／エコー用バス（未来のオアシス・広大な虚空の反響をシミュレート）
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;

  public setDestination(node: AudioNode) {
    this.destinationNode = node;
    if (this.masterCompressor) {
      try {
        this.masterCompressor.disconnect();
        this.masterCompressor.connect(node);
      } catch (e) {
        console.warn('electroHealing setDestination warning:', e);
      }
    }
  }

  public init(ctx: AudioContext, destination?: AudioNode) {
    this.audioCtx = ctx;
    const targetDest = destination || ctx.destination;

    if (this.isInitialized && this.masterCompressor && this.masterCompressor.context === ctx) {
      if (this.destinationNode !== targetDest) {
        this.setDestination(targetDest);
      }
      return;
    }

    this.destinationNode = targetDest;

    try {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(DEFAULT_ELECTRO_HEALING_CONFIG.masterVolume, ctx.currentTime);

      // 各パートのゲイン設定（瞑想的で柔らかなバランス）
      this.droneBassGain = ctx.createGain();
      this.droneBassGain.gain.setValueAtTime(0.70, ctx.currentTime);

      this.percussionGain = ctx.createGain();
      this.percussionGain.gain.setValueAtTime(0.75, ctx.currentTime);

      this.padGain = ctx.createGain();
      this.padGain.gain.setValueAtTime(0.65, ctx.currentTime);

      this.leadGain = ctx.createGain();
      this.leadGain.gain.setValueAtTime(0.70, ctx.currentTime);

      // オーシャン・波音専用ゲイン
      this.waveGain = ctx.createGain();
      this.waveGain.gain.setValueAtTime(0.70, ctx.currentTime);

      // 広大な空間を演出するテープエコー／ディレイ（380ms）
      this.delayNode = ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.38, ctx.currentTime);

      this.delayFeedbackGain = ctx.createGain();
      this.delayFeedbackGain.gain.setValueAtTime(0.38, ctx.currentTime);

      this.delayFilter = ctx.createBiquadFilter();
      this.delayFilter.type = 'lowpass';
      this.delayFilter.frequency.setValueAtTime(1600, ctx.currentTime); // 自然な高域減衰

      // ディレイループの接続
      this.delayNode.connect(this.delayFilter);
      this.delayFilter.connect(this.delayFeedbackGain);
      this.delayFeedbackGain.connect(this.delayNode);
      this.delayFilter.connect(this.masterGain);

      // 各パートをマスターおよびディレイへ接続
      this.droneBassGain.connect(this.masterGain);
      this.percussionGain.connect(this.masterGain);
      this.padGain.connect(this.masterGain);
      this.leadGain.connect(this.masterGain);
      this.waveGain.connect(this.masterGain);

      // リードとパーカッション（鐘）の一部をディレイにセンド
      const sendToDelayLead = ctx.createGain();
      sendToDelayLead.gain.setValueAtTime(0.30, ctx.currentTime);
      this.leadGain.connect(sendToDelayLead);
      sendToDelayLead.connect(this.delayNode);

      const sendToDelayBell = ctx.createGain();
      sendToDelayBell.gain.setValueAtTime(0.35, ctx.currentTime);
      this.percussionGain.connect(sendToDelayBell);
      sendToDelayBell.connect(this.delayNode);

      // 波音の微細な空間ディレイ
      const sendToDelayWave = ctx.createGain();
      sendToDelayWave.gain.setValueAtTime(0.18, ctx.currentTime);
      this.waveGain.connect(sendToDelayWave);
      sendToDelayWave.connect(this.delayNode);

      // 突発的な音量増幅や重なりによるクリッピングを完全に防ぐソフトリミッター／コンプレッサー
      this.masterCompressor = ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-3.5, ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(10, ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(10, ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.20, ctx.currentTime);

      this.masterGain.connect(this.masterCompressor);
      this.masterCompressor.connect(targetDest);
      this.isInitialized = true;
    } catch (e) {
      console.warn('ElectroHealingEngine initialization failed:', e);
    }
  }

  /**
   * チャンネル変更や演奏停止時、すべての発音・ディレイ残響を即座に完全遮断
   */
  /**
   * クリック・ポップノイズ（ブツブツ音）を完全に防止する安全なゲインフェードアウトヘルパー
   * 不連続なステップジャンプ（setValueAtTime(gain.value)）を一切行わず、
   * cancelAndHoldAtTime または指数減衰 setTargetAtTime で微細なミリ秒単位の滑らかな減衰を実現
   */
  private fadeOutGain(gainNode: GainNode, now: number, fadeTime = 0.08) {
    try {
      if (typeof gainNode.gain.cancelAndHoldAtTime === 'function') {
        gainNode.gain.cancelAndHoldAtTime(now);
        gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeTime);
      } else {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setTargetAtTime(0.0001, now, Math.max(0.015, fadeTime * 0.35));
      }
    } catch (e) {
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setTargetAtTime(0.0001, now, 0.025);
      } catch (e2) {}
    }
  }

  /**
   * チャンネル変更や演奏停止時、すべての発音・ディレイ残響を即座に完全遮断
   */
  private ensureActive(now: number) {
    if (this.masterGain && this.masterGain.gain.value < 0.05) {
      try {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(DEFAULT_ELECTRO_HEALING_CONFIG.masterVolume, now, 0.02);
      } catch (e) {}
    }
    if (this.delayFeedbackGain && this.delayFeedbackGain.gain.value < 0.05) {
      try {
        this.delayFeedbackGain.gain.cancelScheduledValues(now);
        this.delayFeedbackGain.gain.setTargetAtTime(0.38, now, 0.02);
      } catch (e) {}
    }
  }

  public stopAll() {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    try {
      if (this.masterGain) {
        this.fadeOutGain(this.masterGain, now, 0.03);
      }
      if (this.delayFeedbackGain) {
        this.fadeOutGain(this.delayFeedbackGain, now, 0.03);
      }
      this.activePadGains.forEach((g) => {
        this.fadeOutGain(g, now, 0.03);
      });
      this.activePadGains = [];
      if (this.activeLeadGain) {
        this.fadeOutGain(this.activeLeadGain, now, 0.03);
        this.activeLeadGain = null;
      }
    } catch (e) {}
  }

  // 和音コード進行変更時の滑らかなパッドフェードアウト
  public fadePadChords(time?: number, fadeSec = 0.12) {
    if (!this.audioCtx) return;
    const now = time ? Math.max(time, this.audioCtx.currentTime) : this.audioCtx.currentTime;
    try {
      this.activePadGains.forEach((g) => {
        this.fadeOutGain(g, now, fadeSec);
      });
      this.activePadGains = [];
    } catch (e) {}
  }

  // =========================================================================
  // オーシャン・ピンクノイズバッファ生成（Paul Kellet アルゴリズム）
  // =========================================================================
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const duration = 8;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
        b6 = white * 0.115926;
      }
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  // =========================================================================
  // 寄せては返す波の音（オーシャン・ウェーブ・サージ）
  // =========================================================================
  public triggerOceanWave(
    intensity = 0.75,
    duration = 6.2,
    time?: number,
    pan = 0
  ) {
    if (!this.audioCtx || !this.waveGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, intensity));
    const soundDuration = Math.max(2.5, Math.min(10.0, duration));
    const surgePeak = soundDuration * 0.38; // 波が押し寄せ白波が立つ頂点 (約38%時点)

    // 1. ノイズ音源（ピンクノイズ）
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.getNoiseBuffer(ctx);
    noiseSource.loop = true;

    // 2. メインの波のうねりフィルター（Bandpass/Lowpassスウィープ）
    // 遠くの低音の波鳴り(140Hz) -> 浜辺に迫る波頭(750Hz〜950Hz) -> 静かに引く潮騒(160Hz)
    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.Q.setValueAtTime(1.6, now);
    waveFilter.frequency.setValueAtTime(140, now);
    waveFilter.frequency.exponentialRampToValueAtTime(850, now + surgePeak);
    waveFilter.frequency.exponentialRampToValueAtTime(160, now + soundDuration);

    // 3. 白波の飛沫・泡立ちフィルター（高域のシュワシュワ・さらさら感）
    const foamFilter = ctx.createBiquadFilter();
    foamFilter.type = 'bandpass';
    foamFilter.Q.setValueAtTime(1.2, now);
    foamFilter.frequency.setValueAtTime(1800, now);
    foamFilter.frequency.linearRampToValueAtTime(2400, now + surgePeak);
    foamFilter.frequency.exponentialRampToValueAtTime(1200, now + soundDuration);

    // 4. 音量エンベロープ
    const waveGainNode = ctx.createGain();
    waveGainNode.gain.setValueAtTime(0.0001, now);
    waveGainNode.gain.linearRampToValueAtTime(vol * 0.78, now + surgePeak);
    waveGainNode.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    const foamGainNode = ctx.createGain();
    foamGainNode.gain.setValueAtTime(0.0001, now);
    foamGainNode.gain.setValueAtTime(0.0001, now + surgePeak * 0.4);
    foamGainNode.gain.linearRampToValueAtTime(vol * 0.22, now + surgePeak + 0.1);
    foamGainNode.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration * 0.85);

    // 5. 海底の超低周波の重み（Sub-ocean rumble）
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(46, now);
    subOsc.frequency.linearRampToValueAtTime(52, now + surgePeak);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + soundDuration);

    const subGainNode = ctx.createGain();
    subGainNode.gain.setValueAtTime(0.0001, now);
    subGainNode.gain.linearRampToValueAtTime(vol * 0.38, now + surgePeak);
    subGainNode.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    // 6. ステレオ移動（浜辺を左から右、あるいは右から左へと波が洗う）
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      const startPan = Math.max(-0.8, Math.min(0.8, pan - 0.25));
      const endPan = Math.max(-0.8, Math.min(0.8, pan + 0.25));
      panner.pan.setValueAtTime(startPan, now);
      panner.pan.linearRampToValueAtTime(endPan, now + soundDuration);
    }

    // 接続
    noiseSource.connect(waveFilter);
    waveFilter.connect(waveGainNode);

    noiseSource.connect(foamFilter);
    foamFilter.connect(foamGainNode);

    subOsc.connect(subGainNode);

    const combiner = ctx.createGain();
    waveGainNode.connect(combiner);
    foamGainNode.connect(combiner);
    subGainNode.connect(combiner);

    if (panner) {
      combiner.connect(panner);
      panner.connect(this.waveGain);
    } else {
      combiner.connect(this.waveGain);
    }

    noiseSource.start(now);
    subOsc.start(now);
    noiseSource.stop(now + soundDuration + 0.08);
    subOsc.stop(now + soundDuration + 0.08);

    noiseSource.onended = () => {
      try {
        noiseSource.disconnect();
        subOsc.disconnect();
        waveFilter.disconnect();
        foamFilter.disconnect();
        waveGainNode.disconnect();
        foamGainNode.disconnect();
        subGainNode.disconnect();
        combiner.disconnect();
        if (panner) panner.disconnect();
      } catch (e) {}
    };
  }

  // =========================================================================
  // 1. エレクトロ・ヒーリング・リード (Singing Ambient Flute-Lead)
  // =========================================================================
  public triggerLead(
    freq: number,
    volume = 0.65,
    duration = 1.4,
    time?: number
  ) {
    if (!this.audioCtx || !this.leadGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const soundDuration = Math.max(0.4, Math.min(4.5, duration));

    // 同音の重複発音や急激な音量増幅を防止する単音（モノフォニック）クロスフェード管理
    if (this.activeLeadGain) {
      this.fadeOutGain(this.activeLeadGain, now, 0.08);
      this.activeLeadGain = null;
    }

    // メインオシレーター（三角波：ふくよかな笛の芯）
    const triOsc = ctx.createOscillator();
    triOsc.type = 'triangle';

    // サブオシレーター（ノコギリ波：シンセサイザーの艶）
    const sawOsc = ctx.createOscillator();
    sawOsc.type = 'sawtooth';

    // 基準ピッチを正確に発音（不要な半音ズレや音頭のピッチ降下を排除）
    triOsc.frequency.setValueAtTime(freq, now);
    sawOsc.frequency.setValueAtTime(freq, now);

    // ビブラートLFO（音の伸びとともに約250ms後から静かに寄り添う自然な揺らぎ: 約10セント）
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(4.8, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.0001, now);
    lfoGain.gain.setValueAtTime(0.0001, now + 0.20);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.006, now + 0.60);

    lfo.connect(lfoGain);
    lfoGain.connect(triOsc.frequency);
    lfoGain.connect(sawOsc.frequency);

    // 暖かく角の取れたアナログフィルター（息遣いのような緩やかな開閉）
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.8, now);
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.linearRampToValueAtTime(1800, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(900, now + soundDuration);

    // エンベロープゲイン（ゆったりとしたアタックと長いリリース）
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(vol * 0.70, now + 0.08); // 80msの自然なアタック
    gainNode.gain.linearRampToValueAtTime(vol * 0.65, now + Math.max(0.1, soundDuration - 0.4));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    triOsc.connect(filter);
    sawOsc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.leadGain);

    this.activeLeadGain = gainNode;

    lfo.start(now);
    triOsc.start(now);
    sawOsc.start(now);

    lfo.stop(now + soundDuration + 0.05);
    triOsc.stop(now + soundDuration + 0.05);
    sawOsc.stop(now + soundDuration + 0.05);

    triOsc.onended = () => {
      try {
        if (this.activeLeadGain === gainNode) {
          this.activeLeadGain = null;
        }
        lfo.disconnect();
        lfoGain.disconnect();
        triOsc.disconnect();
        sawOsc.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
  }

  /**
   * 水平線を飛翔する海鳥・海洋クジラの歌声のようなオーシャン・ヒーリング・シンセリード
   */
  public triggerOceanLead(
    freq: number,
    volume = 0.65,
    duration = 2.2,
    time?: number
  ) {
    if (!this.audioCtx || !this.leadGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const soundDuration = Math.max(0.6, Math.min(5.5, duration));

    // 先行するリード単音のクリックのない滑らかなクロスフェード（重複・音量膨張防止）
    if (this.activeLeadGain) {
      this.fadeOutGain(this.activeLeadGain, now, 0.08);
      this.activeLeadGain = null;
    }

    // メインオシレーター（純度の高いサイン波 ＋ 温かな三角波）
    const sineOsc = ctx.createOscillator();
    sineOsc.type = 'sine';

    const triOsc = ctx.createOscillator();
    triOsc.type = 'triangle';

    // 寄せる波のように滑り込むポルタメント
    const startFreq = freq * 0.95;
    sineOsc.frequency.setValueAtTime(startFreq, now);
    sineOsc.frequency.exponentialRampToValueAtTime(freq, now + 0.12);

    triOsc.frequency.setValueAtTime(startFreq * 1.001, now);
    triOsc.frequency.exponentialRampToValueAtTime(freq * 1.001, now + 0.12);

    // 水のゆらぎ LFO（4.5Hzの静かな波紋ビブラート）
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(4.5, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.0001, now);
    lfoGain.gain.setValueAtTime(0.0001, now + 0.16);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.014, now + 0.65);

    lfo.connect(lfoGain);
    lfoGain.connect(sineOsc.frequency);
    lfoGain.connect(triOsc.frequency);

    // 碧海のフィルター（過度な刺激を抑えたクリスタルな音質）
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.5, now);
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(2200, now + 0.28);
    filter.frequency.exponentialRampToValueAtTime(1100, now + soundDuration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(vol * 0.70, now + 0.14);
    gainNode.gain.linearRampToValueAtTime(vol * 0.64, now + Math.max(0.1, soundDuration - 0.5));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    sineOsc.connect(filter);
    triOsc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.leadGain);

    this.activeLeadGain = gainNode;

    lfo.start(now);
    sineOsc.start(now);
    triOsc.start(now);

    lfo.stop(now + soundDuration + 0.05);
    sineOsc.stop(now + soundDuration + 0.05);
    triOsc.stop(now + soundDuration + 0.05);

    sineOsc.onended = () => {
      try {
        if (this.activeLeadGain === gainNode) {
          this.activeLeadGain = null;
        }
        lfo.disconnect();
        lfoGain.disconnect();
        sineOsc.disconnect();
        triOsc.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
  }

  /**
   * 中東・シルクロードの風を思わせるネイ／リード調のオアシス・キャラバンリード (Oasis Caravan Reed Lead)
   */
  public triggerOasisLead(
    freq: number,
    volume = 0.65,
    duration = 0.95,
    time?: number,
    hasGraceOrnament = false
  ) {
    if (!this.audioCtx || !this.leadGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const soundDuration = Math.max(0.3, Math.min(3.5, duration));

    if (this.activeLeadGain) {
      this.fadeOutGain(this.activeLeadGain, now, 0.05);
      this.activeLeadGain = null;
    }

    // リード木管（ネイ／ズルナ）の微小な立ち上がりポルタメント（砂漠の装飾的節回し）
    const sawOsc = ctx.createOscillator();
    sawOsc.type = 'sawtooth';
    const sqOsc = ctx.createOscillator();
    sqOsc.type = 'triangle';

    const startPitch = hasGraceOrnament ? freq * 0.92 : freq * 0.97;
    sawOsc.frequency.setValueAtTime(startPitch, now);
    sawOsc.frequency.exponentialRampToValueAtTime(freq, now + (hasGraceOrnament ? 0.06 : 0.035));
    sqOsc.frequency.setValueAtTime(startPitch * 1.002, now);
    sqOsc.frequency.exponentialRampToValueAtTime(freq * 1.002, now + (hasGraceOrnament ? 0.06 : 0.035));

    // アラビアン・ビブラート（やや速めの6.2Hz、情熱的な揺らぎ）
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(6.2, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.0001, now);
    lfoGain.gain.setValueAtTime(0.0001, now + 0.10);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.012, now + 0.35);

    lfo.connect(lfoGain);
    lfoGain.connect(sawOsc.frequency);
    lfoGain.connect(sqOsc.frequency);

    // 中域フォルマントを強調した木管的レゾナンスフィルター
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.8, now);
    filter.frequency.linearRampToValueAtTime(2200, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(1200, now + soundDuration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(vol * 0.72, now + 0.03); // 素早い木管アタック
    gainNode.gain.linearRampToValueAtTime(vol * 0.65, now + soundDuration * 0.7);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    sawOsc.connect(filter);
    sqOsc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.leadGain);

    this.activeLeadGain = gainNode;

    lfo.start(now);
    sawOsc.start(now);
    sqOsc.start(now);

    lfo.stop(now + soundDuration + 0.05);
    sawOsc.stop(now + soundDuration + 0.05);
    sqOsc.stop(now + soundDuration + 0.05);

    sawOsc.onended = () => {
      try {
        if (this.activeLeadGain === gainNode) {
          this.activeLeadGain = null;
        }
        lfo.disconnect();
        lfoGain.disconnect();
        sawOsc.disconnect();
        sqOsc.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
  }

  /**
   * 星辰・オーロラの輝きを描くクリスタル・セレスティアルリード (Celestial Aurora Glass Lead)
   */
  public triggerCelestialLead(
    freq: number,
    volume = 0.55,
    duration = 2.4,
    time?: number
  ) {
    if (!this.audioCtx || !this.leadGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const soundDuration = Math.max(0.8, Math.min(6.0, duration));

    if (this.activeLeadGain) {
      this.fadeOutGain(this.activeLeadGain, now, 0.12);
      this.activeLeadGain = null;
    }

    // 純度の高いサイン波 ＋ クリスタル倍音
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.003, now); // 微小デチューンされたオクターブ倍音

    const osc3 = ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq * 0.5, now); // 下支えする柔らかな基音

    // 宇宙空間のゆっくりとしたオーロラゆらぎ LFO (3.2Hz)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(3.2, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.0001, now);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.007, now + 0.8);

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    // 澄んだハイパス＆ローパスのコンビネーション
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, now);
    filter.Q.setValueAtTime(0.7, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + soundDuration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(vol * 0.60, now + 0.22); // ふんわりと光が差すようなアタック
    gainNode.gain.linearRampToValueAtTime(vol * 0.52, now + soundDuration * 0.6);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.leadGain);

    this.activeLeadGain = gainNode;

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    lfo.stop(now + soundDuration + 0.05);
    osc1.stop(now + soundDuration + 0.05);
    osc2.stop(now + soundDuration + 0.05);
    osc3.stop(now + soundDuration + 0.05);

    osc1.onended = () => {
      try {
        if (this.activeLeadGain === gainNode) {
          this.activeLeadGain = null;
        }
        lfo.disconnect();
        lfoGain.disconnect();
        osc1.disconnect();
        osc2.disconnect();
        osc3.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
  }

  // =========================================================================
  // 2. 悠久のアンビエント・シンセパッド (Lush Electro Ambient Strings)
  // =========================================================================
  public triggerPadChord(
    notes: number[],
    volume = 0.70,
    duration = 3.8,
    time?: number
  ) {
    if (!this.audioCtx || !this.padGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const soundDuration = Math.max(0.6, Math.min(6.0, duration));
    const attackTime = Math.min(0.35, Math.max(0.08, soundDuration * 0.22));

    // 既存のシンセパッドが鳴っている場合、同一周波数の重なりによる急激な音量増幅（うなり・干渉）を防止するため、
    // 前のコードを滑らかにフェードアウトさせて安全にクロスフェードする
    if (this.activePadGains.length > 0) {
      const fadeTime = Math.min(0.20, soundDuration * 0.3);
      this.activePadGains.forEach((g) => {
        this.fadeOutGain(g, now, fadeTime);
      });
      this.activePadGains = [];
    }

    const newGains: GainNode[] = [];

    notes.forEach((freq, idx) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq * 0.998, now);
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(1.0, now);
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.linearRampToValueAtTime(1400, now + Math.min(1.2, soundDuration * 0.5));
      filter.frequency.exponentialRampToValueAtTime(650, now + soundDuration);

      const noteGain = ctx.createGain();
      newGains.push(noteGain);
      const perNoteVol = (vol * 0.45) / Math.sqrt(notes.length);
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(perNoteVol, now + attackTime);
      noteGain.gain.linearRampToValueAtTime(perNoteVol * 0.85, now + soundDuration * 0.6);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (panner) {
        const panVal = (idx % 2 === 0 ? -0.45 : 0.45);
        panner.pan.setValueAtTime(panVal, now);
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(panner);
        panner.connect(this.padGain!);
      } else {
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.padGain!);
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + soundDuration + 0.05);
      osc2.stop(now + soundDuration + 0.05);

      osc1.onended = () => {
        try {
          const gIdx = this.activePadGains.indexOf(noteGain);
          if (gIdx >= 0) this.activePadGains.splice(gIdx, 1);
          osc1.disconnect();
          osc2.disconnect();
          filter.disconnect();
          noteGain.disconnect();
          if (panner) panner.disconnect();
        } catch (e) {}
      };
    });

    this.activePadGains.push(...newGains);
  }

  /**
   * 碧海の光と波の呼吸を描く、オーシャン・アンビエント・シンセパッド
   */
  public triggerOceanPadChord(
    notes: number[],
    volume = 0.75,
    duration = 5.2,
    time?: number
  ) {
    if (!this.audioCtx || !this.padGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const soundDuration = Math.max(2.0, Math.min(7.5, duration));

    // 既存パッドの滑らかなクロスフェード（音の濁り・急激な音量倍増を防止）
    if (this.activePadGains.length > 0) {
      this.activePadGains.forEach((g) => {
        this.fadeOutGain(g, now, 0.35);
      });
      this.activePadGains = [];
    }

    const newGains: GainNode[] = [];

    notes.forEach((freq, idx) => {
      // 1. 基音（温かな三角波）
      const oscTri = ctx.createOscillator();
      oscTri.type = 'triangle';
      oscTri.frequency.setValueAtTime(freq, now);

      // 2. 陽光の煌めき（わずかにデチューンしたノコギリ波）
      const oscSaw = ctx.createOscillator();
      oscSaw.type = 'sawtooth';
      const detuneAmount = (idx % 2 === 0 ? 1.0025 : 0.9975);
      oscSaw.frequency.setValueAtTime(freq * detuneAmount, now);

      // 3. 海中の透明なサイン波（1オクターブ下の深海層）
      const oscSine = ctx.createOscillator();
      oscSine.type = 'sine';
      oscSine.frequency.setValueAtTime(freq * 0.5, now);

      // 4. 水の揺らぎ（ゆったりとしたフィルターモジュレーション）
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(1.4, now);
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.linearRampToValueAtTime(1250, now + soundDuration * 0.45);
      filter.frequency.exponentialRampToValueAtTime(420, now + soundDuration);

      // 5. アタックとエンベロープ（波のようにゆっくり寄せて引く）
      const noteGain = ctx.createGain();
      newGains.push(noteGain);
      const perNoteVol = (vol * 0.48) / Math.sqrt(notes.length);
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(perNoteVol, now + 1.1); // 1.1秒の雄大なスウェル
      noteGain.gain.linearRampToValueAtTime(perNoteVol * 0.88, now + soundDuration * 0.65);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (panner) {
        const panVal = (idx % 2 === 0 ? -0.4 : 0.4);
        panner.pan.setValueAtTime(panVal, now);
        oscTri.connect(filter);
        oscSaw.connect(filter);
        oscSine.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(panner);
        panner.connect(this.padGain!);
      } else {
        oscTri.connect(filter);
        oscSaw.connect(filter);
        oscSine.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.padGain!);
      }

      oscTri.start(now);
      oscSaw.start(now);
      oscSine.start(now);
      oscTri.stop(now + soundDuration + 0.05);
      oscSaw.stop(now + soundDuration + 0.05);
      oscSine.stop(now + soundDuration + 0.05);

      oscTri.onended = () => {
        try {
          const gIdx = this.activePadGains.indexOf(noteGain);
          if (gIdx >= 0) this.activePadGains.splice(gIdx, 1);
          oscTri.disconnect();
          oscSaw.disconnect();
          oscSine.disconnect();
          filter.disconnect();
          noteGain.disconnect();
          if (panner) panner.disconnect();
        } catch (e) {}
      };
    });

    this.activePadGains.push(...newGains);
  }

  /**
   * 水面のきらめき・穏やかなさざ波を描くクリスタル・マリン・トーン（アルペジオ／リフレクション）
   */
  public triggerOceanRipple(
    freq: number,
    volume = 0.50,
    time?: number,
    pan = 0
  ) {
    if (!this.audioCtx || !this.leadGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.05, Math.min(1.0, volume));

    // 1. 基音（透き通るサイン波）
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // 2. 水の透明感を与える倍音（2オクターブ上の純音）
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.0, now);

    // 3. ローパスフィルター（角の取れた瑞々しい音色）
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.2, now);
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 1.2);

    // 4. アンプエンベロープ（水面に光が落ちて静かに溶けていく減衰）
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(vol * 0.45, now + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(Math.max(-0.8, Math.min(0.8, pan)), now);
    }

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);

    if (panner) {
      gainNode.connect(panner);
      panner.connect(this.leadGain);
    } else {
      gainNode.connect(this.leadGain);
    }

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.45);
    osc2.stop(now + 1.45);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        filter.disconnect();
        gainNode.disconnect();
        if (panner) panner.disconnect();
      } catch (e) {}
    };
  }

  /**
   * 深海の包容力と波の底流を描く、温かで穏やかなディープオーシャン・ベース
   */
  public triggerDeepOceanBass(
    freq: number,
    volume = 0.65,
    duration = 4.8,
    time?: number
  ) {
    if (!this.audioCtx || !this.droneBassGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const soundDuration = Math.max(1.8, Math.min(7.0, duration));

    // 前の低音との重複による低域ブーミング・音量倍増を防止
    if (this.activeBassGain) {
      this.fadeOutGain(this.activeBassGain, now, 0.16);
      this.activeBassGain = null;
    }

    let bassPitch = freq;
    while (bassPitch > 110) bassPitch *= 0.5;
    while (bassPitch < 40) bassPitch *= 2;

    const oscSine = ctx.createOscillator();
    oscSine.type = 'sine';
    oscSine.frequency.setValueAtTime(bassPitch, now);

    const oscTri = ctx.createOscillator();
    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(bassPitch * 1.001, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.0, now);
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.linearRampToValueAtTime(260, now + 1.2);
    filter.frequency.exponentialRampToValueAtTime(120, now + soundDuration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(vol * 0.70, now + 0.35); // 穏やかに包み込むスローアタック
    gainNode.gain.linearRampToValueAtTime(vol * 0.65, now + soundDuration * 0.65);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    oscSine.connect(filter);
    oscTri.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.droneBassGain);

    this.activeBassGain = gainNode;

    oscSine.start(now);
    oscTri.start(now);
    oscSine.stop(now + soundDuration + 0.05);
    oscTri.stop(now + soundDuration + 0.05);

    oscSine.onended = () => {
      try {
        if (this.activeBassGain === gainNode) {
          this.activeBassGain = null;
        }
        oscSine.disconnect();
        oscTri.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
  }

  // =========================================================================
  // 3. 瞑想的ドローン・シンセベース (Taurus Style Meditative Drone)
  // =========================================================================
  public triggerDroneBass(
    freq: number,
    volume = 0.75,
    duration = 4.0,
    time?: number
  ) {
    if (!this.audioCtx || !this.droneBassGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const soundDuration = Math.max(1.0, Math.min(6.5, duration));

    // 前の低音との重複による低域ブーミング・音量倍増を防止
    if (this.activeBassGain) {
      this.fadeOutGain(this.activeBassGain, now, 0.16);
      this.activeBassGain = null;
    }

    // メイン低音（三角波）＋ 豊かな倍音（低域ノコギリ波）＋ サブオシレーター（超低域サイン波）
    const triOsc = ctx.createOscillator();
    triOsc.type = 'triangle';
    triOsc.frequency.setValueAtTime(freq, now);

    const sawOsc = ctx.createOscillator();
    sawOsc.type = 'sawtooth';
    sawOsc.frequency.setValueAtTime(freq, now);

    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.1, now);
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + soundDuration);

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.0001, now);
    mainGain.gain.linearRampToValueAtTime(vol * 0.75, now + 0.25);
    mainGain.gain.linearRampToValueAtTime(vol * 0.65, now + soundDuration * 0.7);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(vol * 0.55, now + 0.20);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    triOsc.connect(filter);
    sawOsc.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.droneBassGain);

    subOsc.connect(subGain);
    subGain.connect(this.droneBassGain);

    this.activeBassGain = mainGain;

    triOsc.start(now);
    sawOsc.start(now);
    subOsc.start(now);

    triOsc.stop(now + soundDuration + 0.05);
    sawOsc.stop(now + soundDuration + 0.05);
    subOsc.stop(now + soundDuration + 0.05);

    triOsc.onended = () => {
      try {
        if (this.activeBassGain === mainGain) {
          this.activeBassGain = null;
        }
        triOsc.disconnect();
        sawOsc.disconnect();
        subOsc.disconnect();
        filter.disconnect();
        mainGain.disconnect();
        subGain.disconnect();
      } catch (e) {}
    };
  }

  // =========================================================================
  // 4. 心を洗うチベット・シンギングボウル＆おりん / オーシャンチャイム
  // =========================================================================
  public triggerBell(
    type: 'singingBowl' | 'templeGong' | 'windChime' | 'oceanChime' | 'seaDrop' | 'fingerCymbal' | 'celestialBell' = 'singingBowl',
    volume = 0.70,
    time?: number
  ) {
    if (!this.audioCtx || !this.percussionGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));

    if (type === 'fingerCymbal') {
      // キャラバンの旅路・中東のフィンガーシンバル（Zill / 金属の微細なきらめき）
      const baseFreq = 2640;
      const ratios = [1.0, 1.414, 2.18];
      ratios.forEach((ratio, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * ratio, now);

        const gain = ctx.createGain();
        const partVol = (vol * (idx === 0 ? 0.35 : 0.18)) / (idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(partVol, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(gain);
        gain.connect(this.percussionGain!);

        osc.start(now);
        osc.stop(now + 0.90);
      });
      return;
    }

    if (type === 'celestialBell') {
      // 天空・星辰の海（第7チャクラ・クラウン 963Hz 神秘のソルフェジオベル）
      const baseFreq = 963.0;
      const ratios = [1.0, 2.002, 3.14];
      ratios.forEach((ratio, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * ratio, now);

        const gain = ctx.createGain();
        const partVol = (vol * (idx === 0 ? 0.45 : 0.22)) / (idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(partVol, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        gain.connect(this.percussionGain!);

        osc.start(now);
        osc.stop(now + 3.25);
      });
      return;
    }

    if (type === 'oceanChime' || type === 'seaDrop') {
      // 碧海の水滴・クリスタルベル（水面のきらめき・ソルフェジオ周波数 852Hz / 1760Hz）
      const baseFreq = type === 'seaDrop' ? 1046.50 : 1760.00;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * 0.94, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.015);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol * 0.40, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(this.percussionGain);

      osc.start(now);
      osc.stop(now + 2.25);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };
      return;
    }

    if (type === 'singingBowl') {
      // 528Hz（愛と修復のソルフェジオ周波数）ベースのおりん・シンギングボウル
      const baseFreq = 528;
      const ratios = [1.0, 2.76, 5.40]; // 金属鉢の共鳴比
      const decay = 4.2;

      ratios.forEach((ratio, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        // わずかなデチューンで神秘的なうなり（Shimmering Beat）を発生
        const detuneFreq = baseFreq * ratio + (idx === 0 ? 0.8 : 0);
        osc.frequency.setValueAtTime(detuneFreq, now);

        const gain = ctx.createGain();
        const partVol = (vol * (idx === 0 ? 0.65 : 0.28)) / (idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(partVol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(this.percussionGain!);

        osc.start(now);
        osc.stop(now + decay + 0.05);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (e) {}
        };
      });
    } else if (type === 'templeGong') {
      // 厳かな低音の寺院の鐘（梵鐘）
      const baseFreq = 110;
      const ratios = [1.0, 1.48, 2.08, 3.22];
      const decay = 5.0;

      ratios.forEach((ratio, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * ratio, now);

        const gain = ctx.createGain();
        const partVol = (vol * 0.50) / (idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(partVol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(this.percussionGain!);

        osc.start(now);
        osc.stop(now + decay + 0.05);
      });
    } else {
      // 風鈴／クリスタルチャイム
      const baseFreq = 1320;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol * 0.40, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc.connect(gain);
      gain.connect(this.percussionGain);

      osc.start(now);
      osc.stop(now + 2.05);
    }
  }

  // =========================================================================
  // 5. 厳かな儀礼太鼓 (Ceremonial Drum / Earth Pulse)
  // =========================================================================
  public triggerTaiko(volume = 0.85, time?: number) {
    if (!this.audioCtx || !this.percussionGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const duration = 1.4;

    // 1. 皮の振動と打撃音（ピッチベンド：98Hz -> 38Hz）
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(98, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);

    // 2. 太鼓の胴鳴り（木胴の深い響き）
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.setValueAtTime(75, now);
    bodyFilter.Q.setValueAtTime(2.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol * 0.95, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 3. アタックの皮打ちクリック
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(220, now);
    clickOsc.frequency.exponentialRampToValueAtTime(50, now + 0.025);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.linearRampToValueAtTime(vol * 0.45, now + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(bodyFilter);
    bodyFilter.connect(gain);
    gain.connect(this.percussionGain);

    clickOsc.connect(clickGain);
    clickGain.connect(this.percussionGain);

    osc.start(now);
    clickOsc.start(now);
    osc.stop(now + duration + 0.05);
    clickOsc.stop(now + 0.04);

    osc.onended = () => {
      try {
        osc.disconnect();
        clickOsc.disconnect();
        bodyFilter.disconnect();
        gain.disconnect();
        clickGain.disconnect();
      } catch (e) {}
    };
  }

  // =========================================================================
  // 6. キャラバン・民族フレームドラム (Ethnic Frame Drum / Duff)
  // =========================================================================
  public triggerFrameDrum(volume = 0.75, pitch = 115, time?: number) {
    if (!this.audioCtx || !this.percussionGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.1, Math.min(1.0, volume));
    const duration = 0.55;

    // フレームドラム特有の弾力あるピッチ降下（130Hz -> 75Hz）
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.58, now + 0.12);

    const drumFilter = ctx.createBiquadFilter();
    drumFilter.type = 'lowpass';
    drumFilter.frequency.setValueAtTime(280, now);
    drumFilter.Q.setValueAtTime(2.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol * 0.85, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 指先の乾いたスナップ音（羊皮のタップ）
    const snapOsc = ctx.createOscillator();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(380, now);
    snapOsc.frequency.exponentialRampToValueAtTime(90, now + 0.018);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.0001, now);
    snapGain.gain.linearRampToValueAtTime(vol * 0.40, now + 0.002);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(drumFilter);
    drumFilter.connect(gain);
    gain.connect(this.percussionGain);

    snapOsc.connect(snapGain);
    snapGain.connect(this.percussionGain);

    osc.start(now);
    snapOsc.start(now);
    osc.stop(now + duration + 0.05);
    snapOsc.stop(now + 0.03);
  }

  // =========================================================================
  // 7. 天空・星辰の海 スターライト・クリスタルチャイム (Celestial Starlight Chime)
  // =========================================================================
  public triggerStarlightChime(freq: number, volume = 0.45, time?: number, pan = 0) {
    if (!this.audioCtx || !this.leadGain) return;
    const ctx = this.audioCtx;
    const now = time ? Math.max(time, ctx.currentTime) : ctx.currentTime;
    this.ensureActive(now);
    const vol = Math.max(0.05, Math.min(1.0, volume));

    // 純粋なクリスタルサイン波 ＋ 12度上（オクターブ+5度）の星屑倍音
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 3.0, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(450, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(vol * 0.50, now + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(Math.max(-0.8, Math.min(0.8, pan)), now);
    }

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);

    if (panner) {
      gainNode.connect(panner);
      panner.connect(this.leadGain);
    } else {
      gainNode.connect(this.leadGain);
    }

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.85);
    osc2.stop(now + 1.85);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        filter.disconnect();
        gainNode.disconnect();
        if (panner) panner.disconnect();
      } catch (e) {}
    };
  }
}

export const electroHealing = new ElectroHealingEngine();
// 下位互換性用エイリアス
export const kitaroHealing = electroHealing;
