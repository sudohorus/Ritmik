import axios from 'axios';
import { parseMusicTitle, ParsedTitle } from '@/utils/parseMusicTitle';

export interface LyricsResult {
  lyrics: string | null;
  artist: string;
  title: string;
}

async function fetchLyricsFromAPI(artist: string, title: string): Promise<string | null> {
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
      let lyrics = response.data.plainLyrics;
      
      if (!lyrics && response.data.syncedLyrics) {
        lyrics = response.data.syncedLyrics
          .split('\n')
          .map((line: string) => line.replace(/^\[\d+:\d+\.\d+\]/, '').trim())
          .filter((line: string) => line.length > 0)
          .join('\n');
      }
      
      if (lyrics) {
        return lyrics.trim();
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
      const lyrics = await fetchLyricsFromAPI(variation.artist, variation.title);
      return lyrics ? { lyrics, variation, index: i + index } : null;
    });

    const results = await Promise.all(promises);
    const found = results.find(r => r !== null);
    
    if (found) {
      console.log(`  [Success] Found lyrics using variation ${found.index + 1}/${variations.length}`);
      console.log(`    Artist: "${found.variation.artist}"`);
      console.log(`    Title: "${found.variation.title}"`);
      console.log(`    Length: ${found.lyrics.length} characters`);
      return {
        lyrics: found.lyrics,
        artist: found.variation.artist,
        title: found.variation.title,
      };
    }
  }

  console.log(`  [Failed] No lyrics found after ${variations.length} attempts`);
  return null;
}

