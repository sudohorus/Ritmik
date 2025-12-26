import { NextApiRequest, NextApiResponse } from 'next';
import { PlaylistService } from '@/services/playlist-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 8;
        const search = req.query.search as string || undefined;

        const result = await PlaylistService.getPublicPlaylists(page, limit, search);

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching public playlists:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
