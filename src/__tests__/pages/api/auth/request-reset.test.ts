import handler from '@/pages/api/auth/request-reset';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { EmailService } from '@/services/email-service';
import { withRateLimit } from '@/middleware/rate-limit';

// Mock dependencies
jest.mock('@/lib/supabase-admin', () => ({
    supabaseAdmin: {
        auth: {
            admin: {
                listUsers: jest.fn(),
            },
        },
        from: jest.fn(),
    },
}));

jest.mock('@/services/email-service', () => ({
    EmailService: {
        sendPasswordResetEmail: jest.fn(),
    },
}));

// Mock middleware to pass through
jest.mock('@/middleware/rate-limit', () => ({
    withRateLimit: jest.fn((handler) => handler),
}));

// Manual mock helper
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

describe('/api/auth/request-reset', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASSWORD = 'password';
    });

    it('returns 405 for non-POST requests', async () => {
        const { req, res } = createMocks('GET');

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 400 if email is missing', async () => {
        const { req, res } = createMocks('POST', {});

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
    });

    it('returns 500 if email credentials are missing', async () => {
        delete process.env.EMAIL_USER;
        const { req, res } = createMocks('POST', { email: 'test@example.com' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server misconfiguration: Email credentials missing' });
    });

    it('returns 200 if user is not found (security)', async () => {
        (supabaseAdmin.auth.admin.listUsers as jest.Mock).mockResolvedValue({
            data: { users: [] },
            error: null,
        });

        const { req, res } = createMocks('POST', { email: 'unknown@example.com' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'If an account exists, a reset email has been sent.' });
        expect(EmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('returns 200 and sends email if user is found', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' };
        (supabaseAdmin.auth.admin.listUsers as jest.Mock).mockResolvedValue({
            data: { users: [mockUser] },
            error: null,
        });

        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        (supabaseAdmin.from as jest.Mock).mockReturnValue({
            insert: mockInsert,
        });

        const { req, res } = createMocks('POST', { email: 'test@example.com' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'If an account exists, a reset email has been sent.' });
        expect(supabaseAdmin.from).toHaveBeenCalledWith('password_resets');
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'user-123',
            token: expect.any(String),
        }));
        expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
    });
});
