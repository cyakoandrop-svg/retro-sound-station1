import * as Tone from 'tone';

/**
 * 105.8MHz「ROPPONGI Petrichor FM」専用 コポコポ水泡和音（アクア・バブルコード）音源エンジン
 * 
 * サウンドコンセプト：
 * 「夜の静かに降る雨」と「水面に湧き立つ気泡（コポコポ・ぷくぷく）」を表現した、
 * 豊かで暖かく、かつ明確に心地よく耳に届く水泡コード音源。
 * 
 * 音響構造：
 * 1. 【気泡ピッチスウィープ (Bubble Plop Pitch Rise)】:
 *    各構成音が水中で泡立つ瞬間のピッチ上昇（+140〜180セント）で「コポッ」と弾ける質感を形成
 * 2. 【液状フォルマント・レゾナンス (Liquid Resonant Shaping)】:
 *    水の丸みと透明感を強調するレゾナンスフィルター（Q=2.2〜3.0）
 * 3. 【水泡カスケード分散 (Aquatic Cascade Strum)】:
 *    和音の構成音が 25ms〜32ms の心地よい時間差で「コポ・コポ・コポッ」と連なって分散発音
 * 4. 【高信頼 Web Audio 出力】:
 *    イコライザー（bassFilter）へダイレクトに接続し、常に安定した音量でクリアに鳴り響く
 */

export class AquaBubbleChordEngine {
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
        console.warn('aquaBubbleChords setDestination warning:', e);
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
   * 水泡（コポコポ）和音コードのトリガー
   * @param notes 構成音の周波数配列 (Hz)
   * @param volume 音量 (0.0 ~ 1.0)
   * @param sustain 持続時間 (秒)
   * @param startTime 発音開始時刻 (AudioContext.currentTime)
   */
  public triggerChord(
    notes: number[],
    volume: number = 0.60,
    sustain: number = 2.0,
    startTime?: number
  ) {
    // コンテキストが未設定の場合の自動フォールバック
    if (!this.audioCtx || !this.isInitialized) {
      const toneCtx = Tone.getContext().rawContext as AudioContext;
      if (toneCtx) {
        this.init(toneCtx);
      } else {
        return;
      }
    }

    const ctx = this.audioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = startTime !== undefined ? startTime : ctx.currentTime;
    this.ensureActive(now);
    const effectiveVol = Math.max(0.1, Math.min(1.0, volume));

    // 低音から高音へソートして、水底から水面へ泡が昇るようにカスケード発音
    const sortedNotes = [...notes].sort((a, b) => a - b);
    const chordCount = sortedNotes.length;

    const isShortStaccato = sustain < 0.5;

    sortedNotes.forEach((freq, idx) => {
      // コポコポとした心地よい気泡の時間差（スタッカート時は小気味よく揃う10ms、アンビエント時は28ms間隔）
      const bubbleDelay = isShortStaccato
        ? idx * 0.010
        : idx * 0.028 + (Math.random() * 0.004);
      const noteStartTime = now + bubbleDelay;
      const noteDuration = Math.max(0.12, sustain - bubbleDelay);

      // 各ノートの音量バランス（和音の厚みと透明感を両立）
      const noteVol = (effectiveVol * 0.72) / Math.sqrt(Math.max(1, chordCount * 0.55));

      this.triggerBubbleVoice(freq, noteVol, noteDuration, noteStartTime);
    });
  }

