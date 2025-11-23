import axios from 'axios';

export async function scrapeViewCount(videoId: string): Promise<number> {
  try {
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 3000,
    });

    const viewCountMatch = response.data.match(/"viewCount":"(\d+)"/);
    if (viewCountMatch) {
      return parseInt(viewCountMatch[1]);
    }

    return 0;
  } catch (error) {
    return 0;
  }
}

