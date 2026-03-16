import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'

/**
 * ⚠️ SECURITY WARNING FOR SERVERLESS ENVIRONMENTS (Vercel, AWS Lambda, etc.):
 * 
 * RateLimiterMemory stores limits in process memory. In serverless environments,
 * each function invocation may run on a different instance, causing rate limits
 * to reset frequently. For production, consider using:
 * 
 * 1. Redis-based rate limiting (rate-limiter-flexible with ioredis)
 * 2. Vercel Edge Config for distributed rate limiting
 * 3. Upstash Redis (serverless-friendly)
 * 
 * Example with Redis:
 * import { RateLimiterRedis } from 'rate-limiter-flexible'
 * import Redis from 'ioredis'
 * 
 * const redisClient = new Redis(process.env.REDIS_URL)
 * export const loginLimiter = new RateLimiterRedis({
 *   storeClient: redisClient,
 *   keyPrefix: 'login',
 *   points: 5,
 *   duration: 15 * 60,
 * })
 */

// Login attempts: 5 per 15 minutes per IP
export const loginLimiter = new RateLimiterMemory({
  keyPrefix: 'login',
  points: 5,
  duration: 15 * 60, // 15 minutes
})

// Comment submissions: 3 per hour per IP
export const commentLimiter = new RateLimiterMemory({
  keyPrefix: 'comment',
  points: 3,
  duration: 60 * 60, // 1 hour
})

// Anonymous comments: 3 per hour per fingerprint
export const anonymousCommentLimiter = new RateLimiterMemory({
  keyPrefix: 'anon_comment',
  points: 3,
  duration: 60 * 60, // 1 hour
})

// Logged-in user comments: 10 per hour per user
export const loggedInCommentLimiter = new RateLimiterMemory({
  keyPrefix: 'user_comment',
  points: 10,
  duration: 60 * 60, // 1 hour
})

// File uploads: 10 per hour per user/IP
export const uploadLimiter = new RateLimiterMemory({
  keyPrefix: 'upload',
  points: 10,
  duration: 60 * 60, // 1 hour
})

// General API: 100 per minute per IP
export const apiLimiter = new RateLimiterMemory({
  keyPrefix: 'api',
  points: 100,
  duration: 60, // 1 minute
})

// Admin actions: 50 per minute per admin
export const adminLimiter = new RateLimiterMemory({
  keyPrefix: 'admin',
  points: 50,
  duration: 60, // 1 minute
})

// Comment likes: 10 per minute per user
export const likeLimiter = new RateLimiterMemory({
  keyPrefix: 'like',
  points: 10,
  duration: 60, // 1 minute
})

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime?: Date
  msBeforeNext?: number
}

export async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<RateLimitResult> {
  try {
    const res = await limiter.consume(key)
    return {
      success: true,
      limit: limiter.points,
      remaining: res.remainingPoints,
      resetTime: new Date(Date.now() + res.msBeforeNext),
      msBeforeNext: res.msBeforeNext,
    }
  } catch (rejRes) {
    if (rejRes instanceof RateLimiterRes) {
      return {
        success: false,
        limit: limiter.points,
        remaining: 0,
        resetTime: new Date(Date.now() + rejRes.msBeforeNext),
        msBeforeNext: rejRes.msBeforeNext,
      }
    }
    throw rejRes
  }
}

// Get client IP from request with proxy awareness
export function getClientIp(request: Request): string {
  // In production with Vercel, use the x-vercel-forwarded-for header
  // which is more trustworthy as it's set by Vercel's edge network
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwarded) {
    return vercelForwarded.split(',')[0].trim()
  }
  
  // Fallback to standard headers (may be spoofed if not behind a trusted proxy)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // Last resort fallback
  return 'unknown'
}
