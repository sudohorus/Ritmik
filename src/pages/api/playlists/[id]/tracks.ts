import { NextApiRequest, NextApiResponse } from 'next';
import { PlaylistService } from '@/services/playlist-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid playlist ID' });
    }

    try {
        const tracks = await PlaylistService.getPlaylistTracks(id);

        return res.status(200).json(tracks);
    } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
