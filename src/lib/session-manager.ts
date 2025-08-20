/**
 * 🔐 SUPER ADMIN SESSION MANAGEMENT
 * Extended session handling for admin operations
 */

interface AdminSessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  checkIntervalMs: number;
  activityEvents: string[];
}

interface AdminSessionState {
  lastActivity: number;
  isActive: boolean;
  warningShown: boolean;
  timeoutId: NodeJS.Timeout | null;
  warningTimeoutId: NodeJS.Timeout | null;
}

export class AdminSessionManager {
  private static instance: AdminSessionManager;
  private config: AdminSessionConfig;
  private state: AdminSessionState;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.config = {
      timeoutMinutes: 480, // 8 hours for admin (much longer)
      warningMinutes: 30, // 30 minutes warning
      checkIntervalMs: 300000, // Check every 5 minutes (less aggressive)
      activityEvents: [
        'mousedown', 'mousemove', 'keypress', 'scroll', 
        'touchstart', 'click', 'focus', 'blur'
      ]
    };

    this.state = {
      lastActivity: Date.now(),
      isActive: false,
      warningShown: false,
      timeoutId: null,
      warningTimeoutId: null
    };
  }

  static getInstance(): AdminSessionManager {
    if (!AdminSessionManager.instance) {
      AdminSessionManager.instance = new AdminSessionManager();
    }
    return AdminSessionManager.instance;
  }

  /**
   * 🚀 Start admin session management
   */
  start(): void {
    if (this.state.isActive) return;

    this.state.isActive = true;
    this.state.lastActivity = Date.now();

    // Add activity listeners
    this.config.activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity.bind(this), true);
    });

    // Start session monitoring
    this.scheduleTimeouts();
    this.startPeriodicCheck();
  }

  /**
   * 🛑 Stop admin session management
   */
  stop(): void {
    if (!this.state.isActive) return;

    this.state.isActive = false;

    // Remove activity listeners
    this.config.activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleActivity.bind(this), true);
    });

    // Clear timeouts
    this.clearTimeouts();
  }

  /**
   * 📊 Handle admin activity
   */
  private handleActivity(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.state.lastActivity;

    // Throttle activity updates (don't update more than once per second)
    if (timeSinceLastActivity < 1000) return;

    this.state.lastActivity = now;
    this.state.warningShown = false;

    // Reschedule timeouts
    this.scheduleTimeouts();

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * ⏰ Schedule warning and timeout
   */
  private scheduleTimeouts(): void {
    this.clearTimeouts();

    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    const warningMs = (this.config.timeoutMinutes - this.config.warningMinutes) * 60 * 1000;

    // Schedule warning
    this.state.warningTimeoutId = setTimeout(() => {
      this.showTimeoutWarning();
    }, warningMs);

    // Schedule timeout
    this.state.timeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeoutMs);
  }

  /**
   * 🧹 Clear existing timeouts
   */
  private clearTimeouts(): void {
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId);
      this.state.timeoutId = null;
    }
    if (this.state.warningTimeoutId) {
      clearTimeout(this.state.warningTimeoutId);
      this.state.warningTimeoutId = null;
    }
  }

  /**
   * ⚠️ Show admin session timeout warning
   */
  private showTimeoutWarning(): void {
    if (this.state.warningShown) return;
    this.state.warningShown = true;


    const remainingMinutes = this.config.warningMinutes;
    const message = `Your admin session will expire in ${remainingMinutes} minutes due to inactivity. Would you like to continue?`;

    // Show warning dialog
    const continueSession = confirm(message);

    if (continueSession) {
      this.extendSession();
    } else {
      this.handleSessionTimeout();
    }
  }

  /**
   * 🔚 Handle admin session timeout
   */
  private handleSessionTimeout(): void {
    
    this.stop();
    this.clearAdminAuthData();
    
    // Show timeout message
    alert('Your admin session has expired due to inactivity. Please log in again.');
    
    // Redirect to admin login
    window.location.href = '/login';
  }

  /**
   * 🔄 Extend admin session
   */
  extendSession(): void {
    this.state.lastActivity = Date.now();
    this.state.warningShown = false;
    this.scheduleTimeouts();
  }

  /**
   * 🧹 Clear admin authentication data
   */
  private clearAdminAuthData(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }

  /**
   * ⚡ Start periodic session validation
   */
  private startPeriodicCheck(): void {
    setInterval(() => {
      if (!this.state.isActive) return;

      const now = Date.now();
      const timeSinceActivity = now - this.state.lastActivity;
      const timeoutMs = this.config.timeoutMinutes * 60 * 1000;

      // Check if session should have timed out
      if (timeSinceActivity >= timeoutMs) {
        this.handleSessionTimeout();
        return;
      }

      // Validate token with backend every 10 minutes
      if (timeSinceActivity % (10 * 60 * 1000) < this.config.checkIntervalMs) {
        this.validateSessionWithBackend();
      }

    }, this.config.checkIntervalMs);
  }

  /**
   * 🔍 Validate admin session with backend
   */
  private async validateSessionWithBackend(): Promise<void> {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      
      // Use AuthService which handles refresh token logic
      const { AuthService } = await import('./auth');
      const result = await AuthService.verifyToken();
      
    } catch (error) {
      // Don't auto-logout here - let AuthService handle it
    }
  }

  /**
   * 📢 Add session listener
   */
  addListener(callback: () => void): void {
    this.listeners.add(callback);
  }

  /**
   * 🔇 Remove session listener
   */
  removeListener(callback: () => void): void {
    this.listeners.delete(callback);
  }

  /**
   * 📢 Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        // Error in admin session listener
      }
    });
  }

  /**
   * 📊 Get admin session info
   */
  getSessionInfo() {
    const now = Date.now();
    const timeSinceActivity = now - this.state.lastActivity;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    const remainingMs = Math.max(0, timeoutMs - timeSinceActivity);

    return {
      isActive: this.state.isActive,
      lastActivity: new Date(this.state.lastActivity),
      timeRemaining: remainingMs,
      timeRemainingMinutes: Math.floor(remainingMs / 60000),
      warningShown: this.state.warningShown
    };
  }

  /**
   * ⚙️ Update admin configuration
   */
  updateConfig(newConfig: Partial<AdminSessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.state.isActive) {
      this.scheduleTimeouts(); // Reschedule with new config
    }
    
  }
}

// Export singleton instance
export const adminSessionManager = AdminSessionManager.getInstance();