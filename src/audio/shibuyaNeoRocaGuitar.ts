/**
 * 92.4MHz「SHIBUYA DAYLIGHT GROOVE」Cat・street・Twist (Neo-Roca) 専用
 * 80s ネオロカビリー・トゥワンギーギター音源エンジン (Gretsch 6120 Twang & Safe Slapback Echo)
 *
 * 特徴:
 * 1. トゥワング・ピックアタック: ピックで弦を弾く瞬間の鋭いエッジとバイト感
 * 2. ホローボディ共鳴: ウッディな箱鳴りとヴィンテージ・クランチの倍音
 * 3. 安全なフィードフォワード・スラップバックエコー (115ms):
 *    再帰フィードバックループを持たない単一リピート設計により、
 *    音割れや発散ノイズ（NaN/爆音）を100%防止し、澄んだ王道ロカビリーエコーを実現。
 * 4. 内蔵ダイナミクスリミッター: 突発的な過大入力やクリッピング歪みを厳格に抑制。
 */

export interface ShibuyaNeoRocaGuitarConfig {
  volume: number; // マスター音量
  slapbackDelayMs: number; // スラップバックエコー遅延時間 (ms)
  slapbackMix: number; // スラップバック音量比率
}

export const DEFAULT_SHIBUYA_NEO_ROCA_GUITAR_CONFIG: ShibuyaNeoRocaGuitarConfig = {
  volume: 0.85,
  slapbackDelayMs: 115, // 王道の115msスラップバックテープエコー
  slapbackMix: 0.28,    // 原音を引き立てるクリアなスラップバック比率
};

class ShibuyaNeoRocaGuitarEngine {
  private config: ShibuyaNeoRocaGuitarConfig = { ...DEFAULT_SHIBUYA_NEO_ROCA_GUITAR_CONFIG };
  private isInitialized = false;
  private rawContext: AudioContext | null = null;
  private destinationNode: AudioNode | null = null;

  // ネイティブ Web Audio 信号処理ノード
  private inputBus: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private slapbackDelayNode: DelayNode | null = null;
  private slapbackToneFilter: BiquadFilterNode | null = null;
  private slapbackGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;

