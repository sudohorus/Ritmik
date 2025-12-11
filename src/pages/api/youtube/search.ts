import type { NextApiRequest, NextApiResponse } from 'next';
import youtubesearchapi from 'youtube-search-api';
import { scrapeViewCount } from '@/services/youtube-scraper';
import { withRateLimit } from '@/middleware/rate-limit';
import { sanitizeString, parseJsonSafely } from '@/utils/sanitize';
import { handleApiError, ValidationError } from '@/utils/error-handler';

import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1).max(200),
  nextPageData: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, nextPageData } = searchSchema.parse(req.query);

    const sanitizedQuery = sanitizeString(query);

    let result;

    if (nextPageData) {
      const parsedNextPage = parseJsonSafely(nextPageData);
      if (!parsedNextPage) {
        throw new ValidationError('Invalid nextPageData parameter');
      }
      result = await youtubesearchapi.NextPage(parsedNextPage, false, 20);
    } else {
      result = await youtubesearchapi.GetListByKeyword(sanitizedQuery, false, 20, [{ type: 'video' }]);
    }

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

    return res.status(200).json({
      data: tracks,
      nextPageData: result.nextPage ? JSON.stringify(result.nextPage) : null,
      hasMore: !!result.nextPage
    });
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
  maxRequests: 30
});