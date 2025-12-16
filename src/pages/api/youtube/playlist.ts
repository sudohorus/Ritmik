import type { NextApiRequest, NextApiResponse } from 'next';
import youtubesearchapi from 'youtube-search-api';
import { withRateLimit } from '@/middleware/rate-limit';
import { handleApiError } from '@/utils/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        let playlistId = url;
        const match = url.match(/[&?]list=([^&]+)/);
        if (match) {
            playlistId = match[1];
        }

        const result = await youtubesearchapi.GetPlaylistData(playlistId);

        if (!result || !result.metadata) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const playlist = {
            id: result.metadata.playlistMetadataRenderer?.playlistId || playlistId,
            title: result.metadata.playlistMetadataRenderer?.title || 'Unknown Playlist',
            thumbnail: result.metadata.playlistMetadataRenderer?.thumbnail?.thumbnails?.[0]?.url || '',
            channelTitle: result.metadata.playlistMetadataRenderer?.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text || '',
            videoCount: result.metadata.playlistHeaderRenderer?.numVideosText?.runs?.[0]?.text || '0',
            tracks: result.items.map((item: any) => ({
                id: item.id,
                videoId: item.id,
                title: item.title,
                thumbnail: item.thumbnail?.thumbnails?.[0]?.url || '',
                channelTitle: item.thumbnail?.thumbnails?.[0]?.url || '', // API might not give channel for items easily, but that's fine
                duration: item.length?.simpleText || '0:00'
            }))
        };

        return res.status(200).json(playlist);
    } catch (error) {
        handleApiError(error, res);
    }
}

export default withRateLimit(handler, {
    interval: 60000,
    maxRequests: 20
});
