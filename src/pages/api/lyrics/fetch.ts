import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchLyrics } from '@/services/lyrics-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { title, channel } = req.query;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title parameter is required' });
  }

  const channelName = typeof channel === 'string' ? channel : '';

  try {
    const result = await fetchLyrics(title, channelName);
    
    if (result) {
      return res.status(200).json(result);
    }
    
    return res.status(404).json({ error: 'Lyrics not found' });
  } catch (error) {
    console.error('Lyrics fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
}

