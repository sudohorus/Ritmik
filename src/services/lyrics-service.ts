import axios from 'axios';
import { parseMusicTitle, ParsedTitle } from '@/utils/parseMusicTitle';

export interface LyricsLine {
  time: number;
  text: string;
}

export interface LyricsResult {
  lyrics: string | null;
  syncedLyrics: LyricsLine[] | null;
  artist: string;
  title: string;
}

function parseSyncedLyrics(syncedLyrics: string): LyricsLine[] {
  const lines: LyricsLine[] = [];
  const lrcLines = syncedLyrics.split('\n');
  
  for (const line of lrcLines) {
    const match = line.match(/^\[(\d+):(\d+)\.(\d+)\](.*)$/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = parseInt(match[3]);
      const text = match[4].trim();
      
      const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;
      
      if (text.length > 0) {
        lines.push({ time: timeInSeconds, text });
      }
    }
  }
  
  return lines;
}

async function fetchLyricsFromAPI(artist: string, title: string): Promise<{ plain: string | null; synced: LyricsLine[] | null } | null> {
  try {
    const response = await axios.get(
      `https://lrclib.net/api/get`,
      { 
        params: {
          artist_name: artist,
          track_name: title,
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Ritmik/1.0',
        }
      }
    );
    
    if (response.data) {
      const plainLyrics = response.data.plainLyrics || null;
      const syncedLyrics = response.data.syncedLyrics ? parseSyncedLyrics(response.data.syncedLyrics) : null;
      
      if (plainLyrics || syncedLyrics) {
        return { plain: plainLyrics, synced: syncedLyrics };
      }
    }
    return null;
  } catch (error: any) {
    return null;
  }
}

export async function fetchLyrics(videoTitle: string, channelName: string): Promise<LyricsResult | null> {
  const cleanedChannel = channelName.replace(/\s*-\s*Topic\s*$/i, '').trim();
  
  console.log('[Lyrics Service] Fetching lyrics');
  console.log(`  Title: "${videoTitle}"`);
  console.log(`  Channel: "${cleanedChannel}"`);
  
  const variations = parseMusicTitle(videoTitle, cleanedChannel);
  console.log(`  Generated ${variations.length} variations to try`);

  const batchSize = 10;
  for (let i = 0; i < variations.length; i += batchSize) {
    const batch = variations.slice(i, i + batchSize);
    
    const promises = batch.map(async (variation, index) => {
      const result = await fetchLyricsFromAPI(variation.artist, variation.title);
      return result ? { result, variation, index: i + index } : null;
    });

    const results = await Promise.all(promises);
    const found = results.find(r => r !== null);
    
    if (found) {
      const plainLyrics = found.result.plain || (found.result.synced ? found.result.synced.map(l => l.text).join('\n') : null);
      
      console.log(`  [Success] Found lyrics using variation ${found.index + 1}/${variations.length}`);
      console.log(`    Artist: "${found.variation.artist}"`);
      console.log(`    Title: "${found.variation.title}"`);
      console.log(`    Has synced: ${!!found.result.synced}`);
      console.log(`    Length: ${plainLyrics?.length || 0} characters`);
      
      return {
        lyrics: plainLyrics,
        syncedLyrics: found.result.synced,
        artist: found.variation.artist,
        title: found.variation.title,
      };
    }
  }

  console.log(`  [Failed] No lyrics found after ${variations.length} attempts`);
  return null;
}

