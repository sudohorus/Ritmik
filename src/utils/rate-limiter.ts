import { supabase } from '@/lib/supabase';

export type ActionType = 'login' | 'signup';

interface RateLimitConfig {
    maxAttempts: number;
    blockDuration: number;
}

const LIMITS: Record<ActionType, RateLimitConfig> = {
    login: {
        maxAttempts: 15,
        blockDuration: 30 * 60 * 1000,
    },
    signup: {
        maxAttempts: 5,
        blockDuration: 30 * 60 * 1000,
    },
};

export interface RateLimitResult {
    allowed: boolean;
    remainingAttempts?: number;
    blockedUntil?: Date;
    resetAt?: Date;
}

export async function getClientIP(): Promise<string> {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'unknown';
    } catch {
        return 'unknown';
    }
}

export async function checkRateLimit(
    ipAddress: string,
    actionType: ActionType
): Promise<RateLimitResult> {
    try {
        const { data, error } = await supabase
            .from('rate_limit_attempts')
            .select('*')
            .eq('ip_address', ipAddress)
            .eq('action_type', actionType)
            .maybeSingle();

        if (error) {
            console.error('Error checking rate limit:', error);
            return { allowed: true };
        }

        if (!data) {
            return {
                allowed: true,
                remainingAttempts: LIMITS[actionType].maxAttempts
            };
        }

        if (data.blocked_until) {
            const blockedUntil = new Date(data.blocked_until);
            if (blockedUntil > new Date()) {
                return {
                    allowed: false,
                    blockedUntil,
                    resetAt: blockedUntil,
                };
            }

            await supabase
                .from('rate_limit_attempts')
                .delete()
                .eq('ip_address', ipAddress)
                .eq('action_type', actionType);

            return {
                allowed: true,
                remainingAttempts: LIMITS[actionType].maxAttempts
            };
        }

        const remaining = LIMITS[actionType].maxAttempts - data.attempt_count;
        return {
            allowed: remaining > 0,
            remainingAttempts: Math.max(0, remaining),
        };
    } catch (err) {
        console.error('Rate limit check error:', err);
        return { allowed: true };
    }
}

export async function recordAttempt(
    ipAddress: string,
    actionType: ActionType
): Promise<void> {
    try {
        const { data: existing } = await supabase
            .from('rate_limit_attempts')
            .select('*')
            .eq('ip_address', ipAddress)
            .eq('action_type', actionType)
            .maybeSingle();

        const config = LIMITS[actionType];

        if (existing) {
            const newCount = existing.attempt_count + 1;
            const shouldBlock = newCount >= config.maxAttempts;

            await supabase
                .from('rate_limit_attempts')
                .update({
                    attempt_count: newCount,
                    blocked_until: shouldBlock
                        ? new Date(Date.now() + config.blockDuration).toISOString()
                        : null,
                })
                .eq('ip_address', ipAddress)
                .eq('action_type', actionType);
        } else {
            await supabase
                .from('rate_limit_attempts')
                .insert({
                    ip_address: ipAddress,
                    action_type: actionType,
                    attempt_count: 1,
                });
        }
    } catch (err) {
        console.error('Error recording attempt:', err);
    }
}

export async function resetAttempts(
    ipAddress: string,
    actionType: ActionType
): Promise<void> {
    try {
        await supabase
            .from('rate_limit_attempts')
            .delete()
            .eq('ip_address', ipAddress)
            .eq('action_type', actionType);
    } catch (err) {
        console.error('Error resetting attempts:', err);
    }
}

export function formatTimeRemaining(blockedUntil: Date): string {
    const now = new Date();
    const diff = blockedUntil.getTime() - now.getTime();

    if (diff <= 0) return '0 minutes';

    const minutes = Math.ceil(diff / (60 * 1000));

    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return `${hours}h ${remainingMinutes}min`;
}
