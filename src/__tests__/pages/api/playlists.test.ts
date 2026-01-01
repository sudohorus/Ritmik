import handler from '@/pages/api/playlists';
import { getUserIdFromRequest } from '@/utils/auth';
import { createClient } from '@supabase/supabase-js';

jest.mock('@/utils/auth', () => ({
    getUserIdFromRequest: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(),
}));

const createMocks = (method: string, query: any = {}) => {
    const req = {
        method,
        query,
    } as any;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as any;

    return { req, res };
};

describe('/api/playlists', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 405 for non-GET requests', async () => {
        const { req, res } = createMocks('POST');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 401 if user is not authenticated', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue(null);

        const { req, res } = createMocks('GET');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('returns 200 and fetches playlists', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue('user-123');

        const mockPlaylists = [
            { id: '1', name: 'Playlist 1' },
            { id: '2', name: 'Playlist 2' },
        ];

        const mockBuilder = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve({
                data: mockPlaylists,
                error: null,
                count: 2
            }))
        };

        (createClient as jest.Mock).mockReturnValue({
            from: jest.fn().mockReturnValue(mockBuilder),
        });

        const { req, res } = createMocks('GET', { page: '1', limit: '10' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: mockPlaylists,
            meta: {
                page: 1,
                limit: 10,
                total: 2,
                hasMore: false
            }
        });
    });

    it('handles search query correctly', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue('user-123');

        const mockBuilder = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve({
                data: [],
                error: null,
                count: 0
            }))
        };

        (createClient as jest.Mock).mockReturnValue({
            from: jest.fn().mockReturnValue(mockBuilder),
        });

        const { req, res } = createMocks('GET', { search: 'test' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockBuilder.ilike).toHaveBeenCalledWith('name', '%test%');
    });

    it('returns 500 on database error', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue('user-123');

        const mockBuilder = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve({
                data: null,
                error: { message: 'DB Error' },
                count: null
            }))
        };

        (createClient as jest.Mock).mockReturnValue({
            from: jest.fn().mockReturnValue(mockBuilder),
        });

        const { req, res } = createMocks('GET');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch playlists' });
    });
});
