import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  FileCode, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Play, 
  Square,
  Copy,
  Layers,
  Radio,
  Sliders,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  FileJson,
  CheckCircle2,
  Music
} from 'lucide-react';
import { SoundSlotPattern, SoundLabChannelId, SoundSlotPartChannels, SoundSlotPartMutes, RhythmStepTrigger, SoundSlotDrumStep } from '../types/soundSlot';
import { BUILTIN_STATION_SLOTS } from '../audio/slots/builtinSlots';

// 全7チャンネルの音源定義
export interface ChannelDef {
  id: SoundLabChannelId;
  name: string;
  station: string;
  frequency: string;
  badge: string;
  desc: string;
  icon: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
}

export const SOUND_CHANNELS: ChannelDef[] = [
  {
    id: 'musicbox',
    name: '秋葉原オルゴール',
    station: 'akihabara cronos',
    frequency: '97.5MHz',
    badge: '97.5ch',
    desc: '昭和レトロオルゴール。澄み渡る金属弁の澄明な打鍵と可憐な響き',
    icon: '🎵',
    colorBorder: 'border-amber-500/50',
    colorBg: 'bg-amber-500/15',
    colorText: 'text-amber-400'
  },
  {
    id: 'piano',
    name: '銀座ピアノ',
    station: 'GINZA CLUB',
    frequency: '101.5MHz',
    badge: '101.5ch',
    desc: 'Rhodes / エレピの温かみと洗練されたジャズのコード感',
    icon: '🎹',
    colorBorder: 'border-sky-500/50',
    colorBg: 'bg-sky-500/15',
    colorText: 'text-sky-400'
  },
  {
    id: 'guitar',
    name: 'ボサギター',
    station: 'TOKYO MORNING',
    frequency: '88.1MHz',
    badge: '88.1ch',
    desc: 'ナイロン弦ボサノヴァギターの軽快な爪弾きと温もりある響き',
    icon: '🎸',
    colorBorder: 'border-emerald-500/50',
    colorBg: 'bg-emerald-500/15',
    colorText: 'text-emerald-400'
  },
  {
    id: 'sax',
    name: '渋谷サックス＆ブラス',
    station: 'SHIBUYA GROOVE',
    frequency: '92.4MHz',
    badge: '92.4ch',
    desc: '艶やかなサックス旋律と華やかなシティポップ・シンセブラス',
    icon: '🎷',
    colorBorder: 'border-rose-500/50',
    colorBg: 'bg-rose-500/15',
    colorText: 'text-rose-400'
  },
  {
    id: 'raindrop',
    name: '六本木アクア',
    station: 'ROPPONGI Petrichor',
    frequency: '105.8MHz',
    badge: '105.8ch',
    desc: '水滴マリンバの可憐な打鍵とアクアバブル・リバーブ',
    icon: '🌧️',
    colorBorder: 'border-cyan-500/50',
    colorBg: 'bg-cyan-500/15',
    colorText: 'text-cyan-400'
  },
  {
    id: 'ambient',
    name: 'シルクロード',
    station: 'ELECTRO HEALING',
    frequency: '76.0MHz',
    badge: '76.0ch',
    desc: '深く包み込む瞑想アンビエントパッドと風鈴ベルの癒やし',
    icon: '✨',
    colorBorder: 'border-purple-500/50',
    colorBg: 'bg-purple-500/15',
    colorText: 'text-purple-400'
  }
];

// 本チャンネル（FM局）のリズム＆ドラムパターン定義
export interface StationDrumPreset {
  id: string;
  name: string;
  freq: string;
  badge: string;
  description: string;
  steps: SoundSlotDrumStep[];
}

