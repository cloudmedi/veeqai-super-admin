/**
 * 🛡️ SUPER ADMIN CSRF PROTECTION
 * Enhanced CSRF protection for admin operations
 */

export class SuperAdminCSRFProtection {
  private static token: string | null = null;
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';
  private static readonly ADMIN_TOKEN_HEADER = 'X-Admin-CSRF-Token';
  private static readonly TOKEN_STORAGE_KEY = 'admin_csrf_token';
  private static readonly TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes for admin

  /**
   * 🔄 Initialize admin CSRF protection
   */
  static async initialize(): Promise<void> {
    try {
      this.token = sessionStorage.getItem(this.TOKEN_STORAGE_KEY);
      
      if (!this.token || this.isTokenExpired()) {
        await this.fetchNewAdminToken();
      }
      
      // Protection initialized
    } catch (error) {
      // Failed to initialize protection
      this.generateSecureToken();
    }
  }

  /**
   * 🆕 Fetch new admin CSRF token
   */
  private static async fetchNewAdminToken(): Promise<void> {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No admin token available');
      }

      const response = await fetch('/api/admin/csrf-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.token);
        // New admin token fetched
      } else {
        throw new Error(`Failed to fetch admin CSRF token: ${response.status}`);
      }
    } catch (error) {
      // Error fetching admin token
      this.generateSecureToken();
    }
  }

  /**
   * 🔐 Generate cryptographically secure token
   */
  private static generateSecureToken(): void {
    try {
      const array = new Uint8Array(48); // 384 bits for admin security
      crypto.getRandomValues(array);
      this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      this.setToken(this.token);
      // Secure token generated
    } catch (error) {
      // Failed to generate secure token
      // Fallback to timestamp-based token
      this.token = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      this.setToken(this.token);
    }
  }

  /**
   * 💾 Set token with timestamp
   */
  private static setToken(token: string): void {
    this.token = token;
    sessionStorage.setItem(this.TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(`${this.TOKEN_STORAGE_KEY}_timestamp`, Date.now().toString());
  }

  /**
   * ⏰ Check if admin token is expired
   */
  private static isTokenExpired(): boolean {
    const tokenTimestamp = sessionStorage.getItem(`${this.TOKEN_STORAGE_KEY}_timestamp`);
    if (!tokenTimestamp) return true;
    
    return Date.now() - parseInt(tokenTimestamp) > this.TOKEN_EXPIRY;
  }

  /**
   * 📋 Get admin CSRF token
   */
  static getToken(): string | null {
    if (!this.token || this.isTokenExpired()) {
      this.generateSecureToken();
    }
    return this.token;
  }

  /**
   * 📤 Get admin CSRF headers
   */
  static getHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) return {};
    
    const adminUser = this.getCurrentAdminUser();
    
    return {
      [this.TOKEN_HEADER]: token,
      [this.ADMIN_TOKEN_HEADER]: token,
      'X-Admin-User': adminUser?.email || 'unknown',
      'X-Admin-Request-Time': new Date().toISOString(),
    };
  }

  /**
   * 👤 Get current admin user
   */
  private static getCurrentAdminUser(): any {
    try {
      const userData = localStorage.getItem('adminUser');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * ✅ Validate admin CSRF token
   */
  static validateAdminToken(requestToken: string): boolean {
    const currentToken = this.getToken();
    if (!currentToken || !requestToken) return false;
    
    // Use constant-time comparison to prevent timing attacks
    return this.constantTimeEqual(currentToken, requestToken);
  }

  /**
   * 🔍 Constant-time string comparison
   */
  private static constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * 🧹 Clear admin CSRF token
   */
  static clearToken(): void {
    this.token = null;
    sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(`${this.TOKEN_STORAGE_KEY}_timestamp`);
    // Token cleared
  }

  /**
   * 🔄 Force refresh admin token
   */
  static async refreshAdminToken(): Promise<void> {
    this.clearToken();
    await this.fetchNewAdminToken();
  }

  /**
   * 📝 Add CSRF token to admin form
   */
  static addTokenToAdminForm(form: HTMLFormElement): void {
    const token = this.getToken();
    if (!token) return;

    // Remove existing CSRF inputs
    const existingInputs = form.querySelectorAll('input[name="csrf_token"], input[name="admin_csrf_token"]');
    existingInputs.forEach(input => input.remove());

    // Add admin CSRF input
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'admin_csrf_token';
    csrfInput.value = token;
    form.appendChild(csrfInput);

    // Add user verification
    const adminUser = this.getCurrentAdminUser();
    if (adminUser) {
      const userInput = document.createElement('input');
      userInput.type = 'hidden';
      userInput.name = 'admin_user_verification';
      userInput.value = btoa(adminUser.email); // Base64 encode for basic obfuscation
      form.appendChild(userInput);
    }
  }

  /**
   * 🔍 Setup admin form protection
   */
  static setupAdminFormProtection(): void {
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (form && form.method.toLowerCase() === 'post') {
        // Check if it's an admin form (has admin-related classes or data attributes)
        if (form.classList.contains('admin-form') || 
            form.hasAttribute('data-admin-form') || 
            form.closest('.admin-panel')) {
          this.addTokenToAdminForm(form);
        }
      }
    });

    // Admin form protection setup complete
  }

  /**
   * 🌐 Enhance admin fetch with CSRF
   */
  static enhanceAdminFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Add CSRF token to admin API requests
      if (url.includes('/api/admin') && init?.method && 
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init.method.toUpperCase())) {
        
        init.headers = {
          ...init.headers,
          ...this.getHeaders()
        };
        
        // Token added to admin request
      }
      
      return originalFetch(input, init);
    };

    // Admin fetch enhanced
  }

  /**
   * 🚨 Detect potential CSRF attacks
   */
  static detectCSRFAttack(request: any): boolean {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      !request.headers?.['X-Requested-With'], // Missing AJAX header
      !request.headers?.['Content-Type']?.includes('application/json'), // Wrong content type
      request.headers?.['Origin'] !== window.location.origin, // Wrong origin
      !this.validateAdminToken(request.headers?.[this.ADMIN_TOKEN_HEADER]) // Invalid CSRF token
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern);
    
    if (isSuspicious) {
      // Potential CSRF attack detected
      
      // Log security event
      this.logSecurityEvent('csrf_attack_detected', {
        url: request.url,
        method: request.method,
        origin: request.headers?.['Origin'],
        hasCSRFToken: !!request.headers?.[this.ADMIN_TOKEN_HEADER]
      });
    }
    
    return isSuspicious;
  }

  /**
   * 📊 Log security event
   */
  private static logSecurityEvent(type: string, details: any): void {
    const event = {
      timestamp: Date.now(),
      type,
      severity: 'high',
      details,
      adminUser: this.getCurrentAdminUser()?.email,
      sessionId: sessionStorage.getItem('admin_session_id')
    };
    
    // Security event logged
    
    // In production, send to security monitoring endpoint
    // fetch('/api/security/events', { method: 'POST', body: JSON.stringify(event) });
  }

  /**
   * 📊 Get admin CSRF status
   */
  static getAdminStatus() {
    return {
      hasToken: !!this.token,
      tokenPreview: this.token ? `${this.token.substring(0, 12)}...` : null,
      isExpired: this.isTokenExpired(),
      timestamp: sessionStorage.getItem(`${this.TOKEN_STORAGE_KEY}_timestamp`),
      adminUser: this.getCurrentAdminUser()?.email,
      expiryTime: this.TOKEN_EXPIRY / 1000 / 60 // minutes
    };
  }

  /**
   * 🔧 Configure admin CSRF settings
   */
  static configure(options: { expiry?: number; autoRefresh?: boolean }): void {
    if (options.expiry) {
      (this as any).TOKEN_EXPIRY = options.expiry;
    }
    
    if (options.autoRefresh) {
      // Setup auto-refresh before expiry
      setInterval(() => {
        if (this.isTokenExpired()) {
          this.refreshAdminToken();
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
    }
    
    // Configuration updated
  }
}

// Auto-initialize for admin panel
if (typeof window !== 'undefined' && window.location.pathname.includes('admin')) {
  SuperAdminCSRFProtection.initialize();
  SuperAdminCSRFProtection.setupAdminFormProtection();
  SuperAdminCSRFProtection.enhanceAdminFetch();
}