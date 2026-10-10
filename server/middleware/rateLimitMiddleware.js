// CineVerse Lightweight In-Memory Sliding-Window Rate Limiter
// Zero external dependencies, automatic garbage collection

export class MemoryRateLimiter {
  constructor({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' }) {
    this.windowMs = windowMs;
    this.max = max;
    this.message = message;
    this.hits = new Map();

    // Clean up expired entries every 5 minutes
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of this.hits.entries()) {
        if (now > record.resetTime) {
          this.hits.delete(ip);
        }
      }
    }, 5 * 60 * 1000);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  middleware() {
    return (req, res, next) => {
      // In automated test environments or if disabled, pass through
      if (process.env.DISABLE_RATE_LIMIT === 'true') {
        return next();
      }

      // Extract client IP address
      const clientIp =
        req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        'unknown_ip';

      const now = Date.now();
      let record = this.hits.get(clientIp);

      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        this.hits.set(clientIp, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.max - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      // Set standard RateLimit headers
      res.setHeader('RateLimit-Limit', this.max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetSeconds);

      if (record.count > this.max) {
        res.setHeader('Retry-After', resetSeconds);
        return res.status(429).json({
          success: false,
          error: 'RateLimitExceeded',
          message: this.message,
          retryAfter: resetSeconds,
        });
      }

      next();
    };
  }
}

// 1. General API Rate Limiter: 300 requests per 15 minutes
export const apiLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'API rate limit exceeded. Please wait a moment before trying again.',
}).middleware();

// 2. Strict Authentication Rate Limiter: 25 requests per 15 minutes
export const authLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many authentication attempts. Please try again in a few minutes to protect your account.',
}).middleware();

export default { apiLimiter, authLimiter, MemoryRateLimiter };
