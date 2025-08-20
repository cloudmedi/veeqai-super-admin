import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AIModels from './pages/AIModels'
import Users from './pages/Users'
import Plans from './pages/Plans'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Music from './pages/Music'
import Voices from './pages/Voices'
import Layout from './components/Layout'
import { AuthService } from './lib/auth'
import { SessionManager } from './lib/security'
import { adminSessionManager } from './lib/session-manager'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Get stored tokens and user data (like frontend)
      const savedToken = localStorage.getItem('adminToken')
      const savedRefreshToken = localStorage.getItem('adminRefreshToken')
      const savedUser = localStorage.getItem('adminUser')
      
      if (savedToken && savedUser) {
        try {
          // Parse saved user
          const userData = JSON.parse(savedUser)
          
          // Verify token with backend (this will auto-refresh if needed)
          const result = await AuthService.verifyToken()
          
          if (result.success && result.user) {
            setIsAuthenticated(true)
            setUser(result.user)
            
            // Start automatic token refresh
            AuthService.startTokenRefresh()
            
            // Start session activity tracking
            SessionManager.startActivityTracking()
            
            // Start admin session management
            adminSessionManager.start()
          } else {
            // Token invalid and refresh failed, clean up
            AuthService.logout()
            setIsAuthenticated(false)
            setUser(null)
          }
        } catch (parseError) {
          AuthService.logout()
          setIsAuthenticated(false)
          setUser(null)
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      AuthService.logout()
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
        } />
        
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" /> : <Register />
        } />
        
        <Route path="/" element={
          isAuthenticated ? <Layout user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} /> : <Navigate to="/login" />
        }>
          <Route index element={<Dashboard />} />
          <Route path="models" element={<AIModels />} />
          <Route path="users" element={<Users />} />
          <Route path="plans" element={<Plans />} />
          <Route path="music" element={<Music />} />
          <Route path="voices" element={<Voices />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App