import type { NextApiRequest, NextApiResponse } from 'next';
import youtubesearchapi from 'youtube-search-api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query, nextPage } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const options = nextPage ? { nextPage: { nextPageToken: nextPage } } : undefined;
    
    const result = await youtubesearchapi.GetListByKeyword(
      query, 
      false, 
      20,
      options
    );

    const tracks = result.items
      .filter((item: any) => item.type === 'video' && item.length)
      .map((item: any) => ({
        id: item.id,
        videoId: item.id,
        title: item.title,
        artist: item.channelTitle || 'Unknown',
        channel: item.channelTitle || 'Unknown',
        duration: item.length?.simpleText ? parseDuration(item.length.simpleText) : 0,
        viewCount: parseViewCount(item.viewCount),
        thumbnail: item.thumbnail?.thumbnails?.[0]?.url || ''
      }));

    return res.status(200).json({ 
      data: tracks,
      nextPageToken: result.nextPage?.nextPageToken,
      hasMore: !!result.nextPage?.nextPageToken
    });
  } catch (err: any) {
    console.error('YouTube API Error:', err.message);
    return res.status(500).json({ 
      error: err.message || 'Failed to search on YouTube' 
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

function parseViewCount(viewCount: string | number | undefined): number {
  if (!viewCount) return 0;
  if (typeof viewCount === 'number') return viewCount;
  
  const cleanCount = viewCount.replace(/[^0-9]/g, '');
  return parseInt(cleanCount) || 0;
}

