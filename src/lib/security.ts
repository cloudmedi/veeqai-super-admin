/**
 * Security utilities and configurations for the super admin panel
 */

/**
 * Content Security Policy for enhanced security
 */
export const getCSPMeta = () => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Vite needs unsafe-inline/eval for dev
    "style-src 'self' 'unsafe-inline'", // Tailwind needs unsafe-inline
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' http://localhost:5000 ws://localhost:5174", // API and WebSocket
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  return csp
}

/**
 * Security headers for the application
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}

/**
 * Input sanitization utility
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate admin email format
 */
export const validateAdminEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Password strength validation
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Rate limiting tracker (client-side)
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get existing attempts for this key
    let keyAttempts = this.attempts.get(key) || []
    
    // Remove attempts outside the window
    keyAttempts = keyAttempts.filter(time => time > windowStart)
    
    // Check if we're over the limit
    if (keyAttempts.length >= maxAttempts) {
      return false
    }
    
    // Add current attempt
    keyAttempts.push(now)
    this.attempts.set(key, keyAttempts)
    
    return true
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

/**
 * Session management utilities
 */
export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private static readonly ACTIVITY_CHECK_INTERVAL = 60 * 1000 // 1 minute
  private static lastActivity = Date.now()
  private static timeoutWarningShown = false
  
  static startActivityTracking(): void {
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const updateActivity = () => {
      this.lastActivity = Date.now()
      this.timeoutWarningShown = false
    }
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })
    
    // Check for session timeout
    setInterval(() => {
      this.checkSessionTimeout()
    }, this.ACTIVITY_CHECK_INTERVAL)
  }
  
  static checkSessionTimeout(): void {
    const now = Date.now()
    const timeSinceActivity = now - this.lastActivity
    const warningTime = this.SESSION_TIMEOUT - (5 * 60 * 1000) // 5 minutes before timeout
    
    if (timeSinceActivity >= this.SESSION_TIMEOUT) {
      // Session expired
      this.handleSessionExpired()
    } else if (timeSinceActivity >= warningTime && !this.timeoutWarningShown) {
      // Show warning
      this.showTimeoutWarning()
      this.timeoutWarningShown = true
    }
  }
  
  static handleSessionExpired(): void {
    alert('Your session has expired due to inactivity. Please log in again.')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    window.location.href = '/login'
  }
  
  static showTimeoutWarning(): void {
    const continueSession = confirm(
      'Your session will expire in 5 minutes due to inactivity. Would you like to continue?'
    )
    
    if (continueSession) {
      this.lastActivity = Date.now()
      this.timeoutWarningShown = false
    }
  }
  
  static extendSession(): void {
    this.lastActivity = Date.now()
    this.timeoutWarningShown = false
  }
}