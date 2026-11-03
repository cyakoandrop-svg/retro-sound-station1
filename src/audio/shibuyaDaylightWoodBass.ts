import * as Tone from 'tone';

/**
 * 92.4MHz「SHIBUYA DAYLIGHT GROOVE」専用 アコースティック・ウッドベース音源エンジン
 * 
 * 本物のアコースティック・ダブルベース（指弾きピチカート・ウッドベース）の実録サンプル音源を使用。
 * 異音（電子音、ノコギリ波、サイン波スウィープ等のシンセサイザー音）を一切混入させず、
 * 純粋でオーガニックなウッドベースの温かい木質感と弦のピチカートの響きのみを提供します。
 */

export interface ShibuyaDaylightWoodBassConfig {
  volume: number; // マスター音量
}

export const DEFAULT_SHIBUYA_DAYLIGHT_WOOD_BASS_CONFIG: ShibuyaDaylightWoodBassConfig = {
  volume: 1.45, // アコースティック楽器アンサンブルで心地よく抜ける音量
};

// 実録アコースティック・ウッドベース音源 (FluidR3_GM / midi-js-soundfonts: acoustic_bass)
const WOOD_BASS_SAMPLE_URLS: Record<string, string> = {
  'E1': 'E1.mp3',
  'G1': 'G1.mp3',
  'A#1': 'Bb1.mp3',
  'C2': 'C2.mp3',
  'D#2': 'Eb2.mp3',
  'F#2': 'Gb2.mp3',
  'A2': 'A2.mp3',
  'C3': 'C3.mp3',
  'D#3': 'Eb3.mp3',
  'F#3': 'Gb3.mp3',
  'A3': 'A3.mp3',
};

const WOOD_BASS_BASE_URL = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_bass-mp3/';

class ShibuyaDaylightWoodBassEngine {
  private config: ShibuyaDaylightWoodBassConfig = { ...DEFAULT_SHIBUYA_DAYLIGHT_WOOD_BASS_CONFIG };
  private isInitialized = false;
  private rawContext: AudioContext | null = null;
  private destinationNode: AudioNode | null = null;

  // Tone.js 実録ピチカート・ウッドベースサンプラー
  private bassSampler: Tone.Sampler | null = null;
  private samplerLoaded = false;
  private toneMasterGain: Tone.Gain | null = null;

  // ネイティブ Web Audio 出力ノード（サンプラー読み込み中の極短時間フォールバック用）
  private fallbackMasterGain: GainNode | null = null;

  /**
   * 出力先オーディオノードの動的切り替え（サウンドラボ／ラジオ本体バスへの接続変更）
   */
  public setDestination(node: AudioNode) {
    this.destinationNode = node;
    if (this.toneMasterGain) {
      try {
        this.toneMasterGain.disconnect();
        Tone.connect(this.toneMasterGain, node);
      } catch (e) {
        console.warn('shibuyaDaylightWoodBass toneMasterGain setDestination warning:', e);
      }
    }
    if (this.fallbackMasterGain) {
      try {
        this.fallbackMasterGain.disconnect();
        this.fallbackMasterGain.connect(node);
      } catch (e) {
        console.warn('shibuyaDaylightWoodBass fallbackMasterGain setDestination warning:', e);
      }
    }
  }

