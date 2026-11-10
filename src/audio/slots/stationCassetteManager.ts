import { StationCassettePlaylist, StationProgression, CassetteTrackItem } from '../../types/stationCassette';
import { Station } from '../../types';

// 本線実装済みの6局の局情報定義
export interface StationChannelMeta {
  frequency: number;
  name: string;
  genre: string;
  badge: string;
  icon: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
}

export const IMPLEMENTED_STATIONS: StationChannelMeta[] = [
  {
    frequency: 76.0,
    name: 'ELECTRO HEALING',
    genre: 'Electro Healing / Ambient Future',
    badge: '76.0 MHz',
    icon: '🧘',
    colorBorder: 'border-teal-500/50',
    colorBg: 'bg-teal-500/15',
    colorText: 'text-teal-400'
  },
  {
    frequency: 88.1,
    name: 'TOKYO MORNING',
    genre: 'Bossa Nova / Acoustic Chill',
    badge: '88.1 MHz',
    icon: '🎸',
    colorBorder: 'border-emerald-500/50',
    colorBg: 'bg-emerald-500/15',
    colorText: 'text-emerald-400'
  },
  {
    frequency: 92.4,
    name: 'SHIBUYA DAYLIGHT GROOVE',
    genre: 'City Pop, Blues & Neo-Rockabilly',
    badge: '92.4 MHz',
    icon: '🎷',
    colorBorder: 'border-amber-500/50',
    colorBg: 'bg-amber-500/15',
    colorText: 'text-amber-400'
  },
  {
    frequency: 97.5,
    name: 'akihabara cronos',
    genre: 'Akihabara Retro & Ambient Musicbox',
    badge: '97.5 MHz',
    icon: '🎵',
    colorBorder: 'border-cyan-500/50',
    colorBg: 'bg-cyan-500/15',
    colorText: 'text-cyan-400'
  },
  {
    frequency: 101.5,
    name: 'GINZA MIDNIGHT CLUB',
    genre: 'Smooth Jazz / Lounge & Electric Piano',
    badge: '101.5 MHz',
    icon: '🎹',
    colorBorder: 'border-sky-500/50',
    colorBg: 'bg-sky-500/15',
    colorText: 'text-sky-400'
  },
  {
    frequency: 105.8,
    name: 'ROPPONGI Petrichor FM',
    genre: 'Waterdrop Ragtime & Rainy Lo-Fi Chillhop',
    badge: '105.8 MHz',
    icon: '🌧️',
    colorBorder: 'border-indigo-500/50',
    colorBg: 'bg-indigo-500/15',
    colorText: 'text-indigo-400'
  }
];

// 各局のデフォルト曲名リスト
const DEFAULT_TRACK_NAMES: Record<number, string[]> = {
  76.0: [
    'Sanctuary (シルクロード・悠久の祈り)',
    'Resonance (幽玄なオアシス / キャラバンの旅路)',
    'Biosphere (天空・古事記・星辰の海)',
    'Ocean Swell (穏やかな海と波のうねり)'
  ],
  88.1: [
    'Café da Manhã (Ipanema Bossa)',
    'Morning Bossa (Bossa Project 2)',
    'Acoustic Walk (Relaxing Lounge)',
    'Warm Breeze'
  ],
  92.4: [
    'Cat・street・Twist( Neo-Roca)',
    'Sunlit Boulevard (Shibuya City Pop)',
    'Daylight Blues (12-Bar Blues & Sax)',
    'Sunshine Walk (Midday Groove)'
  ],
  97.5: [
    'Cosmic Nebula (Ambient Musicbox)',
    'Retro Quest (80s RPG Musicbox Solo)',
    'Yoimiya Minimal (Evening Bell Chill)',
    'Stardust Transit (Electronic Musicbox)'
  ],
  101.5: [
    'Bayside Twilight Highway (City Pop / Rhodes)',
    'Blue Note (Late Night Jazz Trio)',
    'Velvet Sax & Espresso Lounge (Neo-Soul Jazz)'
  ],
  105.8: [
    'Vinyl Rain (ヴィンテージレコードの雨音ローファイ・チルホップ)',
    'Raindrop Rag (水滴マリンバの跳ねるラグタイム)',
    'Rêverie de la Pluie (ドビュッシー「夢」水滴分散和音アルペジオ)',
    'Puddle Stomp (雨上がりストライド・ジャズラグ)'
  ]
};

