import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SpotifyService } from '@/services/spotify-service';
import axios from 'axios';
import type { SpotifyConnection, ImportProgress } from '@/types/spotify';
import { validateImportToken } from '@/utils/import-tokens';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { spotifyPlaylistId, targetPlaylistId, token } = req.query;

    if (!spotifyPlaylistId || !targetPlaylistId || !token ||
        typeof spotifyPlaylistId !== 'string' ||
        typeof targetPlaylistId !== 'string' ||
        typeof token !== 'string') {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

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

        const { data: connection, error: fetchError } = await supabaseAdmin
            .from('spotify_connections')
            .select('*')
            .eq('user_id', userId)
            .single<SpotifyConnection>();

        if (fetchError || !connection) {
            return res.status(404).json({ error: 'Spotify not connected' });
        }

        let accessToken = connection.access_token;

        if (SpotifyService.isTokenExpired(connection.token_expires_at)) {
            const refreshed = await SpotifyService.refreshAccessToken(connection.refresh_token);
            accessToken = refreshed.access_token;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

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

        const trackItems = await SpotifyService.getPlaylistTracks(accessToken, spotifyPlaylistId);

        const total = trackItems.length;
        let successful = 0;
        let failed = 0;
        let notFound = 0;

        const startTime = Date.now();

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        ];

        const searchWithRetry = async (url: string, trackName: string): Promise<any> => {
            let attempt = 0;

            while (true) {
                try {
                    const headers: any = {
                        'User-Agent': userAgents[attempt % userAgents.length],
                    };

                    const response = await axios.get(url, {
                        timeout: 15000,
                        headers
                    });
                    return response;
                } catch (error: any) {
                    if (error.response?.status === 429) {
                        attempt++;
                        await sleep(15187.5);
                        continue;
                    }

                    if (attempt < 5) {
                        attempt++;
                        await sleep(1000);
                        continue;
                    }

                    throw error;
                }
            }
        };

        const processTrack = async (item: any, index: number) => {
            const track = item.track;

            if (!track || !track.name) {
                return { success: false, notFound: false, failed: true };
            }

            const trackName = track.name;
            const artistName = track.artists.map((a: any) => a.name).join(', ');
            let searchQuery = `${trackName} ${artistName}`;

            if (searchQuery.length > 180) {
                searchQuery = searchQuery.substring(0, 180);
            }

            const progress: ImportProgress = {
                current: index + 1,
                total,
                track: {
                    name: trackName,
                    artist: artistName,
                    spotifyId: track.id,
                },
                status: 'searching',
            };

            sendEvent('progress', progress);

            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const searchUrl = `${baseUrl}/api/youtube/search?query=${encodeURIComponent(searchQuery)}`;
                const searchResponse = await searchWithRetry(searchUrl, trackName);

                if (!searchResponse.data || !searchResponse.data.data) {
                    progress.status = 'not_found';
                    sendEvent('progress', progress);
                    return { success: false, notFound: true, failed: false };
                }

                if (searchResponse.data.data.length === 0) {
                    progress.status = 'not_found';
                    sendEvent('progress', progress);
                    return { success: false, notFound: true, failed: false };
                }

                const match = searchResponse.data.data[0];

                progress.status = 'found';
                progress.match = {
                    id: match.videoId,
                    title: match.title,
                    thumbnail: match.thumbnail,
                    artist: match.artist,
                };

                sendEvent('progress', progress);

                const { error: insertError } = await supabaseAdmin
                    .from('playlist_tracks')
                    .insert({
                        playlist_id: targetPlaylistId,
                        video_id: match.videoId,
                        title: match.title,
                        artist: match.artist,
                        thumbnail_url: match.thumbnail,
                        duration: match.duration,
                        position: index,
                    });

                if (insertError) {
                    progress.status = 'error';
                    progress.error = 'Failed to add track';
                    sendEvent('progress', progress);
                    return { success: false, notFound: false, failed: true };
                } else {
                    progress.status = 'added';
                    sendEvent('progress', progress);
                    return { success: true, notFound: false, failed: false };
                }
            } catch (error: any) {
                progress.status = 'error';
                progress.error = 'Search failed';
                sendEvent('progress', progress);
                return { success: false, notFound: false, failed: true };
            }
        };

        for (let i = 0; i < trackItems.length; i += 2) {
            if (!isConnectionAlive()) {
                break;
            }

            const batch = trackItems.slice(i, Math.min(i + 2, trackItems.length));

            const results = await Promise.all(
                batch.map((item, batchIndex) => processTrack(item, i + batchIndex))
            );

            results.forEach(result => {
                if (result.success) successful++;
                if (result.notFound) notFound++;
                if (result.failed) failed++;
            });
        }

        if (isConnectionAlive()) {
            const duration = Date.now() - startTime;

            sendEvent('complete', {
                total,
                successful,
                failed,
                notFound,
                duration,
            });
        } else {
        }

        res.end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to import playlist' });
    }
}
