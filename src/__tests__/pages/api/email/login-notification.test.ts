import handler from '@/pages/api/email/login-notification';
import { EmailService } from '@/services/email-service';

// Mock dependencies
jest.mock('@/services/email-service', () => ({
    EmailService: {
        sendLoginNotificationEmail: jest.fn(),
    },
}));

jest.mock('@/middleware/rate-limit', () => ({
    withRateLimit: jest.fn((handler) => handler),
}));

// Mock requireAuth to simulate authenticated user
jest.mock('@/middleware/auth', () => ({
    requireAuth: jest.fn((handler) => async (req: any, res: any) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        return handler(req, res);
    }),
}));

// Manual mock helper
const createMocks = (method: string, user: any = null, headers: any = {}) => {
    const req = {
        method,
        user,
        headers,
        socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as any;

    return { req, res };
};

describe('/api/email/login-notification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 405 for non-POST requests', async () => {
        const { req, res } = createMocks('GET', { email: 'test@example.com' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Method not allowed' }));
    });

    it('returns 401 if user is not authenticated', async () => {
        const { req, res } = createMocks('POST', null);

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('returns 200 and sends email if authenticated', async () => {
        const mockUser = { email: 'test@example.com' };
        const { req, res } = createMocks('POST', mockUser, {
            'user-agent': 'Test Browser',
            'x-forwarded-for': '192.168.1.1'
        });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Notification sent' });
        expect(EmailService.sendLoginNotificationEmail).toHaveBeenCalledWith(
            'test@example.com',
            '192.168.1.1',
            'Test Browser'
        );
    });
});
