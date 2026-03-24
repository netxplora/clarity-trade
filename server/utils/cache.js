import NodeCache from 'node-cache';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Standard TTL of 5 minutes (300 seconds)
const DEFAULT_TTL = 300; 

class CacheService {
    constructor() {
        this.inMemoryCache = new NodeCache({ stdTTL: DEFAULT_TTL, checkperiod: 60 });
        this.redis = null;
        this.useRedis = false;

        if (process.env.REDIS_URL) {
            try {
                this.redis = new Redis(process.env.REDIS_URL, {
                    maxRetriesPerRequest: 1,
                    connectTimeout: 5000
                });
                this.redis.on('error', (err) => {
                    console.warn('Redis connection disabled, falling back to in-memory cache:', err.message);
                    this.useRedis = false;
                });
                this.redis.on('connect', () => {
                    console.log('Successfully connected to Redis caching layer.');
                    this.useRedis = true;
                });
            } catch (err) {
                console.warn('Failed to initialize Redis:', err.message);
            }
        }
    }

    async get(key) {
        if (this.useRedis) {
            try {
                const val = await this.redis.get(key);
                return val ? JSON.parse(val) : null;
            } catch (err) {
                console.error('Redis GET error:', err);
                return this.inMemoryCache.get(key);
            }
        }
        return this.inMemoryCache.get(key);
    }

    async set(key, value, ttl = DEFAULT_TTL) {
        if (this.useRedis) {
            try {
                await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
            } catch (err) {
                console.error('Redis SET error:', err);
            }
        }
        return this.inMemoryCache.set(key, value, ttl);
    }

    async del(key) {
        if (this.useRedis) {
            try {
                await this.redis.del(key);
            } catch (err) {
                console.error('Redis DEL error:', err);
            }
        }
        return this.inMemoryCache.del(key);
    }

    /**
     * Wrap a function with caching logic
     * @param {string} key 
     * @param {function} fetchFn 
     * @param {number} ttl 
     */
    async wrap(key, fetchFn, ttl = DEFAULT_TTL) {
        const cached = await this.get(key);
        if (cached !== undefined && cached !== null) return cached;

        const fresh = await fetchFn();
        if (fresh !== undefined && fresh !== null) {
            await this.set(key, fresh, ttl);
        }
        return fresh;
    }

    async flush() {
        if (this.useRedis) {
            try {
                await this.redis.flushall();
            } catch (err) {
                console.error('Redis FLUSH error:', err);
            }
        }
        return this.inMemoryCache.flushAll();
    }
}

const cache = new CacheService();
export default cache;
