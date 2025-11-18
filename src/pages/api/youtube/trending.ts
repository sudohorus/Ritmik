import type { NextApiRequest, NextApiResponse } from 'next';
import youtubesearchapi from 'youtube-search-api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await youtubesearchapi.GetListByKeyword('music 2024', false, 50, {
      type: 'video'
    });

    const tracks = result.items
      .filter((item: any) => item.type === 'video')
      .map((item: any) => ({
        id: item.id,
        videoId: item.id,
        title: item.title,
        artist: item.channelTitle,
        channel: item.channelTitle,
        duration: item.length?.simpleText ? parseDuration(item.length.simpleText) : 0,
        viewCount: item.viewCount ? parseInt(item.viewCount) : 0,
        thumbnail: item.thumbnail?.thumbnails?.[0]?.url || ''
      }));

    return res.status(200).json({ data: tracks });
  } catch (err: any) {
    console.error('YouTube API Error:', err.message);
    return res.status(500).json({ 
      error: err.message || 'Failed to fetch trending from YouTube' 
    });
  }
}

function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

