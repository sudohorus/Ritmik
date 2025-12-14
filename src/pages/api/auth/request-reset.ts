import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { EmailService } from '@/services/email-service';
import { withRateLimit } from '@/middleware/rate-limit';
import { handleApiError } from '@/utils/error-handler';
import crypto from 'crypto';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        return res.status(500).json({ error: 'Server misconfiguration: Email credentials missing' });
    }

    try {
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

        if (userError) throw userError;

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const { error: dbError } = await supabaseAdmin
            .from('password_resets')
            .insert({
                user_id: user.id,
                token,
                expires_at: expiresAt.toISOString(),
            });

        if (dbError) throw dbError;

        await EmailService.sendPasswordResetEmail(email, token);

        return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
    } catch (error) {
        handleApiError(error, res);
    }
}

export default withRateLimit(handler, {
    interval: 60 * 60 * 1000,
    maxRequests: 5
});
