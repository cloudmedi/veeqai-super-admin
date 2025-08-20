import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Users, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'
import api from '@/lib/axios'

interface UsageModalModalProps {
  isOpen: boolean
  onClose: () => void
  model: any
}

interface UsageStats {
  totalUsage: number
  monthlyUsage: number
  weeklyUsage: number
  dailyUsage: number
  successRate: number
  totalRevenue: number
  monthlyRevenue: number
  averageLatency: number
  activeUsers: number
  recentGenerations: Array<{
    date: string
    count: number
    revenue: number
  }>
}

export default function UsageModalModal({ isOpen, onClose, model }: UsageModalModalProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    if (isOpen && model) {
      fetchUsageStats()
    }
  }, [isOpen, model, timeRange])

  const fetchUsageStats = async () => {
    if (!model) return
    
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('adminToken')
      
      // TODO: Backend'de gerçek usage endpoint'i yapılacak
      // Şimdilik mock data kullanıyoruz
      setTimeout(() => {
        setStats({
          totalUsage: model.stats?.totalUsage || 0,
          monthlyUsage: model.stats?.monthlyUsage || 0,
          weeklyUsage: Math.floor((model.stats?.monthlyUsage || 0) / 4),
          dailyUsage: Math.floor((model.stats?.monthlyUsage || 0) / 30),
          successRate: model.stats?.successRate || 95,
          totalRevenue: (model.stats?.totalUsage || 0) * (model.pricing?.userPrice || 0),
          monthlyRevenue: (model.stats?.monthlyUsage || 0) * (model.pricing?.userPrice || 0),
          averageLatency: model.performance?.averageLatency || 20000,
          activeUsers: Math.floor((model.stats?.monthlyUsage || 0) / 10),
          recentGenerations: [
            { date: '2024-01-15', count: 45, revenue: 0.45 },
            { date: '2024-01-14', count: 32, revenue: 0.32 },
            { date: '2024-01-13', count: 67, revenue: 0.67 },
            { date: '2024-01-12', count: 23, revenue: 0.23 },
            { date: '2024-01-11', count: 89, revenue: 0.89 },
            { date: '2024-01-10', count: 54, revenue: 0.54 },
            { date: '2024-01-09', count: 76, revenue: 0.76 }
          ]
        })
        setLoading(false)
      }, 1000)

    } catch (error: any) {
      setError('Usage verileri yüklenemedi')
      setLoading(false)
    }
  }

  if (!model) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Usage Analytics - ${model.displayName}`}
      size="xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading usage analytics...</span>
          </div>
        ) : stats && (
          <>
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Time Range:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Total Usage</h3>
                </div>
                <div className="text-2xl font-bold text-blue-700">{stats.totalUsage.toLocaleString()}</div>
                <div className="text-sm text-blue-600">generations</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Monthly</h3>
                </div>
                <div className="text-2xl font-bold text-green-700">{stats.monthlyUsage.toLocaleString()}</div>
                <div className="text-sm text-green-600">this month</div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Success Rate</h3>
                </div>
                <div className="text-2xl font-bold text-purple-700">{stats.successRate}%</div>
                <div className="text-sm text-purple-600">success</div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">Revenue</h3>
                </div>
                <div className="text-2xl font-bold text-yellow-700">${stats.totalRevenue.toFixed(2)}</div>
                <div className="text-sm text-yellow-600">total</div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Latency</span>
                    <span className="font-medium">{(stats.averageLatency / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-medium text-green-600">{stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failure Rate</span>
                    <span className="font-medium text-red-600">{(100 - stats.successRate)}%</span>
                  </div>
                </div>
              </div>

              {/* Usage Breakdown */}
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usage Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Average</span>
                    <span className="font-medium">{stats.dailyUsage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weekly Total</span>
                    <span className="font-medium">{stats.weeklyUsage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Users</span>
                    <span className="font-medium">{stats.activeUsers}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Details */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Analytics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Monthly Revenue</div>
                  <div className="text-xl font-bold text-blue-600">${stats.monthlyRevenue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Price per Generation</div>
                  <div className="text-xl font-bold text-purple-600">${model.pricing?.userPrice?.toFixed(4) || '0.00'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Avg Revenue/User</div>
                  <div className="text-xl font-bold text-orange-600">
                    ${stats.activeUsers > 0 ? (stats.totalRevenue / stats.activeUsers).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Daily Activity</h3>
              <div className="space-y-2">
                {stats.recentGenerations.map((day, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="text-sm text-gray-600">{day.date}</div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">{day.count} generations</div>
                      <div className="text-sm text-green-600 font-medium">${day.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}