  /**
   * 個々の気泡ノート（コポッ）の物理モデリング合成
   */
  private triggerBubbleVoice(
    freq: number,
    vol: number,
    duration: number,
    time: number
  ) {
    const ctx = this.audioCtx;
    if (!ctx) return;
    const dest = this.destinationNode || ctx.destination;
    const now = time;

    try {
      // --- 1. 気泡の主音（サイン波 ＋ 温かみのあるトライアングル波） ---
      const oscSine = ctx.createOscillator();
      const oscTri = ctx.createOscillator();
      oscSine.type = 'sine';
      oscTri.type = 'triangle';

      // 水泡の上昇ピッチスウィープ（「コポッ」と泡が水中で弾ける微細ピッチ変化: 約22ms）
      const startPitch = freq * 0.89; // 11%低い周波数からスタート
      oscSine.frequency.setValueAtTime(startPitch, now);
      oscSine.frequency.exponentialRampToValueAtTime(freq, now + 0.022);

      oscTri.frequency.setValueAtTime(startPitch, now);
      oscTri.frequency.exponentialRampToValueAtTime(freq, now + 0.022);

      // --- 2. 水泡の弾け・共鳴倍音（水膜の破裂音「プクッ」） ---
      const oscPop = ctx.createOscillator();
      oscPop.type = 'sine';
      const popFreq = freq * 2.76;
      oscPop.frequency.setValueAtTime(popFreq * 0.94, now);
      oscPop.frequency.exponentialRampToValueAtTime(popFreq * 1.04, now + 0.015);
      oscPop.frequency.exponentialRampToValueAtTime(popFreq * 0.85, now + 0.05);

      const gainPop = ctx.createGain();
      gainPop.gain.setValueAtTime(0.0001, now);
      gainPop.gain.linearRampToValueAtTime(vol * 0.28, now + 0.003);
      gainPop.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      // --- 3. 液状レゾナンス・ローパスフィルター (Liquid Lowpass Resonator) ---
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(2.6, now); // 水の丸みを強調するレゾナンス

      // フィルターエンベロープ: 気泡発生時に開き（明るいコポッ音）、その後まろやかに減衰
      const filterBase = Math.min(3600, Math.max(900, freq * 3.5));
      const filterPeak = Math.min(6500, Math.max(1600, freq * 5.2));
      filter.frequency.setValueAtTime(filterBase, now);
      filter.frequency.linearRampToValueAtTime(filterPeak, now + 0.02);
      filter.frequency.exponentialRampToValueAtTime(Math.max(500, freq * 1.8), now + 0.5);

      // --- 4. メインアンプエンベロープ（みずみずしいアタック ＋ 豊かなサスティン） ---
      const gainMain = ctx.createGain();
      gainMain.gain.setValueAtTime(0.0001, now);
      // 瞬時の立ち上がり (5ms)
      gainMain.gain.linearRampToValueAtTime(vol, now + 0.005);
      // 自然な減衰と余韻
      const decayTime = Math.min(0.08, duration * 0.4);
      gainMain.gain.linearRampToValueAtTime(vol * 0.75, now + decayTime);
      gainMain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // 各波形のバランスゲイン
      const gainSine = ctx.createGain();
      gainSine.gain.setValueAtTime(0.85, now);

      const gainTri = ctx.createGain();
      gainTri.gain.setValueAtTime(0.35, now);

      // ノードの接続
      oscSine.connect(gainSine);
      oscTri.connect(gainTri);
      gainSine.connect(filter);
      gainTri.connect(filter);

      oscPop.connect(gainPop);
      gainPop.connect(filter);

      filter.connect(gainMain);
      gainMain.connect(this.outputBus || dest);

      // 発音開始と停止
      oscSine.start(now);
      oscTri.start(now);
      oscPop.start(now);

      const stopTime = now + duration + 0.1;
      oscSine.stop(stopTime);
      oscTri.stop(stopTime);
      oscPop.stop(now + 0.07);

      // クリーンアップ
      oscSine.onended = () => {
        try {
          oscSine.disconnect();
          oscTri.disconnect();
          oscPop.disconnect();
          gainSine.disconnect();
          gainTri.disconnect();
          gainPop.disconnect();
          filter.disconnect();
          gainMain.disconnect();
        } catch (e) {}
      };
    } catch (e) {
      console.error('Error in AquaBubbleChordEngine.triggerBubbleVoice:', e);
    }
  }

  public dispose() {
    this.isInitialized = false;
  }
}

export const aquaBubbleChords = new AquaBubbleChordEngine();
