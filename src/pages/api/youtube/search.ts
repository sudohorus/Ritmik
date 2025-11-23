import type { NextApiRequest, NextApiResponse } from 'next';
import youtubesearchapi from 'youtube-search-api';
import { scrapeViewCount } from '@/services/youtube-scraper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query, nextPageData } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    let result;
    
    if (nextPageData) {
      const parsedNextPage = JSON.parse(nextPageData as string);
      result = await youtubesearchapi.NextPage(parsedNextPage, false, 20);
    } else {
      result = await youtubesearchapi.GetListByKeyword(query, false, 20, [{ type: 'video' }]);
    }

    const filteredItems = result.items
      .filter((item: any) => item.type === 'video' && item.length);
    
    const viewCounts = await Promise.all(
      filteredItems.map((item: any) => scrapeViewCount(item.id))
    );
    
    const tracks = filteredItems.map((item: any, index: number) => ({
      id: item.id,
      videoId: item.id,
      title: item.title,
      artist: item.channelTitle || 'Unknown',
      channel: item.channelTitle || 'Unknown',
      duration: item.length?.simpleText ? parseDuration(item.length.simpleText) : 0,
      viewCount: viewCounts[index],
      thumbnail: item.thumbnail?.thumbnails?.[0]?.url || ''
    }));

    return res.status(200).json({ 
      data: tracks,
      nextPageData: result.nextPage ? JSON.stringify(result.nextPage) : null,
      hasMore: !!result.nextPage
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



