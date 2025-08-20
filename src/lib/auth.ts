import { adminApiClient, SuperAdminApiError } from './api-client'

interface AuthUser {
  id: string
  email: string
  role: string
  name: string
}

interface AuthResponse {
  success: boolean
  user?: AuthUser
  error?: string
}

/**
 * Secure authentication utilities for super admin
 */
export class AuthService {
  private static tokenKey = 'adminToken'
  private static refreshTokenKey = 'adminRefreshToken'
  private static userKey = 'adminUser'

  /**
   * Client-side token expiry validation (like frontend)
   */
  private static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true; // Treat invalid tokens as expired
    }
  }
  
  /**
   * Verify token with backend and get user data
   */
  static async verifyToken(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem(this.tokenKey)
      if (!token) {
        return { success: false, error: 'No token found' }
      }

      // First check if token is expired client-side (like frontend)
      if (this.isTokenExpired(token)) {
        const refreshSuccess = await this.refreshAccessToken()
        if (!refreshSuccess) {
          this.logout()
          return { success: false, error: 'Token expired and refresh failed' }
        }
      }

      // Verify token with backend
      const response = await adminApiClient.get<{success: boolean, user: any}>('/auth/validate')
      
      if (response && response.success && response.user) {
        const user = response.user
        
        // Check if user is super admin
        if (user.role !== 'superadmin') {
          this.logout()
          return { success: false, error: 'Insufficient permissions' }
        }
        
        // Update stored user data
        localStorage.setItem(this.userKey, JSON.stringify(user))
        return { success: true, user }
      }
      
      return { success: false, error: 'Invalid token' }
    } catch (error: any) {
      
      // If it's a SuperAdminApiError with 401, try refresh
      if (error.status === 401) {
        const refreshSuccess = await this.refreshAccessToken()
        if (refreshSuccess) {
          return this.verifyToken()
        } else {
          this.logout()
        }
      }
      
      return { 
        success: false, 
        error: error.message || error.response?.data?.error || 'Token verification failed' 
      }
    }
  }
  
  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await adminApiClient.post<{accessToken: string, refreshToken: string, user: any}>('/login', { email, password })
      
      if (response.accessToken && response.user) {
        const { accessToken, refreshToken, user } = response
        
        // Verify super admin role
        if (user.role !== 'superadmin') {
          return { success: false, error: 'Access denied. Super admin only.' }
        }
        
        // Store tokens securely
        localStorage.setItem(this.tokenKey, accessToken)
        localStorage.setItem(this.refreshTokenKey, refreshToken)
        localStorage.setItem(this.userKey, JSON.stringify(user))
        
        return { success: true, user }
      }
      
      return { success: false, error: 'Invalid response from server' }
    } catch (error: any) {
      
      // Handle SuperAdminApiError
      if (error instanceof SuperAdminApiError) {
        if (error.status === 429) {
          return { 
            success: false, 
            error: 'Too many login attempts. Please wait a few minutes and try again.' 
          }
        }
        
        if (error.status === 401) {
          return { 
            success: false, 
            error: 'Invalid email or password' 
          }
        }
        
        return { 
          success: false, 
          error: error.message || 'Login failed. Please try again.' 
        }
      }
      
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }
    }
  }
  
  /**
   * Logout and clear all stored data
   */
  static logout(): void {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    localStorage.removeItem(this.userKey)
    
    // Optional: Notify backend about logout
    adminApiClient.post('/auth/logout', {}).catch(() => {
      // Ignore errors on logout
    })
  }
  
  /**
   * Get stored user data
   */
  static getUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem(this.userKey)
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }
  
  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey)
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem(this.refreshTokenKey)
      if (!refreshToken) {
        return false
      }

      const response = await adminApiClient.post<{accessToken: string, user: any}>('/auth/refresh', { 
        refreshToken 
      })
      
      if (response.accessToken && response.user) {
        const { accessToken, user } = response
        
        // Verify super admin role
        if (user.role !== 'superadmin') {
          this.logout()
          return false
        }
        
        // Update stored tokens
        localStorage.setItem(this.tokenKey, accessToken)
        localStorage.setItem(this.userKey, JSON.stringify(user))
        
        return true
      }
      
      return false
    } catch (error: any) {
      
      // If refresh fails, user needs to login again
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.logout()
      }
      
      return false
    }
  }
  
  /**
   * Auto-refresh token periodically
   */
  static startTokenRefresh(): void {
    // Verify token every 15 minutes like frontend
    setInterval(async () => {
      if (this.isAuthenticated()) {
        const result = await this.verifyToken()
        if (!result.success) {
          window.location.href = '/login'
        }
      }
    }, 15 * 60 * 1000) // 15 minutes like frontend
  }
}