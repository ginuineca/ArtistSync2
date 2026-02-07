import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Initialize Redis client only in production
let store;
if (process.env.NODE_ENV === 'production') {
    const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    store = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    });
}

// Create rate limiter
export const loginLimiter = rateLimit({
    store: process.env.NODE_ENV === 'production' ? store : undefined,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'test' ? 100 : 5, // Higher limit for tests
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    }
});

// Rate limiter for general API endpoints
export const apiLimiter = rateLimit({
    store: process.env.NODE_ENV === 'production' ? store : undefined,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'test' ? 1000 : 100 // Higher limit for tests
});

// Profile update rate limiter
export const profileLimiter = rateLimit({
    store: process.env.NODE_ENV === 'production' ? store : undefined,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 profile updates per 15 minutes
    message: {
        success: false,
        message: 'Too many profile updates. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
