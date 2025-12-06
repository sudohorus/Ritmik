import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailService } from '@/services/email-service';
import { withRateLimit } from '@/middleware/rate-limit';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { handleApiError, ValidationError } from '@/utils/error-handler';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const userEmail = req.user?.email;

    if (!userEmail) {
      throw new ValidationError('User email not found in token');
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    const location = Array.isArray(ip) ? ip[0] : ip;

    await EmailService.sendLoginNotificationEmail(
      userEmail,
      location,
      userAgent
    );

    return res.status(200).json({ success: true, message: 'Notification sent' });
  } catch (error) {
    handleApiError(error, res);
  }
}

const authenticatedHandler = requireAuth(handler);

export default withRateLimit(authenticatedHandler, {
  interval: 60 * 60 * 1000,
  maxRequests: 5
});