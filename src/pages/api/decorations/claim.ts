import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkEligibility } from '@/lib/server/decoration-rules';
import { getUserIdFromRequest } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = await getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { decorationName } = req.body;

        if (!decorationName) {
            return res.status(400).json({ error: 'Decoration name is required' });
        }

        const { data: decoration, error: decorationError } = await supabaseAdmin
            .from('avatar_decorations')
            .select('*')
            .eq('name', decorationName)
            .single();

        if (decorationError || !decoration) {
            return res.status(404).json({ error: 'Decoration not found' });
        }

        const isEligible = await checkEligibility(
            decorationName,
            userId,
            supabaseAdmin,
            decoration.is_free
        );

        if (!isEligible) {
            return res.status(403).json({ error: 'You are not eligible for this decoration' });
        }

        const { error: claimError } = await supabaseAdmin
            .from('user_decorations')
            .insert({
                user_id: userId,
                decoration_id: decoration.id
            });

        if (claimError) {
            if (claimError.code === '23505') {
                return res.status(200).json({ success: true, message: 'Already claimed' });
            }
            throw claimError;
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error claiming decoration:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
