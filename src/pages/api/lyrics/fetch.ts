import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchLyrics } from '@/services/lyrics-service';
import { withRateLimit } from '@/middleware/rate-limit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { title, channel } = req.query;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title parameter is required' });
  }

  const channelName = typeof channel === 'string' ? channel : '';

  try {
    const result = await fetchLyrics(title, channelName);
    const duration = Date.now() - startTime;
    
    if (result) {
      return res.status(200).json(result);
    }
    
    return res.status(404).json({ error: 'Lyrics not found' });
  } catch (error) {
    const duration = Date.now() - startTime;
    return res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
}

export default withRateLimit(handler, {
  interval: 60000,
  maxRequests: 60
});