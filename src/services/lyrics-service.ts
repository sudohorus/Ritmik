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
  console.log('[Lyrics Service] Fetching lyrics');
  console.log(`  Title: "${videoTitle}"`);
  console.log(`  Channel: "${channelName}"`);
  
  const variations = parseMusicTitle(videoTitle, channelName);
  console.log(`  Generated ${variations.length} variations to try`);

  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    const lyrics = await fetchLyricsFromAPI(variation.artist, variation.title);
    
    if (lyrics) {
      console.log(`  [Success] Found lyrics using variation ${i + 1}/${variations.length}`);
      console.log(`    Artist: "${variation.artist}"`);
      console.log(`    Title: "${variation.title}"`);
      console.log(`    Length: ${lyrics.length} characters`);
      return {
        lyrics,
        artist: variation.artist,
        title: variation.title,
      };
    }
  }

  console.log(`  [Failed] No lyrics found after ${variations.length} attempts`);
  return null;
}

