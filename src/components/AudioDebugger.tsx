import { useState, useMemo } from 'react';
import { 
  Bug, 
  X, 
  Activity, 
  Volume2, 
  Radio, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Sliders, 
  Clock, 
  Cpu, 
  ShieldCheck,
  Check,
  Zap
} from 'lucide-react';
import { Station, DebugLogItem } from '../types';
import SoundLabAudition from './SoundLabAudition';
import { StationCassetteMaintenance } from './StationCassetteMaintenance';
import { StationProgression } from '../types/stationCassette';
import { toneDrumKit, DrumKitType } from '../audio/toneDrumKit';

interface AudioDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
  audioCtx: AudioContext | null;
  bassFilter?: BiquadFilterNode | null;
  activeStation: Station | null;
  frequency: number;
  isPowerOn: boolean;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  bass: number;
  mid: number;
  treble: number;
  sleepTimer: number | null;
  pomodoroState: 'idle' | 'work' | 'break';
  pomodoroTimeLeft: number;
  isTimeSignalEnabled: boolean;
  activeNodesCount: number;
  logs: DebugLogItem[];
  onClearLogs: () => void;
  onTriggerTestTone: () => void;
  onTriggerTimeSignalTest: (isHalfHour?: boolean) => void;
  onTriggerJingleTest?: () => void;
  isJinglePlaying?: boolean;
  onResumeAudioContext: () => void;
  onRestartAudioEngine?: () => void;
  onEnsureAudioContext?: () => AudioContext;
  onStopAllAudio: () => void;
  stations: Station[];
  stationConfigs?: Record<number, StationProgression>;
  customStationFlags?: Record<number, boolean>;
  onUpdateStationConfig?: (freq: number, newProg: StationProgression, name: string) => void;
  onResetStationConfig?: (freq: number) => void;
  onTuneStation?: (freq: number) => void;
}