  public init(audioCtx: AudioContext, destinationNode?: AudioNode) {
    this.rawContext = audioCtx;
    if (destinationNode) {
      this.setDestination(destinationNode);
    } else if (!this.destinationNode) {
      this.destinationNode = audioCtx.destination;
    }

    if (this.isInitialized && this.toneMasterGain) {
      return;
    }

    try {
      if (Tone.getContext().rawContext !== audioCtx) {
        Tone.setContext(audioCtx);
      }

      // フォールバック用のネイティブゲイン
      if (!this.fallbackMasterGain) {
        this.fallbackMasterGain = audioCtx.createGain();
        this.fallbackMasterGain.gain.setValueAtTime(this.config.volume, audioCtx.currentTime);
        if (this.destinationNode) {
          this.fallbackMasterGain.connect(this.destinationNode);
        } else {
          this.fallbackMasterGain.connect(audioCtx.destination);
        }
      }

      if (!this.toneMasterGain) {
        this.toneMasterGain = new Tone.Gain(this.config.volume);
        if (this.destinationNode) {
          this.toneMasterGain.connect(this.destinationNode);
        } else {
          this.toneMasterGain.toDestination();
        }
      }

      if (!this.bassSampler) {
        this.bassSampler = new Tone.Sampler({
          urls: WOOD_BASS_SAMPLE_URLS,
          baseUrl: WOOD_BASS_BASE_URL,
          attack: 0, // ピチカート実録サンプルの弦を指で弾く瞬間（Pluckアタック）を100%生かす
          release: 0.9,
          onload: () => {
            this.samplerLoaded = true;
            console.log('🎻 92.4ch 実録アコースティック・ウッドベース（ピチカート）サンプラーのロード完了');
          },
        });

        // ウッドベース専用の音響プロセッシング：
        // 1. イコライザー: 220Hz以下のふくよかな木製胴鳴りと、600Hz〜1.4kHzの指弾きアタックの輪郭を協調
        const woodBassEq = new Tone.EQ3({
          low: 4.8,            // 220Hz以下の温かく包み込むような低域・木製ホローボディ鳴りを強化
          mid: 3.2,            // 指先が太い弦を弾くピチカートのアタック感と弦のニュアンス（600Hz〜1.4kHz）を強調
          high: -1.2,          // キンキンした耳障りなノイズは抑えつつ、アタックのスナップ感と空気感を保持
          lowFrequency: 220,   // 低域の暖かみを担うクロスオーバー周波数
          highFrequency: 1400, // 指弾きアタック・プレゼンスを担うクロスオーバー周波数
        });

        // 2. ピチカート専用ダイナミクス・コンプレッサー:
        // アタックタイムを15ms設けることで、指が弦を弾いた瞬間の立ち上がり（トランジェント）を一切潰さず前に出し、
        // 直後のボディ鳴りとサステインを豊かに持ち上げて「ポン〜ン」という粘りと暖かみのあるウッドベーストーンを創出
        const woodBassComp = new Tone.Compressor({
          threshold: -18,
          ratio: 2.8,
          attack: 0.015,
          release: 0.25,
        });

        this.bassSampler.chain(woodBassEq, woodBassComp, this.toneMasterGain);
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('ShibuyaDaylightWoodBass init warning:', e);
    }
  }

  /**
   * チャンネル変更や演奏停止時、すべての発音・ウッドベース余韻を即座に完全遮断
   */
  private ensureActive(now: number) {
    if (this.toneMasterGain && this.toneMasterGain.gain.value < 0.01) {
      try {
        this.toneMasterGain.gain.cancelScheduledValues(now);
        this.toneMasterGain.gain.setValueAtTime(Math.max(this.toneMasterGain.gain.value, 0.0001), now);
        this.toneMasterGain.gain.linearRampToValueAtTime(this.config.volume, now + 0.015);
      } catch (e) {}
    }
    if (this.fallbackMasterGain && this.fallbackMasterGain.gain.value < 0.01) {
      try {
        this.fallbackMasterGain.gain.cancelScheduledValues(now);
        this.fallbackMasterGain.gain.setValueAtTime(Math.max(this.fallbackMasterGain.gain.value, 0.0001), now);
        this.fallbackMasterGain.gain.linearRampToValueAtTime(0.50, now + 0.015);
      } catch (e) {}
    }
  }

  public stopAll() {
    try {
      this.bassSampler?.releaseAll();
      if (this.toneMasterGain) {
        const now = Tone.now();
        const curr = this.toneMasterGain.gain.value;
        this.toneMasterGain.gain.cancelScheduledValues(now);
        this.toneMasterGain.gain.setValueAtTime(Math.max(curr, 0.0001), now);
        this.toneMasterGain.gain.linearRampToValueAtTime(0.0001, now + 0.02);
      }
      if (this.fallbackMasterGain && this.rawContext) {
        const nowCtx = this.rawContext.currentTime;
        const currFb = this.fallbackMasterGain.gain.value;
        this.fallbackMasterGain.gain.cancelScheduledValues(nowCtx);
        this.fallbackMasterGain.gain.setValueAtTime(Math.max(currFb, 0.0001), nowCtx);
        this.fallbackMasterGain.gain.linearRampToValueAtTime(0.0001, nowCtx + 0.02);
      }
    } catch (e) {}
  }

  private freqToMidi(freq: number): number {
    return Math.round(69 + 12 * Math.log2(freq / 440));
  }

  private midiToNoteName(midi: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = notes[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${noteName}${octave}`;
  }

  private freqToNoteName(freq: number): string {
    return this.midiToNoteName(this.freqToMidi(freq));
  }

  /**
   * サンプラー初回ロード待ちの数秒間だけ使用される、純粋なアコースティック・フォールバック
   * ※ 電子音（Sawtoothや急激な周波数ドロップ、過剰な倍音など）は一切入れず、
   *   アコースティックな温かい三角波（Triangle）と丸いローパスフィルターのみで生成
   */
  private playPureAcousticFallback(freq: number, volume: number, duration: number, time: number) {
    if (!this.rawContext || !this.fallbackMasterGain) return;
    const ctx = this.rawContext;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const startTime = Math.max(ctx.currentTime, time);
    const soundDuration = Math.max(0.25, Math.min(2.0, duration));
    const effectiveVol = Math.max(0.01, Math.min(1.0, volume)) * 0.85;

    // 1. アコースティック弦の基音振動（丸く温かいTriangle波）
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    // 2. 木製ボディの共鳴ローパス＆温かみイコライジング
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    // 弾いた瞬間に指弾きアタックの周波数を適度に通し、すばやく温かいボディ鳴りへ落ち着く
    filter.frequency.setValueAtTime(650, startTime);
    filter.frequency.exponentialRampToValueAtTime(200, startTime + 0.08);
    filter.frequency.exponentialRampToValueAtTime(140, startTime + soundDuration);

    const bodyResonance = ctx.createBiquadFilter();
    bodyResonance.type = 'peaking';
    bodyResonance.frequency.setValueAtTime(130, startTime); // 130Hzの豊かなボディ鳴り
    bodyResonance.gain.setValueAtTime(4.0, startTime);
    bodyResonance.Q.setValueAtTime(1.4, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    // 指先で弦を弾くピチカートの立ち上がり（8ms）
    gain.gain.linearRampToValueAtTime(effectiveVol, startTime + 0.008);
    // 指弾きアタック後の落ち着き
    gain.gain.exponentialRampToValueAtTime(effectiveVol * 0.7, startTime + 0.08);
    // ウッドベースの自然な減衰
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + soundDuration);

    osc.connect(filter);
    filter.connect(bodyResonance);
    bodyResonance.connect(gain);
    gain.connect(this.fallbackMasterGain);

    osc.start(startTime);
    osc.stop(startTime + soundDuration + 0.05);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        bodyResonance.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }

  /**
   * ウッドベース・ベースラインのトリガー
   * @param freq 周波数 (Hz) または ノート名 (例: "F1", "A#1")
   * @param volume 音量 (0.0 ~ 1.0)
   * @param duration 持続時間 (s)
   * @param time 発音タイミング
   */
  public triggerBass(
    freq: number | string,
    volume = 0.75,
    duration = 0.45,
    time?: number
  ) {
    if (!this.rawContext) return;
    const now = time ?? this.rawContext.currentTime;
    this.ensureActive(now);

    let numericFreq = 110;
    let noteName = 'A2';

    if (typeof freq === 'string') {
      noteName = freq;
      try {
        numericFreq = Tone.Frequency(freq).toFrequency();
      } catch (e) {
        numericFreq = 110;
      }
    } else {
      numericFreq = freq;
      noteName = this.freqToNoteName(freq);
    }

    const clampedVelocity = Math.max(0.1, Math.min(1.0, volume));
    const cleanDuration = Math.max(0.20, Math.min(2.8, duration));

    // ★ 実録ウッドベースサンプラーが使用可能な場合は、サンプラー音のみを発音！
    // シンセサイザーの音や電子音との二重発音（レイヤー）は行わず、純粋なウッドベースの音だけを鳴らします。
    if (this.bassSampler && (this.samplerLoaded || this.bassSampler.loaded)) {
      try {
        this.bassSampler.triggerAttackRelease(
          noteName,
          cleanDuration,
          now,
          clampedVelocity
        );
        return; // 純粋な実録ウッドベースのみで完結
      } catch (err) {
        console.warn('Wood bass sampler trigger fallback:', err);
      }
    }

    // サンプラーの初回読み込み完了前のみ、電子音を一切含まないピュアなアコースティック音でフォールバック
    this.playPureAcousticFallback(numericFreq, clampedVelocity, cleanDuration, now);
  }

  /**
   * ネオロカビリー特有のウッドベース指板スラップ音（Fingerboard Slap Click）
   * ガット弦／スチール弦がウッドベースのエボニー指板に叩きつけられるパーカッシブな打撃音
   */
  public triggerSlapClick(volume = 0.70, time?: number) {
    if (!this.rawContext) return;
    const ctx = this.rawContext;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const startTime = Math.max(ctx.currentTime + 0.005, time ?? ctx.currentTime);
    const effVol = Math.max(0.01, Math.min(1.0, volume)) * 0.28;

    // 1. ウッドベース指板の木製打撃音（Wood Thud: 240Hz -> 65Hz のピッチ急減衰）
    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(240, startTime);
    thudOsc.frequency.exponentialRampToValueAtTime(65, startTime + 0.022);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.0001, startTime);
    thudGain.gain.linearRampToValueAtTime(effVol * 0.85, startTime + 0.003);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.028);

    thudOsc.connect(thudGain);

    // 2. 弦が指板に触れる瞬間の微細なスナップ音（耳障りなノイズではなく、1.8kHzにフォーカスした極小レベルのアタック）
    const bufferSize = Math.floor(ctx.sampleRate * 0.025); // 25ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // 振幅を0.08に抑えた極めて穏やかな接触ノイズ
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(1800, startTime);
    snapFilter.Q.setValueAtTime(1.2, startTime);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.0001, startTime);
    snapGain.gain.linearRampToValueAtTime(effVol * 0.55, startTime + 0.002);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.022);

    noise.connect(snapFilter);
    snapFilter.connect(snapGain);

    // ミックスゲイン
    const mixGain = ctx.createGain();
    mixGain.gain.setValueAtTime(1.0, startTime);

    thudGain.connect(mixGain);
    snapGain.connect(mixGain);

    const targetNode = this.destinationNode || this.fallbackMasterGain || ctx.destination;
    mixGain.connect(targetNode);

    thudOsc.start(startTime);
    thudOsc.stop(startTime + 0.035);

    noise.start(startTime);
    noise.stop(startTime + 0.030);

    thudOsc.onended = () => {
      try {
        thudOsc.disconnect();
        thudGain.disconnect();
        noise.disconnect();
        snapFilter.disconnect();
        snapGain.disconnect();
        mixGain.disconnect();
      } catch (e) {}
    };
  }

  /**
   * ネオロカビリー・スラップベース（ピチカート実音 ＋ 指板スラップクリックの同時発音）
   */
  public triggerSlapBass(
    freq: number | string,
    volume = 0.85,
    duration = 0.30,
    time?: number
  ) {
    const now = time ?? (this.rawContext ? this.rawContext.currentTime : undefined);
    // 1. 実音ピチカート
    this.triggerBass(freq, volume, duration, now);
    // 2. 上品でタイトな指板スラップ音
    this.triggerSlapClick(volume * 0.65, now);
  }

  public isLoaded(): boolean {
    return this.samplerLoaded || (this.bassSampler?.loaded ?? false);
  }
}

export const shibuyaDaylightWoodBass = new ShibuyaDaylightWoodBassEngine();
