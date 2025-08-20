/**
 * 🔒 SUPER ADMIN SECURITY VALIDATION
 * Enterprise-grade input validation and sanitization
 */

interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SuperAdminValidator {
  private static passwordRequirements: PasswordRequirements = {
    minLength: 14, // Even stronger than main app
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  };

  /**
   * 🛡️ Advanced XSS prevention
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>'"&]/g, '') // Extended XSS prevention
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript
      .replace(/expression\(/gi, ''); // Remove CSS expressions
  }

  /**
   * 🔐 Super Admin Email Validation (stricter)
   */
  static validateAdminEmail(email: string): string {
    const sanitized = this.sanitizeInput(email);
    
    if (!sanitized) {
      throw new ValidationError('Email is required', 'email');
    }

    if (sanitized.length > 100) { // Stricter limit for admins
      throw new ValidationError('Email is too long', 'email');
    }

    // More restrictive regex for admin emails
    const adminEmailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,4}$/;
    if (!adminEmailRegex.test(sanitized)) {
      throw new ValidationError('Invalid admin email format', 'email');
    }

    // Blacklist common domains for admin accounts
    const blacklistedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = sanitized.split('@')[1];
    if (blacklistedDomains.includes(domain)) {
      throw new ValidationError('Personal email domains not allowed for admin accounts', 'email');
    }

    return sanitized.toLowerCase();
  }

  /**
   * 🔒 Super Strong Password Validation
   */
  static validateSuperAdminPassword(password: string): string {
    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required', 'password');
    }

    const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = this.passwordRequirements;

    if (password.length < minLength) {
      throw new ValidationError(`Super admin password must be at least ${minLength} characters long`, 'password');
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter', 'password');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter', 'password');
    }

    if (requireNumbers && !/\d/.test(password)) {
      throw new ValidationError('Password must contain at least one number', 'password');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ValidationError('Password must contain at least one special character', 'password');
    }

    // Advanced weak pattern detection
    const weakPatterns = [
      /(.)\1{2,}/, // Repeated characters (aaa, 111)
      /123456|password|qwerty|admin|superadmin|root/i, // Common passwords
      /^[a-z]+$/i, // Only letters
      /^\d+$/, // Only numbers
      /^[!@#$%^&*(),.?":{}|<>]+$/, // Only special chars
      /(abc|def|ghi|jkl|mno|pqr|stu|vwx)/i, // Sequential patterns
      /\b(password|admin|user|login|system)\b/i, // Common words
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        throw new ValidationError('Password contains common patterns. Please choose a more complex password.', 'password');
      }
    }

    // Check entropy (complexity)
    const entropy = this.calculatePasswordEntropy(password);
    if (entropy < 50) {
      throw new ValidationError('Password is not complex enough. Use a mix of different character types.', 'password');
    }

    return password;
  }

  /**
   * 📊 Calculate password entropy
   */
  static calculatePasswordEntropy(password: string): number {
    let charSetSize = 0;
    
    if (/[a-z]/.test(password)) charSetSize += 26;
    if (/[A-Z]/.test(password)) charSetSize += 26;
    if (/\d/.test(password)) charSetSize += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) charSetSize += 32;
    
    return password.length * Math.log2(charSetSize);
  }

  /**
   * 🏷️ Validate and sanitize admin name
   */
  static validateAdminName(name: string): string {
    const sanitized = this.sanitizeInput(name);
    
    if (!sanitized) {
      throw new ValidationError('Name is required', 'name');
    }

    if (sanitized.length < 2) {
      throw new ValidationError('Name must be at least 2 characters long', 'name');
    }

    if (sanitized.length > 30) { // Stricter for admin
      throw new ValidationError('Name is too long', 'name');
    }

    // Only allow letters, spaces, hyphens (no apostrophes for security)
    const nameRegex = /^[a-zA-Z\s\-]+$/;
    if (!nameRegex.test(sanitized)) {
      throw new ValidationError('Name contains invalid characters', 'name');
    }

    return sanitized;
  }

  /**
   * 🔢 Validate admin action inputs
   */
  static validateAdminAction(action: string): string {
    const sanitized = this.sanitizeInput(action);
    
    if (!sanitized) {
      throw new ValidationError('Action is required', 'action');
    }

    // Whitelist allowed admin actions
    const allowedActions = [
      'create_user', 'delete_user', 'update_user', 'view_user',
      'create_model', 'delete_model', 'update_model', 'test_model',
      'create_plan', 'delete_plan', 'update_plan',
      'generate_music', 'delete_music', 'feature_music',
      'view_analytics', 'export_data', 'system_settings'
    ];

    if (!allowedActions.includes(sanitized)) {
      throw new ValidationError('Invalid admin action', 'action');
    }

    return sanitized;
  }

  /**
   * 🔍 Advanced SQL injection prevention
   */
  static sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') return '';
    
    return query
      .trim()
      .replace(/['"`;\\]/g, '') // Remove SQL injection chars
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|OR|AND)\b/gi, '') // Remove SQL keywords
      .slice(0, 100); // Limit length
  }

  /**
   * 📧 Validate file upload (admin context)
   */
  static validateAdminFileUpload(file: File): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB for admin uploads

    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('Only JPEG, PNG, and WebP images are allowed', 'file');
    }

    if (file.size > maxSize) {
      throw new ValidationError('File size must be less than 2MB', 'file');
    }

    // Check for malicious file names
    if (/[<>:"/\\|?*]/.test(file.name)) {
      throw new ValidationError('File name contains invalid characters', 'file');
    }
  }

  /**
   * 🎯 Get password strength score (0-5 for super admin)
   */
  static getPasswordStrength(password: string): number {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++; // Extra point for super long
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    // Bonus for high entropy
    const entropy = this.calculatePasswordEntropy(password);
    if (entropy >= 60) score++;
    
    return Math.min(score, 5);
  }

  /**
   * 📊 Get password strength text (enhanced for super admin)
   */
  static getPasswordStrengthText(score: number): string {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Super Strong'];
    return texts[score] || 'Very Weak';
  }

  /**
   * 🔐 Validate session timeout value
   */
  static validateSessionTimeout(minutes: number): number {
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) {
      throw new ValidationError('Session timeout must be between 5 and 480 minutes', 'sessionTimeout');
    }
    return minutes;
  }
}

export { ValidationError };