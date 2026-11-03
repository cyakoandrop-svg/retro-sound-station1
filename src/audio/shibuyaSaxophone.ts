/**
 * 92.4MHz「SHIBUYA DAYLIGHT GROOVE」専用
 * メロウで艶やかなサックス（Alto / Tenor Saxophone）音源エンジン
 * 
 * 音響構造：
 * 1. 【管体基本振動 (Acoustic Sawtooth + Sub/Harmonic)】:
 *    円錐管楽器（シングルリード）特有の倍音構成を再現するSawtooth基音に、
 *    リードの厚みと鳴りを再現するオクターブ上ハーモニクスをデュアルで合成。
 * 2. 【アタック・しゃくり (Pitch Scoop / Bend-up)】:
 *    サックス奏者のアンブシュアによるアタック直後の微小なピッチ上昇（freq * 0.965 -> freq）。
 * 3. 【管体フォルマント・フィルター (Formant Body Resonance)】:
 *    ベル共鳴と管体共振を模した2800Hz帯のダイナミック・ローパススイープ。
 * 4. 【ジャズ・ビブラート (Expressive Jazz Vibrato)】:
 *    0.3秒以上のサステイン時に、5.2Hzの艶やかなピッチ揺らぎを自然にブレンド。
 */

export class ShibuyaSaxophoneEngine {
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
        console.warn('shibuyaSaxophone setDestination warning:', e);
      }
    }
  }

  public init(ctx: AudioContext, destination?: AudioNode) {
    this.audioCtx = ctx;
    const dest = destination || this.destinationNode || ctx.destination;
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
   * サックス単音の発音（92.4MHz チャンネルと完全同一の音響アルゴリズム）
   * 
   * @param freq 音高周波数 (Hz)
   * @param volume 音量 (0.0 - 1.0)
   * @param duration 持続時間 (秒)
   * @param time 発音タイミング
   * @param autoOctaveDown 400Hz以上の高域時にテナー/アルトサックスの心地よい実音音域（1オクターブ下）に補正するかどうか
   */
  public triggerNote(
    freq: number,
    volume: number = 0.8,
    duration: number = 0.45,
    time?: number,
    autoOctaveDown: boolean = true
  ) {
    if (!this.audioCtx || !this.outputBus || !this.isInitialized) return;
    const now = time ?? this.audioCtx.currentTime;
    this.ensureActive(now);

    // 400Hzを超える高域の場合、92.4MHzのサックス実音域（暖かみのあるアルト/テナー帯）に合わせる
    const playFreq = (autoOctaveDown && freq > 450) ? freq * 0.5 : freq;

    try {
      const osc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(playFreq, now);

      // サックス特有の「しゃくり (Pitch Scoop / Bend-up)」の付加（アタック直後の微小なピッチの上昇）
      osc.frequency.setValueAtTime(playFreq * 0.965, now);
      osc.frequency.exponentialRampToValueAtTime(playFreq, now + 0.035);

      // サックスの円錐管共鳴とリードの厚みを模した、オクターブ上のハーモニクスオシレーター（デュアル構成）
      let oscHarm: OscillatorNode | null = null;
      let harmGain: GainNode | null = null;
      if (duration >= 0.25) {
        oscHarm = this.audioCtx.createOscillator();
        harmGain = this.audioCtx.createGain();
        oscHarm.type = 'sine';
        oscHarm.frequency.setValueAtTime(playFreq * 2.0, now);
        if (duration >= 0.4) {
          oscHarm.frequency.setValueAtTime(playFreq * 2.0 * 0.965, now);
          oscHarm.frequency.exponentialRampToValueAtTime(playFreq * 2.0, now + 0.035);
        }
        harmGain.gain.setValueAtTime(0.0001, now);
        harmGain.gain.linearRampToValueAtTime(volume * 0.32, now + 0.025);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.2);
      }

      // 表現豊かなジャズ・ビブラート（ピッチ揺らぎ）
      if (duration >= 0.32) {
        const vibRate = 5.2; // 少し艶のあるジャズ・ヴィブラート
        const vibDepth = playFreq * 0.009; 
        const vibStart = now + 0.12;
        const actualDuration = Math.max(0.1, duration * 1.2 - 0.12);
        const vibSteps = 24;
        const curve = new Float32Array(vibSteps + 1);
        for (let i = 0; i <= vibSteps; i++) {
          const t = i / vibSteps;
          const sineVal = Math.sin(t * Math.PI * 2 * vibRate * actualDuration);
          curve[i] = playFreq + sineVal * vibDepth * Math.min(1.0, t * 1.8);
        }
        try {
          osc.frequency.setValueCurveAtTime(curve, vibStart, actualDuration);
          if (oscHarm) {
            const harmCurve = new Float32Array(vibSteps + 1);
            for (let i = 0; i <= vibSteps; i++) {
              const t = i / vibSteps;
              const sineVal = Math.sin(t * Math.PI * 2 * vibRate * actualDuration);
              harmCurve[i] = (playFreq * 2.0) + sineVal * (vibDepth * 2.0) * Math.min(1.0, t * 1.8);
            }
            oscHarm.frequency.setValueCurveAtTime(harmCurve, vibStart, actualDuration);
          }
        } catch (e) {}
      }

      // エンベロープ（アタック〜自然なサックスの減衰）
      noteGain.gain.setValueAtTime(0.0001, now);
      const attackTime = 0.016;
      noteGain.gain.linearRampToValueAtTime(volume * 0.85, now + attackTime);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.35);

      // 管体フォルマント共鳴を模したダイナミック・ローパスフィルター（2800Hz近傍の抜けと温かみ）
      const cutoffFilter = this.audioCtx.createBiquadFilter();
      cutoffFilter.type = 'lowpass';
      const effectiveCutoff = 2800;
      cutoffFilter.frequency.setValueAtTime(effectiveCutoff * 0.75, now);
      cutoffFilter.frequency.exponentialRampToValueAtTime(effectiveCutoff * 1.25, now + 0.035);
      cutoffFilter.frequency.exponentialRampToValueAtTime(effectiveCutoff, now + 0.25);

      osc.connect(cutoffFilter);
      if (oscHarm && harmGain) {
        oscHarm.connect(harmGain);
        harmGain.connect(cutoffFilter);
      }
      cutoffFilter.connect(noteGain);
      noteGain.connect(this.outputBus);

      osc.start(now);
      if (oscHarm) oscHarm.start(now);

      const stopTime = now + duration * 1.4;
      osc.stop(stopTime);
      if (oscHarm) oscHarm.stop(stopTime);

      setTimeout(() => {
        try {
          osc.disconnect();
          if (oscHarm) oscHarm.disconnect();
          if (harmGain) harmGain.disconnect();
          cutoffFilter.disconnect();
          noteGain.disconnect();
        } catch (e) {}
      }, (duration * 1.4 + 0.1) * 1000);

    } catch (e) {
      console.warn('Failed to trigger saxophone note:', e);
    }
  }

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
}

export const shibuyaSaxophone = new ShibuyaSaxophoneEngine();