export const MAIN_STATION_DRUM_PATTERNS: StationDrumPreset[] = [
  {
    id: 'station_1058',
    name: '105.8MHz 六本木雨音チルホップ',
    freq: '105.8MHz',
    badge: '105.8ch',
    description: '105.8MHz六本木本線直系 チルホップ雨音ビート (キック: 0, 6, 10拍 / スネア: 4, 12拍 / 8分刻みハイハット)',
    steps: [
      { step: 0, type: 'kick', velocity: 0.65 },
      { step: 0, type: 'hihat_closed', velocity: 0.32 },
      { step: 2, type: 'hihat_closed', velocity: 0.20 },
      { step: 4, type: 'snare', velocity: 0.55 },
      { step: 4, type: 'hihat_closed', velocity: 0.30 },
      { step: 6, type: 'kick', velocity: 0.62 },
      { step: 6, type: 'hihat_closed', velocity: 0.20 },
      { step: 8, type: 'hihat_closed', velocity: 0.32 },
      { step: 10, type: 'kick', velocity: 0.60 },
      { step: 10, type: 'hihat_closed', velocity: 0.20 },
      { step: 12, type: 'snare', velocity: 0.55 },
      { step: 12, type: 'hihat_closed', velocity: 0.30 },
      { step: 14, type: 'hihat_open', velocity: 0.26 }
    ]
  },
  {
    id: 'station_1015',
    name: '101.5MHz 銀座ラウンジジャズ',
    freq: '101.5MHz',
    badge: '101.5ch',
    description: '101.5MHz銀座ラウンジ本線直系 アコースティック・ブラシジャズスウィング (キック: 0, 8拍 / スネア: 4, 12拍 / ライド刻み)',
    steps: [
      { step: 0, type: 'kick', velocity: 0.60 },
      { step: 0, type: 'hihat_closed', velocity: 0.28 },
      { step: 2, type: 'hihat_closed', velocity: 0.18 },
      { step: 4, type: 'snare', velocity: 0.50 },
      { step: 4, type: 'hihat_closed', velocity: 0.30 },
      { step: 6, type: 'hihat_closed', velocity: 0.18 },
      { step: 8, type: 'kick', velocity: 0.45 },
      { step: 8, type: 'hihat_closed', velocity: 0.28 },
      { step: 10, type: 'hihat_closed', velocity: 0.18 },
      { step: 12, type: 'snare', velocity: 0.50 },
      { step: 12, type: 'hihat_closed', velocity: 0.30 },
      { step: 14, type: 'hihat_open', velocity: 0.24 }
    ]
  },
  {
    id: 'station_881',
    name: '88.1MHz 渋谷ボサノヴァ',
    freq: '88.1MHz',
    badge: '88.1ch',
    description: '88.1MHz東京モーニング本線直系 ボサノヴァ・スルド＆木製リムショット (スルド: 0, 8拍 / リム: 4, 12拍 / シェイカー: 4分)',
    steps: [
      { step: 0, type: 'kick', velocity: 0.55 },
      { step: 0, type: 'hihat_closed', velocity: 0.22 },
      { step: 4, type: 'snare', velocity: 0.48 },
      { step: 4, type: 'hihat_closed', velocity: 0.22 },
      { step: 8, type: 'kick', velocity: 0.52 },
      { step: 8, type: 'hihat_closed', velocity: 0.22 },
      { step: 12, type: 'snare', velocity: 0.48 },
      { step: 12, type: 'hihat_closed', velocity: 0.22 }
    ]
  },
  {
    id: 'station_924',
    name: '92.4MHz 渋谷シティポップ',
    freq: '92.4MHz',
    badge: '92.4ch',
    description: '92.4MHz渋谷本線直系 シティポップ・グルーヴ (キック: 0, 6, 10拍 / スネア: 4, 12拍 / 16分ハイハット刻み)',
    steps: [
      { step: 0, type: 'kick', velocity: 0.75 },
      { step: 0, type: 'hihat_closed', velocity: 0.35 },
      { step: 2, type: 'hihat_closed', velocity: 0.22 },
      { step: 4, type: 'snare', velocity: 0.70 },
      { step: 4, type: 'hihat_closed', velocity: 0.35 },
      { step: 6, type: 'kick', velocity: 0.65 },
      { step: 6, type: 'hihat_closed', velocity: 0.22 },
      { step: 8, type: 'hihat_closed', velocity: 0.35 },
      { step: 10, type: 'kick', velocity: 0.70 },
      { step: 10, type: 'hihat_closed', velocity: 0.22 },
      { step: 12, type: 'snare', velocity: 0.70 },
      { step: 12, type: 'hihat_closed', velocity: 0.35 },
      { step: 14, type: 'hihat_open', velocity: 0.32 }
    ]
  },
  {
    id: 'station_760',
    name: '76.0MHz エレクトロ瞑想太鼓鐘',
    freq: '76.0MHz',
    badge: '76.0ch',
    description: '76.0MHzエレクトロヒーリング本線直系 瞑想和太鼓＆寺院の梵鐘・おりん・風鈴',
    steps: [
      { step: 0, type: 'taiko', velocity: 0.60 },
      { step: 6, type: 'windChime', velocity: 0.35 },
      { step: 8, type: 'templeGong', velocity: 0.55 },
      { step: 14, type: 'windChime', velocity: 0.35 }
    ]
  }
];

interface SlotCartridgeManagerProps {
  currentSlot: SoundSlotPattern;
  onLoadSlot: (slot: SoundSlotPattern) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentStep: number;
  currentBar: number;
}

