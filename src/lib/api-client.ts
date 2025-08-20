/**
 * 🔒 SUPER ADMIN API CLIENT
 * Enterprise-grade API client with advanced security features
 */

import { SuperAdminCSRFProtection } from './csrf-protection';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    status: number;
    timestamp: string;
    details?: any;
  };
}

class SuperAdminApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'SuperAdminApiError';
  }
}

export class SuperAdminApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private enableLogging: boolean;
  private refreshTokenPromise: Promise<boolean> | null = null;
  private requestCount: number = 0;
  private lastActivity: number = Date.now();

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : 'http://localhost:5000/api'; // Admin-specific base URL
    this.timeout = 15000; // Longer timeout for admin operations
    this.enableLogging = import.meta.env.DEV; // Enable logging in development
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Client-Type': 'super-admin',
      'X-Client-Version': '1.0.0',
    };

    // Track API usage for monitoring
    this.startActivityTracking();
  }

  /**
   * 📊 Track API activity for security monitoring
   */
  private startActivityTracking(): void {
    setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - this.lastActivity;
      
      // Log suspicious activity (high request rate)
      if (this.requestCount > 100) { // More than 100 requests per minute
        this.secureLog('warn', 'High API request rate detected', { 
          requestCount: this.requestCount,
          timeSince: timeSinceLastActivity 
        });
      }
      
      // Reset counters
      this.requestCount = 0;
    }, 60000); // Every minute
  }

  /**
   * 🔒 Secure logging with admin context
   */
  private secureLog(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.enableLogging) return;

    const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
    const timestamp = new Date().toISOString();
    const user = this.getCurrentUser();
    
    const logEntry = {
      timestamp,
      level,
      message,
      user: user?.email || 'unknown',
      userRole: user?.role || 'unknown',
      data: sanitizedData
    };
    
    // Logs removed
  }

  /**
   * 🧹 Sanitize sensitive data from logs
   */
  private sanitizeLogData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;
    
    const sensitiveKeys = [
      'token', 'password', 'authorization', 'auth', 'secret', 'key',
      'adminToken', 'refreshToken', 'sessionId', 'apiKey'
    ];
    
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * 👤 Get current admin user
   */
  private getCurrentUser(): any {
    try {
      const userData = localStorage.getItem('adminUser');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * 🎫 Get admin auth token
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  /**
   * 🔄 Refresh admin token (if needed in future)
   */
  private async refreshAdminToken(): Promise<boolean> {
    // For now, admin tokens don't have refresh mechanism
    // This would be implemented when refresh tokens are added
    return false;
  }

  /**
   * 📋 Get auth headers with admin context
   */
  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    const user = this.getCurrentUser();
    
    return {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(user && { 'X-Admin-User': user.email }),
      'X-Request-ID': this.generateRequestId(),
      'X-Request-Time': new Date().toISOString(),
    };
  }

  /**
   * 🆔 Generate unique request ID for tracing
   */
  private generateRequestId(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 🌐 Build full URL for admin endpoints
   */
  private buildURL(endpoint: string): string {
    // Don't modify endpoints that already have paths like /voices/admin/
    if (endpoint.includes('/admin/') || endpoint.startsWith('/admin') || endpoint.startsWith('/auth') || endpoint.startsWith('/voices')) {
      return `${this.baseURL}${endpoint}`;
    }
    // Only add /admin for simple endpoints
    endpoint = `/admin${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * 🔍 Handle API response with admin-specific error handling
   */
  private async handleResponse<T>(response: Response, originalRequest?: () => Promise<Response>): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const requestId = response.headers.get('X-Request-ID');

    let data: any;
    
    try {
      data = isJson ? await response.json() : { 
        success: false, 
        error: { 
          message: await response.text(), 
          code: 'NON_JSON_RESPONSE', 
          status: response.status, 
          timestamp: new Date().toISOString() 
        } 
      };
    } catch (parseError) {
      this.secureLog('error', 'Failed to parse admin API response', { parseError, requestId });
      throw new SuperAdminApiError('Failed to parse response', 'PARSE_ERROR', response.status);
    }

    if (!response.ok) {
      const error = data.error || { 
        message: data.message || 'Request failed', 
        code: data.code || 'REQUEST_FAILED', 
        status: response.status,
        timestamp: new Date().toISOString()
      };
      
      // Handle admin-specific errors
      if (error.status === 401) {
        this.secureLog('warn', 'Admin authentication failed', { error, requestId });
        // Don't auto-logout here - let AuthService handle refresh token logic
        // The auth layer will handle token refresh and retry
      }
      
      if (error.status === 403) {
        this.secureLog('error', 'Admin access forbidden', { error, requestId });
      }
      
      if (error.status === 429) {
        this.secureLog('warn', 'Admin rate limit exceeded', { error, requestId });
      }
      
      this.secureLog('error', `Admin API Error: ${error.status} ${error.code}`, { error, requestId });
      throw new SuperAdminApiError(error.message, error.code, error.status, error.details);
    }

    // Handle different response formats
    if (data.success !== undefined) {
      // For responses with success field, return the whole data object
      return data;
    }
    
    // Handle direct data responses (like admin login)
    if (data.token || data.user || data.accessToken) {
      return data;
    }

    return data;
  }

  /**
   * 🌐 Generic request method with admin security features
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildURL(endpoint);
    this.requestCount++;
    this.lastActivity = Date.now();
    
    const makeRequest = () => {
      const headers = {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...SuperAdminCSRFProtection.getHeaders(), // Add CSRF protection
        ...options.headers,
      };

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      return fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'same-origin', // Security: Prevent cross-origin credentials
      }).then(response => {
        clearTimeout(timeoutId);
        return response;
      });
    };

    const method = options.method || 'GET';
    const requestId = this.generateRequestId();
    
    this.secureLog('info', `Admin API ${method} ${endpoint}`, { requestId });

    try {
      const response = await makeRequest();
      return await this.handleResponse<T>(response, makeRequest);
    } catch (error) {
      if (error instanceof SuperAdminApiError) {
        throw error;
      }

      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        this.secureLog('error', 'Admin API request timeout', { endpoint, requestId });
        throw new SuperAdminApiError('Request timeout', 'TIMEOUT_ERROR', 408);
      }
      
      this.secureLog('error', 'Admin API network error', { 
        endpoint, 
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId 
      });
      throw new SuperAdminApiError('Network request failed', 'NETWORK_ERROR', 0);
    }
  }

  /**
   * 📥 GET request for admin operations
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * 📤 POST request for admin operations
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 🔄 PUT request for admin operations
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 🗑️ DELETE request for admin operations
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * 📁 PUT request for file uploads (update with files)
   */
  async putFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getAuthToken();
    const requestId = this.generateRequestId();
    
    const headers: Record<string, string> = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      'X-Request-ID': requestId,
      'X-Request-Time': new Date().toISOString(),
    };
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    
    const url = this.buildURL(endpoint);
    
    this.secureLog('info', 'PUT File Request', {
      url,
      requestId,
      hasFiles: formData.has('file') || formData.has('audioFile') || formData.has('artworkFile')
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const csrfToken = await SuperAdminCSRFProtection.getToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: formData,
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      // Log error
      console.error('Request error:', error);
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * 📁 POST request for file uploads
   */
  async postFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getAuthToken();
    const requestId = this.generateRequestId();
    
    const headers: Record<string, string> = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      'X-Request-ID': requestId,
      'X-Request-Time': new Date().toISOString(),
    };
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    
    const url = this.buildURL(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new SuperAdminApiError('Request timeout', 'TIMEOUT_ERROR', 408);
      }
      throw new SuperAdminApiError('File upload failed', 'UPLOAD_ERROR', 0);
    }
  }

  /**
   * 📊 Get API usage statistics
   */
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      lastActivity: this.lastActivity,
      uptime: Date.now() - this.lastActivity
    };
  }
}

// Export singleton instance for admin operations
export const adminApiClient = new SuperAdminApiClient();
export { SuperAdminApiError };

// Export typed admin service methods
export const adminAPI = {
  // Authentication
  login: (email: string, password: string) => 
    adminApiClient.post<{token: string, user: any}>('/login', { email, password }),
  
  // User management
  getUsers: (page?: number, limit?: number) => 
    adminApiClient.get<{users: any[], total: number}>('/users', { page, limit }),
  deleteUser: (id: string) => 
    adminApiClient.delete<{success: boolean}>(`/users/${id}`),
  
  // AI Models
  getModels: () => 
    adminApiClient.get<any[]>('/models'),
  createModel: (data: any) => 
    adminApiClient.post<any>('/models', data),
  deleteModel: (id: string) => 
    adminApiClient.delete<{success: boolean}>(`/models/${id}`),
  
  // Music management
  getMyMusic: (page?: number, limit?: number) => 
    adminApiClient.get<{data: any[], pagination: any}>('/music/my-music', { page, limit }),
  deleteMusic: (id: string) => 
    adminApiClient.delete<{success: boolean}>(`/music/${id}`),
  
  // Analytics
  getAnalytics: (period?: string) => 
    adminApiClient.get<any>('/analytics', { period }),
};