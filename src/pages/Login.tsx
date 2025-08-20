import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthService } from '@/lib/auth'
import { SessionManager, rateLimiter } from '@/lib/security'
import { SuperAdminValidator, ValidationError } from '@/lib/validation'
import Logo from '@/components/Logo'

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void
  setUser: (user: any) => void
}

export default function Login({ setIsAuthenticated, setUser }: LoginProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate email format with advanced admin validation
    try {
      SuperAdminValidator.validateAdminEmail(email)
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        setError(validationError.message)
      } else {
        setError('Please enter a valid admin email address')
      }
      setLoading(false)
      return
    }

    // Rate limiting check
    const clientIP = 'local' // In production, use actual IP
    if (!rateLimiter.isAllowed(`login_${clientIP}`, 5, 15 * 60 * 1000)) {
      setError('Too many login attempts. Please try again in 15 minutes.')
      setLoading(false)
      return
    }

    try {
      const result = await AuthService.login(email, password)
      
      if (result.success && result.user) {
        // Reset rate limiter on successful login
        rateLimiter.reset(`login_${clientIP}`)
        
        setIsAuthenticated(true)
        setUser(result.user)
        
        // Start automatic token refresh
        AuthService.startTokenRefresh()
        
        // Start session activity tracking
        SessionManager.startActivityTracking()
        
        navigate('/')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err: any) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo 
              variant="black" 
              width={120} 
              height={40} 
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Admin Panel
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Super Admin Access Only
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-10 shadow-lg rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Need to create a super admin? Register here
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}