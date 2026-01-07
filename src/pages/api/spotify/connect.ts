import type { NextApiRequest, NextApiResponse } from 'next';
import { SpotifyService } from '@/services/spotify-service';
import { getUserIdFromRequest } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userId = await getUserIdFromRequest(req, res);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const authUrl = SpotifyService.getAuthUrl();
    const redirectUrl = `${authUrl}&state=${userId}`;

    return res.status(200).json({ url: redirectUrl });
}
