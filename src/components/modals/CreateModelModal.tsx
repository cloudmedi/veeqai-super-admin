import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'

interface CreateModelModalProps {
  isOpen: boolean
  onClose: () => void
  onModelCreated: () => void
}

export default function CreateModelModal({ isOpen, onClose, onModelCreated }: CreateModelModalProps) {
  const [replicateModels, setReplicateModels] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    type: 'music',
    category: 'standard',
    providerName: 'replicate',
    modelId: '',
    apiEndpoint: 'https://api.replicate.com',
    baseCost: 0.005,
    markup: 2.0,
    pricingModel: 'per-generation',
    status: 'active',
    featured: false,
    badge: '',
    tags: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch Replicate models when modal opens
  useEffect(() => {
    if (isOpen && formData.providerName === 'replicate') {
      fetchReplicateModels()
    }
  }, [isOpen, formData.providerName])

  const fetchReplicateModels = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await api.get('/api/admin/replicate-models', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReplicateModels(response.data.models || [])
    } catch (error) {
      // Failed to fetch Replicate models
    }
  }

  // Auto-fill when Replicate model selected
  const handleReplicateModelChange = (selectedModelId: string) => {
    const selectedModel = replicateModels.find(m => m.id === selectedModelId)
    if (selectedModel) {
      setFormData(prev => ({
        ...prev,
        modelId: selectedModelId,
        displayName: selectedModel.name,
        description: selectedModel.description,
        type: selectedModel.type,
        name: selectedModel.name.toLowerCase().replace(/\s+/g, '-')
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const token = localStorage.getItem('adminToken')
      
      // Prepare model data
      const modelData = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        provider: {
          name: formData.providerName,
          modelId: formData.modelId,
          apiEndpoint: formData.apiEndpoint
        },
        config: {
          defaultParameters: {},
          inputFormats: ['text'],
          outputFormats: formData.type === 'music' ? ['audio/wav', 'audio/mp3'] : ['audio/wav'],
          maxInputLength: 200,
          maxOutputDuration: formData.type === 'music' ? 240 : 30
        },
        capabilities: {
          languages: [
            { code: 'en', name: 'English', quality: 'native' }
          ],
          styles: formData.type === 'music' ? 
            ['classical', 'jazz', 'rock', 'electronic', 'ambient'] : 
            ['conversational', 'narration'],
          emotions: ['neutral', 'happy', 'sad'],
          features: {
            voiceCloning: formData.type === 'voice-clone',
            emotionControl: true,
            speedControl: false,
            pitchControl: formData.type === 'music',
            multiSpeaker: formData.type === 'tts',
            ssml: formData.type === 'tts'
          }
        },
        pricing: {
          model: formData.pricingModel,
          baseCost: formData.baseCost,
          markup: formData.markup,
          userPrice: formData.baseCost * formData.markup,
          currency: 'USD'
        },
        performance: {
          averageLatency: 20000,
          reliability: 95,
          quality: 4
        },
        stats: {
          totalUsage: 0,
          monthlyUsage: 0,
          successRate: 100
        },
        status: formData.status,
        availability: {
          plans: ['starter', 'pro', 'enterprise'],
          regions: ['us', 'eu'],
          restrictions: []
        },
        display: {
          order: 0,
          featured: formData.featured,
          badge: formData.badge || undefined,
          icon: getTypeIcon(formData.type),
          color: '#3B82F6',
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
        }
      }

      await api.post('/api/admin/models', modelData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      onModelCreated()
      onClose()
      resetForm()
      
    } catch (error: any) {
      // Create model error
      if (error.response?.data?.errors) {
        const newErrors: Record<string, string> = {}
        error.response.data.errors.forEach((err: any) => {
          newErrors[err.path || err.param] = err.msg || err.message
        })
        setErrors(newErrors)
      } else {
        setErrors({ general: error.response?.data?.error || 'Failed to create model' })
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      type: 'music',
      category: 'standard',
      providerName: 'replicate',
      modelId: '',
      apiEndpoint: 'https://api.replicate.com',
      baseCost: 0.005,
      markup: 2.0,
      pricingModel: 'per-generation',
      status: 'active',
      featured: false,
      badge: '',
      tags: ''
    })
    setErrors({})
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'music': return '🎵'
      case 'tts': return '🗣️'
      case 'voice-clone': return '👤'
      case 'voice-design': return '🎨'
      case 'voice-isolator': return '🔊'
      default: return '🤖'
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New AI Model"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., musicgen-large"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="e.g., MusicGen Large"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this model does..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Type and Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="music">Music</option>
              <option value="tts">Text-to-Speech</option>
              <option value="voice-clone">Voice Clone</option>
              <option value="voice-design">Voice Design</option>
              <option value="voice-isolator">Voice Isolator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="experimental">Experimental</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Provider Configuration */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Provider Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider *
              </label>
              <select
                value={formData.providerName}
                onChange={(e) => setFormData(prev => ({ ...prev, providerName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="replicate">Replicate</option>
                <option value="custom">Custom API</option>
                <option value="openai">OpenAI</option>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="local">Local</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.providerName === 'replicate' ? 'Replicate Model *' : 'Model ID *'}
              </label>
              
              {formData.providerName === 'replicate' ? (
                <select
                  value={formData.modelId}
                  onChange={(e) => handleReplicateModelChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Replicate model seç...</option>
                  {replicateModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.type} ({model.description})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.modelId}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelId: e.target.value }))}
                  placeholder="model-id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              
              {formData.providerName === 'replicate' && (
                <p className="text-xs text-gray-500 mt-1">
                  Model seçtiğinde otomatik olarak bilgiler doldurulacak
                </p>
              )}
            </div>
          </div>

          {formData.providerName === 'custom' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Endpoint *
              </label>
              <input
                type="url"
                value={formData.apiEndpoint}
                onChange={(e) => setFormData(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                placeholder="https://your-api.com/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Model
              </label>
              <select
                value={formData.pricingModel}
                onChange={(e) => setFormData(prev => ({ ...prev, pricingModel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="per-generation">Per Generation</option>
                <option value="per-second">Per Second</option>
                <option value="per-character">Per Character</option>
                <option value="per-request">Per Request</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Cost ($)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.baseCost}
                onChange={(e) => setFormData(prev => ({ ...prev, baseCost: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Markup (x)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.markup}
                onChange={(e) => setFormData(prev => ({ ...prev, markup: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            User Price: ${(formData.baseCost * formData.markup).toFixed(4)} {formData.pricingModel}
          </div>
        </div>

        {/* Display Options */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Display Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Badge (optional)
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                placeholder="e.g., NEW, POPULAR, BETA"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="music, ai, generation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Featured Model</span>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[100px]"
          >
            {loading ? 'Creating...' : 'Create Model'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}