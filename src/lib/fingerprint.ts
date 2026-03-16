import crypto from 'crypto'

/**
 * Generate a privacy-respecting browser fingerprint for rate limiting.
 * This fingerprint is:
 * - One-way hashed (cannot be reversed to identify the user)
 * - Based on browser characteristics (not IP address)
 * - Consistent across page reloads for the same browser
 * - Different for different browsers/devices
 * 
 * Note: This is for rate limiting purposes only, not for tracking.
 */
export function generateFingerprint(req: Request): string {
  // Collect browser characteristics
  const userAgent = req.headers.get('user-agent') || ''
  const acceptLanguage = req.headers.get('accept-language') || ''
  const acceptEncoding = req.headers.get('accept-encoding') || ''
  const acceptCharset = req.headers.get('accept-charset') || ''
  
  // Create a fingerprint string from browser characteristics
  // We deliberately don't use IP address for privacy
  const fingerprintString = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${acceptCharset}`
  
  // Create SHA-256 hash and take first 16 characters
  // This is enough for rate limiting while being privacy-friendly
  return crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex')
    .substring(0, 16)
}

/**
 * Generate a fingerprint hash from browser data sent via form/API
 * This is used when the client sends browser info explicitly
 */
export function generateFingerprintFromData(data: {
  userAgent: string
  acceptLanguage?: string
  acceptEncoding?: string
  screenResolution?: string
  timezone?: string
  colorDepth?: number
}): string {
  const fingerprintString = `${data.userAgent}|${data.acceptLanguage || ''}|${data.acceptEncoding || ''}|${data.screenResolution || ''}|${data.timezone || ''}|${data.colorDepth || ''}`
  
  return crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex')
    .substring(0, 16)
}
