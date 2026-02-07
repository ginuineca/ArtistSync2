// Simple in-memory cache service
// In production, replace with Redis or similar

const cache = new Map();

const cacheService = {
    get: (key) => {
        const item = cache.get(key);
        if (item && item.expiresAt > Date.now()) {
            return item.value;
        }
        if (item) {
            cache.delete(key);
        }
        return null;
    },

    set: (key, value, ttl = 3600) => {
        cache.set(key, {
            value,
            expiresAt: Date.now() + (ttl * 1000)
        });
    },

    delete: (key) => {
        cache.delete(key);
    },

    clear: () => {
        cache.clear();
    },

    // Cleanup expired entries
    cleanup: () => {
        const now = Date.now();
        for (const [key, item] of cache.entries()) {
            if (item.expiresAt <= now) {
                cache.delete(key);
            }
        }
    }
};

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cacheService.cleanup, 5 * 60 * 1000);
}

export const closeRedisConnections = async () => {
    // In production with Redis, close connections here
    cache.clear();
};

export default cacheService;
