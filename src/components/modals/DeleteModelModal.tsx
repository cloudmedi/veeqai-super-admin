import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle } from 'lucide-react'
import api from '@/lib/axios'

interface DeleteModelModalProps {
  isOpen: boolean
  onClose: () => void
  onModelDeleted: () => void
  model: any
}

export default function DeleteModelModal({ isOpen, onClose, onModelDeleted, model }: DeleteModelModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!model) return
    
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('adminToken')
      
      await api.delete(`/api/admin/models/${model._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      onModelDeleted()
      onClose()
      
    } catch (error: any) {
      setError(error.response?.data?.error || 'Model silinemedi')
    } finally {
      setLoading(false)
    }
  }

  if (!model) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete AI Model"
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Delete Model:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div><strong>Name:</strong> {model.name}</div>
            <div><strong>Display Name:</strong> {model.displayName}</div>
            <div><strong>Type:</strong> {model.type}</div>
            <div><strong>Provider:</strong> {model.provider?.name}</div>
            <div><strong>Status:</strong> {model.status}</div>
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
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Model
              </div>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}