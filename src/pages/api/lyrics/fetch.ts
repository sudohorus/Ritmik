import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchLyrics } from '@/services/lyrics-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  const { title, channel } = req.query;

  console.log('[API] /api/lyrics/fetch - Request received');
  console.log(`  Title: "${title}"`);
  console.log(`  Channel: "${channel}"`);

  if (!title || typeof title !== 'string') {
    console.log('[API] /api/lyrics/fetch - Invalid title parameter');
    return res.status(400).json({ error: 'Title parameter is required' });
  }

  const channelName = typeof channel === 'string' ? channel : '';

  try {
    console.log('[API] /api/lyrics/fetch - Calling fetchLyrics...');
    const result = await fetchLyrics(title, channelName);
    const duration = Date.now() - startTime;
    
    if (result) {
      console.log(`[API] /api/lyrics/fetch - Success (${duration}ms)`);
      return res.status(200).json(result);
    }
    
    console.log(`[API] /api/lyrics/fetch - Not found (${duration}ms)`);
    return res.status(404).json({ error: 'Lyrics not found' });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] /api/lyrics/fetch - Error (${duration}ms):`, error);
    return res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
}

