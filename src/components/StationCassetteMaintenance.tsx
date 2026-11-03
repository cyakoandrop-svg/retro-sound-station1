import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Radio, 
  Copy, 
  Check, 
  AlertCircle, 
  FileJson, 
  Disc, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCode
} from 'lucide-react';
import { Station } from '../types';
import { StationProgression, StationCassettePlaylist } from '../types/stationCassette';
import { 
  IMPLEMENTED_STATIONS, 
  exportStationCassettePlaylist, 
  importStationCassettePlaylist, 
  downloadJsonFile 
} from '../audio/slots/stationCassetteManager';

interface StationCassetteMaintenanceProps {
  currentFrequency: number;
  stations: Station[];
  stationConfigs: Record<number, StationProgression>;
  customStationFlags: Record<number, boolean>;
  onUpdateStationConfig: (freq: number, newProg: StationProgression, cassetteName: string) => void;
  onResetStationConfig: (freq: number) => void;
  onTuneStation: (freq: number) => void;
  isPlaying: boolean;
}

export const StationCassetteMaintenance: React.FC<StationCassetteMaintenanceProps> = ({
  currentFrequency,
  stations,
  stationConfigs,
  customStationFlags,
  onUpdateStationConfig,
  onResetStationConfig,
  onTuneStation,
  isPlaying
}) => {
  const [selectedFreq, setSelectedFreq] = useState<number>(105.8);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteJsonText, setPasteJsonText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMeta = IMPLEMENTED_STATIONS.find(s => Math.abs(s.frequency - selectedFreq) < 0.2) || IMPLEMENTED_STATIONS[0];
  const stationObj = stations.find(s => Math.abs(s.frequency - selectedFreq) < 0.2);
  const currentProg = stationConfigs[selectedFreq];
  const isCustomLoaded = customStationFlags[selectedFreq] === true;
  const isCurrentlyBroadcasting = Math.abs(currentFrequency - selectedFreq) < 0.2;

  // 現在の局のセットプレイリストJSONオブジェクト
  const currentPlaylist: StationCassettePlaylist = currentProg 
    ? exportStationCassettePlaylist(selectedFreq, currentProg, stationObj)
    : {
        type: 'station_cassette_playlist',
        version: '1.0.0',
        frequency: selectedFreq,
        stationName: selectedMeta.name,
        genre: selectedMeta.genre,
        exportedAt: new Date().toISOString(),
        description: 'No data',
        tracks: []
      };

  const handleExport = () => {
    try {
      const filename = `${selectedMeta.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedFreq}mhz_cassette.json`;
      downloadJsonFile(filename, currentPlaylist);
      setStatusMessage({ type: 'success', text: `「${selectedMeta.name}」のカセットデータ (${filename}) を書き出しました！` });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `書き出し失敗: ${err.message}` });
    }
  };

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(currentPlaylist, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // ignore
    }
  };

  const processJsonString = (jsonString: string) => {
    try {
      const result = importStationCassettePlaylist(jsonString);
      // インポート先の周波数は、JSON内に周波数指定があればそれを使い、なければ現在選択中の周波数へ
      const targetFreq = result.frequency || selectedFreq;
      onUpdateStationConfig(targetFreq, result.progression, result.playlist.stationName || selectedMeta.name);
      
      setSelectedFreq(targetFreq);
      setStatusMessage({
        type: 'success',
        text: `「${result.playlist.stationName || `CH ${targetFreq}MHz`}」の本線カセットを正常に装填・更新しました！（全${result.playlist.tracks.length}セット収録）`
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processJsonString(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processJsonString(text);
      };
      reader.readAsText(file);
    }
  };

  const handleApplyPaste = () => {
    if (!pasteJsonText.trim()) return;
    processJsonString(pasteJsonText);
    setShowPasteModal(false);
    setPasteJsonText('');
  };

  return (
    <div className="space-y-4 font-sans text-stone-200">
      {/* 隠しファイルインプット */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json,application/json" 
        className="hidden" 
      />

      {/* 1. 概要バナー */}
      <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono text-amber-400 flex items-center gap-1.5">
              <span>📻</span>
              <span>本線チャンネル 演奏データカセット管理 (STATION CASSETTE MAINTENANCE)</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              ADMIN TOOL
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            本線ラジオとして実装されている全6局の放送演奏データ（Set 1 / Set 2 / Set 3...）をカセットとして外部ファイル（.json）へ書き出し、また外部から読み込んで実際の放送音源へ直接反映・差し替えを行うメンテナンス機能です。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            title="外部カセットJSONファイルを読み込んで本線へ装填"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>カセット外部読込 (.json)</span>
          </button>

          <button
            onClick={() => setShowPasteModal(true)}
            className="px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-mono flex items-center gap-1 cursor-pointer transition-all"
            title="JSON文字列を直接貼り付けて装填"
          >
            <FileCode className="w-3.5 h-3.5 text-stone-400" />
            <span>テキスト貼付</span>
          </button>
        </div>
      </div>

      {/* 通知メッセージ */}
      {statusMessage && (
        <div className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 animate-fadeIn ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/90 border border-emerald-500/70 text-emerald-200' 
            : 'bg-rose-950/90 border border-rose-500/70 text-rose-200'
        }`}>
          {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. 本線6局セレクター（大型ピルボタン） */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {IMPLEMENTED_STATIONS.map((meta) => {
          const isSelected = selectedFreq === meta.frequency;
          const isBroadcastingNow = Math.abs(currentFrequency - meta.frequency) < 0.2;
          const hasCustom = customStationFlags[meta.frequency] === true;

          return (
            <button
              key={meta.frequency}
              onClick={() => setSelectedFreq(meta.frequency)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 group relative ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-stone-950 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{meta.icon}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'
                  }`}>
                    {meta.badge}
                  </span>
                </div>
                <div className={`text-xs font-bold mt-1 font-mono truncate ${isSelected ? 'text-amber-300' : 'text-stone-200'}`}>
                  {meta.name}
                </div>
              </div>

              <div className="pt-1.5 border-t border-stone-800/80 flex items-center justify-between text-[9px] font-mono">
                {hasCustom ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    CUSTOM
                  </span>
                ) : (
                  <span className="text-stone-500">標準初期</span>
                )}

                {isBroadcastingNow && (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    ON AIR
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. 選択局の詳細カセットパネル & ドラッグ＆ドロップエリア */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 rounded-xl border transition-all ${
          isDragging 
            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400' 
            : 'bg-stone-950 border-stone-800'
        }`}
      >
        {/* ヘッダー情報 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-800 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg border flex items-center justify-center text-2xl shrink-0 ${selectedMeta.colorBorder} ${selectedMeta.colorBg}`}>
              {selectedMeta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-mono font-bold ${selectedMeta.colorText}`}>
                  {selectedMeta.badge}
                </span>
                <span className="text-stone-500">•</span>
                <span className="text-xs font-mono text-stone-300">
                  {selectedMeta.genre}
                </span>
                {isCustomLoaded ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    <Disc className="w-3 h-3 text-amber-400 animate-spin" />
                    カスタムカセット装填中
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800">
                    標準ファームウェア運用中
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2 mt-0.5">
                <span>{selectedMeta.name}</span>
                {isCurrentlyBroadcasting && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    現在受信中 ({isPlaying ? '放送演奏中' : '待機中'})
                  </span>
                )}
              </h3>
            </div>
          </div>

          {/* 右側：操作ボタングループ */}
          <div className="flex flex-wrap items-center gap-2">
            {!isCurrentlyBroadcasting && (
              <button
                onClick={() => onTuneStation(selectedFreq)}
                className="px-2.5 py-1.5 rounded bg-stone-900 hover:bg-stone-850 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                title="ラジオの周波数をこの局へ即座に同調"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>この局を受信 (Tune {selectedFreq}MHz)</span>
              </button>
            )}

            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded bg-stone-900 hover:bg-stone-850 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              title="この局の全セットを1本のセットプレイリストJSONとしてダウンロード"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>カセット書き出し (.json)</span>
            </button>

            {isCustomLoaded && (
              <button
                onClick={() => onResetStationConfig(selectedFreq)}
                className="px-2.5 py-1.5 rounded bg-stone-900 hover:bg-stone-850 text-rose-300 border border-rose-500/40 hover:border-rose-400 text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                title="この局の演奏データを初期の工場設定に戻す"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>初期設定にリセット</span>
              </button>
            )}
          </div>
        </div>

        {/* ドラッグ＆ドロップガイド */}
        {isDragging && (
          <div className="my-3 text-center py-4 text-xs font-mono text-amber-300 font-bold border-2 border-dashed border-amber-400 rounded-lg animate-pulse bg-amber-500/10">
            📂 ここにカセットJSONをドロップすると、「{selectedMeta.name}」の本線演奏データとして即座に装填されます
          </div>
        )}

        {/* 4. カセット収録曲（Set 1, Set 2...）一覧カード */}
        <div className="mt-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span className="font-bold flex items-center gap-1.5 text-stone-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>収録セット・トラック一覧 (CASSETTE TRACK LIST / {currentPlaylist.tracks.length} SETS)</span>
            </span>
            <span className="text-[11px]">
              ラジオ放送時はこれらのセットが自動ローテーションまたはランダム選曲されます
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {currentPlaylist.tracks.map((track, idx) => {
              const chordNames = track.chords.map(c => c.name).join(' → ');
              return (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-stone-900/90 border border-stone-800/90 hover:border-stone-700 transition-all flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          SET {track.setNumber} (Side {idx === 0 ? 'A' : idx === 1 ? 'B' : `${idx + 1}`})
                        </span>
                        <h4 className="text-xs font-bold text-stone-100 font-mono">
                          {track.title}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-stone-800 font-bold">
                        {track.bpm} BPM
                      </span>
                    </div>

                    {track.description && (
                      <p className="text-[10.5px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {track.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-800/70 text-[10px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-stone-400">
                      <span>コード進行:</span>
                      <span className="text-amber-200 font-bold truncate max-w-[200px]" title={chordNames}>
                        {chordNames}
                      </span>
                    </div>
                    {track.chordRhythm && (
                      <div className="flex items-center justify-between text-stone-400">
                        <span>コード刻み:</span>
                        <span className="text-stone-300">
                          {track.chordRhythm.map(s => `Step ${s}`).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. JSONインスペクター（折りたたみ） */}
        <div className="mt-3.5 pt-3 border-t border-stone-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowJsonInspector(!showJsonInspector)}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>カセット JSON データ構造を確認</span>
              {showJsonInspector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={handleCopyJson}
              className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-700 text-xs font-mono flex items-center gap-1 cursor-pointer transition-all"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copySuccess ? 'コピー完了' : 'JSONコピー'}</span>
            </button>
          </div>

          {showJsonInspector && (
            <div className="mt-2.5 animate-fadeIn">
              <pre className="p-3 bg-stone-900/95 border border-stone-800 rounded-lg text-[10.5px] font-mono text-amber-200/90 overflow-x-auto max-h-64 leading-relaxed">
                {JSON.stringify(currentPlaylist, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* テキスト貼り付けモーダル */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 w-full max-w-xl space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono text-stone-200">
                  カセット JSON テキストの貼り付け装填
                </h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-stone-400 hover:text-stone-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] font-mono text-stone-400">
              `station_cassette_playlist` 形式または `SoundSlotPattern` 形式のJSONテキストを貼り付けて「本線へ装填」を押すと、即座に該当チャンネルの演奏データが差し替えられます：
            </p>

            <textarea
              value={pasteJsonText}
              onChange={(e) => setPasteJsonText(e.target.value)}
              placeholder="ここにカセットJSONを貼り付け..."
              rows={10}
              className="w-full font-mono text-xs p-3 bg-stone-900 border border-stone-800 rounded-lg text-amber-200 focus:border-amber-400 focus:outline-none leading-relaxed"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 rounded bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-700 text-xs font-mono cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleApplyPaste}
                disabled={!pasteJsonText.trim()}
                className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>本線へ装填 (Apply)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
