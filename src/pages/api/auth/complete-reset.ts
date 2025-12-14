import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withRateLimit } from '@/middleware/rate-limit';
import { handleApiError } from '@/utils/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const { data: resetRecord, error: fetchError } = await supabaseAdmin
            .from('password_resets')
            .select('*')
            .eq('token', token)
            .single();

        if (fetchError || !resetRecord) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        if (new Date(resetRecord.expires_at) < new Date()) {
            await supabaseAdmin.from('password_resets').delete().eq('id', resetRecord.id);
            return res.status(400).json({ error: 'Token expired' });
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            resetRecord.user_id,
            { password: password }
        );

        if (updateError) throw updateError;

        await supabaseAdmin.from('password_resets').delete().eq('id', resetRecord.id);

        return res.status(200).json({ success: true });
    } catch (error) {
        handleApiError(error, res);
    }
}

export default withRateLimit(handler, {
    interval: 15 * 60 * 1000, 
    maxRequests: 5
});
