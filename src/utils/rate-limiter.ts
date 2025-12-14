import { supabase } from '@/lib/supabase';

export type ActionType = 'login' | 'signup' | 'reset_password';

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
    reset_password: {
        maxAttempts: 3,
        blockDuration: 60 * 60 * 1000,
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
        const { data, error } = await supabase.rpc('check_rate_limit', {
            p_ip_address: ipAddress,
            p_action_type: actionType
        });

        if (error) {
            return { allowed: true };
        }

        return {
            allowed: data.allowed,
            remainingAttempts: data.remainingAttempts,
            blockedUntil: data.blockedUntil ? new Date(data.blockedUntil) : undefined,
            resetAt: data.resetAt ? new Date(data.resetAt) : undefined
        };
    } catch (err) {
        return { allowed: true };
    }
}

export async function recordAttempt(
    ipAddress: string,
    actionType: ActionType
): Promise<void> {
    try {
        const { error } = await supabase.rpc('record_rate_limit_attempt', {
            p_ip_address: ipAddress,
            p_action_type: actionType
        });

    } catch (err) {
        console.error('Error recording attempt:', err);
    }
}

export async function resetAttempts(
    ipAddress: string,
    actionType: ActionType
): Promise<void> {
    try {
        const { error } = await supabase.rpc('reset_rate_limit_attempts', {
            p_ip_address: ipAddress,
            p_action_type: actionType
        });

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
