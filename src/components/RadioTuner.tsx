import { ChangeEvent, memo } from 'react';
import { Compass, Sparkles, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Station } from '../types';

interface RadioTunerProps {
  currentFreq: number;
  onFreqChange: (freq: number) => void;
  stations: Station[];
  activeStation: Station | null;
  theme?: string;
  selectedBand?: 'FM' | 'AM' | 'SW';
  onBandChange?: (band: 'FM' | 'AM' | 'SW') => void;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  isPowerOn?: boolean;
  isPlaying?: boolean;
  className?: string;
}

function RadioTuner({
  currentFreq,
  onFreqChange,
  stations,
  activeStation,
  theme = 'wood',
  selectedBand = 'FM',
  onBandChange,
  isFavorite = false,
  onFavoriteToggle,
  isPowerOn = true,
  className = '',
}: RadioTunerProps) {
  const isPop = theme === 'candypop';
  const isSilver = theme === 'silver';

  // Range allows tuning down to 76.0 MHz for the secret station
  const minFreq = 76.0;
  const maxFreq = 108.0;

  // Convert frequency to percentage along the dial width
  const getPercent = (freq: number) => {
    return ((freq - minFreq) / (maxFreq - minFreq)) * 100;
  };

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFreqChange(parseFloat(e.target.value));
  };

  const stepFreq = (direction: 'up' | 'down') => {
    let next = direction === 'up' ? currentFreq + 0.1 : currentFreq - 0.1;
    next = Math.max(minFreq, Math.min(maxFreq, parseFloat(next.toFixed(1))));
    onFreqChange(next);
  };

  const regularStations = stations.filter(s => !s.isSecret);

  return (
    <div className={`p-4 rounded-xl shadow-lg flex flex-col justify-between transition-all duration-300 ${
      isPop 
        ? 'bg-slate-900/90 border border-pink-500/40 shadow-pink-500/10' 
        : isSilver
          ? 'bg-slate-950 border border-slate-700 shadow-xl'
          : 'bg-slate-900 border border-slate-800'
    } ${className}`}>
      {/* Glow Panel Title & Band Switch */}
      <div className={`flex flex-wrap items-center justify-between gap-2 mb-3 border-b pb-2.5 ${
        isPop ? 'border-pink-500/30' : isSilver ? 'border-slate-700' : 'border-slate-800'
      }`}>
        <div className="flex items-center space-x-2">
          <Compass size={15} className={`animate-spin [animation-duration:12s] ${isPop ? 'text-pink-400' : isSilver ? 'text-cyan-400' : 'text-amber-500'}`} />
          <h2 className={`text-xs font-mono font-bold tracking-wider uppercase ${isPop ? 'text-pink-200' : 'text-slate-100'}`}>
            {isPop ? 'CANDY TUNER' : 'FREQUENCY TUNING DIAL'}
          </h2>
        </div>

        {/* BAND and FAVORITE STATUS */}
        <div className="flex items-center gap-1.5 flex-nowrap">
          {/* Favorite Toggle Button */}
          {onFavoriteToggle && (
            <button 
              onClick={onFavoriteToggle}
              disabled={!isPowerOn || !activeStation}
              className={`p-1 rounded border transition-all ${
                !isPowerOn 
                  ? 'text-slate-600 border-transparent opacity-50 cursor-not-allowed' 
                  : isFavorite
                    ? 'text-rose-500 border-rose-500/30 bg-rose-500/10'
                    : isSilver ? 'text-slate-300 border-slate-700 hover:text-white' : 'text-stone-300 border-stone-800 hover:text-stone-100'
              }`}
              title={isFavorite ? 'お気に入り解除' : 'お気に入り登録'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Real Band Switch Toggle Buttons (FM / AM / SW) */}
          {onBandChange && (
            <div className="flex items-center bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800 gap-1 text-[10px] font-mono">
              <span className="text-slate-400 font-bold pr-0.5">BAND:</span>
              {(['FM', 'AM', 'SW'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => onBandChange(b)}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    selectedBand === b
                      ? isPop
                        ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/50'
                        : isSilver
                          ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-amber-600 text-stone-950 shadow-sm'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                  title={`${b}バンドに切り替え`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
          
          {/* Glow indicator if tuned precisely */}
          {activeStation ? (
            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
              activeStation.isSecret
                ? 'bg-purple-600/30 border-fuchsia-400/80 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.7)]'
                : isPop 
                  ? 'bg-pink-500/20 border-pink-400/50 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.5)]' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <Sparkles size={8} />
              <span>{activeStation.isSecret ? '✨ SECRET 2099' : `${selectedBand || 'FM'} ST. LOCKED`}</span>
            </div>
          ) : (
            <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono shrink-0 ${
              isPop ? 'bg-slate-950 text-pink-400/60' : 'bg-slate-950 text-slate-400'
            }`}>
              STATIC
            </div>
          )}
        </div>
      </div>

      {/* Retro Glass Analog Display Panel */}
      <div className={`relative rounded-lg border p-4 shadow-inner overflow-hidden mb-3 transition-all ${
        activeStation?.isSecret
          ? 'bg-slate-950/90 border-fuchsia-500/60 shadow-[inset_0_0_20px_rgba(217,70,239,0.3)]'
          : isPop 
            ? 'bg-slate-950/90 border-pink-500/40 shadow-[inset_0_0_15px_rgba(236,72,153,0.2)]' 
            : 'bg-slate-950/90 border-slate-900'
      }`}>
        {/* Subtle grid mesh pattern in background */}
        <div className="absolute inset-0 bg-grid-slate-900/50 pointer-events-none"></div>

        {/* Dial Scale Grads */}
        <div className="relative h-14 flex flex-col justify-end px-2">
          
          {/* Station indicators (Tick marks above scale) */}
          <div className="absolute top-0 left-2 right-2 h-5">
            {stations.map((st) => (
              <button
                key={st.frequency}
                onClick={() => onFreqChange(st.frequency)}
                style={{ left: `${getPercent(st.frequency)}%` }}
                className={`absolute -translate-x-1/2 flex flex-col items-center cursor-pointer group z-10`}
                title={st.isSecret ? "✨ 76.0 MHz 隠しステーション" : `${st.frequency} MHz - ${st.name}`}
              >
                <span className={`h-2 w-1 rounded-full transition-all ${
                  Math.abs(st.frequency - currentFreq) < 0.1
                    ? st.isSecret
                      ? 'bg-fuchsia-400 h-3.5 w-2 shadow-[0_0_12px_rgba(217,70,239,0.9)] animate-bounce'
                      : isPop 
                        ? 'bg-pink-400 h-3 w-1.5 shadow-[0_0_10px_rgba(244,114,182,0.9)]'
                        : 'bg-amber-400 h-3 w-1.5 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : st.isSecret
                      ? 'bg-purple-500/60 text-fuchsia-300 group-hover:bg-fuchsia-400'
                      : isPop ? 'bg-purple-400/40 group-hover:bg-pink-400' : 'bg-indigo-500/40 group-hover:bg-indigo-400'
                }`}></span>
                <span className={`text-[8px] font-mono font-bold mt-0.5 leading-none ${
                  st.isSecret
                    ? 'text-fuchsia-300 group-hover:text-fuchsia-100'
                    : isPop 
                      ? 'text-pink-300 group-hover:text-pink-100' 
                      : isSilver
                        ? 'text-cyan-300 font-extrabold group-hover:text-white'
                        : 'text-amber-300 group-hover:text-amber-100'
                }`}>
                  {st.isSecret ? '76✨' : st.frequency}
                </span>
              </button>
            ))}
          </div>

          {/* Scale Notch Ticks & Frequency Numbers (Accurately Mapped) */}
          <div className="relative w-full h-8 mb-1 select-none">
            {/* Major Frequency Numbers (76, 80, 84, 88, 92, 96, 100, 104, 108) */}
            {[76, 80, 84, 88, 92, 96, 100, 104, 108].map((f) => (
              <span
                key={f}
                style={{ left: `${getPercent(f)}%` }}
                className={`absolute top-0 -translate-x-1/2 text-[10px] font-mono font-bold ${
                  f === 76 
                    ? 'text-fuchsia-400 font-extrabold' 
                    : f === 108 
                      ? 'text-emerald-400 font-extrabold' 
                      : isPop 
                        ? 'text-pink-300' 
                        : isSilver 
                          ? 'text-cyan-300 font-extrabold' 
                          : 'text-amber-400 font-bold'
                }`}
              >
                {f === 76 ? '76🔒' : f}
              </span>
            ))}

            {/* Sub tick notch lines mapped accurately every 0.5 MHz (65 ticks across 32 MHz) */}
            <div className="absolute bottom-0 inset-x-0 h-3">
              {Array.from({ length: 65 }).map((_, i) => {
                const freq = 76.0 + i * 0.5;
                const isMajor = i % 8 === 0; // Every 4 MHz (76, 80, 84...)
                const isMedium = i % 2 === 0; // Every 1 MHz
                return (
                  <div
                    key={i}
                    style={{ left: `${getPercent(freq)}%` }}
                    className={`absolute bottom-0 -translate-x-1/2 w-[1px] ${
                      isPop ? 'bg-pink-400/50' : isSilver ? 'bg-cyan-400/60' : 'bg-amber-500/40'
                    } ${
                      isMajor ? 'h-3 w-[1.5px] opacity-90' : isMedium ? 'h-2 opacity-70' : 'h-1 opacity-40'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Glowing Tuning needle slider cursor */}
          <div className="absolute inset-x-2 bottom-0 h-14 pointer-events-none">
            <div 
              style={{ left: `${getPercent(currentFreq)}%` }} 
              className={`absolute bottom-0 h-14 w-0.5 -translate-x-1/2 transition-all duration-100 ease-out z-20 ${
                Math.abs(currentFreq - 76.0) < 0.2
                  ? 'bg-fuchsia-400 shadow-[0_0_12px_#e879f9]'
                  : isPop 
                    ? 'bg-pink-400 shadow-[0_0_10px_#f472b6]' 
                    : isSilver
                      ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                      : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              }`}
            >
              {/* Top needle eye */}
              <div className={`h-2.5 w-2.5 rounded-full -translate-x-[4px] -translate-y-1 ${
                Math.abs(currentFreq - 76.0) < 0.2
                  ? 'bg-fuchsia-300 shadow-[0_0_10px_rgba(232,121,249,1)]'
                  : isPop 
                    ? 'bg-gradient-to-r from-yellow-300 to-pink-500 shadow-[0_0_8px_rgba(253,224,71,0.9)]' 
                    : isSilver
                      ? 'bg-gradient-to-r from-cyan-300 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.9)]'
                      : 'bg-gradient-to-r from-red-400 to-red-600'
              }`}></div>
            </div>
          </div>
        </div>

        {/* Glowing Retro Frequency Display screen */}
        <div className={`mt-3 flex items-baseline justify-between border-t pt-2.5 ${
          isPop ? 'border-pink-500/30' : isSilver ? 'border-slate-800' : 'border-slate-900'
        }`}>
          <div>
            <div className={`text-[10px] font-mono tracking-wider uppercase ${isPop ? 'text-pink-300/70' : isSilver ? 'text-slate-300 font-semibold' : 'text-slate-400'}`}>Tuned Frequency</div>
            <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight text-transparent bg-clip-text flex items-baseline ${
              Math.abs(currentFreq - 76.0) < 0.2
                ? 'bg-gradient-to-r from-fuchsia-300 via-purple-300 to-pink-300 drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]'
                : isPop 
                  ? 'bg-gradient-to-r from-pink-300 via-yellow-200 to-cyan-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]' 
                  : isSilver
                    ? 'bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`}>
              {currentFreq.toFixed(1)}
              <span className={`text-xs font-semibold ml-1 ${isPop ? 'text-pink-400' : isSilver ? 'text-cyan-400' : 'text-amber-600/70'}`}>MHz</span>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] font-mono tracking-wider block uppercase ${isPop ? 'text-pink-300/70' : isSilver ? 'text-slate-300 font-semibold' : 'text-slate-400'}`}>Band Mode</span>
            <span className={`text-xs sm:text-sm font-semibold font-mono tracking-widest ${
              Math.abs(currentFreq - 76.0) < 0.2
                ? 'text-fuchsia-300 animate-pulse font-bold'
                : isPop ? 'text-pink-300' : isSilver ? 'text-cyan-300 font-bold' : 'text-indigo-400'
            }`}>
              {Math.abs(currentFreq - 76.0) < 0.2 ? '✨ SECRET 2099' : `${selectedBand} STEREO`}
            </span>
          </div>
        </div>

        {/* Glossy Reflection overlay glass */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 to-transparent h-1/3"></div>
      </div>

      {/* Manual Fine Tuning Slider Control */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => stepFreq('down')}
            className={`p-2 bg-slate-950 border text-xs rounded cursor-pointer transition-all active:translate-y-0.5 ${
              isPop 
                ? 'border-pink-500/40 text-pink-300 hover:text-white hover:border-pink-400 hover:bg-pink-950/40' 
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            title="周波数を下げる (76.0MHzで隠し局)"
          >
            <ChevronLeft size={16} />
          </button>
          
          <input
            type="range"
            min={minFreq}
            max={maxFreq}
            step="0.1"
            value={currentFreq}
            onChange={handleSliderChange}
            className={`flex-grow h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer border ${
              Math.abs(currentFreq - 76.0) < 0.2
                ? 'accent-fuchsia-400 border-fuchsia-500/60 shadow-[0_0_10px_rgba(217,70,239,0.5)]'
                : isPop 
                  ? 'accent-pink-500 border-pink-500/40' 
                  : 'accent-amber-500 border-slate-800'
            }`}
          />

          <button
            onClick={() => stepFreq('up')}
            className={`p-2 bg-slate-950 border text-xs rounded cursor-pointer transition-all active:translate-y-0.5 ${
              isPop 
                ? 'border-pink-500/40 text-pink-300 hover:text-white hover:border-pink-400 hover:bg-pink-950/40' 
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Factional presets list */}
        <div className="grid grid-cols-5 gap-1.5">
          {regularStations.map((st) => (
            <button
              key={st.frequency}
              onClick={() => onFreqChange(st.frequency)}
              className={`py-1.5 px-1 text-center rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                Math.abs(st.frequency - currentFreq) < 0.1
                  ? isPop 
                    ? 'bg-pink-500/20 border-pink-400 text-pink-200 shadow-lg shadow-pink-500/20 scale-105'
                    : isSilver
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20 scale-105 font-extrabold'
                      : 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10'
                  : isPop 
                    ? 'bg-slate-950/80 border-pink-900/40 hover:border-pink-500/50 text-pink-300 hover:text-white'
                    : isSilver
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>{st.frequency}</div>
              <div className="text-[8px] opacity-75 font-normal truncate">{st.name.replace(/FM|Radio/gi, '').trim()}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(RadioTuner);

