import { memo } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, FastForward } from 'lucide-react';

interface TapeDeckProps {
  title: string;
  artist: string;
  isPlaying: boolean;
  isRewinding: boolean;
  isFastForwarding: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFastForward?: () => void;
  progress: number; // 0 to 1
  currentTimeSec?: number;
  durationSec?: number;
  currentBpm?: number;
  theme?: string;
  className?: string;
}

const formatTime = (seconds: number = 0) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function TapeDeck({
  title,
  artist,
  isPlaying,
  isRewinding,
  isFastForwarding,
  onPlayPause,
  onStop,
  onPrev,
  onNext,
  onFastForward,
  progress,
  currentTimeSec = 0,
  durationSec = 225,
  currentBpm = 72,
  theme = 'wood',
  className = '',
}: TapeDeckProps) {
  const isPop = theme === 'candypop';
  const isSilver = theme === 'silver';

  // Determine reel speed
  let spinClass = '';
  if (isPlaying) spinClass = 'animate-spin [animation-duration:4s]';
  if (isRewinding) spinClass = 'animate-spin [animation-duration:0.6s] direction-reverse';
  if (isFastForwarding) spinClass = 'animate-spin [animation-duration:0.6s]';

  // Calculate reel scale size (simulating tape transferring from Left Reel to Right Reel)
  const leftReelRadius = 35 - progress * 15; // 35px to 20px
  const rightReelRadius = 20 + progress * 15; // 20px to 35px

  return (
    <div className={`p-4 rounded-xl shadow-lg relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
      isPop 
        ? 'bg-slate-900/90 border border-pink-500/40 shadow-pink-500/10' 
        : isSilver
          ? 'bg-slate-950 border border-slate-700 shadow-xl'
          : 'bg-slate-900 border border-slate-800'
    } ${className}`}>
      {/* Top Header Bar */}
      <div className={`flex items-center justify-between mb-3 border-b pb-2 gap-2 flex-wrap ${
        isPop ? 'border-pink-500/30' : isSilver ? 'border-slate-700' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            isPlaying
              ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : 'bg-stone-600'
          }`} />
          <span className={`text-xs font-mono font-bold tracking-wider uppercase ${
            isPop ? 'text-pink-300' : isSilver ? 'text-cyan-300' : 'text-slate-100'
          }`}>
            CASSETTE TAPE DECK
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
            isPop
              ? 'bg-slate-950 text-pink-300 border-pink-500/30'
              : isSilver
                ? 'bg-slate-900 text-cyan-300 border-slate-700'
                : 'bg-black/60 text-emerald-400 border-stone-800'
          }`}>
            {formatTime(currentTimeSec)} / {formatTime(durationSec)}
          </div>
        </div>
      </div>
      {/* Tape Body Face */}
      <div className={`rounded-xl border p-3 sm:p-4 shadow-inner relative z-10 transition-all ${
        isPop
          ? 'bg-slate-900/90 border-pink-400/40 shadow-pink-950/50'
          : isSilver
            ? 'bg-slate-900 border-slate-600 shadow-md'
            : 'bg-slate-800/80 border-slate-700'
      }`}>
        
        {/* Cassette Label Strip */}
        <div className={`rounded px-4 py-2 mb-4 shadow font-mono text-xs flex flex-col items-center border ${
          isPop 
            ? 'bg-gradient-to-r from-pink-200 via-yellow-100 to-cyan-100 border-pink-300 text-slate-900' 
            : isSilver
              ? 'bg-gradient-to-r from-slate-100 via-sky-50 to-amber-50 border-b-4 border-cyan-500 text-slate-950 shadow-md'
              : 'bg-amber-50 border-b-4 border-orange-500 text-slate-900'
        }`}>
          <div className={`flex justify-between w-full text-[10px] font-bold tracking-wider ${
            isPop ? 'text-pink-700' : isSilver ? 'text-slate-800 font-extrabold' : 'text-slate-600 font-bold'
          }`}>
            <span>{isPop ? '🍭 SIDE A' : 'SIDE A'}</span>
            <span>{`BPM: ${currentBpm}`}</span>
            <span>{isPop ? '✨ SOUNDS' : '琥珀 SOUNDS'}</span>
          </div>
          
          {/* Handwritten-style Title Line */}
          <div className={`w-full border-b border-dashed mt-1 pb-0.5 text-center ${
            isPop ? 'border-pink-400' : isSilver ? 'border-slate-500' : 'border-slate-400'
          }`}>
            <span className={`font-sans font-extrabold text-sm tracking-tight ${
              isPop ? 'text-pink-950 drop-shadow-sm' : 'text-slate-950'
            }`}>
              {title || 'NO TAPE LOADED'}
            </span>
          </div>
          <div className="w-full text-center mt-1">
            <span className={`text-[10px] italic block font-semibold ${
              isPop ? 'text-pink-800' : isSilver ? 'text-slate-800' : 'text-slate-700'
            }`}>
              {artist ? `Artist: ${artist}` : 'Insert Station cassette'}
            </span>
          </div>
        </div>

        {/* Cassette Window (Tape Viewport) */}
        <div className={`rounded-lg h-20 border p-2 flex items-center justify-between relative overflow-hidden ${
          isPop 
            ? 'bg-slate-950/90 border-pink-500/50 shadow-[inset_0_0_12px_rgba(236,72,153,0.3)]' 
            : 'bg-slate-950 border-slate-700'
        }`}>
          {/* Glass glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>

          {/* Left Reel Hub */}
          <div className="relative flex items-center justify-center w-20 h-20">
            {/* Dark magnetic tape wrap */}
            <div 
              style={{ width: `${leftReelRadius * 2}px`, height: `${leftReelRadius * 2}px` }} 
              className={`rounded-full absolute transition-all duration-300 border flex items-center justify-center ${
                isPop 
                  ? 'bg-pink-900/80 border-pink-500/60 shadow-[0_0_8px_rgba(236,72,153,0.4)]' 
                  : 'bg-slate-700/80 border-slate-600'
              }`}
            >
              {/* Spinning Spindle Spokes */}
              <div className={`w-10 h-10 rounded-full border flex items-center justify-center relative ${spinClass} ${
                isPop ? 'bg-pink-400 border-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.8)]' : 'bg-slate-400 border-slate-300'
              }`}>
                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center relative">
                  {/* Spokes teeth */}
                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <div 
                      key={angle} 
                      style={{ transform: `rotate(${angle}deg)` }} 
                      className={`absolute w-1 h-3 top-0 origin-bottom ${isPop ? 'bg-cyan-300' : 'bg-slate-400'}`}
                    ></div>
                  ))}
                  <div className={`w-4 h-4 rounded-full ${isPop ? 'bg-pink-950' : 'bg-slate-950'}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Center viewport ruler notches */}
          <div className="flex flex-col items-center justify-center space-y-1 h-full z-10 px-1 font-mono text-[9px]">
            <div className={`h-0.5 w-4 ${isPop ? 'bg-pink-400' : 'bg-slate-700'}`}></div>
            <div className={`h-0.5 w-2 ${isPop ? 'bg-yellow-400' : 'bg-slate-700'}`}></div>
            <div className={`h-0.5 w-2 ${isPop ? 'bg-cyan-400' : 'bg-slate-700'}`}></div>
            <div className={`h-0.5 w-4 ${isPop ? 'bg-pink-400' : 'bg-slate-700'}`}></div>
          </div>

          {/* Right Reel Hub */}
          <div className="relative flex items-center justify-center w-20 h-20">
            {/* Dark magnetic tape wrap */}
            <div 
              style={{ width: `${rightReelRadius * 2}px`, height: `${rightReelRadius * 2}px` }} 
              className={`rounded-full absolute transition-all duration-300 border flex items-center justify-center ${
                isPop 
                  ? 'bg-pink-900/80 border-pink-500/60 shadow-[0_0_8px_rgba(236,72,153,0.4)]' 
                  : 'bg-slate-700/80 border-slate-600'
              }`}
            >
              {/* Spinning Spindle Spokes */}
              <div className={`w-10 h-10 rounded-full border flex items-center justify-center relative ${spinClass} ${
                isPop ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-slate-400 border-slate-300'
              }`}>
                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center relative">
                  {/* Spokes teeth */}
                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <div 
                      key={angle} 
                      style={{ transform: `rotate(${angle}deg)` }} 
                      className={`absolute w-1 h-3 top-0 origin-bottom ${isPop ? 'bg-pink-300' : 'bg-slate-400'}`}
                    ></div>
                  ))}
                  <div className={`w-4 h-4 rounded-full ${isPop ? 'bg-purple-950' : 'bg-slate-950'}`}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Cassette Trailing Pins Hole Accents */}
        <div className="flex justify-around items-center px-6 mt-4">
          <div className={`w-3 h-3 rounded-full border shadow-inner ${isPop ? 'bg-pink-950 border-pink-500' : 'bg-slate-950 border-slate-700'}`}></div>
          <div className={`w-4 h-2.5 border rounded-sm shadow-inner ${isPop ? 'bg-pink-950 border-yellow-400' : 'bg-slate-950 border-slate-700'}`}></div>
          <div className={`w-3 h-3 rounded-full border shadow-inner ${isPop ? 'bg-pink-950 border-cyan-400' : 'bg-slate-950 border-slate-700'}`}></div>
        </div>

      </div>

      {/* Cassette Mechanical Push Buttons */}
      <div className="grid grid-cols-5 gap-2.5 mt-5 max-w-md mx-auto w-full">
        <button 
          onClick={onPrev}
          title="前の放送局へ選局 [←]"
          className={`border-2 rounded-xl py-4 px-2 flex flex-col items-center justify-center shadow-xl active:translate-y-1 cursor-pointer transition-all ${
            isPop
              ? 'bg-gradient-to-b from-pink-500 to-purple-600 border-pink-300 text-white hover:from-pink-400 hover:to-purple-500 shadow-pink-500/30'
              : isSilver
                ? 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-100 border-slate-500 font-bold shadow-md'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 border-slate-950 font-bold'
          }`}
        >
          <SkipBack size={18} />
          <span className="text-[10px] font-mono mt-1 font-extrabold tracking-wider">PREV</span>
        </button>

        <button 
          onClick={onPlayPause}
          title={isPlaying ? "一時停止 [Space]" : "再生 [Space]"}
          className={`border-2 rounded-xl py-4 px-2 flex flex-col items-center justify-center shadow-xl cursor-pointer transition-all active:translate-y-1 ${
            isPop
              ? isPlaying 
                ? 'bg-gradient-to-b from-yellow-400 to-amber-500 border-yellow-200 text-slate-950 font-black shadow-yellow-400/50 scale-105' 
                : 'bg-gradient-to-b from-pink-500 to-purple-600 border-pink-300 text-white hover:from-pink-400 hover:to-purple-500 shadow-pink-500/30'
              : isPlaying 
                ? isSilver
                  ? 'bg-gradient-to-b from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 border-cyan-200 shadow-cyan-500/50 font-extrabold scale-105'
                  : 'bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-100 border-slate-950 shadow-amber-900/30 font-extrabold' 
                : isSilver
                  ? 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-100 border-slate-500 font-bold shadow-md'
                  : 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 border-slate-950 font-bold'
          }`}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span className="text-[10px] font-mono mt-1 font-extrabold tracking-wider">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <button 
          onClick={onStop}
          title="停止"
          className={`border-2 rounded-xl py-4 px-2 flex flex-col items-center justify-center shadow-xl active:translate-y-1 cursor-pointer transition-all ${
            isPop
              ? 'bg-gradient-to-b from-pink-500 to-purple-600 border-pink-300 text-white hover:from-pink-400 hover:to-purple-500 shadow-pink-500/30'
              : isSilver
                ? 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-100 border-slate-500 font-bold shadow-md'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 border-slate-950 font-bold'
          }`}
        >
          <Square size={18} />
          <span className="text-[10px] font-mono mt-1 font-extrabold tracking-wider">STOP</span>
        </button>

        <button 
          onClick={onFastForward}
          title="次の曲へ進む (早送り) [N]"
          className={`border-2 rounded-xl py-4 px-2 flex flex-col items-center justify-center shadow-xl active:translate-y-1 cursor-pointer transition-all ${
            isPop
              ? 'bg-gradient-to-b from-pink-500 to-purple-600 border-pink-300 text-white hover:from-pink-400 hover:to-purple-500 shadow-pink-500/30'
              : isSilver
                ? 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-100 border-slate-500 font-bold shadow-md'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 border-slate-950 font-bold'
          }`}
        >
          <FastForward size={18} />
          <span className="text-[10px] font-mono mt-1 font-extrabold tracking-wider">F.FWD</span>
        </button>

        <button 
          onClick={onNext}
          title="次の放送局へ選局 [→]"
          className={`border-2 rounded-xl py-4 px-2 flex flex-col items-center justify-center shadow-xl active:translate-y-1 cursor-pointer transition-all ${
            isPop
              ? 'bg-gradient-to-b from-pink-500 to-purple-600 border-pink-300 text-white hover:from-pink-400 hover:to-purple-500 shadow-pink-500/30'
              : isSilver
                ? 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-100 border-slate-500 font-bold shadow-md'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 border-slate-950 font-bold'
          }`}
        >
          <SkipForward size={18} />
          <span className="text-[10px] font-mono mt-1 font-extrabold tracking-wider">NEXT</span>
        </button>
      </div>
    </div>
  );
}

export default memo(TapeDeck);
