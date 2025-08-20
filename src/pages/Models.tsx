import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Play, Pause, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'

interface AIModel {
  _id: string
  name: string
  displayName: string
  type: string
  provider: {
    name: string
    modelId: string
  }
  status: string
  pricing: {
    userPrice: number
    currency: string
    model: string
  }
  stats: {
    totalUsage: number
    monthlyUsage: number
    successRate: number
  }
  capabilities: {
    languages: Array<{
      code: string
      name: string
    }>
    voices: Array<{
      name: string
      gender: string
    }>
  }
  display: {
    featured: boolean
    badge?: string
  }
  createdAt: string
  updatedAt: string
}

export default function Models() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await api.get('/api/admin/models', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setModels(response.data)
    } catch (error) {
      // Failed to fetch models
    } finally {
      setLoading(false)
    }
  }

  const toggleModelStatus = async (modelId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      await api.patch(`/api/admin/models/${modelId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      )
      
      setModels(models.map(model => 
        model._id === modelId 
          ? { ...model, status: newStatus }
          : model
      ))
    } catch (error) {
      // Failed to update model status
    }
  }

  const deleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return
    
    try {
      const token = localStorage.getItem('adminToken')
      await api.delete(`/api/admin/models/${modelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setModels(models.filter(model => model._id !== modelId))
    } catch (error) {
      // Failed to delete model
    }
  }

  const filteredModels = models.filter(model => {
    if (filter === 'all') return true
    if (filter === 'active') return model.status === 'active'
    if (filter === 'inactive') return model.status === 'inactive'
    return model.type === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tts': return 'bg-blue-100 text-blue-800'
      case 'music': return 'bg-purple-100 text-purple-800'
      case 'voice-clone': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Models</h1>
          <p className="mt-2 text-gray-600">Manage your AI models and providers</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'active', 'inactive', 'tts', 'music', 'voice-clone'].map((filterOption) => (
          <Button
            key={filterOption}
            variant={filter === filterOption ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(filterOption)}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </Button>
        ))}
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <div key={model._id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {model.displayName}
                  </h3>
                  {model.display.featured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      ★ Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(model.type)}`}>
                    {model.type.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(model.status)}`}>
                    {model.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {model.provider.name} • {model.provider.modelId}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleModelStatus(model._id, model.status)}
                >
                  {model.status === 'active' ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => deleteModel(model._id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">Pricing</p>
              <p className="font-semibold">
                ${model.pricing.userPrice} per {model.pricing.model.replace('-', ' ')}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="font-semibold">{model.stats.totalUsage}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="font-semibold">{model.stats.monthlyUsage}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="font-semibold">{model.stats.successRate}%</p>
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Capabilities</p>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {model.capabilities.languages.length} languages
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {model.capabilities.voices.length} voices
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No models found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}