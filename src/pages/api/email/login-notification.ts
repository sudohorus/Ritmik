import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailService } from '@/services/email-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, device } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '0.0.0.0';

    console.log('IP detectado:', ip);

    let userLocation = 'Unknown location';

    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();

      if (data && data.city) {
        userLocation = `${data.city}, ${data.region}, ${data.country_name}`;
      }
    } catch (err) {
    }

    const userDevice = device || 'Unknown device';

    await EmailService.sendLoginNotificationEmail(
      email,
      userLocation,
      userDevice
    );

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
