import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchLyrics } from '@/services/lyrics-service';
import { withRateLimit } from '@/middleware/rate-limit';
import { sanitizeString } from '@/utils/sanitize';
import { handleApiError, ValidationError } from '@/utils/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { title, channel } = req.query;

    if (!title || typeof title !== 'string') {
      throw new ValidationError('Title parameter is required');
    }

    const sanitizedTitle = sanitizeString(title);
    const sanitizedChannel = typeof channel === 'string' ? sanitizeString(channel) : '';

    if (!sanitizedTitle) {
      throw new ValidationError('Invalid title parameter');
    }

    const result = await fetchLyrics(sanitizedTitle, sanitizedChannel);

    if (result) {
      return res.status(200).json(result);
    }

    return res.status(404).json({ error: 'Lyrics not found', code: 'NOT_FOUND' });
  } catch (error) {
    handleApiError(error, res);
  }
}

export default withRateLimit(handler, {
  interval: 60000,
  maxRequests: 60
});