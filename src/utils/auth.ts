import type { NextApiRequest } from 'next';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function getUserIdFromRequest(req: NextApiRequest): Promise<string | null> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) return user.id;
    }

    const cookies = parse(req.headers.cookie || '');

    for (const [key, value] of Object.entries(cookies)) {
        if (!value || !key.includes('auth-token')) continue;

        try {
            const data = JSON.parse(value);
            const token = data.access_token || data[0];
            if (!token) continue;

            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) return user.id;
        } catch {
            continue;
        }
    }

    return null;
}
