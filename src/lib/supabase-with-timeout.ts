import { supabase } from './supabase';

const TIMEOUT_MS = 15000;

export function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  return Promise.race<T>([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    ),
  ]);
}

export { supabase };

