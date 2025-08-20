import { useEffect, useState } from 'react'
import { adminSessionManager } from '@/lib/session-manager'

export default function AdminSessionIndicator() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const updateSessionInfo = () => {
      const info = adminSessionManager.getSessionInfo()
      setSessionInfo(info)
      
      // Show indicator when less than 15 minutes remaining
      setShowIndicator(info.isActive && info.timeRemainingMinutes <= 15)
    }

    // Update immediately
    updateSessionInfo()

    // Add listener for session changes
    adminSessionManager.addListener(updateSessionInfo)

    // Update every 30 seconds
    const interval = setInterval(updateSessionInfo, 30000)

    return () => {
      adminSessionManager.removeListener(updateSessionInfo)
      clearInterval(interval)
    }
  }, [])

  if (!showIndicator || !sessionInfo) return null

  const isWarning = sessionInfo.timeRemainingMinutes <= 5
  const isCritical = sessionInfo.timeRemainingMinutes <= 2

  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-sm font-medium ${
      isCritical 
        ? 'bg-red-100 text-red-800 border border-red-300'
        : isWarning
        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        : 'bg-blue-100 text-blue-800 border border-blue-300'
    }`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
        }`}></div>
        <span>
          Admin session: {sessionInfo.timeRemainingMinutes}m remaining
        </span>
      </div>
    </div>
  )
}