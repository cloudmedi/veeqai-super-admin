import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'

interface EditModelModalProps {
  isOpen: boolean
  onClose: () => void
  onModelUpdated: () => void
  model: any
}

export default function EditModelModal({ isOpen, onClose, onModelUpdated, model }: EditModelModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    type: 'music',
    category: 'standard',
    status: 'active',
    baseCost: 0.005,
    markup: 2.0,
    pricingModel: 'per-generation',
    featured: false,
    badge: '',
    tags: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Model bilgilerini form'a yükle
  useEffect(() => {
    if (model && isOpen) {
      setFormData({
        name: model.name || '',
        displayName: model.displayName || '',
        description: model.description || '',
        type: model.type || 'music',
        category: model.category || 'standard',
        status: model.status || 'active',
        baseCost: model.pricing?.baseCost || 0.005,
        markup: model.pricing?.markup || 2.0,
        pricingModel: model.pricing?.model || 'per-generation',
        featured: model.display?.featured || false,
        badge: model.display?.badge || '',
        tags: model.display?.tags?.join(', ') || ''
      })
    }
  }, [model, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const token = localStorage.getItem('adminToken')
      
      const updateData = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        status: formData.status,
        pricing: {
          ...model.pricing,
          model: formData.pricingModel,
          baseCost: formData.baseCost,
          markup: formData.markup,
          userPrice: formData.baseCost * formData.markup
        },
        display: {
          ...model.display,
          featured: formData.featured,
          badge: formData.badge || undefined,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
        }
      }

      await api.patch(`/api/admin/models/${model._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      onModelUpdated()
      onClose()
      
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const newErrors: Record<string, string> = {}
        error.response.data.errors.forEach((err: any) => {
          newErrors[err.path || err.param] = err.msg || err.message
        })
        setErrors(newErrors)
      } else {
        setErrors({ general: error.response?.data?.error || 'Model güncellenemedi' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!model) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit AI Model"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

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

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[100px]"
          >
            {loading ? 'Updating...' : 'Update Model'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}