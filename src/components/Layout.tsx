import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Bot, 
  Users, 
  CreditCard, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Music,
  Mic
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AuthService } from '@/lib/auth'
import { adminSessionManager } from '@/lib/session-manager'
import AdminSessionIndicator from './AdminSessionIndicator'
import Logo from './Logo'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'AI Models', href: '/models', icon: Bot },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Plans', href: '/plans', icon: CreditCard },
  { name: 'Featured Music', href: '/music', icon: Music },
  { name: 'Voice Models', href: '/voices', icon: Mic },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface LayoutProps {
  user: any
  setIsAuthenticated: (value: boolean) => void
  setUser: (user: any) => void
}

export default function Layout({ user, setIsAuthenticated, setUser }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const handleLogout = () => {
    // Stop admin session management
    adminSessionManager.stop()
    
    // Clear auth
    AuthService.logout()
    setIsAuthenticated(false)
    setUser(null)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Session Indicator */}
      <AdminSessionIndicator />
      
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-gray-200 px-4">
            <div className="flex items-center gap-3">
              <Logo 
                variant="black" 
                width={105} 
                height={35} 
              />
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-600 font-medium">
                admin
              </span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}