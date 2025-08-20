import { useEffect, useState } from 'react'
import { adminApiClient } from '@/lib/api-client'

interface DashboardAnalytics {
  overview: {
    totalUsers: number
    activeUsers: number
    totalMusic: number
    totalModels: number
    activeModels: number
    totalSubscriptions: number
    newUsersThisWeek: number
    newMusicThisMonth: number
  }
  musicStats: Record<string, number>
  userRoles: Record<string, number>
  dailyActivity: Array<{ _id: string; count: number }>
  planDistribution: Record<string, number>
  topModels: Array<{ name: string; usage: number; successRate: number }>
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await adminApiClient.get<DashboardAnalytics>('/analytics/dashboard')
      
      if (response) {
        // API client returns whole response, data is in response.data or directly in response
        const analyticsData = (response as any).data || response
        setAnalytics(analyticsData)
      } else {
        setAnalytics(null)
      }
    } catch (error) {
      setAnalytics(null)
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

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Unavailable</h2>
          <p className="text-gray-600 mb-4">Failed to load dashboard analytics</p>
          <button 
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const metricCards = [
    {
      title: 'Total Users',
      value: analytics?.overview?.totalUsers || 0,
      subtitle: `${analytics?.overview?.activeUsers || 0} active`,
      trend: `+${analytics?.overview?.newUsersThisWeek || 0} this week`
    },
    {
      title: 'Music Generated',
      value: analytics?.overview?.totalMusic || 0,
      subtitle: 'All time',
      trend: `+${analytics?.overview?.newMusicThisMonth || 0} this month`
    },
    {
      title: 'AI Models',
      value: `${analytics?.overview?.activeModels || 0}/${analytics?.overview?.totalModels || 0}`,
      subtitle: 'Active models',
      trend: 'Live status'
    },
    {
      title: 'Subscriptions',
      value: analytics?.overview?.totalSubscriptions || 0,
      subtitle: 'Total plans',
      trend: 'All time'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to VeeqAI Admin Panel</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((metric) => (
          <div key={metric.title} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{metric.title}</p>
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-500">{metric.subtitle}</p>
              <p className="text-xs text-blue-600">{metric.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity (Last 7 Days)</h3>
          <div className="space-y-3">
            {analytics?.dailyActivity.map((day) => (
              <div key={day._id} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">{day._id}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((day.count / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{day.count}</span>
                </div>
              </div>
            ))}
            {(!analytics?.dailyActivity || analytics.dailyActivity.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No activity data available</p>
            )}
          </div>
        </div>

        {/* Top Models */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top AI Models</h3>
          <div className="space-y-3">
            {analytics?.topModels.map((model, index) => (
              <div key={model.name} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">#{index + 1} {model.name}</span>
                  <p className="text-xs text-gray-500">{model.successRate}% success rate</p>
                </div>
                <span className="text-sm text-blue-600 font-medium">{model.usage} uses</span>
              </div>
            ))}
            {(!analytics?.topModels || analytics.topModels.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No model data available</p>
            )}
          </div>
        </div>

        {/* Music Generation Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Music Generation Status</h3>
          <div className="space-y-3">
            {Object.entries(analytics?.musicStats || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 capitalize">{status}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(analytics?.musicStats || {}).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No music generation data</p>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plans</h3>
          <div className="space-y-3">
            {Object.entries(analytics?.planDistribution || {}).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 capitalize">{plan}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(analytics?.planDistribution || {}).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No subscription data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}