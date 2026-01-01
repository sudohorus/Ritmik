import handler from '@/pages/api/user/delete-account';
import { NextApiRequest, NextApiResponse } from 'next';

// Mock dependencies with a factory that exposes the internal mocks
jest.mock('@supabase/supabase-js', () => {
    const mockGetUser = jest.fn();
    const mockDeleteUser = jest.fn();
    const mockClient = {
        auth: {
            getUser: mockGetUser,
            admin: {
                deleteUser: mockDeleteUser,
            },
        },
    };
    return {
        createClient: jest.fn(() => mockClient),
        __mocks: {
            mockGetUser,
            mockDeleteUser,
            mockClient
        }
    };
});

// Access the exposed mocks
const { __mocks } = require('@supabase/supabase-js');
const { mockGetUser, mockDeleteUser } = __mocks;

// Manual mock helper
const createMocks = (method: string, headers: any = {}) => {
    const req = {
        method,
        headers,
    } as unknown as NextApiRequest;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as unknown as NextApiResponse;

    return { req, res };
};

describe('/api/user/delete-account', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset default implementations if needed, though mockResolvedValue overrides them
    });

    it('returns 405 for non-DELETE requests', async () => {
        const { req, res } = createMocks('POST');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 401 if authorization header is missing', async () => {
        const { req, res } = createMocks('DELETE');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing authorization header' });
    });

    it('returns 401 if token is invalid', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: 'Invalid token' });

        const { req, res } = createMocks('DELETE', { authorization: 'Bearer invalid-token' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('returns 500 if deletion fails', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
        mockDeleteUser.mockResolvedValue({ error: 'Delete failed' });

        const { req, res } = createMocks('DELETE', { authorization: 'Bearer valid-token' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete user account' });
    });

    it('returns 200 if deletion is successful', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
        mockDeleteUser.mockResolvedValue({ error: null });

        const { req, res } = createMocks('DELETE', { authorization: 'Bearer valid-token' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted successfully' });
        expect(mockDeleteUser).toHaveBeenCalledWith('user-123');
    });
});
