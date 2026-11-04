import { useState, useEffect, useRef, memo } from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  color: string; // e.g. 'amber', 'pink', 'cyan'
  isTuning?: boolean;
  isPowerOn?: boolean;
  powerAnimState?: 'powering_on' | 'powering_off' | null;
  targetStationName?: string;
  pomodoroMode?: 'work' | 'break' | 'off';
  isEcoMode?: boolean;
}

function Visualizer({ 
  analyser, 
  isPlaying, 
  color, 
  isTuning = false,
  isPowerOn = true,
  powerAnimState = null,
  targetStationName = '',
  pomodoroMode = 'off',
  isEcoMode = false,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // State & Effect for slide-in notification badge on Pomodoro mode switch
  const [notification, setNotification] = useState<{
    mode: 'work' | 'break';
    text: string;
  } | null>(null);

  // isTuningが何らかの理由で解除されなかった場合のフェイルセーフ（最大1.8秒で強制解除）
  const [visualTuning, setVisualTuning] = useState<boolean>(isTuning);

  useEffect(() => {
    if (isTuning) {
      setVisualTuning(true);
      const timer = window.setTimeout(() => {
        setVisualTuning(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setVisualTuning(false);
    }
  }, [isTuning]);

  const prevModeRef = useRef<'work' | 'break' | 'off'>(pomodoroMode);

  useEffect(() => {
    if (prevModeRef.current !== pomodoroMode) {
      if (pomodoroMode === 'work') {
        setNotification({
          mode: 'work',
          text: '🔥 作業集中時間 (WORK SESSION)',
        });
      } else if (pomodoroMode === 'break') {
        setNotification({
          mode: 'break',
          text: '☕ リフレッシュ休憩 (BREAK TIME)',
        });
      } else {
        setNotification(null);
      }
      prevModeRef.current = pomodoroMode;
    }
  }, [pomodoroMode]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500); // Display for 4.5 seconds on mode switch
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Map theme colors to actual RGB hex for Canvas drawing
  const getColorHex = (themeColor: string) => {
    if (themeColor.includes('pink') || themeColor.includes('candypop')) return { primary: '#ff69b4', secondary: '#ff85c0', glow: 'rgba(255, 105, 180, 0.6)' };
    if (themeColor.includes('amber')) return { primary: '#f59e0b', secondary: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' };
    if (themeColor.includes('fuchsia')) return { primary: '#d946ef', secondary: '#c084fc', glow: 'rgba(217, 70, 239, 0.4)' };
    if (themeColor.includes('cyan')) return { primary: '#06b6d4', secondary: '#0891b2', glow: 'rgba(6, 182, 212, 0.4)' };
    if (themeColor.includes('emerald')) return { primary: '#10b981', secondary: '#059669', glow: 'rgba(16, 185, 129, 0.4)' };
    if (themeColor.includes('indigo')) return { primary: '#6366f1', secondary: '#4f46e5', glow: 'rgba(99, 102, 241, 0.4)' };
    return { primary: '#f59e0b', secondary: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // High performance DPR scaling (clamped to 1.5 to prevent 4K canvas fill rate lag)
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    // 36-band authentic retro spectrum analyzer (24-band in Eco Mode for max efficiency)
    const barsCount = isEcoMode ? 24 : 36;
    const simBars = Array.from({ length: barsCount }, () => ({
      current: 4,
      target: 4,
      speed: 0.1 + Math.random() * 0.12,
    }));

    // Pre-allocated frequency data buffer to avoid garbage collection spikes
    let cachedDataArray: Uint8Array | null = null;
    let cachedBufferLength = 0;

    let animTime = 0;
    let lastTime = 0;
    const targetFps = isEcoMode ? 24 : 34; // 34 FPS is authentic retro VFD speed and cuts CPU by >65%
    const frameInterval = 1000 / targetFps;

    const render = (time: number) => {
      // Pause drawing completely when browser tab is inactive to save battery/CPU
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      // Delta-time FPS throttling
      const elapsed = time - lastTime;
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      lastTime = time - (elapsed % frameInterval);
      animTime += 0.05;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width <= 0 || height <= 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const colors = getColorHex(color);

      // Create unified vertical gradient (1 single style for all bars and segments)
      const barGradient = ctx.createLinearGradient(0, height, 0, 0);
      if (color.includes('candypop') || color.includes('pink')) {
        barGradient.addColorStop(0.0, '#f472b6'); // Neon Pink
        barGradient.addColorStop(0.4, '#c084fc'); // Lavender Purple
        barGradient.addColorStop(0.75, '#facc15'); // Sunshine Yellow
        barGradient.addColorStop(1.0, '#22d3ee'); // Neon Cyan
      } else if (color.includes('cyan')) {
        barGradient.addColorStop(0.0, '#06b6d4'); // Cyan
        barGradient.addColorStop(0.65, '#38bdf8'); // Sky
        barGradient.addColorStop(0.82, '#fbbf24'); // Yellow
        barGradient.addColorStop(1.0, '#ef4444'); // Red
      } else {
        barGradient.addColorStop(0.0, colors.primary);
        barGradient.addColorStop(0.65, colors.primary);
        barGradient.addColorStop(0.82, '#fbbf24'); // Yellow warning
        barGradient.addColorStop(1.0, '#ef4444'); // Red peak alert
      }

      const barGap = 2;
      const barWidth = Math.max(2, (width - (barsCount - 1) * barGap) / barsCount);
      const segmentHeight = 3;
      const segmentGap = 2;
      const stepY = segmentHeight + segmentGap;

      // --- 📡 1. ローディング・選局同調中 (isTuning) ---
      if (isTuning && isPowerOn && !isPlaying) {
        let x = 0;
        const scanBeamX = ((animTime * 1.5) % 1) * width;

        ctx.fillStyle = barGradient;
        ctx.beginPath();

        for (let i = 0; i < barsCount; i++) {
          const normIdx = i / barsCount;
          const distFromCenter = Math.abs(normIdx - 0.5) * 2;
          const centerPulse = Math.sin(distFromCenter * 8 - animTime * 4) * 0.5 + 0.5;
          const sweepWave = Math.sin(normIdx * 12 - animTime * 6) * 0.5 + 0.5;
          const ripple = Math.cos(normIdx * 20 + animTime * 7) * 0.25 + 0.25;
          const barCenterX = x + barWidth / 2;
          const beamDist = Math.abs(barCenterX - scanBeamX);
          const beamBoost = Math.max(0, 1 - beamDist / 40);

          const combinedHeightFactor = (centerPulse * 0.4 + sweepWave * 0.35 + ripple * 0.25) * (1 - distFromCenter * 0.25);
          const barHeight = Math.max(4, combinedHeightFactor * (height * 0.7) + beamBoost * (height * 0.25) + 3);

          const segments = Math.max(1, Math.floor(barHeight / stepY));
          for (let s = 0; s < segments; s++) {
            const segmentY = height - (s * stepY) - 5;
            ctx.rect(x, segmentY, barWidth, segmentHeight);
          }
          x += barWidth + barGap;
        }
        ctx.fill();

        // 走査線（1本のライン描画のみ）
        if (!isEcoMode) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(scanBeamX, 0);
          ctx.lineTo(scanBeamX, height);
          ctx.stroke();
        }
      } else if (analyser && isPlaying) {
        // --- 🎵 2. 実周波数スペクトラム表示 (Web Audio API) ---
        const bufferLength = analyser.frequencyBinCount;
        if (!cachedDataArray || cachedBufferLength !== bufferLength) {
          cachedDataArray = new Uint8Array(bufferLength);
          cachedBufferLength = bufferLength;
        }
        analyser.getByteFrequencyData(cachedDataArray);

        let x = 0;
        ctx.fillStyle = barGradient;
        ctx.beginPath();

        for (let i = 0; i < barsCount; i++) {
          const percentIdx = i / barsCount;
          // 対数スケーリングで低音から高音までバランス良く拾う
          const binIdx = Math.floor(Math.pow(percentIdx, 1.4) * (bufferLength * 0.65));
          const val = cachedDataArray[binIdx] || 0;
          const barHeight = (val / 255) * (height - 12) + 2;

          const segments = Math.max(1, Math.floor(barHeight / stepY));
          for (let s = 0; s < segments; s++) {
            const segmentY = height - (s * stepY) - 5;
            ctx.rect(x, segmentY, barWidth, segmentHeight);
          }
          x += barWidth + barGap;
        }
        ctx.fill();
      } else {
        // --- 💤 3. 停止中・シミュレーション表示 ---
        let x = 0;
        let isSettled = !isPlaying && !isPowerOn;

        ctx.fillStyle = barGradient;
        ctx.beginPath();

        for (let i = 0; i < barsCount; i++) {
          const bar = simBars[i] || { current: 4, target: 4, speed: 0.1 };
          if (isPlaying) {
            if (Math.abs(bar.current - bar.target) < 1) {
              bar.target = Math.random() * (height - 15) + 5;
              bar.speed = 0.08 + Math.random() * 0.12;
            }
            bar.current += (bar.target - bar.current) * bar.speed;
          } else {
            if (Math.abs(bar.current - 4) > 0.2) {
              isSettled = false;
            }
            bar.current += (4 - bar.current) * 0.15;
          }

          const barHeight = bar.current;
          const segments = Math.max(1, Math.floor(barHeight / stepY));
          for (let s = 0; s < segments; s++) {
            const segmentY = height - (s * stepY) - 5;
            ctx.rect(x, segmentY, barWidth, segmentHeight);
          }
          x += barWidth + barGap;
        }
        ctx.fill();

        // 電源OFFでベースラインに収束した後はループを一時停止してCPU消費ゼロへ
        if (isSettled && !isPlaying && !isPowerOn && !isTuning) {
          animationRef.current = null;
          return;
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
    };
  }, [analyser, isPlaying, color, isTuning, isPowerOn, isEcoMode]);

  return (
    <div className="relative w-full h-full min-h-[100px] bg-slate-950/90 rounded-lg border border-slate-900 overflow-hidden shadow-inner flex items-center justify-center bg-[linear-gradient(to_right,rgba(30,41,59,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,59,0.22)_1px,transparent_1px)] bg-[size:16px_10px]">
      <canvas ref={canvasRef} className="w-full h-full block absolute inset-0 opacity-90" />
      
      {/* 0. Pomodoro Mode Change Notification Badge (Slide-In / Fade-Out) */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -60, x: '-50%', opacity: 0, scale: 0.85 }}
            animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
            exit={{ y: -40, x: '-50%', opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-3 left-1/2 z-30 flex items-center gap-2 px-4 py-1.5 rounded-full border-2 shadow-2xl text-xs font-mono font-bold tracking-wider backdrop-blur-md transition-colors ${
              notification.mode === 'work'
                ? 'bg-amber-950/95 border-amber-500 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.6)]'
                : 'bg-emerald-950/95 border-emerald-500 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.6)]'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full animate-ping shrink-0 ${
              notification.mode === 'work' ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            <Clock className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. POWER ON Dot Text Overlay */}
      {powerAnimState === 'powering_on' && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-1 font-mono">
          <div className="text-cyan-400 font-extrabold text-lg tracking-[0.25em] animate-dot-blink drop-shadow-[0_0_12px_rgba(34,211,238,0.9)] flex items-center gap-2">
            <span>⚡</span>
            <span>POWER ON</span>
            <span>⚡</span>
          </div>
          <div className="text-[10px] text-cyan-300/80 tracking-widest uppercase">
            SYSTEM READY • VFD DISPLAY ACTIVE
          </div>
        </div>
      )}

      {/* 2. POWER OFF Dot Text Overlay */}
      {powerAnimState === 'powering_off' && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-1 font-mono animate-fade-out">
          <div className="text-rose-500 font-extrabold text-lg tracking-[0.25em] animate-pulse drop-shadow-[0_0_12px_rgba(244,63,94,0.9)] flex items-center gap-2">
            <span>⚡</span>
            <span>POWER OFF</span>
            <span>⚡</span>
          </div>
          <div className="text-[10px] text-rose-400/70 tracking-widest uppercase">
            SYSTEM STANDBY...
          </div>
        </div>
      )}

      {/* 3. OFF state (No power) */}
      {!isPowerOn && !powerAnimState && (
        <div className="absolute inset-0 bg-slate-950/95 z-10 flex items-center justify-center font-mono">
          <div className="text-slate-700 text-xs tracking-widest font-bold">
            [ POWERED OFF ]
          </div>
        </div>
      )}

      {/* 4. Tuning / Loading Overlay: レトロアナログ機器の同調＆ローディング演出 */}
      {isPowerOn && (isTuning || visualTuning) && !isPlaying && !powerAnimState && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 p-3 font-mono">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-wider">
            {/* 回転アナログオシロスコープ・ローダー */}
            <div className="w-4 h-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 border-r-amber-400 animate-spin shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            <span className="animate-pulse">📡 TUNING & LOCKING FREQUENCY...</span>
          </div>

          {targetStationName && (
            <div className="text-xs sm:text-sm font-bold text-amber-300 tracking-wider bg-slate-900/90 px-3.5 py-1 rounded-md border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse flex items-center gap-2">
              <span className="text-cyan-400 animate-ping text-[10px]">●</span>
              <span>📻 {targetStationName}</span>
            </div>
          )}

          {/* アナログ信号スキャン・ローディングバー */}
          <div className="w-64 max-w-[85%] flex flex-col gap-1 items-center">
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner">
              <div className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-cyan-400 rounded-full animate-pulse w-full duration-700 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            </div>
            <div className="w-full flex justify-between text-[9px] text-slate-400 font-bold tracking-widest px-1">
              <span className="text-cyan-400/90">ANTENNA: OPTIMAL</span>
              <span className="text-amber-400 animate-pulse">BUFFERING HI-FI...</span>
              <span className="text-cyan-400/90">STEREO LOCK</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. POWER ON but NOT PLAYING: Horizontal Marquee "Please press play!!" */}
      {isPowerOn && !isPlaying && !isTuning && !visualTuning && !powerAnimState && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] z-10 flex items-center overflow-hidden font-mono pointer-events-none">
          <div className="w-full relative flex items-center overflow-hidden">
            <div className="animate-marquee whitespace-nowrap text-amber-400 font-bold text-xs md:text-sm tracking-[0.2em] drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] flex items-center gap-6">
              <span>▶▶ PLEASE PRESS PLAY!!</span>
              <span>🎵 SELECT STATION & START MUSIC</span>
              <span>▶▶ PLEASE PRESS PLAY!!</span>
              <span>🎵 SELECT STATION & START MUSIC</span>
            </div>
          </div>
        </div>
      )}

      {/* Glossy overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent h-1/2"></div>
      
      {/* Grid glass reflection lines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.03)_50%,transparent_55%)]"></div>
    </div>
  );
}

export default memo(Visualizer);
