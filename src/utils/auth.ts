import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getUserIdFromRequest(req: NextApiRequest, res?: NextApiResponse): Promise<string | null> {
    if (res) {
        const supabase = createPagesServerClient(req, res);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) return user.id;
    }

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const token = authHeader.substring(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) return user.id;
    }

    return null;
}