export const SlotCartridgeManager: React.FC<SlotCartridgeManagerProps> = ({
  currentSlot,
  onLoadSlot,
  isPlaying,
  onTogglePlay,
  currentStep,
  currentBar
}) => {
  const [showPartMixer, setShowPartMixer] = useState<boolean>(false);
  const [showArpeggioStepEditor, setShowArpeggioStepEditor] = useState<boolean>(true);
  const [showJsonEditor, setShowJsonEditor] = useState<boolean>(true);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>(() => JSON.stringify(currentSlot, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // currentSlot の変更をエディタ用 JSON に常時同期
  useEffect(() => {
    setJsonText(JSON.stringify(currentSlot, null, 2));
    setJsonError(null);
  }, [currentSlot]);

  const updateJsonFromSlot = (slot: SoundSlotPattern) => {
    setJsonText(JSON.stringify(slot, null, 2));
    setJsonError(null);
  };

  // ファイル読み込み処理共通関数
  const processJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.id || !parsed.title || !Array.isArray(parsed.chords)) {
          throw new Error('演奏データの必須構造 (id, title, chords) が不足しています。');
        }
        onLoadSlot(parsed);
        updateJsonFromSlot(parsed);
        setImportSuccess(`「${parsed.title}」を正常に読み込みました！`);
        setTimeout(() => setImportSuccess(null), 3500);
      } catch (err: any) {
        setJsonError(`ファイル読み込みエラー: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // 1. 外部ファイル (.json) のインポート (アップロード)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processJsonFile(file);
    e.target.value = '';
  };

  // ドラッグ＆ドロップ対応
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processJsonFile(file);
    }
  };

  // 2. 演奏データの外部ファイル (.json) エクスポート (ダウンロード保存)
  // エディタで編集中の場合も即座に同期して完全一致のデータを書き出す
  const handleExportJson = () => {
    let slotToExport = currentSlot;
    if (jsonText.trim()) {
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.id && parsed.title && Array.isArray(parsed.chords)) {
          slotToExport = parsed;
          onLoadSlot(parsed);
        }
      } catch (e) {
        // 構文エラー時は現在のスロットを出力
      }
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(slotToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeFilename = `${slotToExport.id || 'sound-data'}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', safeFilename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setImportSuccess(`「${slotToExport.title}」を書き出しました (.json)`);
    setTimeout(() => setImportSuccess(null), 2500);
  };

  // 3. 7チャンネルの音源一括切り替え（リアルタイム発音音源変更）
  const handleSelectMasterChannel = (channelId: SoundLabChannelId) => {
    const updatedSlot: SoundSlotPattern = {
      ...currentSlot,
      channel: channelId,
      partChannels: {
        bass: channelId,
        chords: channelId,
        melody: channelId,
      },
      partMutes: {
        ...(currentSlot.partMutes || {}),
        drums: channelId === 'musicbox' ? true : false,
      }
    };
    onLoadSlot(updatedSlot);
    updateJsonFromSlot(updatedSlot);
    const chDef = SOUND_CHANNELS.find(c => c.id === channelId);
    setImportSuccess(`音源を「${chDef?.badge} ${chDef?.name}」に切り替えました！`);
    setTimeout(() => setImportSuccess(null), 2200);
  };

  // 4. パート別音源マッピングの変更
  const handlePartChannelChange = (partKey: 'bass' | 'chords' | 'melody', channelId: SoundLabChannelId) => {
    const currentParts: SoundSlotPartChannels = currentSlot.partChannels || {
      bass: currentSlot.channel,
      chords: currentSlot.channel,
      melody: currentSlot.channel
    };
    const updatedParts = {
      ...currentParts,
      [partKey]: channelId
    };
    const updatedSlot: SoundSlotPattern = {
      ...currentSlot,
      partChannels: updatedParts
    };
    onLoadSlot(updatedSlot);
    updateJsonFromSlot(updatedSlot);
  };

  // 5. パート別ミュート切り替え
  const handleTogglePartMute = (partKey: 'bass' | 'chords' | 'melody' | 'drums') => {
    const currentMutes: SoundSlotPartMutes = currentSlot.partMutes || {};
    const updatedMutes: SoundSlotPartMutes = {
      ...currentMutes,
      [partKey]: !currentMutes[partKey]
    };
    const updatedSlot: SoundSlotPattern = {
      ...currentSlot,
      partMutes: updatedMutes
    };
    onLoadSlot(updatedSlot);
    updateJsonFromSlot(updatedSlot);
  };

  // 6. BPMの変更
  const handleChangeBpm = (newBpm: number) => {
    const updatedSlot: SoundSlotPattern = {
      ...currentSlot,
      bpm: newBpm
    };
    onLoadSlot(updatedSlot);
    updateJsonFromSlot(updatedSlot);
  };

  // 6.1 アルペジオ各ステップの発音/休符トグル
  const handleToggleChordStep = (stepIdx: number) => {
    const currentSteps = currentSlot.chordSteps || [];
    const exists = currentSteps.some(c => c.step === stepIdx);
    let newSteps: RhythmStepTrigger[];
    if (exists) {
      newSteps = currentSteps.filter(c => c.step !== stepIdx);
    } else {
      const defaultNotes = [0, 1, 2, 3, 4, 3, 2, 1];
      const nIdx = defaultNotes[stepIdx % 8];
      newSteps = [
        ...currentSteps,
        { step: stepIdx, noteIndex: nIdx, velocity: stepIdx % 8 === 0 ? 0.65 : 0.54, duration: 0.9 }
      ].sort((a, b) => a.step - b.step);
    }
    const updatedSlot: SoundSlotPattern = {
      ...currentSlot,
      chordSteps: newSteps
    };
    onLoadSlot(updatedSlot);
    updateJsonFromSlot(updatedSlot);
  };

  // 6.2 アルペジオ休符プリセットの一括適用
  const handleApplyArpeggioPreset = (presetType: '5and7_1based' | '5and7_0based' | 'all_active' | 'half_only') => {
    let newSteps: RhythmStepTrigger[] = [];
    const defaultNotes = [0, 1, 2, 3, 4, 3, 2, 1];

    if (presetType === '5and7_1based') {
      // 1番目から数えた5拍目(Step 4) と 7拍目(Step 6) を休符（前後半とも）
      const activeSteps = [0, 1, 2, 3, 5, 7, 8, 9, 10, 11, 13, 15];
      newSteps = activeSteps.map(s => ({
        step: s,
        noteIndex: defaultNotes[s % 8],
        velocity: s === 0 || s === 8 ? 0.65 : 0.54,
        duration: 0.9
      }));
      setImportSuccess('1始まりの5拍目(Step 4)・7拍目(Step 6)を休符に設定しました');
    } else if (presetType === '5and7_0based') {
      // ステップ番号 5 と 7 を休符（前後半とも）
      const activeSteps = [0, 1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 14];
      newSteps = activeSteps.map(s => ({
        step: s,
        noteIndex: defaultNotes[s % 8],
        velocity: s === 0 || s === 8 ? 0.65 : 0.54,
        duration: 0.9
      }));
      setImportSuccess('ステップ5・7を休符に設定しました');
    } else if (presetType === 'half_only') {
      // 前半のみ5&7休符 (Step 4, 6休符、後半8〜15は全発音)
      const activeSteps = [0, 1, 2, 3, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      newSteps = activeSteps.map(s => ({
        step: s,
        noteIndex: defaultNotes[s % 8],
        velocity: s === 0 || s === 8 ? 0.65 : 0.54,
        duration: 0.9
      }));
      setImportSuccess('前半小節のみ5拍目・7拍目を休符に設定しました');
    } else {
      // 全16ステップ発音 (休符なし)
      const activeSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      newSteps = activeSteps.map(s => ({
        step: s,
        noteIndex: defaultNotes[s % 8],
        velocity: s === 0 || s === 8 ? 0.65 : 0.54,
        duration: 0.9
      }));
      setImportSuccess('全16ステップを発音状態（休符なし）にしました');
    }

    const updatedSlot: SoundSlotPattern = {
      ...currentSlot,
      chordSteps: newSteps
    };
    onLoadSlot(updatedSlot);
    updateJsonFromSlot(updatedSlot);
    setTimeout(() => setImportSuccess(null), 2500);
  };

  // 6.3 本チャンネル（FM局）のドラムパターンを試作に適用
  const handleApplyMainStationDrumPattern = (patternId: string) => {
    const target = MAIN_STATION_DRUM_PATTERNS.find(p => p.id === patternId);
    if (!target) return;
    const currentMutes = currentSlot.partMutes || {};
    const updatedSlot: SoundSlotPattern = {
      ...currentSlot,
      drumSteps: target.steps,
      drumPatternDescription: target.description,
      partMutes: {
        ...currentMutes,
        drums: false
      }
    };
    onLoadSlot(updatedSlot);
    updateJsonFromSlot(updatedSlot);
    setImportSuccess(`「${target.name}」の本線ドラムパターンを試作に適用しました！`);
    setTimeout(() => setImportSuccess(null), 3000);
  };

  // 7. JSON 直接適用
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.id || !parsed.title || !Array.isArray(parsed.chords)) {
        throw new Error('必須構造 (id, title, chords) が不足しています。');
      }
      onLoadSlot(parsed);
      updateJsonFromSlot(parsed);
      setJsonError(null);
      setImportSuccess(`「${parsed.title}」の変更を演奏データに反映しました！`);
      setTimeout(() => setImportSuccess(null), 2500);
    } catch (err: any) {
      setJsonError(`構文エラー: ${err.message}`);
    }
  };

  // 8. クリップボードへコピー
  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const activeChannelDef = SOUND_CHANNELS.find(c => c.id === currentSlot.channel) || SOUND_CHANNELS[0];

  return (
    <div className="p-4 bg-stone-950 rounded-xl border border-amber-500/40 shadow-2xl space-y-4">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 0. 試作カートリッジ・プリセット選択ラック                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="p-3 bg-stone-900/90 border border-amber-500/30 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
            <span>🎛️</span>
            <span>新曲試作カートリッジ・プリセット一覧 (PROTOTYPE CARTRIDGES)</span>
          </span>
          <span className="text-[10px] font-mono text-stone-400">クリックでプレイヤーに即時装填</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {BUILTIN_STATION_SLOTS.filter(s => s.id !== 'initial-empty-slot' && s.id !== 'custom-session-slot').map(slot => {
            const isSelected = currentSlot.id === slot.id;
            const chDef = SOUND_CHANNELS.find(c => c.id === slot.channel);
            const isNewDebussy = slot.id === 'debussy-reverie-raindrop';
            return (
              <button
                key={slot.id}
                onClick={() => {
                  onLoadSlot(slot);
                  updateJsonFromSlot(slot);
                }}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group relative ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                    : isNewDebussy
                    ? 'bg-cyan-950/30 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-950/50'
                    : 'bg-stone-950/80 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold font-mono text-stone-200 truncate flex items-center gap-1.5">
                    <span>{chDef?.icon || '🎵'}</span>
                    <span className={isSelected ? 'text-amber-300' : (isNewDebussy ? 'text-cyan-300' : 'text-stone-200')}>{slot.title}</span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isNewDebussy && (
                      <span className="text-[9px] font-mono font-bold px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                        NEW
                      </span>
                    )}
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'
                    }`}>
                      {chDef?.badge || slot.channel}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 line-clamp-1">{slot.description}</p>
                <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-800/60">
                  <span>BPM {slot.bpm}</span>
                  <span>{slot.chords.length}和音</span>
                  {isSelected && <span className="text-amber-400 font-bold">装填中 (Loaded)</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. JSON 読み込み & 書き出し & 試聴再生 コントロールバー         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-3.5 rounded-xl border transition-all ${
          isDraggingFile
            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 scale-[1.01]'
            : 'bg-stone-900/90 border-amber-500/30'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/40 shrink-0">
              <FileJson className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wide">
                  JSON 演奏データプレイヤー
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  JSON SYNC
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-stone-100 flex items-center gap-2">
                <span>{currentSlot.title}</span>
                {currentSlot.author && (
                  <span className="text-xs font-mono font-normal text-stone-400">by {currentSlot.author}</span>
                )}
                <span className="text-xs font-mono font-normal text-stone-400">v{currentSlot.version}</span>
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                {currentSlot.description}
              </p>
            </div>
          </div>

          {/* 読込・書出・試聴ボタングループ */}
          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json,application/json" 
              className="hidden" 
            />

            {/* 読み込みボタン */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-100 border border-stone-700 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all hover:border-amber-400 shadow-sm"
              title="外部JSONファイルを読み込んで即座に演奏データ差し替え (ドラッグ＆ドロップ対応)"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>JSON 読み込み (.json)</span>
            </button>

            {/* 書き出しボタン */}
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-amber-500/20"
              title="現在のコード・リズム・各ch音源設定をまるごとJSONファイルとしてダウンロード保存"
            >
              <Download className="w-4 h-4" />
              <span>JSON 書き出し (.json)</span>
            </button>

            {/* 再生 / 停止ボタン */}
            <button
              onClick={onTogglePlay}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                isPlaying 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? '停止' : '再生 (試聴)'}</span>
            </button>
          </div>
        </div>

        {/* データ概要バッジ */}
        <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-400">装填データ:</span>
            <span className="text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
              BPM {currentSlot.bpm}
            </span>
            <span className="text-stone-300 bg-stone-850 px-2 py-0.5 rounded border border-stone-700">
              {currentSlot.chords?.length || 0} 和音
            </span>
            <span className="text-stone-300 bg-stone-850 px-2 py-0.5 rounded border border-stone-700">
              音源: {activeChannelDef.badge} {activeChannelDef.name}
            </span>
            {currentSlot.melodyScale && (
              <span className="text-stone-300 bg-stone-850 px-2 py-0.5 rounded border border-stone-700">
                スケール音数: {currentSlot.melodyScale.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>JSON リアルタイム同期中</span>
          </div>
        </div>

        {/* ドラッグ＆ドロップ案内ガイド */}
        {isDraggingFile && (
          <div className="mt-2 text-center py-2 text-xs font-mono text-amber-300 font-bold border-2 border-dashed border-amber-400 rounded-lg animate-pulse">
            📂 ここに演奏データ (.json) をドロップすると即座に読み込まれます
          </div>
        )}
      </div>

      {/* メッセージ通知 */}
      {importSuccess && (
        <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/70 rounded-lg text-emerald-200 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importSuccess}</span>
        </div>
      )}

      {jsonError && (
        <div className="p-2.5 bg-rose-950/90 border border-rose-500/70 rounded-lg text-rose-200 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{jsonError}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. 各チャンネル音源切り替えセレクター                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="p-3.5 bg-stone-900/90 rounded-xl border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800/90 pb-2.5 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold text-amber-300 tracking-wide uppercase">
                音源チャンネル切り替え (SOUND CHANNEL SELECTOR)
              </h3>
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                リアルタイム反映
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              読み込んだJSON演奏データの音源を、全7ラジオ局のチャンネル音色へワンクリックで切り替えて試聴演奏できます。
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* BPM調整 */}
            <div className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-md border border-stone-800 text-[11px] font-mono">
              <span className="text-stone-400">BPM:</span>
              <input
                type="number"
                min={50}
                max={160}
                value={currentSlot.bpm}
                onChange={(e) => handleChangeBpm(Number(e.target.value) || 80)}
                className="w-14 bg-stone-900 text-amber-300 font-bold text-center text-[11px] rounded px-1 py-0.5 border border-stone-700 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* パート別音源カスタム展開ボタン */}
            <button
              onClick={() => setShowPartMixer(!showPartMixer)}
              className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                showPartMixer
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>パート別音源詳細</span>
              {showPartMixer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* 7チャンネル音源カード（大型セレクター） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          {SOUND_CHANNELS.map((ch) => {
            const isSelected = currentSlot.channel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => handleSelectMasterChannel(ch.id)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 group relative ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base">{ch.icon}</span>
                    <span className={`text-[9.5px] font-mono px-1 py-0.2 rounded font-bold ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950'
                        : 'bg-stone-850 text-stone-400 border border-stone-700'
                    }`}>
                      {ch.badge}
                    </span>
                  </div>
                  <div className={`text-xs font-bold mt-1 font-mono ${isSelected ? 'text-amber-300' : 'text-stone-200'}`}>
                    {ch.name}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1 leading-tight line-clamp-2">
                    {ch.desc}
                  </p>
                </div>

                <div className="pt-1.5 border-t border-stone-800/80 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-stone-500">{ch.station}</span>
                  {isSelected && (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      ON AIR
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* パート別音源詳細設定（メロディ / 和音 / ベース の個別チャンネル設定＆ミュート） */}
        {showPartMixer && (
          <div className="p-3 bg-stone-950 rounded-lg border border-stone-800 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono text-stone-300">
              <span className="font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>パート別個別音源マッピング (MULTI-CHANNEL ASSIGNMENT)</span>
              </span>
              <button
                onClick={() => handleSelectMasterChannel(currentSlot.channel)}
                className="text-[10px] text-stone-400 hover:text-amber-300 underline cursor-pointer"
              >
                全パートをマスター音源 ({activeChannelDef.name}) に統一
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
              {/* 1. メロディパート */}
              {(() => {
                const melCh = currentSlot.partChannels?.melody || currentSlot.channel;
                const isMuted = currentSlot.partMutes?.melody === true;
                return (
                  <div className={`p-2.5 rounded-lg border flex flex-col justify-between gap-2 ${
                    isMuted ? 'bg-stone-900/40 border-stone-850 opacity-60' : 'bg-stone-900 border-stone-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-200">🎶 メロディ音源</span>
                      <button
                        onClick={() => handleTogglePartMute('melody')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          isMuted ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isMuted ? 'MUTED' : 'ACTIVE'}</span>
                      </button>
                    </div>
                    <select
                      value={melCh}
                      onChange={(e) => handlePartChannelChange('melody', e.target.value as SoundLabChannelId)}
                      className="bg-stone-950 text-amber-300 text-xs rounded p-1.5 border border-stone-700 cursor-pointer focus:outline-none focus:border-amber-400"
                    >
                      {SOUND_CHANNELS.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.badge} {ch.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* 2. 和音バッキングパート */}
              {(() => {
                const chordCh = currentSlot.partChannels?.chords || currentSlot.channel;
                const isMuted = currentSlot.partMutes?.chords === true;
                return (
                  <div className={`p-2.5 rounded-lg border flex flex-col justify-between gap-2 ${
                    isMuted ? 'bg-stone-900/40 border-stone-850 opacity-60' : 'bg-stone-900 border-stone-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-200">🎹 和音バッキング</span>
                      <button
                        onClick={() => handleTogglePartMute('chords')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          isMuted ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isMuted ? 'MUTED' : 'ACTIVE'}</span>
                      </button>
                    </div>
                    <select
                      value={chordCh}
                      onChange={(e) => handlePartChannelChange('chords', e.target.value as SoundLabChannelId)}
                      className="bg-stone-950 text-amber-300 text-xs rounded p-1.5 border border-stone-700 cursor-pointer focus:outline-none focus:border-amber-400"
                    >
                      {SOUND_CHANNELS.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.badge} {ch.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* 3. ベースパート */}
              {(() => {
                const bassCh = currentSlot.partChannels?.bass || currentSlot.channel;
                const isMuted = currentSlot.partMutes?.bass === true;
                return (
                  <div className={`p-2.5 rounded-lg border flex flex-col justify-between gap-2 ${
                    isMuted ? 'bg-stone-900/40 border-stone-850 opacity-60' : 'bg-stone-900 border-stone-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-200">🎸 ベースライン音源</span>
                      <button
                        onClick={() => handleTogglePartMute('bass')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          isMuted ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isMuted ? 'MUTED' : 'ACTIVE'}</span>
                      </button>
                    </div>
                    <select
                      value={bassCh}
                      onChange={(e) => handlePartChannelChange('bass', e.target.value as SoundLabChannelId)}
                      className="bg-stone-950 text-amber-300 text-xs rounded p-1.5 border border-stone-700 cursor-pointer focus:outline-none focus:border-amber-400"
                    >
                      {SOUND_CHANNELS.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.badge} {ch.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* 4. ドラム・パーカッションパート */}
              {(() => {
                const isMusicBox = currentSlot.channel === 'musicbox';
                const isMuted = currentSlot.partMutes?.drums === true || isMusicBox;
                return (
                  <div className={`p-2.5 rounded-lg border flex flex-col justify-between gap-2 ${
                    isMuted ? 'bg-stone-900/40 border-stone-850 opacity-60' : 'bg-stone-900 border-stone-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-200">🥁 ドラム＆リズム</span>
                      <button
                        onClick={() => handleTogglePartMute('drums')}
                        disabled={isMusicBox}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          isMuted ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                        title={isMusicBox ? 'オルゴール音源時は自動消音されます' : 'ドラムの発音/ミュートを切り替え'}
                      >
                        {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isMuted ? 'MUTED' : 'ACTIVE'}</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-stone-400 bg-stone-950 px-2 py-1.5 rounded border border-stone-800">
                      {isMusicBox ? (
                        <span className="text-stone-500 italic">オルゴール専用消音中</span>
                      ) : (
                        <span className="text-amber-300/90 font-mono truncate block" title={currentSlot.drumPatternDescription || 'Roland R-8 / アコースティックドラム'}>
                          {currentSlot.drumPatternDescription || 'Roland R-8 / アコースティックドラム'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── 本チャンネル（FM局）ドラムパターン一括適用ラック ── */}
            <div className="mt-3 pt-3 border-t border-stone-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  本チャンネル（FM局）のリズム＆ドラムパターンを適用:
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  ワンクリックでFM各局本線のビートを試作スロットに装填
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5">
                {MAIN_STATION_DRUM_PATTERNS.map(pat => {
                  const isCurrent = currentSlot.drumPatternDescription === pat.description;
                  return (
                    <button
                      key={pat.id}
                      onClick={() => handleApplyMainStationDrumPattern(pat.id)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.25)] ring-1 ring-amber-400'
                          : 'bg-stone-950/80 hover:bg-stone-850 border-stone-800 hover:border-amber-500/50 text-stone-300'
                      }`}
                      title={pat.description}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold font-mono text-amber-400">{pat.badge}</span>
                        {isCurrent && <span className="text-[9px] bg-amber-400 text-stone-950 px-1 rounded font-bold">適用中</span>}
                      </div>
                      <div className="text-[10px] font-bold text-stone-200 truncate mt-0.5">{pat.name.replace(/^[\d.]+MHz\s*/, '')}</div>
                      <div className="text-[9px] text-stone-400 truncate mt-0.5">{pat.description.replace(/^[\d.]+MHz[^\s]*\s*/, '')}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. 16ステップ LEDシーケンサー (再生中ステップの可視化)          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="p-3 bg-stone-900/70 rounded-lg border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[10.5px] font-mono text-stone-400 shrink-0">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Music className="w-3 h-3" />
              16-STEP:
            </span>
            <span>
              Bar {currentBar + 1}/{currentSlot.chords.length || 4} 
              {' '}[<strong className="text-stone-200">{currentSlot.chords[currentBar % (currentSlot.chords.length || 1)]?.name}</strong>]
            </span>
            <span className="text-stone-500 hidden md:inline">
              進行: {currentSlot.chords.map(c => c.name).join(' → ')}
            </span>
          </div>

          <div className="grid grid-cols-16 gap-1 w-full max-w-xl">
            {Array.from({ length: 16 }).map((_, idx) => {
              const isCurrentStep = isPlaying && currentStep === idx;
              const isBeat = idx % 4 === 0;
              const hasBass = currentSlot.bassSteps?.some(b => b.step === idx);
              const hasChord = currentSlot.chordSteps?.some(c => c.step === idx);
              const hasMelody = currentSlot.melodySteps?.some(m => m.step === idx);
              const hasDrum = currentSlot.drumSteps?.some(d => d.step === idx);
              return (
                <div
                  key={idx}
                  className={`h-2.5 rounded-full transition-all flex items-center justify-center ${
                    isCurrentStep
                      ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.95)] scale-125 z-10'
                      : hasChord || hasBass || hasMelody || hasDrum
                      ? 'bg-amber-600/75'
                      : isBeat
                      ? 'bg-stone-700'
                      : 'bg-stone-850'
                  }`}
                  title={`Step ${idx} (${idx + 1}拍目): ${[hasBass && 'Bass', hasChord && 'Chord', hasMelody && 'Melody', hasDrum && 'Drum'].filter(Boolean).join(', ') || 'Rest'}`}
                />
              );
            })}
          </div>
        </div>

        {/* ── アルペジオ（コード分散和音）ステップ別 発音・休符 コントローラー ── */}
        <div className="pt-2 border-t border-stone-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                🎹 アルペジオ休符・ステップ設定 (クリックで発音/休符を即座に切替)
              </span>
              <button
                onClick={() => setShowArpeggioStepEditor(!showArpeggioStepEditor)}
                className="text-[10px] text-stone-400 hover:text-stone-200 flex items-center gap-0.5 cursor-pointer"
              >
                {showArpeggioStepEditor ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* ワンクリック・プリセット */}
            <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
              <span className="text-stone-400 mr-1">プリセット:</span>
              <button
                onClick={() => handleApplyArpeggioPreset('5and7_1based')}
                className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold transition-all cursor-pointer"
                title="1番目から数えた5拍目(Step 4)と7拍目(Step 6)を休符にします"
              >
                ★ 5拍目＆7拍目を休符 (Step 4, 6休符)
              </button>
              <button
                onClick={() => handleApplyArpeggioPreset('5and7_0based')}
                className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all cursor-pointer"
                title="ステップ番号 5 と 7 を休符にします"
              >
                ステップ5＆7休符
              </button>
              <button
                onClick={() => handleApplyArpeggioPreset('half_only')}
                className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all cursor-pointer"
                title="前半のみ休符（後半は全発音）"
              >
                前半のみ休符
              </button>
              <button
                onClick={() => handleApplyArpeggioPreset('all_active')}
                className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all cursor-pointer"
                title="全16ステップを発音状態にします"
              >
                全発音 (休符なし)
              </button>
            </div>
          </div>

          {showArpeggioStepEditor && (
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 pt-1">
              {Array.from({ length: 16 }).map((_, stepIdx) => {
                const isPlayingThisStep = isPlaying && currentStep === stepIdx;
                const chordTrigger = currentSlot.chordSteps?.find(c => c.step === stepIdx);
                const isActive = !!chordTrigger;
                const beatNum = stepIdx + 1; // 1-based (1拍目〜16拍目)
                const isTargetBeat = beatNum === 5 || beatNum === 7 || beatNum === 13 || beatNum === 15;

                return (
                  <button
                    key={stepIdx}
                    onClick={() => handleToggleChordStep(stepIdx)}
                    className={`p-1 rounded flex flex-col items-center justify-between text-center transition-all cursor-pointer border ${
                      isPlayingThisStep
                        ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-stone-900'
                        : ''
                    } ${
                      isActive
                        ? 'bg-amber-950/50 border-amber-500/60 text-amber-200 hover:bg-amber-900/60'
                        : isTargetBeat
                        ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 hover:bg-rose-900/40'
                        : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-300'
                    }`}
                    title={`第${beatNum}拍 (Step ${stepIdx}): クリックで${isActive ? '休符にする' : '発音させる'}`}
                  >
                    <div className="text-[9px] font-mono font-bold leading-tight flex items-center gap-0.5">
                      <span>{beatNum}拍</span>
                      {isTargetBeat && <span className="text-[7.5px] text-amber-400 font-normal">★</span>}
                    </div>
                    <div className="text-[8px] font-mono text-stone-400">
                      S{stepIdx}
                    </div>
                    <div className={`mt-0.5 text-[8.5px] font-bold px-1 py-0.2 rounded font-mono ${
                      isActive
                        ? 'bg-amber-500/30 text-amber-300'
                        : 'bg-stone-900 text-stone-500 border border-stone-800'
                    }`}>
                      {isActive ? '♪発音' : '休符'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 4. JSON 直接編集・リアルタイム反映エディタ                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-2 pt-1 border-t border-stone-800">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowJsonEditor(!showJsonEditor)}
            className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>演奏データ JSON エディタ (リアルタイム同期)</span>
            {showJsonEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-700 text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="JSONテキストをクリップボードにコピー"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copySuccess ? 'コピー完了' : 'JSONコピー'}</span>
            </button>
          </div>
        </div>

        {showJsonEditor && (
          <div className="space-y-2.5 animate-fadeIn">
            <p className="text-[11px] font-mono text-stone-400">
              読み込んだJSONのコード進行・BPM・リズム配列・スケール周波数はここに表示され、直接編集して「演奏データに反映」で即時試聴できます：
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="w-full font-mono text-xs p-3 bg-stone-900/95 border border-stone-800 rounded-lg text-amber-200 focus:border-amber-400 focus:outline-none leading-relaxed shadow-inner"
              spellCheck={false}
            />

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => updateJsonFromSlot(currentSlot)}
                className="px-3 py-1.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer border border-stone-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>現在の装填データに戻す</span>
              </button>

              <button
                onClick={handleApplyJson}
                className="px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>変更を演奏データに反映 (Apply)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
