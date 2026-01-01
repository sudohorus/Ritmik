import handler from '@/pages/api/playlists/create';
import { createClient } from '@supabase/supabase-js';
import { PlaylistService } from '@/services/playlist-service';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(),
}));

jest.mock('@/services/playlist-service', () => ({
    PlaylistService: {
        createPlaylist: jest.fn(),
    },
}));

// Mock global fetch
global.fetch = jest.fn();

// Manual mock helper
const createMocks = (method: string, body: any = {}, headers: any = {}) => {
    const req = {
        method,
        body,
        headers,
        socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as any;

    return { req, res };
};

describe('/api/playlists/create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.TURNSTILE_SECRET_KEY = 'mock-secret';
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    });

    it('returns 405 for non-POST requests', async () => {
        const { req, res } = createMocks('GET');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 400 if token is missing', async () => {
        const { req, res } = createMocks('POST', { name: 'My Playlist' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Turnstile token is required' });
    });

    it('returns 400 if Turnstile verification fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue({ success: false }),
        });

        const { req, res } = createMocks('POST', { token: 'invalid-token', name: 'My Playlist' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid Turnstile token' });
    });

    it('returns 401 if user is not authenticated', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue({ success: true }),
        });

        const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null }, error: 'Auth error' });
        const mockAuth = { getUser: mockGetUser };
        (createClient as jest.Mock).mockReturnValue({ auth: mockAuth });

        const { req, res } = createMocks('POST', { token: 'valid-token', name: 'My Playlist' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('returns 200 and creates playlist if valid', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue({ success: true }),
        });

        const mockUser = { id: 'user-123' };
        const mockGetUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
        const mockAuth = { getUser: mockGetUser };
        const mockSupabase = { auth: mockAuth };
        (createClient as jest.Mock).mockReturnValue(mockSupabase);

        const mockPlaylist = { id: 'pl-1', name: 'My Playlist' };
        (PlaylistService.createPlaylist as jest.Mock).mockResolvedValue(mockPlaylist);

        const { req, res } = createMocks('POST', {
            token: 'valid-token',
            name: 'My Playlist',
            description: 'Test'
        });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockPlaylist);
        expect(PlaylistService.createPlaylist).toHaveBeenCalledWith(
            'user-123',
            { name: 'My Playlist', description: 'Test' },
            mockSupabase
        );
    });
});
