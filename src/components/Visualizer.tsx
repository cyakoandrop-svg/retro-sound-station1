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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI canvas resolution
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    // 64-band real time spectrum analyzer (32-band in Eco Mode for performance)
    const barsCount = isEcoMode ? 32 : 64;
    const simBars = Array.from({ length: barsCount }, () => ({
      current: 5,
      target: 5,
      speed: 0.1 + Math.random() * 0.15,
    }));

    // Pre-allocated frequency data buffer to avoid GC spikes on every 60fps frame
    let cachedDataArray: Uint8Array | null = null;
    let cachedBufferLength = 0;

    let frameCount = 0;
    let animTime = 0;

    const render = () => {
      animTime += 0.04;
      if (isEcoMode) {
        frameCount++;
        if (frameCount % 2 !== 0) {
          animationRef.current = requestAnimationFrame(render);
          return;
        }
      }

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Draw background grid lines (retro feel) - skip in Eco mode for max performance
      if (!isEcoMode) {
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 15) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 10) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      const colors = getColorHex(color);

      // --- 📡 1. ローディング・選局同調中 (isTuning): アナログスペアナの電波探索＆走査スキャンアニメーション ---
      if (isTuning && isPowerOn && !isPlaying) {
        const barGap = 1.5;
        const barWidth = Math.max(1, (width - (barsCount - 1) * barGap) / barsCount);
        let x = 0;

        // 水平走査レーダービームのX位置 (0 ~ width)
        const scanBeamX = ((animTime * 1.8) % 1) * width;

        for (let i = 0; i < barsCount; i++) {
          const normIdx = i / barsCount; // 0.0 ~ 1.0
          const distFromCenter = Math.abs(normIdx - 0.5) * 2; // 0.0 (center) ~ 1.0 (edge)

          // アナログ周波数探索波形:
          // 1. 中央から外側へ広がる波紋 (Center-Out Pulse)
          const centerPulse = Math.sin(distFromCenter * 8 - animTime * 4) * 0.5 + 0.5;
          // 2. 左から右へ走るスキャン波 (Sweep Wave)
          const sweepWave = Math.sin(normIdx * 12 - animTime * 6) * 0.5 + 0.5;
          // 3. 高速オシレーター成分 (Jitter & Radio Ripple)
          const ripple = Math.cos(normIdx * 24 + animTime * 8) * 0.25 + 0.25;
          // 4. レーダービーム通過時のピークブースト
          const barCenterX = x + barWidth / 2;
          const beamDist = Math.abs(barCenterX - scanBeamX);
          const beamBoost = Math.max(0, 1 - beamDist / 40);

          // 総合バー高さの計算 (高さの30%〜85%をダイナミックに波打つ)
          const combinedHeightFactor = (centerPulse * 0.4 + sweepWave * 0.35 + ripple * 0.25) * (1 - distFromCenter * 0.25);
          const barHeight = Math.max(4, combinedHeightFactor * (height * 0.72) + beamBoost * (height * 0.25) + 3);

          const segments = Math.max(1, Math.floor(barHeight / 5));
          const segmentGap = 2;
          const segmentHeight = 3;

          for (let s = 0; s < segments; s++) {
            const segmentY = height - (s * (segmentHeight + segmentGap)) - 5;
            
            if (color.includes('candypop') || color.includes('pink')) {
              if (s > 12) ctx.fillStyle = '#22d3ee';
              else if (s > 8) ctx.fillStyle = '#facc15';
              else if (s > 4) ctx.fillStyle = '#c084fc';
              else ctx.fillStyle = '#f472b6';
            } else {
              // スキャン中はシアン・琥珀・テーマカラーが美しく点滅
              if (s > 12) ctx.fillStyle = '#06b6d4'; // スキャンビームシアン
              else if (s > 8) ctx.fillStyle = '#fbbf24';
              else ctx.fillStyle = colors.primary;
            }

            ctx.beginPath();
            ctx.roundRect(x, segmentY, barWidth, segmentHeight, 1);
            ctx.fill();
          }

          // ビーム通過時のネオングロー
          if (beamBoost > 0.3) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#06b6d4';
          } else {
            ctx.shadowBlur = 0;
          }

          x += barWidth + barGap;
        }

        // オシロスコープ走査線の描画
        if (!isEcoMode) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(scanBeamX, 0);
          ctx.lineTo(scanBeamX, height);
          ctx.stroke();
        }
      } else if (analyser && isPlaying) {
        // Use real frequency data from Web Audio API with pre-allocated buffer
        const bufferLength = analyser.frequencyBinCount;
        if (!cachedDataArray || cachedBufferLength !== bufferLength) {
          cachedDataArray = new Uint8Array(bufferLength);
          cachedBufferLength = bufferLength;
        }
        analyser.getByteFrequencyData(cachedDataArray);

        const barGap = 1.5;
        const barWidth = Math.max(1, (width - (barsCount - 1) * barGap) / barsCount);
        let x = 0;

        for (let i = 0; i < barsCount; i++) {
          // Map index to a logarithmically spaced bin to get better visual balance
          const percentIdx = i / barsCount;
          const binIdx = Math.floor(Math.pow(percentIdx, 1.5) * (bufferLength * 0.6));
          const val = cachedDataArray[binIdx] || 0;
          
          // Calculate height
          const barHeight = (val / 255) * (height - 10) + 2;

          // Drawing glowing LED Segment look
          const segments = Math.max(1, Math.floor(barHeight / 5));
          const segmentGap = 2;
          const segmentHeight = 3;

          for (let s = 0; s < segments; s++) {
            const segmentY = height - (s * (segmentHeight + segmentGap)) - 5;
            
            if (color.includes('candypop') || color.includes('pink')) {
              // Candy POP colorful neon gradient
              if (s > 12) {
                ctx.fillStyle = '#22d3ee'; // Neon Cyan
              } else if (s > 8) {
                ctx.fillStyle = '#facc15'; // Sunshine Yellow
              } else if (s > 4) {
                ctx.fillStyle = '#c084fc'; // Purple
              } else {
                ctx.fillStyle = '#f472b6'; // Neon Pink
              }
            } else {
              // Top segments are yellow/red, bottom are theme color
              if (s > 12) {
                ctx.fillStyle = '#ef4444'; // Red peak alert
              } else if (s > 8) {
                ctx.fillStyle = '#fbbf24'; // Yellow warning
              } else {
                ctx.fillStyle = colors.primary;
              }
            }

            ctx.beginPath();
            ctx.roundRect(x, segmentY, barWidth, segmentHeight, 1);
            ctx.fill();
          }

          // Subtle neon glow under active bars
          if (barHeight > 10) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = colors.glow;
          } else {
            ctx.shadowBlur = 0;
          }

          x += barWidth + barGap;
        }
      } else {
        // Simulated visualizer
        const barGap = 1.5;
        const barWidth = Math.max(1, (width - (barsCount - 1) * barGap) / barsCount);
        let x = 0;
        let isSettled = !isPlaying && !isPowerOn;

        for (let i = 0; i < barsCount; i++) {
          const bar = simBars[i];
          if (isPlaying) {
            if (Math.abs(bar.current - bar.target) < 1) {
              bar.target = Math.random() * (height - 15) + 5;
              bar.speed = 0.08 + Math.random() * 0.12;
            }
            bar.current += (bar.target - bar.current) * bar.speed;
          } else {
            // Calm down to baseline
            if (Math.abs(bar.current - 4) > 0.2) {
              isSettled = false;
            }
            bar.current += (4 - bar.current) * 0.15;
          }

          const barHeight = bar.current;
          const segments = Math.max(1, Math.floor(barHeight / 5));
          const segmentGap = 2;
          const segmentHeight = 3;

          for (let s = 0; s < segments; s++) {
            const segmentY = height - (s * (segmentHeight + segmentGap)) - 5;
            if (color.includes('candypop') || color.includes('pink')) {
              if (s > 12) {
                ctx.fillStyle = '#22d3ee';
              } else if (s > 8) {
                ctx.fillStyle = '#facc15';
              } else if (s > 4) {
                ctx.fillStyle = '#c084fc';
              } else {
                ctx.fillStyle = '#f472b6';
              }
            } else {
              if (s > 12) {
                ctx.fillStyle = '#ef4444';
              } else if (s > 8) {
                ctx.fillStyle = '#fbbf24';
              } else {
                ctx.fillStyle = colors.primary;
              }
            }
            ctx.beginPath();
            ctx.roundRect(x, segmentY, barWidth, segmentHeight, 1);
            ctx.fill();
          }

          x += barWidth + barGap;
        }

        // If stopped and bars have reached rest state, pause animation loop to save CPU / battery
        if (isSettled && !isPlaying && !isPowerOn && !isTuning) {
          ctx.shadowBlur = 0;
          animationRef.current = null;
          return;
        }
      }

      ctx.shadowBlur = 0; // reset
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
    };
  }, [analyser, isPlaying, color, isTuning, isPowerOn, isEcoMode]);

  return (
    <div className="relative w-full h-full min-h-[100px] bg-slate-950/90 rounded-lg border border-slate-900 overflow-hidden shadow-inner flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block absolute inset-0 opacity-80" />
      
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
