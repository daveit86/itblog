import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'

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

// Get client IP from request
export function getClientIp(request: Request): string {
  // Try to get IP from headers (works with proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // Fallback to a default (in production, you'd want better IP detection)
  return 'unknown'
}
