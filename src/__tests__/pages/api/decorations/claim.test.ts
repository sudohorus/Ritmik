import handler from '@/pages/api/decorations/claim';
import { getUserIdFromRequest } from '@/utils/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkEligibility } from '@/lib/server/decoration-rules';

jest.mock('@/utils/auth', () => ({
    getUserIdFromRequest: jest.fn(),
}));

jest.mock('@/lib/supabase-admin', () => ({
    supabaseAdmin: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(),
                })),
            })),
            insert: jest.fn(),
        })),
    },
}));

jest.mock('@/lib/server/decoration-rules', () => ({
    checkEligibility: jest.fn(),
}));

const createMocks = (method: string, body: any = {}) => {
    const req = {
        method,
        body,
    } as any;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as any;

    return { req, res };
};

describe('/api/decorations/claim', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 405 for non-POST requests', async () => {
        const { req, res } = createMocks('GET');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 401 if user is not authenticated', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue(null);

        const { req, res } = createMocks('POST');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('returns 400 if decorationName is missing', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue('user-123');

        const { req, res } = createMocks('POST', {});

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Decoration name is required' });
    });

    it('returns 404 if decoration is not found', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue('user-123');

        const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const { req, res } = createMocks('POST', { decorationName: 'Unknown Decoration' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Decoration not found' });
    });

    it('returns 403 if user is not eligible', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue('user-123');

        const mockSingle = jest.fn().mockResolvedValue({
            data: { id: 'dec-123', is_free: false },
            error: null
        });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        (checkEligibility as jest.Mock).mockResolvedValue(false);

        const { req, res } = createMocks('POST', { decorationName: 'Exclusive Item' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'You are not eligible for this decoration' });
    });

    it('returns 200 and claims decoration if eligible', async () => {
        (getUserIdFromRequest as jest.Mock).mockResolvedValue('user-123');

        const mockSingle = jest.fn().mockResolvedValue({
            data: { id: 'dec-123', is_free: true },
            error: null
        });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

        const mockInsert = jest.fn().mockResolvedValue({ error: null });

        const mockFrom = jest.fn().mockImplementation((table) => {
            if (table === 'avatar_decorations') {
                return { select: mockSelect };
            }
            if (table === 'user_decorations') {
                return { insert: mockInsert };
            }
            return {};
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        (checkEligibility as jest.Mock).mockResolvedValue(true);

        const { req, res } = createMocks('POST', { decorationName: 'Free Item' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
        expect(mockInsert).toHaveBeenCalledWith({
            user_id: 'user-123',
            decoration_id: 'dec-123'
        });
    });
});
