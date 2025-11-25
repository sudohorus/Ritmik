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
  const startTime = Date.now();
  console.log('[Lyrics Service] fetchLyrics called');
  console.log(`  videoTitle: "${videoTitle}"`);
  console.log(`  channelName: "${channelName}"`);

  const cleanedChannel = channelName.replace(/\s*-\s*Topic\s*$/i, '').trim();
  const variations = parseMusicTitle(videoTitle, cleanedChannel);
  console.log(`  Generated ${variations.length} variations`);

  const batchSize = 10;
  let attemptCount = 0;
  
  for (let i = 0; i < variations.length; i += batchSize) {
    const batch = variations.slice(i, i + batchSize);
    attemptCount += batch.length;
    console.log(`[Lyrics Service] Trying batch ${Math.floor(i / batchSize) + 1} (${batch.length} variations)`);
    
    const batchStartTime = Date.now();
    const promises = batch.map(async (variation, index) => {
      const variationStartTime = Date.now();
      try {
        const result = await fetchLyricsFromAPI(variation.artist, variation.title);
        const duration = Date.now() - variationStartTime;
        if (result) {
          console.log(`[Lyrics Service] Found lyrics at variation ${i + index + 1}/${variations.length} (${duration}ms)`);
          console.log(`  Artist: "${variation.artist}"`);
          console.log(`  Title: "${variation.title}"`);
        }
        return result ? { result, variation, index: i + index } : null;
      } catch (error) {
        const duration = Date.now() - variationStartTime;
        console.log(`[Lyrics Service] Variation ${i + index + 1} failed (${duration}ms)`);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const batchDuration = Date.now() - batchStartTime;
    console.log(`[Lyrics Service] Batch completed in ${batchDuration}ms`);
    
    const found = results.find(r => r !== null);
    
    if (found) {
      const plainLyrics = found.result.plain || (found.result.synced ? found.result.synced.map(l => l.text).join('\n') : null);
      const totalDuration = Date.now() - startTime;
      console.log(`[Lyrics Service] Success after ${attemptCount} attempts (${totalDuration}ms total)`);
      
      return {
        lyrics: plainLyrics,
        syncedLyrics: found.result.synced,
        artist: found.variation.artist,
        title: found.variation.title,
      };
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`[Lyrics Service] Failed after ${variations.length} attempts (${totalDuration}ms total)`);
  return null;
}

