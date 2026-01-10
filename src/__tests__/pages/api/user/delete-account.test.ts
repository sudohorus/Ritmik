import handler from '@/pages/api/user/delete-account';
import { NextApiRequest, NextApiResponse } from 'next';

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

const { __mocks } = require('@supabase/supabase-js');
const { mockGetUser, mockDeleteUser } = __mocks;

jest.mock('@/utils/auth', () => ({
    getUserIdFromRequest: jest.fn(),
}));

import { getUserIdFromRequest } from '@/utils/auth';

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
        
    });

    it('returns 405 for non-DELETE requests', async () => {
        const { req, res } = createMocks('POST');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 401 if authorization header is missing', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue(null);
        const { req, res } = createMocks('DELETE');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('returns 401 if token is invalid', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue(null);
        // mockGetUser.mockResolvedValue({ data: { user: null }, error: 'Invalid token' }); // No longer needed as we mock the util

        const { req, res } = createMocks('DELETE', { authorization: 'Bearer invalid-token' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('returns 500 if deletion fails', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue('user-123');
        mockDeleteUser.mockResolvedValue({ error: 'Delete failed' });

        const { req, res } = createMocks('DELETE', { authorization: 'Bearer valid-token' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete user account' });
    });

    it('returns 200 if deletion is successful', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue('user-123');
        mockDeleteUser.mockResolvedValue({ error: null });

        const { req, res } = createMocks('DELETE', { authorization: 'Bearer valid-token' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted successfully' });
        expect(mockDeleteUser).toHaveBeenCalledWith('user-123');
    });
});