/**
 * 本線チャンネルの現在の演奏設定（StationProgression）から、
 * 外部保存・配布用のセットプレイリスト（StationCassettePlaylist）JSONを生成・書き出し
 */
export function exportStationCassettePlaylist(
  frequency: number,
  prog: StationProgression,
  station?: Station
): StationCassettePlaylist {
  const meta = IMPLEMENTED_STATIONS.find(s => s.frequency === frequency) || {
    frequency,
    name: station?.name || `CH ${frequency.toFixed(1)}MHz`,
    genre: station?.genre || 'Broadcast Music'
  };

  const trackNames = prog.trackNames || DEFAULT_TRACK_NAMES[frequency] || ['Track 1', 'Track 2'];
  const chordPatterns = prog.chordPatterns || [prog.chords];
  const tempoPatterns = prog.tempoPatterns || [prog.tempo];
  const drumPatterns = prog.drumPatterns || [prog.drumPattern];
  const chordRhythms = prog.chordRhythmPatterns || [[0, 10]];
  const melodyScales = prog.melodyScales || [prog.melodyScale];

  const count = Math.max(chordPatterns.length, tempoPatterns.length, drumPatterns.length);
  const tracks: CassetteTrackItem[] = [];

  for (let i = 0; i < count; i++) {
    const chords = chordPatterns[i % chordPatterns.length] || prog.chords;
    const bpm = tempoPatterns[i % tempoPatterns.length] || prog.tempo;
    const drum = drumPatterns[i % drumPatterns.length] || prog.drumPattern;
    const rhythm = chordRhythms[i % chordRhythms.length] || [0, 10];
    const scale = melodyScales[i % melodyScales.length] || prog.melodyScale;
    const title = trackNames[i] || `Set ${i + 1} (${meta.name})`;

    tracks.push({
      setNumber: i + 1,
      title,
      bpm,
      chords,
      drumPattern: drum,
      chordRhythm: rhythm,
      melodyScale: scale
    });
  }

  // 六本木105.8MHzの場合、指定のSet 1: Vinyl Rain, Set 2: Raindrop Rag, Set 3: Rêverie de la Pluie を明示的に整える
  if (frequency === 105.8 && tracks.length >= 2) {
    tracks[0].title = 'Vinyl Rain';
    tracks[0].description = 'ヴィンテージレコードの雨音ローファイ・チルホップ (70 BPM, Fmaj7 - Fm6 - Cmaj7 - C7)';
    tracks[0].bpm = 70;

    tracks[1].title = 'Raindrop Rag';
    tracks[1].description = '水滴マリンバの跳ねるラグタイム (92 BPM, 軽快なストライド・ジャズラグ進行)';
    tracks[1].bpm = 92;

    if (tracks.length >= 3) {
      tracks[2].title = 'Rêverie de la Pluie';
      tracks[2].description = 'ドビュッシー「夢」水滴分散和音アルペジオ (70 BPM, Fmaj9 - Dm9 - Bbmaj7(#11) - C9sus4)';
      tracks[2].bpm = 70;
    }
  }

  // 湘南76.0MHz (ELECTRO HEALING) の場合、全4セットの曲名・解説を整える
  if (Math.abs(frequency - 76.0) < 0.2 && tracks.length >= 4) {
    tracks[0].title = 'Sanctuary';
    tracks[0].description = 'シルクロード・悠久の祈り (54 BPM, バイオ周波数・和太鼓・おりん)';
    tracks[0].bpm = 54;

    tracks[1].title = 'Resonance';
    tracks[1].description = '幽玄なオアシス / キャラバンの旅路 (58 BPM, Gm7 - Ebmaj7 - F - Dm7)';
    tracks[1].bpm = 58;

    tracks[2].title = 'Biosphere';
    tracks[2].description = '天空・古事記・星辰の海 (62 BPM, Am7 - Fmaj7 - G - Em7)';
    tracks[2].bpm = 62;

    tracks[3].title = 'Ocean Swell';
    tracks[3].description = '穏やかな海と波のうねり (52 BPM, Fmaj9 - Am7(11) - Bbmaj9 - Cadd9)';
    tracks[3].bpm = 52;
  }

  return {
    type: 'station_cassette_playlist',
    version: '1.0.0',
    frequency,
    stationName: meta.name,
    genre: meta.genre,
    exportedAt: new Date().toISOString(),
    description: `本線ラジオ ${meta.name} (${frequency.toFixed(1)}MHz) 専用演奏データカセット。全${tracks.length}セット収録。`,
    tracks
  };
}