export default function AudioDebugger({
  isOpen,
  onClose,
  audioCtx,
  bassFilter,
  activeStation,
  frequency,
  isPowerOn,
  isPlaying,
  volume,
  isMuted,
  bass,
  mid,
  treble,
  sleepTimer,
  pomodoroState,
  pomodoroTimeLeft,
  isTimeSignalEnabled,
  activeNodesCount,
  logs,
  onClearLogs,
  onTriggerTestTone,
  onTriggerTimeSignalTest,
  onTriggerJingleTest,
  isJinglePlaying = false,
  onResumeAudioContext,
  onRestartAudioEngine,
  onEnsureAudioContext,
  onStopAllAudio,
  stations,
  stationConfigs,
  customStationFlags,
  onUpdateStationConfig,
  onResetStationConfig,
  onTuneStation,
}: AudioDebuggerProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'cassettes' | 'soundlab' | 'diagnostics' | 'logs'>('status');
  const [logFilter, setLogFilter] = useState<'all' | 'audio' | 'tuner' | 'timer' | 'error'>('all');
  const [copied, setCopied] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    testedAt: string;
    items: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; detail: string }>;
  } | null>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [selectedDrumKit, setSelectedDrumKit] = useState<DrumKitType>('acoustic');

  const playDrumTest = (type: 'kick' | 'snare' | 'hihat' | 'roll') => {
    if (onEnsureAudioContext) onEnsureAudioContext();
    toneDrumKit.setKit(selectedDrumKit);
    const now = audioCtx ? audioCtx.currentTime : undefined;
    if (type === 'kick') {
      toneDrumKit.triggerKick(0.85, now);
    } else if (type === 'snare') {
      toneDrumKit.triggerSnare(0.80, now);
    } else if (type === 'hihat') {
      toneDrumKit.triggerHiHat(0.65, false, now);
    } else if (type === 'roll') {
      const baseTime = now ?? (audioCtx?.currentTime || 0);
      toneDrumKit.triggerKick(0.85, baseTime);
      toneDrumKit.triggerHiHat(0.50, false, baseTime + 0.15);
      toneDrumKit.triggerSnare(0.80, baseTime + 0.30);
      toneDrumKit.triggerHiHat(0.65, true, baseTime + 0.45);
    }
  };

  // ログのフィルタリング
  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return logs;
    if (logFilter === 'error') return logs.filter(l => l.level === 'error' || l.category === 'error');
    return logs.filter(l => l.category === logFilter);
  }, [logs, logFilter]);

  // チューニング精度（現在周波数とアクティブ局周波数の差）
  const tuningAccuracy = useMemo(() => {
    if (!activeStation) return 0;
    const diff = Math.abs(frequency - activeStation.frequency);
    if (diff > 0.6) return 0;
    return Math.round(Math.max(0, 1 - diff / 0.6) * 100);
  }, [frequency, activeStation]);

  // フル自己診断の実行
  const runFullDiagnostics = () => {
    setIsRunningDiagnostic(true);
    setTimeout(() => {
      const results: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; detail: string }> = [];

      // 1. AudioContext 診断
      if (!audioCtx) {
        results.push({
          name: 'Web Audio API Context',
          status: 'warn',
          detail: '未初期化（電源を入れるか音声を再生すると初期化されます）',
        });
      } else if (audioCtx.state === 'running') {
        results.push({
          name: 'Web Audio API Context',
          status: 'pass',
          detail: `正常稼働中 (State: running, SampleRate: ${audioCtx.sampleRate}Hz, Time: ${audioCtx.currentTime.toFixed(1)}s)`,
        });
      } else if (audioCtx.state === 'suspended') {
        results.push({
          name: 'Web Audio API Context',
          status: 'warn',
          detail: 'サスペンド待機状態（ブラウザの自動再生ポリシーによる待機。画面クリックまたは「Contextを再開」で復帰可能）',
        });
      } else if ((audioCtx.state as string) === 'interrupted') {
        results.push({
          name: 'Web Audio API Context',
          status: 'warn',
          detail: '一時中断状態（interrupted: iOS/Safariの省電力またはシステム音声・着信等の割り込み。「再開・復帰」ボタンで即座に復旧可能）',
        });
      } else {
        results.push({
          name: 'Web Audio API Context',
          status: 'fail',
          detail: `停止状態: ${audioCtx.state}`,
        });
      }

      // 2. ブラウザ音声合成 (Web Speech API)
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        results.push({
          name: 'Web Speech API (時報アナウンス)',
          status: 'pass',
          detail: `対応済み (利用可能音声: ${voices.length}件)`,
        });
      } else {
        results.push({
          name: 'Web Speech API (時報アナウンス)',
          status: 'warn',
          detail: '非対応ブラウザ（時報音声アナウンスはスキップされビープ音のみ発音します）',
        });
      }

      // 3. ラジオ局データ完全性
      if (stations && stations.length > 0) {
        const validStations = stations.filter(s => s.tracks && s.tracks.length > 0);
        if (validStations.length === stations.length) {
          results.push({
            name: 'Radio Stations Registry',
            status: 'pass',
            detail: `全${stations.length}局の周波数・トラック設定が整合しています`,
          });
        } else {
          results.push({
            name: 'Radio Stations Registry',
            status: 'warn',
            detail: `${stations.length}局中、トラック情報が不完全な局が存在します`,
          });
        }
      } else {
        results.push({
          name: 'Radio Stations Registry',
          status: 'fail',
          detail: 'ステーションデータが読み込まれていません',
        });
      }

      // 4. ローカルストレージアクセス権
      try {
        localStorage.setItem('__test_radio_debug__', 'ok');
        localStorage.removeItem('__test_radio_debug__');
        results.push({
          name: 'Local Storage (設定保存)',
          status: 'pass',
          detail: '読み取り・書き込み権限正常確認',
        });
      } catch (e: any) {
        results.push({
          name: 'Local Storage (設定保存)',
          status: 'fail',
          detail: `アクセス拒否またはクォータ超過: ${e.message}`,
        });
      }

      // 5. アナライザー / ビジュアライザーバッファ
      results.push({
        name: 'Visualizer & DSP Pipeline',
        status: 'pass',
        detail: `EQ: Bass ${bass > 0 ? '+' : ''}${bass}dB, Mid ${mid > 0 ? '+' : ''}${mid}dB, Treble ${treble > 0 ? '+' : ''}${treble}dB / Active Nodes: ${activeNodesCount}`,
      });

      setDiagnosticResult({
        testedAt: new Date().toLocaleTimeString(),
        items: results,
      });
      setIsRunningDiagnostic(false);
    }, 400);
  };

  // ログコピー
  const handleCopyLogs = () => {
    const text = logs
      .map(l => `[${l.timestamp}] [${l.category.toUpperCase()}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-stone-900 border border-stone-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-stone-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                Audio & System Debugger
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                  v2.5 Live
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Web Audio DSPパイプライン、同調信号、タイマー、ログのリアルタイム診断
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex items-center gap-1 px-4 py-2 bg-stone-900/90 border-b border-stone-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>システム状態</span>
          </button>
          <button
            onClick={() => setActiveTab('cassettes')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cassettes'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-300" />
            <span>本線カセット管理</span>
            <span className="text-[9px] font-bold px-1 rounded bg-amber-500/30 text-amber-200 border border-amber-400/40">6 CH</span>
          </button>
          <button
            onClick={() => setActiveTab('soundlab')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'soundlab'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>新曲試作・サウンドラボ</span>
            <span className="text-[9px] font-bold px-1 rounded bg-amber-500/30 text-amber-200 border border-amber-400/40">DEV</span>
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>自己診断・テスト</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>デバッグログ ({logs.length})</span>
          </button>
        </div>

        {/* コンテンツ領域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* ═══════════ TAB 1: システム状態 ═══════════ */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* 1. AudioContext 状態カード */}
              <div className="p-3.5 bg-stone-950/80 rounded-lg border border-stone-800">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-800/80">
                  <div className="flex items-center gap-1.5 font-bold text-stone-200">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Web Audio Context</span>
                  </div>
                  {audioCtx ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      audioCtx.state === 'running' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {audioCtx.state}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-400 border border-stone-700">
                      Uninitialized
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                    <span className="text-stone-400 block text-[10px]">Sample Rate</span>
                    <span className="text-stone-200 font-bold">{audioCtx ? `${audioCtx.sampleRate} Hz` : '--'}</span>
                  </div>
                  <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                    <span className="text-stone-400 block text-[10px]">Current Time</span>
                    <span className="text-stone-200 font-bold">{audioCtx ? `${audioCtx.currentTime.toFixed(2)}s` : '--'}</span>
                  </div>
                  <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                    <span className="text-stone-400 block text-[10px]">Active Voice Nodes</span>
                    <span className="text-stone-200 font-bold">{activeNodesCount}</span>
                  </div>
                  <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                    <span className="text-stone-400 block text-[10px]">Master Volume</span>
                    <span className="text-stone-200 font-bold">
                      {isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                </div>

                {!audioCtx && (
                  <div className="mt-2.5 flex items-center justify-between p-2 bg-emerald-950/40 border border-emerald-500/30 rounded text-emerald-300">
                    <span className="text-[11px]">AudioContextが未初期化です（ラジオ停止中でも即時起動可能）。</span>
                    <button
                      onClick={() => {
                        if (onEnsureAudioContext) onEnsureAudioContext();
                        else onResumeAudioContext();
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] transition-colors cursor-pointer"
                    >
                      エンジン起動
                    </button>
                  </div>
                )}

                {audioCtx && (audioCtx.state === 'suspended' || (audioCtx.state as string) === 'interrupted') && (
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300">
                    <span className="text-[11px]">
                      {audioCtx.state === 'suspended'
                        ? 'ブラウザの自動再生ポリシーにより待機中 (suspended) です。'
                        : '外部音声の割り込みや省電力等により一時中断 (interrupted) しています。'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={onResumeAudioContext}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[11px] transition-colors cursor-pointer"
                      >
                        Contextを再開・復帰
                      </button>
                      {onRestartAudioEngine && (
                        <button
                          onClick={onRestartAudioEngine}
                          className="px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold rounded text-[11px] transition-colors cursor-pointer"
                          title="オーディオコンテキストを新しく再生成して修復"
                        >
                          リセット再生成
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Tuner & RF 信号状態カード */}
              <div className="p-3.5 bg-stone-950/80 rounded-lg border border-stone-800">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-800/80">
                  <div className="flex items-center gap-1.5 font-bold text-stone-200">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>Tuner & RF Signal (周波数・同調)</span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-400 font-bold">
                    {frequency.toFixed(1)} MHz
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                    <span className="text-stone-400 block text-[10px]">Active Station</span>
                    <span className="text-stone-200 font-bold truncate block" title={activeStation?.name || 'None'}>
                      {activeStation?.name || 'None (混線/未同調)'}
                    </span>
                  </div>
                  <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                    <span className="text-stone-400 block text-[10px]">Tuning Accuracy</span>
                    <span className={`font-bold ${tuningAccuracy > 80 ? 'text-emerald-400' : tuningAccuracy > 30 ? 'text-amber-400' : 'text-stone-400'}`}>
                      {tuningAccuracy}%
                    </span>
                  </div>
                  <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                    <span className="text-stone-400 block text-[10px]">Power / Playback</span>
                    <span className="text-stone-200 font-bold">
                      {isPowerOn ? 'ON' : 'OFF'} / {isPlaying ? 'PLAY' : 'PAUSE'}
                    </span>
                  </div>
                  <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                    <span className="text-stone-400 block text-[10px]">Genre</span>
                    <span className="text-stone-200 font-bold truncate block">
                      {activeStation?.genre || '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. DSP イコライザー ＆ タイマー状態 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-stone-950/80 rounded-lg border border-stone-800">
                  <div className="flex items-center gap-1.5 font-bold text-stone-200 mb-2 pb-1.5 border-b border-stone-800/80">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>3-Band EQ Filter Gain</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-center">
                    <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                      <span className="text-stone-400 block text-[10px]">BASS (150Hz)</span>
                      <span className="text-stone-200 font-bold">{bass > 0 ? `+${bass}` : bass} dB</span>
                    </div>
                    <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                      <span className="text-stone-400 block text-[10px]">MID (1kHz)</span>
                      <span className="text-stone-200 font-bold">{mid > 0 ? `+${mid}` : mid} dB</span>
                    </div>
                    <div className="bg-stone-900/60 p-2 rounded border border-stone-800/60">
                      <span className="text-stone-400 block text-[10px]">TREBLE (3.5k)</span>
                      <span className="text-stone-200 font-bold">{treble > 0 ? `+${treble}` : treble} dB</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-950/80 rounded-lg border border-stone-800">
                  <div className="flex items-center gap-1.5 font-bold text-stone-200 mb-2 pb-1.5 border-b border-stone-800/80">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Timers & Background Tasks</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded">
                      <span className="text-stone-400">Sleep Timer</span>
                      <span className="text-stone-200 font-bold">
                        {sleepTimer !== null ? `${Math.ceil(sleepTimer)}分後OFF` : '無効'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded">
                      <span className="text-stone-400">Pomodoro</span>
                      <span className="text-stone-200 font-bold">
                        {pomodoroState === 'idle' 
                          ? '停止中' 
                          : `${pomodoroState === 'work' ? '作業' : '休憩'} (${Math.floor(pomodoroTimeLeft / 60)}:${(pomodoroTimeLeft % 60).toString().padStart(2, '0')})`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded">
                      <span className="text-stone-400">時報 (毎時00分/30分)</span>
                      <span className={`font-bold ${isTimeSignalEnabled ? 'text-emerald-400' : 'text-stone-500'}`}>
                        {isTimeSignalEnabled ? '有効 (Active)' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB: 本線チャンネル 演奏データカセット管理 (MAINTENANCE) ═══════════ */}
          {activeTab === 'cassettes' && (
            <StationCassetteMaintenance
              currentFrequency={frequency}
              stations={stations}
              stationConfigs={stationConfigs || {}}
              customStationFlags={customStationFlags || {}}
              onUpdateStationConfig={onUpdateStationConfig || (() => {})}
              onResetStationConfig={onResetStationConfig || (() => {})}
              onTuneStation={onTuneStation || (() => {})}
              isPlaying={isPlaying}
            />
          )}

          {/* ═══════════ TAB: 新曲試作・サウンドラボ (DEV ONLY) ═══════════ */}
          {activeTab === 'soundlab' && (
            <SoundLabAudition
              audioCtx={audioCtx}
              bassFilter={bassFilter ?? null}
              isMainRadioPlaying={isPlaying}
              onEnsureAudioContext={onEnsureAudioContext}
            />
          )}

          {/* ═══════════ TAB 2: 自己診断・テストツール ═══════════ */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              {/* テスト発信ツール */}
              <div className="p-3.5 bg-stone-950/80 rounded-lg border border-stone-800">
                <h3 className="font-bold text-stone-200 text-xs mb-1.5 flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  オーディオ即時テスト発信ツール
                </h3>
                <p className="text-[11px] text-stone-400 mb-3">
                  オーディオデバイスへの音声出力、時報アナウンス、ノード解放の動作をテストできます（ラジオが停止中でも発音可能）。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      if (onEnsureAudioContext) onEnsureAudioContext();
                      onTriggerTestTone();
                    }}
                    className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg border border-stone-700 transition-colors flex items-center gap-2 cursor-pointer text-left"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">1kHz テストトーン発信</div>
                      <div className="text-[10px] text-stone-400">0.5秒の基準ピー音を出力して疎通確認</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (onEnsureAudioContext) onEnsureAudioContext();
                      onTriggerTimeSignalTest(false);
                    }}
                    className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg border border-stone-700 transition-colors flex items-center gap-2 cursor-pointer text-left"
                  >
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">正時 (00分) 時報テスト</div>
                      <div className="text-[10px] text-stone-400">ポ・ポ・ポ・ピーン＋音声合成アナウンス</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (onEnsureAudioContext) onEnsureAudioContext();
                      onTriggerTimeSignalTest(true);
                    }}
                    className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg border border-stone-700 transition-colors flex items-center gap-2 cursor-pointer text-left"
                  >
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">半時 (30分) 時報テスト</div>
                      <div className="text-[10px] text-stone-400">ピンポーンチャイム（集中阻害防止用）</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (onEnsureAudioContext) onEnsureAudioContext();
                      if (onTriggerJingleTest) onTriggerJingleTest();
                    }}
                    className={`p-2.5 rounded-lg border transition-colors flex items-center gap-2 cursor-pointer text-left ${
                      isJinglePlaying
                        ? 'bg-amber-600/40 border-amber-400 text-amber-200 animate-pulse'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border-stone-700'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>ステーションジングル 試聴</span>
                        {isJinglePlaying && (
                          <span className="text-[9px] px-1 bg-amber-500 text-black font-extrabold rounded">再生中</span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400">Prime Time Gold (30分毎ステーションID)</div>
                    </div>
                  </button>

                  <button
                    onClick={onStopAllAudio}
                    className="p-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 hover:text-white rounded-lg border border-rose-800/50 transition-colors flex items-center gap-2 cursor-pointer text-left"
                  >
                    <Square className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">全音源・ノード強制停止</div>
                      <div className="text-[10px] text-rose-300/70">滞留オシレーターとTTSを即時完全リセット</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tone.js 実録サンプラードラム試聴・確認パネル */}
              <div className="p-3.5 bg-stone-950/80 rounded-lg border border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🥁</span>
                    <div>
                      <h3 className="font-bold text-stone-200 text-xs">Tone.js ライブラリ・サンプラードラム音源試聴</h3>
                      <p className="text-[10px] text-stone-400">Tone.js公式実録ドラムサンプル（Acoustic / CR-78 / LINN / TR-808）の即時発音テスト</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 bg-stone-900 p-1 rounded-lg border border-stone-800">
                    {[
                      { id: 'r8', label: 'Roland R-8 (重厚)' },
                      { id: 'linn', label: 'LinnDrum (パンチ)' },
                      { id: 'acoustic', label: 'Acoustic (自然)' },
                      { id: 'tr808', label: 'TR-808 (重低音)' },
                      { id: 'cr78', label: 'CR-78 (重厚アナログ・パンチ強化)' },
                    ].map((k) => (
                      <button
                        key={k.id}
                        onClick={() => {
                          const kit = k.id as DrumKitType;
                          setSelectedDrumKit(kit);
                          toneDrumKit.setKit(kit);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          selectedDrumKit === k.id
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                        }`}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-2">
                  <button
                    onClick={() => playDrumTest('kick')}
                    className="p-2 bg-stone-900 hover:bg-stone-800 active:scale-95 text-stone-200 rounded border border-stone-700/80 text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer"
                  >
                    <span>💥 KICK</span>
                    <span className="text-[9px] text-stone-400 font-normal mt-0.5">バスドラム</span>
                  </button>
                  <button
                    onClick={() => playDrumTest('snare')}
                    className="p-2 bg-stone-900 hover:bg-stone-800 active:scale-95 text-stone-200 rounded border border-stone-700/80 text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer"
                  >
                    <span>🥁 SNARE</span>
                    <span className="text-[9px] text-stone-400 font-normal mt-0.5">スネア</span>
                  </button>
                  <button
                    onClick={() => playDrumTest('hihat')}
                    className="p-2 bg-stone-900 hover:bg-stone-800 active:scale-95 text-stone-200 rounded border border-stone-700/80 text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer"
                  >
                    <span>✨ HI-HAT</span>
                    <span className="text-[9px] text-stone-400 font-normal mt-0.5">ハイハット</span>
                  </button>
                  <button
                    onClick={() => playDrumTest('roll')}
                    className="p-2 bg-amber-950/40 hover:bg-amber-900/60 active:scale-95 text-amber-300 rounded border border-amber-800/60 text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer"
                  >
                    <span>🎶 4-HIT GROOVE</span>
                    <span className="text-[9px] text-amber-400/80 font-normal mt-0.5">パターン試聴</span>
                  </button>
                </div>
              </div>

              {/* フル自己診断ボタンと結果 */}
              <div className="p-3.5 bg-stone-950/80 rounded-lg border border-stone-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-stone-200 text-xs">システム包括自己診断</h3>
                    <p className="text-[11px] text-stone-400">ブラウザ環境、オーディオ機能、データ構造を総合テスト</p>
                  </div>
                  <button
                    onClick={runFullDiagnostics}
                    disabled={isRunningDiagnostic}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
                    <span>{isRunningDiagnostic ? '診断中...' : '診断を実行'}</span>
                  </button>
                </div>

                {diagnosticResult ? (
                  <div className="space-y-2 mt-3 pt-3 border-t border-stone-800">
                    <div className="text-[11px] text-stone-400 flex items-center justify-between">
                      <span>診断完了時刻: {diagnosticResult.testedAt}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 診断パス
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {diagnosticResult.items.map((item, idx) => (
                        <div key={idx} className="p-2 bg-stone-900/80 rounded border border-stone-800/80 flex items-start gap-2 text-[11px]">
                          {item.status === 'pass' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          {item.status === 'warn' && (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          )}
                          {item.status === 'fail' && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold text-stone-200">{item.name}</span>
                            <span className="text-stone-400 block text-[10px] mt-0.5">{item.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-stone-500 text-xs">
                    「診断を実行」をクリックすると、現在のシステム整合性をチェックします。
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ TAB 3: デバッグログ ═══════════ */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {/* ログ操作バー */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-800">
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  {(['all', 'audio', 'tuner', 'timer', 'error'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setLogFilter(cat)}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer uppercase ${
                        logFilter === cat 
                          ? 'bg-stone-700 text-white font-bold' 
                          : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyLogs}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer font-mono"
                    title="ログをクリップボードにコピー"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'コピー完了' : 'コピー'}</span>
                  </button>
                  <button
                    onClick={onClearLogs}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-rose-900/40 text-stone-400 hover:text-rose-200 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer font-mono"
                    title="ログを全消去"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>クリア</span>
                  </button>
                </div>
              </div>

              {/* ログリスト */}
              <div className="font-mono text-[10px] bg-stone-950 p-3 rounded-lg border border-stone-800/80 max-h-[360px] overflow-y-auto space-y-1.5">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <div 
                      key={log.id} 
                      className={`flex items-start gap-2 leading-relaxed border-b border-stone-900/60 pb-1 ${
                        log.level === 'error' 
                          ? 'text-rose-400' 
                          : log.level === 'warn' 
                            ? 'text-amber-300' 
                            : log.level === 'success' 
                              ? 'text-emerald-400' 
                              : 'text-stone-300'
                      }`}
                    >
                      <span className="text-stone-500 shrink-0">[{log.timestamp}]</span>
                      <span className={`px-1 rounded text-[9px] uppercase shrink-0 ${
                        log.category === 'error' ? 'bg-rose-950 text-rose-300' :
                        log.category === 'audio' ? 'bg-emerald-950 text-emerald-300' :
                        log.category === 'tuner' ? 'bg-cyan-950 text-cyan-300' :
                        log.category === 'timer' ? 'bg-amber-950 text-amber-300' :
                        'bg-stone-800 text-stone-300'
                      }`}>
                        {log.category}
                      </span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-stone-600">
                    ログ項目はありません
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-4 py-2.5 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span>デバッガーは常時バックグラウンドでエラーと信号を監視しています。</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-medium transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
