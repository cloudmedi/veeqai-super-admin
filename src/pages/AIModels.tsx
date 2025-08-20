import { useEffect, useState } from 'react'
import { Bot, Plus, Search, Filter, MoreVertical, Play, Pause, Settings, Trash2, Edit, Copy, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import CreateModelModal from '@/components/modals/CreateModelModal'
import EditModelModal from '@/components/modals/EditModelModal'
import DeleteModelModal from '@/components/modals/DeleteModelModal'
import UsageModalModal from '@/components/modals/UsageModalModal'
import TestModelModal from '@/components/modals/TestModelModal'
import api from '@/lib/axios'

interface AIModel {
  _id: string
  name: string
  displayName: string
  description: string
  type: 'tts' | 'music' | 'voice-clone' | 'voice-design' | 'voice-isolator'
  category: 'standard' | 'premium' | 'experimental'
  provider: {
    name: 'replicate' | 'openai' | 'elevenlabs' | 'custom' | 'local'
    modelId: string
    apiEndpoint?: string
  }
  status: 'active' | 'inactive' | 'maintenance' | 'deprecated'
  pricing: {
    model: 'per-character' | 'per-second' | 'per-generation' | 'per-request'
    baseCost: number
    userPrice: number
  }
  stats: {
    totalUsage: number
    monthlyUsage: number
    successRate: number
  }
  display: {
    featured: boolean
    badge?: string
    order: number
  }
  createdAt: string
  updatedAt: string
}

export default function AIModels() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    provider: 'all'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [usageModalOpen, setUsageModalOpen] = useState(false)
  const [testModalOpen, setTestModalOpen] = useState(false)

  useEffect(() => {
    fetchModels()
  }, [filter])

  const fetchModels = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams()
      
      if (filter.type !== 'all') params.append('type', filter.type)
      if (filter.status !== 'all') params.append('status', filter.status) 
      if (filter.provider !== 'all') params.append('provider', filter.provider)

      // Fetching models with params

      const response = await api.get(`/api/admin/models?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Models response received
      setModels(response.data.models || [])
    } catch (error) {
      // Failed to fetch models
      alert('Failed to fetch models: ' + ((error as any).response?.data?.error || (error as any).message))
    } finally {
      setLoading(false)
    }
  }

  const handleModelAction = async (modelId: string, action: string) => {
    const model = models.find(m => m._id === modelId)
    if (!model) return
    
    setSelectedModel(model)
    setActionMenuOpen(null)
    
    switch (action) {
      case 'edit':
        setEditModalOpen(true)
        break
      case 'delete':
        setDeleteModalOpen(true)
        break
      case 'test':
        setTestModalOpen(true)
        break
      case 'usage':
        setUsageModalOpen(true)
        break
      case 'clone':
        await cloneModel(model)
        break
      case 'toggle-status':
        await toggleModelStatus(modelId)
        break
    }
  }

  const toggleModelStatus = async (modelId: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const model = models.find(m => m._id === modelId)
      const newStatus = model?.status === 'active' ? 'inactive' : 'active'
      
      await api.patch(`/api/admin/models/${modelId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      )
      
      fetchModels()
    } catch (error) {
      // Failed to toggle model status
    }
  }

  const cloneModel = async (model: AIModel) => {
    try {
      const token = localStorage.getItem('adminToken')
      const clonedModel = {
        ...model,
        name: `${model.name}-copy`,
        displayName: `${model.displayName} (Copy)`
      }
      delete (clonedModel as any)._id
      
      await api.post('/api/admin/models', clonedModel, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      fetchModels()
    } catch (error) {
      // Failed to clone model
    }
  }


  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'replicate': return 'bg-blue-100 text-blue-800'
      case 'openai': return 'bg-green-100 text-green-800'
      case 'elevenlabs': return 'bg-purple-100 text-purple-800'
      case 'custom': return 'bg-orange-100 text-orange-800'
      case 'local': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'deprecated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-600" />
            AI Models
          </h1>
          <p className="mt-2 text-gray-600">
            Manage AI models, providers, and configurations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Model
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <select
            value={filter.type}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="music">Music</option>
            <option value="tts">Text-to-Speech</option>
            <option value="voice-clone">Voice Clone</option>
            <option value="voice-design">Voice Design</option>
            <option value="voice-isolator">Voice Isolator</option>
          </select>
          
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
            <option value="deprecated">Deprecated</option>
          </select>
          
          <select
            value={filter.provider}
            onChange={(e) => setFilter(prev => ({ ...prev, provider: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Providers</option>
            <option value="replicate">Replicate</option>
            <option value="openai">OpenAI</option>
            <option value="elevenlabs">ElevenLabs</option>
            <option value="custom">Custom</option>
            <option value="local">Local</option>
          </select>
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pricing
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredModels.map((model) => (
              <tr key={model._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{model.displayName}</div>
                    <div className="text-sm text-gray-500">{model.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {model.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {model.provider.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    model.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : model.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800'
                      : model.status === 'maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {model.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {model.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="text-sm">{model.stats.totalUsage.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{model.stats.successRate}% success</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="text-sm">${model.pricing.userPrice}</div>
                    <div className="text-xs text-gray-500">per {model.pricing.model.replace('per-', '')}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      if (actionMenuOpen === model._id) {
                        setActionMenuOpen(null)
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setDropdownPosition({
                          top: rect.bottom + 8,
                          right: window.innerWidth - rect.right
                        })
                        setActionMenuOpen(model._id)
                      }
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Actions Dropdown */}
      {actionMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(null)}>
          <div 
            className="absolute w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50" 
            style={{
              top: dropdownPosition.top,
              right: dropdownPosition.right
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <button
                onClick={() => handleModelAction(actionMenuOpen, 'test')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Model
              </button>
              
              <button
                onClick={() => handleModelAction(actionMenuOpen, 'edit')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              <button
                onClick={() => handleModelAction(actionMenuOpen, 'clone')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Copy className="h-4 w-4 mr-2" />
                Clone
              </button>
              
              <button
                onClick={() => handleModelAction(actionMenuOpen, 'usage')}
                className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Usage
              </button>
              
              <button
                onClick={() => handleModelAction(actionMenuOpen, 'toggle-status')}
                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
              >
                <Play className="h-4 w-4 mr-2" />
                Toggle Status
              </button>
              
              <button
                onClick={() => handleModelAction(actionMenuOpen, 'delete')}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <Bot className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No models found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search or filters.' : 'Get started by adding your first AI model.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Model Modal */}
      <CreateModelModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onModelCreated={fetchModels}
      />

      {/* Edit Model Modal */}
      <EditModelModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onModelUpdated={fetchModels}
        model={selectedModel}
      />

      {/* Delete Model Modal */}
      <DeleteModelModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onModelDeleted={fetchModels}
        model={selectedModel}
      />

      {/* Usage Modal */}
      <UsageModalModal
        isOpen={usageModalOpen}
        onClose={() => setUsageModalOpen(false)}
        model={selectedModel}
      />

      {/* Test Model Modal */}
      <TestModelModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        model={selectedModel}
      />
    </div>
  )
}