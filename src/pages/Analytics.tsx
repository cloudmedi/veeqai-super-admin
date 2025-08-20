import { useEffect, useState } from 'react'
import { adminApiClient } from '@/lib/api-client'

interface DetailedAnalytics {
  period: string
  userGrowth: Array<{ _id: string; newUsers: number }>
  musicTrends: Array<{ _id: { date: string; status: string }; count: number }>
  modelPerformance: Array<{
    displayName: string
    stats: { totalUsage: number; successRate: number; averageProcessingTime: number }
    performance: { averageLatency: number }
  }>
  roleAnalytics: Array<{ _id: string; count: number; activeCount: number }>
  subscriptionAnalytics: Array<{
    _id: { plan: string; status: string }
    count: number
    totalCredits: number
  }>
  topUsers: Array<{
    userName: string
    userEmail: string
    musicCount: number
    completedCount: number
    successRate: number
  }>
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await adminApiClient.get<DetailedAnalytics>(`/analytics/detailed?period=${period}`)
      setAnalytics(response)
    } catch (error) {
      // Failed to fetch detailed analytics
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">Detailed platform analytics and insights</p>
        </div>
        
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="space-y-2">
            {analytics?.userGrowth.map((day) => (
              <div key={day._id} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{day._id}</span>
                <span className="text-sm font-medium text-gray-900">+{day.newUsers}</span>
              </div>
            ))}
            {(!analytics?.userGrowth || analytics.userGrowth.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No new users in this period</p>
            )}
          </div>
        </div>

        {/* Model Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Performance</h3>
          <div className="space-y-3">
            {analytics?.modelPerformance.map((model) => (
              <div key={model.displayName} className="border-b border-gray-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {model.displayName.replace('Google ', '')}
                  </span>
                  <span className="text-sm text-blue-600">{model.stats?.totalUsage || 0} uses</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    Success: {Math.round(model.stats?.successRate || 100)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    Avg: {Math.round(model.stats?.averageProcessingTime || 0)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Roles */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h3>
          <div className="space-y-3">
            {analytics?.roleAnalytics.map((role) => (
              <div key={role._id} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 capitalize">{role._id}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{role.count}</span>
                  <p className="text-xs text-gray-500">{role.activeCount} active</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Analytics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Overview</h3>
          <div className="space-y-3">
            {analytics?.subscriptionAnalytics.map((sub) => (
              <div key={`${sub._id.plan}-${sub._id.status}`} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">{sub._id.plan}</span>
                  <p className="text-xs text-gray-500 capitalize">{sub._id.status}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{sub.count}</span>
                  <p className="text-xs text-gray-500">{sub.totalCredits} credits</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Active Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-600">User</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Email</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Completed</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.topUsers.map((user) => (
                <tr key={user.userEmail} className="border-b border-gray-100">
                  <td className="py-2 text-sm text-gray-900">{user.userName}</td>
                  <td className="py-2 text-sm text-gray-600">{user.userEmail}</td>
                  <td className="py-2 text-sm text-gray-900 text-right">{user.musicCount}</td>
                  <td className="py-2 text-sm text-gray-900 text-right">{user.completedCount}</td>
                  <td className="py-2 text-sm text-gray-900 text-right">
                    {Math.round(user.successRate)}%
                  </td>
                </tr>
              ))}
              {(!analytics?.topUsers || analytics.topUsers.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                    No user activity in this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Music Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Music Generation Trends</h3>
        <div className="space-y-2">
          {analytics?.musicTrends.map((trend) => (
            <div key={`${trend._id.date}-${trend._id.status}`} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600">
                {trend._id.date} - {trend._id.status}
              </span>
              <span className="text-sm font-medium text-gray-900">{trend.count}</span>
            </div>
          ))}
          {(!analytics?.musicTrends || analytics.musicTrends.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">No music generation activity</p>
          )}
        </div>
      </div>
    </div>
  )
}