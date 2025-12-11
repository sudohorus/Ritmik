import axios from 'axios';
import type {
    SpotifyPlaylist,
    SpotifyPlaylistTracksResponse,
    SpotifyUserProfile
} from '@/types/spotify';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

export class SpotifyService {
    static getAuthUrl(): string {
        const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

        const scopes = [
            'playlist-read-private',
            'playlist-read-collaborative',
            'user-read-email',
        ];

        const params = new URLSearchParams({
            client_id: clientId!,
            response_type: 'code',
            redirect_uri: redirectUri!,
            scope: scopes.join(' '),
            show_dialog: 'false',
        });

        return `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}`;
    }

    static async exchangeCodeForTokens(code: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
    }> {
        const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI || process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

        try {
            const response = await axios.post(
                `${SPOTIFY_ACCOUNTS_BASE}/api/token`,
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri!,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Spotify token exchange error:', error?.response?.data || error?.message);
            throw error;
        }
    }

    static async refreshAccessToken(refreshToken: string): Promise<{
        access_token: string;
        expires_in: number;
    }> {
        const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        try {
            const response = await axios.post(
                `${SPOTIFY_ACCOUNTS_BASE}/api/token`,
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Spotify token refresh error:', error?.response?.data || error?.message);
            throw error;
        }
    }

    static async getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
        try {
            const response = await axios.get(`${SPOTIFY_API_BASE}/me`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('Spotify get user profile error:', error?.response?.data || error?.message);
            throw error;
        }
    }

    static async getUserPlaylists(accessToken: string, limit = 50): Promise<SpotifyPlaylist[]> {
        const playlists: SpotifyPlaylist[] = [];
        let url: string | null = `${SPOTIFY_API_BASE}/me/playlists?limit=${limit}`;

        try {
            while (url) {
                const response: { data: { items: SpotifyPlaylist[]; next: string | null } } = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                playlists.push(...response.data.items);
                url = response.data.next;
            }

            return playlists;
        } catch (error: any) {
            console.error('Spotify get playlists error:', error?.response?.data || error?.message);
            throw error;
        }
    }

    static async getPlaylistTracks(
        accessToken: string,
        playlistId: string,
        limit = 100
    ): Promise<SpotifyPlaylistTracksResponse['items']> {
        const tracks: SpotifyPlaylistTracksResponse['items'] = [];
        let url: string | null = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=${limit}`;

        while (url) {
            const response: { data: SpotifyPlaylistTracksResponse } = await axios.get<SpotifyPlaylistTracksResponse>(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            tracks.push(...response.data.items);
            url = response.data.next;
        }

        return tracks;
    }

    static isTokenExpired(expiresAt: string): boolean {
        return new Date(expiresAt) <= new Date();
    }

    static calculateExpiryDate(expiresIn: number): Date {
        return new Date(Date.now() + expiresIn * 1000);
    }
}
