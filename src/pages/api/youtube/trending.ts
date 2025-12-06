import type { NextApiRequest, NextApiResponse } from 'next';
import youtubesearchapi from 'youtube-search-api';
import { scrapeViewCount } from '@/services/youtube-scraper';
import { withRateLimit } from '@/middleware/rate-limit';
import { sanitizeString } from '@/utils/sanitize';
import { handleApiError } from '@/utils/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await youtubesearchapi.GetListByKeyword('music', false, 20, [{ type: 'video' }]);

    const filteredItems = result.items
      .filter((item: any) => item.type === 'video' && item.length);

    const viewCounts = await Promise.all(
      filteredItems.map((item: any) => scrapeViewCount(item.id))
    );

    const tracks = filteredItems.map((item: any, index: number) => ({
      id: item.id,
      videoId: item.id,
      title: sanitizeString(item.title || ''),
      artist: sanitizeString(item.channelTitle || 'Unknown'),
      channel: sanitizeString(item.channelTitle || 'Unknown'),
      duration: item.length?.simpleText ? parseDuration(item.length.simpleText) : 0,
      viewCount: viewCounts[index],
      thumbnail: item.thumbnail?.thumbnails?.[0]?.url || ''
    }));

    return res.status(200).json({ data: tracks });
  } catch (error) {
    handleApiError(error, res);
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

export default withRateLimit(handler, {
  interval: 60000,
  maxRequests: 60
});