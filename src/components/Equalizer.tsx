import { memo } from 'react';
import { Sliders } from 'lucide-react';

interface EqualizerProps {
  bass: number; // -10 to 10 dB
  mid: number;
  treble: number;
  onBassChange: (val: number) => void;
  onMidChange: (val: number) => void;
  onTrebleChange: (val: number) => void;
  theme?: string;
  className?: string;
}

function Equalizer({
  bass,
  mid,
  treble,
  onBassChange,
  onMidChange,
  onTrebleChange,
  theme = 'wood',
  className = '',
}: EqualizerProps) {
  const isPop = theme === 'candypop';
  const isSilver = theme === 'silver';

  return (
    <div className={`p-4 rounded-xl shadow-lg flex flex-col justify-between transition-all duration-300 ${
      isPop 
        ? 'bg-slate-900/90 border border-pink-500/40 shadow-pink-500/10' 
        : isSilver
          ? 'bg-slate-950 border border-slate-700 shadow-xl'
          : 'bg-slate-900 border border-slate-800'
    } ${className}`}>
      {/* Equalizer Title */}
      <div className={`flex items-center justify-between mb-3 border-b pb-2.5 ${
        isPop ? 'border-pink-500/30' : isSilver ? 'border-slate-700' : 'border-slate-800'
      }`}>
        <div className="flex items-center space-x-2">
          <Sliders size={16} className={isPop ? 'text-pink-400' : isSilver ? 'text-cyan-400' : 'text-amber-500'} />
          <h2 className={`text-xs font-bold font-mono tracking-wider uppercase ${
            isPop ? 'text-pink-200' : isSilver ? 'text-cyan-200' : 'text-slate-100'
          }`}>
            {isPop ? 'CANDY EQUALIZER' : '3-BAND ANALOG EQUALIZER'}
          </h2>
        </div>
      </div>

      {/* Retro Slider controls */}
      <div className="grid grid-cols-3 gap-2">
        {/* BASS */}
        <div className={`border p-2.5 rounded-lg flex flex-col items-center ${
          isPop 
            ? 'bg-slate-950/80 border-pink-500/30' 
            : isSilver
              ? 'bg-slate-950 border-slate-800'
              : 'bg-slate-950/60 border-slate-900'
        }`}>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${
            isPop ? 'text-pink-400' : isSilver ? 'text-cyan-300' : 'text-slate-400'
          }`}>BASS</span>
          <div className="relative h-16 flex items-center justify-center py-0.5">
            {/* Center line */}
            <div className={`absolute w-[2px] h-full pointer-events-none ${isPop ? 'bg-pink-900/50' : 'bg-slate-800'}`}></div>
            
            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={bass}
              onChange={(e) => onBassChange(parseInt(e.target.value))}
              className={`appearance-none w-1.5 h-full rounded-md bg-transparent focus:outline-none focus:ring-0 cursor-row-resize [writing-mode:vertical-lr] [direction:rtl] ${
                isPop ? 'accent-pink-400' : isSilver ? 'accent-cyan-400' : 'accent-amber-500'
              }`}
              style={{
                background: 'linear-gradient(to bottom, #1e293b, #1e293b)',
              }}
            />
          </div>
          <span className={`text-[10px] font-mono font-bold mt-1 ${
            isPop ? 'text-pink-300' : isSilver ? 'text-cyan-300' : 'text-amber-400'
          }`}>
            {bass > 0 ? `+${bass}` : bass}dB
          </span>
        </div>

        {/* MID */}
        <div className={`border p-2.5 rounded-lg flex flex-col items-center ${
          isPop 
            ? 'bg-slate-950/80 border-pink-500/30' 
            : isSilver
              ? 'bg-slate-950 border-slate-800'
              : 'bg-slate-950/60 border-slate-900'
        }`}>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${
            isPop ? 'text-yellow-400' : isSilver ? 'text-cyan-300' : 'text-slate-400'
          }`}>MID</span>
          <div className="relative h-16 flex items-center justify-center py-0.5">
            {/* Center line */}
            <div className={`absolute w-[2px] h-full pointer-events-none ${isPop ? 'bg-pink-900/50' : 'bg-slate-800'}`}></div>
            
            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={mid}
              onChange={(e) => onMidChange(parseInt(e.target.value))}
              className={`appearance-none w-1.5 h-full rounded-md bg-transparent focus:outline-none focus:ring-0 cursor-row-resize [writing-mode:vertical-lr] [direction:rtl] ${
                isPop ? 'accent-yellow-400' : isSilver ? 'accent-cyan-400' : 'accent-amber-500'
              }`}
              style={{
                background: 'linear-gradient(to bottom, #1e293b, #1e293b)',
              }}
            />
          </div>
          <span className={`text-[10px] font-mono font-bold mt-1 ${
            isPop ? 'text-yellow-300' : isSilver ? 'text-cyan-300' : 'text-amber-400'
          }`}>
            {mid > 0 ? `+${mid}` : mid}dB
          </span>
        </div>

        {/* TREBLE */}
        <div className={`border p-2.5 rounded-lg flex flex-col items-center ${
          isPop 
            ? 'bg-slate-950/80 border-pink-500/30' 
            : isSilver
              ? 'bg-slate-950 border-slate-800'
              : 'bg-slate-950/60 border-slate-900'
        }`}>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${
            isPop ? 'text-cyan-400' : isSilver ? 'text-cyan-300' : 'text-slate-400'
          }`}>TREBLE</span>
          <div className="relative h-16 flex items-center justify-center py-0.5">
            {/* Center line */}
            <div className={`absolute w-[2px] h-full pointer-events-none ${isPop ? 'bg-pink-900/50' : 'bg-slate-800'}`}></div>
            
            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={treble}
              onChange={(e) => onTrebleChange(parseInt(e.target.value))}
              className={`appearance-none w-1.5 h-full rounded-md bg-transparent focus:outline-none focus:ring-0 cursor-row-resize [writing-mode:vertical-lr] [direction:rtl] ${
                isPop ? 'accent-cyan-400' : isSilver ? 'accent-cyan-400' : 'accent-amber-500'
              }`}
              style={{
                background: 'linear-gradient(to bottom, #1e293b, #1e293b)',
              }}
            />
          </div>
          <span className={`text-[10px] font-mono font-bold mt-1 ${
            isPop ? 'text-cyan-300' : isSilver ? 'text-cyan-300' : 'text-amber-400'
          }`}>
            {treble > 0 ? `+${treble}` : treble}dB
          </span>
        </div>
      </div>

      {/* 音質EQ プリセット (SOUND CHARACTER PRESETS) 統合 */}
      <div className={`mt-2.5 pt-2 border-t ${isPop ? 'border-pink-500/30' : isSilver ? 'border-slate-800' : 'border-slate-800/80'}`}>
        <div className={`text-[10px] font-mono font-bold mb-1.5 flex items-center justify-between ${
          isPop ? 'text-pink-300' : isSilver ? 'text-slate-300' : 'text-slate-400'
        }`}>
          <span className="flex items-center gap-1">
            <span>🔊</span>
            <span>EQ PRESETS</span>
          </span>
          <button
            type="button"
            onClick={() => { onBassChange(0); onMidChange(0); onTrebleChange(0); }}
            className="text-[9px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
          >
            FLAT (0dB)
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => { onBassChange(3); onMidChange(-5); onTrebleChange(2); }}
            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
              bass === 3 && mid === -5 && treble === 2
                ? isPop 
                  ? 'bg-pink-500/30 border-pink-400 text-pink-200 font-bold shadow-sm' 
                  : isSilver
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-extrabold shadow-sm'
                    : 'bg-amber-600/30 border-amber-500 text-amber-200 font-bold shadow-sm'
                : 'bg-black/40 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
            }`}
          >
            <div className="font-bold text-[9px] truncate">🍸 ナイト</div>
            <div className="text-[8px] text-slate-400 font-sans">MID -5dB</div>
          </button>

          <button
            type="button"
            onClick={() => { onBassChange(-2); onMidChange(0); onTrebleChange(-1); }}
            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
              bass === -2 && mid === 0 && treble === -1
                ? isPop 
                  ? 'bg-pink-500/30 border-pink-400 text-pink-200 font-bold shadow-sm' 
                  : isSilver
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-extrabold shadow-sm'
                    : 'bg-amber-600/30 border-amber-500 text-amber-200 font-bold shadow-sm'
                : 'bg-black/40 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
            }`}
          >
            <div className="font-bold text-[9px] truncate">☕ マイルド</div>
            <div className="text-[8px] text-slate-400 font-sans">減衰EQ</div>
          </button>

          <button
            type="button"
            onClick={() => { onBassChange(6); onMidChange(-1); onTrebleChange(2); }}
            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
              bass === 6 && mid === -1 && treble === 2
                ? isPop 
                  ? 'bg-pink-500/30 border-pink-400 text-pink-200 font-bold shadow-sm' 
                  : isSilver
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-extrabold shadow-sm'
                    : 'bg-amber-600/30 border-amber-500 text-amber-200 font-bold shadow-sm'
                : 'bg-black/40 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
            }`}
          >
            <div className="font-bold text-[9px] truncate">💥 重低音</div>
            <div className="text-[8px] text-slate-400 font-sans">BASS強調</div>
          </button>

          <button
            type="button"
            onClick={() => { onBassChange(-4); onMidChange(4); onTrebleChange(-2); }}
            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
              bass === -4 && mid === 4 && treble === -2
                ? isPop 
                  ? 'bg-pink-500/30 border-pink-400 text-pink-200 font-bold shadow-sm' 
                  : isSilver
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-extrabold shadow-sm'
                    : 'bg-amber-600/30 border-amber-500 text-amber-200 font-bold shadow-sm'
                : 'bg-black/40 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
            }`}
          >
            <div className="font-bold text-[9px] truncate">📻 レトロ</div>
            <div className="text-[8px] text-slate-400 font-sans">中音高め</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(Equalizer);
