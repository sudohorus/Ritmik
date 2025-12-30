import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import youtubesearchapi from 'youtube-search-api';
import { validateImportToken } from '@/utils/import-tokens';
import type { YoutubeImportProgress } from '@/types/youtube';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function parseDuration(duration: string): number {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { youtubePlaylistId, targetPlaylistId, token } = req.query;

    if (!youtubePlaylistId || !targetPlaylistId || !token ||
        typeof youtubePlaylistId !== 'string' ||
        typeof targetPlaylistId !== 'string' ||
        typeof token !== 'string') {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const isConnectionAlive = () => {
        return res.writable && !res.destroyed && res.socket?.writable;
    };

    const sendEvent = (event: string, data: any) => {
        if (!isConnectionAlive()) {
            return false;
        }
        try {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            return true;
        } catch (error) {
            return false;
        }
    };

    try {
        const userId = validateImportToken(token);

        if (!userId) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const { data: targetPlaylist, error: playlistError } = await supabaseAdmin
            .from('playlists')
            .select('user_id')
            .eq('id', targetPlaylistId)
            .single();

        if (playlistError || !targetPlaylist) {
            return res.status(404).json({ error: 'Target playlist not found' });
        }

        if (targetPlaylist.user_id !== userId) {
            return res.status(403).json({ error: 'You do not own this playlist' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const result = await youtubesearchapi.GetPlaylistData(youtubePlaylistId);

        if (!result || !result.items) {
            sendEvent('error', { message: 'Failed to fetch YouTube playlist' });
            res.end();
            return;
        }

        const tracks = result.items;
        const total = tracks.length;
        let successful = 0;
        let failed = 0;
        const startTime = Date.now();

        const { data: maxPosData } = await supabaseAdmin
            .from('playlist_tracks')
            .select('position')
            .eq('playlist_id', targetPlaylistId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const currentMaxPosition = maxPosData?.position ?? -1;
        const startPosition = currentMaxPosition + 1;

        for (let i = 0; i < total; i++) {
            if (!isConnectionAlive()) break;

            const item = tracks[i];
            const raw = item as any;

            const videoId = item.id;
            const title = item.title || 'Unknown Track';

            const thumbnail = item.thumbnail?.thumbnails?.[0]?.url ||
                raw.thumbnail?.url ||
                '';

            const durationStr = item.length?.simpleText ||
                raw.lengthText?.simpleText ||
                raw.length?.accessibility?.accessibilityData?.label ||
                '0:00';
            const duration = parseDuration(durationStr);

            const artist =
                item.channelTitle ||
                raw.channelTitle ||
                raw.shortBylineText?.runs?.[0]?.text ||
                raw.longBylineText?.runs?.[0]?.text ||
                raw.ownerText?.runs?.[0]?.text ||
                item.channelTitle ||
                raw.author?.name ||
                raw.author ||
                'Unknown Artist';

            const progress: YoutubeImportProgress = {
                current: i + 1,
                total,
                track: {
                    name: title,
                    artist: artist,
                    videoId: videoId
                },
                status: 'pending'
            };

            sendEvent('progress', progress);

            const { error: insertError } = await supabaseAdmin
                .from('playlist_tracks')
                .insert({
                    playlist_id: targetPlaylistId,
                    video_id: videoId,
                    title: title,
                    artist: artist,
                    thumbnail_url: thumbnail,
                    duration: duration,
                    position: startPosition + i,
                });

            if (insertError) {
                progress.status = 'error';
                progress.error = 'Failed to add track';
                failed++;
            } else {
                progress.status = 'added';
                successful++;
            }

            sendEvent('progress', progress);

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (isConnectionAlive()) {
            const duration = Date.now() - startTime;
            sendEvent('complete', {
                total,
                successful,
                failed,
                duration
            });
        }

        res.end();

    } catch (error) {
        if (isConnectionAlive()) {
            sendEvent('error', { message: 'Internal server error' });
        }
        res.end();
    }
}