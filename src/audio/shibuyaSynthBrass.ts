/**
 * 92.4MHz「SHIBUYA DAYLIGHT GROOVE」専用
 * キレのあるアタックを持つ本格シンセブラス（Synth Brass）音源エンジン
 * 
 * サウンドコンセプト：
 * 80年代シティポップ／フュージョン・ファンクを象徴する、
 * 歯切れよくパンチの効いたアナログ・シンセブラス・スタブ。
 * 
 * 音響構造：
 * 1. 【デュアル・デチューン・ノコギリ波 (Dual Detuned Sawtooth)】:
 *    各ボイスにわずかにピッチをずらした2基のSawtooth波（±6セント）を配し、
 *    分厚く華やかなブラス・アンサンブルのうねりを創出。
 * 2. 【ファスト・ブラス・フィルター・エンベロープ (Snappy Brass Filter Sweep)】:
 *    アタック直後（約4ms）にフィルターカットオフが瞬時に400Hzから4500Hz〜6000Hzへ跳ね上がり、
 *    その後35msでディケイ。「パッ！」「バッ！」というキレ味抜群のブラス開口アタックを表現。
 * 3. 【タイト＆パンチ・VCA (Tight Staccato VCA Envelope)】:
 *    アタックタイムは極短（2ms）、リリースは素早く収束（0.06s〜0.12s）。
 *    リズムのもたつきを完全に排除したジャストタイミングのブラス演奏を実現。
 */

export class ShibuyaSynthBrassEngine {
  private audioCtx: AudioContext | null = null;
  private destinationNode: AudioNode | null = null;
  private outputBus: GainNode | null = null;
  private isInitialized = false;

  public setDestination(node: AudioNode) {
    this.destinationNode = node;
    if (this.outputBus) {
      try {
        this.outputBus.disconnect();
        this.outputBus.connect(node);
      } catch (e) {
        console.warn('shibuyaSynthBrass setDestination warning:', e);
      }
    }
  }

  public init(ctx: AudioContext, destination?: AudioNode) {
    this.audioCtx = ctx;
    const dest = destination || ctx.destination;
    if (!this.outputBus || this.outputBus.context !== ctx) {
      this.outputBus = ctx.createGain();
      this.outputBus.gain.setValueAtTime(1.0, ctx.currentTime);
      this.setDestination(dest);
    } else if (destination) {
      this.setDestination(dest);
    }
    this.isInitialized = true;
  }

  private ensureActive(now: number) {
    if (this.outputBus && this.outputBus.gain.value < 0.01) {
      try {
        this.outputBus.gain.cancelScheduledValues(now);
        this.outputBus.gain.setValueAtTime(Math.max(this.outputBus.gain.value, 0.0001), now);
        this.outputBus.gain.linearRampToValueAtTime(1.0, now + 0.015);
      } catch (e) {}
    }
  }

  /**
   * チャンネル変更や演奏停止時、すべての発音・余韻を即座に完全遮断
   */
  public stopAll() {
    if (!this.audioCtx || !this.outputBus) return;
    const now = this.audioCtx.currentTime;
    try {
      const curr = this.outputBus.gain.value;
      this.outputBus.gain.cancelScheduledValues(now);
      this.outputBus.gain.setValueAtTime(Math.max(curr, 0.0001), now);
      this.outputBus.gain.linearRampToValueAtTime(0.0001, now + 0.02);
    } catch (e) {}
  }

  /**
   * 単音シンセブラスノートの発音
   */
  public triggerNote(
    freq: number,
    volume: number = 0.6,
    duration: number = 0.16,
    startTime?: number
  ) {
    const ctx = this.audioCtx;
    if (!ctx || !this.isInitialized) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = startTime !== undefined ? startTime : ctx.currentTime;
    this.ensureActive(now);
    const dest = this.destinationNode || ctx.destination;

    // 1. デュアル・デチューン・オシレーター（Sawtooth × 2）
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    // デチューン（±5〜6セント）によるアナログシンセブラスの厚み
    const detuneFactor = 1.0035; // 約6セント上昇
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * detuneFactor, now);

    // 2. ブラス・レゾナンス・ローパスフィルター（キレのあるスウィープ）
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2.0, now); // 上品で耳に痛くないブラスレゾナンス

    // フィルターエンベロープ：瞬時に開いて素早く締まる
    const baseCutoff = Math.max(500, freq * 1.6);
    const peakCutoff = Math.min(6500, Math.max(3200, freq * 5.5));

    filter.frequency.setValueAtTime(baseCutoff, now);
    // 4msでピークまで急上昇（鋭いブラスアタック）
    filter.frequency.exponentialRampToValueAtTime(peakCutoff, now + 0.004);
    // 35msでボディのカットオフへディケイ
    filter.frequency.exponentialRampToValueAtTime(
      Math.min(peakCutoff * 0.40, baseCutoff * 1.5),
      now + 0.038
    );
    // ノート終了時に素早く閉じる
    filter.frequency.exponentialRampToValueAtTime(baseCutoff, now + duration + 0.06);

    // 3. 音量エンベロープ（VCA）
    const gainNode = ctx.createGain();
    const effectiveVol = Math.max(0.0001, volume * 0.42);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(effectiveVol, now + 0.005);

    // サスティン＆タイトなリリース
    const releaseTime = Math.max(0.05, Math.min(0.12, duration * 0.4));
    gainNode.gain.linearRampToValueAtTime(effectiveVol * 0.88, now + duration);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration + releaseTime);

    // 接続ルート
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.outputBus || dest);

    // 発音開始と停止
    const stopTime = now + duration + releaseTime + 0.02;
    osc1.start(now);
    osc2.start(now);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
  }

  /**
   * シンセブラス和音（ブラスセクション・スタブ）のトリガー
   * @param notes 構成音周波数配列 (Hz)
   * @param volume 音量 (0.0 ~ 1.0)
   * @param duration 持続時間 (秒)
   * @param startTime 発音開始時刻
   */
  public triggerChord(
    notes: number[],
    volume: number = 0.58,
    duration: number = 0.16,
    startTime?: number
  ) {
    const ctx = this.audioCtx;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = startTime !== undefined ? startTime : ctx.currentTime;
    const noteCount = notes.length;
    if (noteCount === 0) return;

    // 和音の音数に応じた音量補正（濁りを防ぎクリアに鳴らす）
    const scaledVol = volume / Math.sqrt(noteCount * 0.65);

    // 全声部をビートと完全一致させてジャストタイミングで鳴らす
    notes.forEach((freq) => {
      this.triggerNote(freq, scaledVol, duration, now);
    });
  }
}

export const shibuyaSynthBrass = new ShibuyaSynthBrassEngine();