  public init(audioCtx: AudioContext, destinationNode?: AudioNode) {
    this.rawContext = audioCtx;
    if (destinationNode) {
      this.destinationNode = destinationNode;
    } else if (!this.destinationNode) {
      this.destinationNode = audioCtx.destination;
    }

    if (this.isInitialized && this.inputBus && this.masterGain) {
      if (destinationNode) {
        this.setDestination(destinationNode);
      }
      return;
    }

    try {
      // 1. ギター入力バス
      const inputBus = audioCtx.createGain();
      inputBus.gain.setValueAtTime(1.0, audioCtx.currentTime);

      // 2. ドライ音路
      const dryGain = audioCtx.createGain();
      dryGain.gain.setValueAtTime(0.72, audioCtx.currentTime);

      // 3. フィードフォワード・スラップバックエコー回路 (ループなし＝絶対安全)
      //    inputBus -> delayNode -> slapbackToneFilter -> slapbackGain -> masterCompressor
      const delay = audioCtx.createDelay(1.0);
      delay.delayTime.setValueAtTime(this.config.slapbackDelayMs / 1000, audioCtx.currentTime);

      const slapbackToneFilter = audioCtx.createBiquadFilter();
      slapbackToneFilter.type = 'lowpass';
      slapbackToneFilter.frequency.setValueAtTime(2800, audioCtx.currentTime);

      const slapbackGain = audioCtx.createGain();
      slapbackGain.gain.setValueAtTime(this.config.slapbackMix, audioCtx.currentTime);

      // 4. ダイナミクス・リミッター（過大入力・クリッピング・突発ノイズの完全防止）
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-6, audioCtx.currentTime);
      compressor.knee.setValueAtTime(6, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(8, audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressor.release.setValueAtTime(0.12, audioCtx.currentTime);

      // 5. マスターゲイン
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(this.config.volume, audioCtx.currentTime);

      // 結線:
      // ドライ経路: inputBus -> dryGain -> compressor
      inputBus.connect(dryGain);
      dryGain.connect(compressor);

      // スラップバック経路 (純粋なフィードフォワード・単一リピート): inputBus -> delay -> toneFilter -> slapGain -> compressor
      inputBus.connect(delay);
      delay.connect(slapbackToneFilter);
      slapbackToneFilter.connect(slapbackGain);
      slapbackGain.connect(compressor);

      // 出力: compressor -> masterGain -> destinationNode
      compressor.connect(masterGain);

      if (this.destinationNode) {
        masterGain.connect(this.destinationNode);
      } else {
        masterGain.connect(audioCtx.destination);
      }

      this.inputBus = inputBus;
      this.dryGain = dryGain;
      this.slapbackDelayNode = delay;
      this.slapbackToneFilter = slapbackToneFilter;
      this.slapbackGain = slapbackGain;
      this.masterCompressor = compressor;
      this.masterGain = masterGain;

      this.isInitialized = true;
    } catch (e) {
      console.warn('ShibuyaNeoRocaGuitar init warning:', e);
    }
  }

  public setDestination(node: AudioNode) {
    this.destinationNode = node;
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
        this.masterGain.connect(node);
      } catch (e) {}
    }
  }

  public updateConfig(newConfig: Partial<ShibuyaNeoRocaGuitarConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (!this.rawContext) return;
    const now = this.rawContext.currentTime;
    if (newConfig.volume !== undefined && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.config.volume, now);
    }
    if (newConfig.slapbackDelayMs !== undefined && this.slapbackDelayNode) {
      this.slapbackDelayNode.delayTime.setValueAtTime(this.config.slapbackDelayMs / 1000, now);
    }
    if (newConfig.slapbackMix !== undefined && this.slapbackGain) {
      this.slapbackGain.gain.setValueAtTime(this.config.slapbackMix, now);
    }
  }

  public getInternalNodes() {
    return {
      inputBus: this.inputBus,
      dryGain: this.dryGain,
      slapbackDelayNode: this.slapbackDelayNode,
      slapbackToneFilter: this.slapbackToneFilter,
      slapbackGain: this.slapbackGain,
      masterCompressor: this.masterCompressor,
      masterGain: this.masterGain,
    };
  }

  /**
   * ネオロカビリー・ホローボディギターの単音 / カッティング和音をトリガー
   */
  public triggerChord(
    notes: number[],
    volume = 0.50,
    duration = 0.16,
    time?: number,
    stagger = 0.007
  ) {
    if (!this.rawContext || !this.inputBus) return;
    const ctx = this.rawContext;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const baseTime = Math.max(ctx.currentTime + 0.005, time ?? ctx.currentTime);
    const effVol = Math.max(0.01, Math.min(1.0, volume));
    const effDur = Math.max(0.08, Math.min(0.60, duration));
    // 和音のノート数に応じて各ノートの音量を適切に配分（和音の合算オーバーロードを完全防止）
    const noteScale = 0.40 / Math.sqrt(Math.max(1, notes.length));

    notes.forEach((freq, idx) => {
      let f = freq;
      while (f < 196) f *= 2;
      while (f > 880) f *= 0.5;

      const noteStartTime = baseTime + idx * stagger;
      const noteVol = effVol * noteScale;

      // 1. デュアル・オシレーター（Gretsch 6120 トゥワング倍音）
      const oscTriangle = ctx.createOscillator();
      oscTriangle.type = 'triangle';
      oscTriangle.frequency.setValueAtTime(f * 1.012, noteStartTime);
      oscTriangle.frequency.exponentialRampToValueAtTime(f, noteStartTime + 0.006);

      const oscBrite = ctx.createOscillator();
      oscBrite.type = 'sawtooth';
      oscBrite.frequency.setValueAtTime(f * 1.018, noteStartTime);
      oscBrite.frequency.exponentialRampToValueAtTime(f, noteStartTime + 0.006);

      // 2. プレゼンス・フィルター（ホローボディの3kHz帯トゥワング＆520Hz胴鳴り）
      const twangFilter = ctx.createBiquadFilter();
      twangFilter.type = 'bandpass';
      twangFilter.frequency.setValueAtTime(2900, noteStartTime);
      twangFilter.Q.setValueAtTime(1.4, noteStartTime);

      const briteGain = ctx.createGain();
      briteGain.gain.setValueAtTime(0.40, noteStartTime);

      // 3. エンベロープゲイン
      const gainDirect = ctx.createGain();
      gainDirect.gain.setValueAtTime(0.0001, noteStartTime);
      gainDirect.gain.linearRampToValueAtTime(noteVol, noteStartTime + 0.003);
      gainDirect.gain.exponentialRampToValueAtTime(Math.max(0.0001, noteVol * 0.32), noteStartTime + 0.045);
      gainDirect.gain.exponentialRampToValueAtTime(0.0001, noteStartTime + effDur);

      // 配線
      oscTriangle.connect(gainDirect);

      oscBrite.connect(twangFilter);
      twangFilter.connect(briteGain);
      briteGain.connect(gainDirect);

      gainDirect.connect(this.inputBus!);

      oscTriangle.start(noteStartTime);
      oscTriangle.stop(noteStartTime + effDur + 0.03);

      oscBrite.start(noteStartTime);
      oscBrite.stop(noteStartTime + effDur + 0.03);

      oscTriangle.onended = () => {
        try {
          oscTriangle.disconnect();
          oscBrite.disconnect();
          twangFilter.disconnect();
          briteGain.disconnect();
          gainDirect.disconnect();
        } catch (e) {}
      };
    });
  }

  /**
   * ネオロカビリー・チョーキング＆ツイスト・ギターリック（単音フレーズ）
   */
  public triggerLickNote(
    freq: number,
    volume = 0.60,
    duration = 0.22,
    time?: number,
    chokeBend = false
  ) {
    if (!this.rawContext || !this.inputBus) return;
    const ctx = this.rawContext;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const noteStartTime = Math.max(ctx.currentTime + 0.005, time ?? ctx.currentTime);
    const effVol = Math.max(0.01, Math.min(1.0, volume)) * 0.48;
    const effDur = Math.max(0.10, Math.min(0.80, duration));

    let f = freq;
    while (f < 220) f *= 2;
    while (f > 1100) f *= 0.5;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';

    if (chokeBend) {
      osc.frequency.setValueAtTime(f * 0.9438, noteStartTime);
      osc.frequency.exponentialRampToValueAtTime(f, noteStartTime + 0.065);
    } else {
      osc.frequency.setValueAtTime(f * 1.012, noteStartTime);
      osc.frequency.exponentialRampToValueAtTime(f, noteStartTime + 0.005);
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3600, noteStartTime);
    filter.Q.setValueAtTime(1.5, noteStartTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, noteStartTime);
    gain.gain.linearRampToValueAtTime(effVol, noteStartTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, effVol * 0.35), noteStartTime + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStartTime + effDur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.inputBus);

    osc.start(noteStartTime);
    osc.stop(noteStartTime + effDur + 0.03);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }
}

export const shibuyaNeoRocaGuitar = new ShibuyaNeoRocaGuitarEngine();