/**
 * 外部JSON文字列をパースし、本線ラジオ用の演奏設定（StationProgression）を再構築してインポート
 */
export function importStationCassettePlaylist(jsonText: string): {
  frequency: number;
  progression: StationProgression;
  playlist: StationCassettePlaylist;
} {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: any) {
    throw new Error(`JSONの解析に失敗しました: ${err.message}`);
  }

  // 1. StationCassettePlaylist 形式
  if (parsed.type === 'station_cassette_playlist' && Array.isArray(parsed.tracks) && parsed.tracks.length > 0) {
    const freq = typeof parsed.frequency === 'number' ? parsed.frequency : 105.8;
    const tracks: CassetteTrackItem[] = parsed.tracks;

    const tempoPatterns = tracks.map(t => t.bpm || 80);
    const chordPatterns = tracks.map(t => t.chords || []);
    const drumPatterns = tracks.map(t => t.drumPattern || {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
    });
    const chordRhythmPatterns = tracks.map(t => t.chordRhythm || [0, 10]);
    const melodyScales = tracks.map(t => t.melodyScale || [261.63, 293.66, 329.63, 349.23, 392, 440, 523.25]);
    const trackNames = tracks.map(t => t.title || `Set ${t.setNumber || 1}`);

    const newProg: StationProgression = {
      tempo: tempoPatterns[0] || 80,
      tempoPatterns,
      swing: 0.1,
      chords: chordPatterns[0] || [],
      chordPatterns,
      melodyScale: melodyScales[0] || [],
      melodyScales,
      drumPattern: drumPatterns[0],
      drumPatterns,
      chordRhythmPatterns,
      trackNames
    };

    return {
      frequency: freq,
      progression: newProg,
      playlist: parsed
    };
  }

  // 2. 単曲 SoundSlotPattern 形式からの自動コンバート互換
  if (parsed.id && parsed.title && Array.isArray(parsed.chords)) {
    const bpm = parsed.bpm || 80;
    const drumPattern = {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
    };
    const freq = parsed.frequency || 105.8;

    const playlist: StationCassettePlaylist = {
      type: 'station_cassette_playlist',
      version: '1.0.0',
      frequency: freq,
      stationName: parsed.title,
      genre: 'Custom Slot',
      exportedAt: new Date().toISOString(),
      description: parsed.description || 'Imported single slot',
      tracks: [
        {
          setNumber: 1,
          title: parsed.title,
          bpm,
          chords: parsed.chords.map((c: any) => ({
            name: c.name || 'Chord',
            root: c.notes?.[0] || 261.63,
            notes: c.notes || [261.63, 329.63, 392.00],
            bass: c.bass || 65.41
          })),
          drumPattern,
          chordRhythm: [0, 10],
          melodyScale: parsed.melodyScale || [261.63, 293.66, 329.63, 349.23, 392, 440, 523.25]
        }
      ]
    };

    const newProg: StationProgression = {
      tempo: bpm,
      tempoPatterns: [bpm],
      swing: 0.1,
      chords: playlist.tracks[0].chords,
      chordPatterns: [playlist.tracks[0].chords],
      melodyScale: playlist.tracks[0].melodyScale || [],
      melodyScales: [playlist.tracks[0].melodyScale || []],
      drumPattern,
      drumPatterns: [drumPattern],
      chordRhythmPatterns: [[0, 10]],
      trackNames: [parsed.title]
    };

    return {
      frequency: freq,
      progression: newProg,
      playlist
    };
  }

  throw new Error('サポートされていない演奏データ形式です。station_cassette_playlist 形式または SoundSlotPattern 形式のJSONをご利用ください。');
}

/**
 * JSONファイルのブラウザダウンロード補助
 */
export function downloadJsonFile(filename: string, data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
