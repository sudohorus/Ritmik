import { Session } from '@supabase/supabase-js';

export const isSessionValid = (session: Session | null): boolean => {
    if (!session) return false;
    const expiresAt = session.expires_at;
    if (!expiresAt) return false;

    const bufferTime = 60;
    return expiresAt * 1000 > Date.now() + (bufferTime * 1000);
};

export const getAuthErrorMessage = (error: any): string => {
    if (!error) return 'An unknown error occurred';

    const errorMessage = error.message || error.error_description || String(error);

    if (errorMessage.includes('Invalid login credentials')) {
        return 'Email or password is incorrect';
    }

    if (errorMessage.includes('Email not confirmed')) {
        return 'Please confirm your email before logging in';
    }

    if (errorMessage.includes('User already registered')) {
        return 'This email is already registered';
    }

    if (errorMessage.includes('Invalid email')) {
        return 'Invalid email';
    }

    if (errorMessage.includes('Password should be at least')) {
        return 'Password should be at least 6 characters';
    }

    if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
        return 'Connection error. Please check your internet connection and try again';
    }

    if (errorMessage.includes('JWT') || errorMessage.includes('token')) {
        return 'Session expired. Please log in again';
    }

    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Authentication required')) {
        return 'You need to be logged in to access this page';
    }

    return errorMessage;
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        retries?: number;
        delay?: number;
        backoff?: boolean;
    } = {}
): Promise<T> {
    const { retries = 2, delay = 1000, backoff = true } = options;

    let lastError: any;

    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (i < retries) {
                const waitTime = backoff ? delay * Math.pow(2, i) : delay;
                await sleep(waitTime);
            }
        }
    }

    throw lastError;
}
