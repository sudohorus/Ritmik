import { Redis } from '@upstash/redis';

class CacheService {
    private redis: Redis | null = null;
    private isRedisEnabled: boolean = false;

    constructor() {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            try {
                this.redis = new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN,
                });
                this.isRedisEnabled = true;
            } catch (error) {
                console.warn('Failed to initialize Upstash Redis:', error);
            }
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isRedisEnabled || !this.redis) return null;

        try {
            const data = await this.redis.get<T>(key);
            return data;
        } catch (error) {
            console.warn(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
        if (!this.isRedisEnabled || !this.redis) return;

        try {
            await this.redis.set(key, value, { ex: ttlSeconds });
        } catch (error) {
            console.warn(`Cache set error for key ${key}:`, error);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isRedisEnabled || !this.redis) return;

        try {
            await this.redis.del(key);
        } catch (error) {
            console.warn(`Cache del error for key ${key}:`, error);
        }
    }

    async flushPattern(pattern: string): Promise<void> {
        if (!this.isRedisEnabled || !this.redis) return;

        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.warn(`Cache flush error for pattern ${pattern}:`, error);
        }
    }
}

export const cacheService = new CacheService();
