import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Plus, Edit, Trash2, CheckCircle, XCircle, MoreVertical, Copy, BarChart3, Play, Eye } from 'lucide-react'
import axios from '../lib/axios'

interface Plan {
  _id: string
  name: string
  displayName: string
  description: string
  pricing: {
    monthly: { amount: number; currency: string }
    yearly?: { amount: number; currency: string; discount?: number }
  }
  credits: {
    monthly: number
    rates: {
      tts: number
      music: { per30Seconds: number; per60Seconds: number }
      voiceClone: { creation: number; usage: number }
      voiceIsolator: { perMinute: number }
    }
  }
  features: { [key: string]: boolean }
  display: {
    order: number
    featured: boolean
    popular: boolean
    badge?: string
    color: string
    icon: string
  }
  status: 'active' | 'inactive' | 'deprecated'
  target: 'individual' | 'team' | 'enterprise' | 'all'
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  useEffect(() => {
    fetchPlans()
  }, [])


  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/admin/plans')
      setPlans(response.data.data || [])
    } catch (error) {
      // Failed to fetch plans
    } finally {
      setLoading(false)
    }
  }

  const togglePlanStatus = async (planId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await axios.patch(`/api/admin/plans/${planId}`, { status: newStatus })
      fetchPlans()
    } catch (error) {
      // Failed to update plan status
    }
  }

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    
    try {
      await axios.delete(`/api/admin/plans/${planId}`)
      fetchPlans()
    } catch (error) {
      // Failed to delete plan
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'deprecated': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCredits = (credits: number) => {
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(1)}M`
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(0)}K`
    }
    return credits.toString()
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="mt-2 text-gray-600">Manage pricing plans and credit allocations</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-black hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Plans Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Plans</h3>
          <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Plans</h3>
          <p className="text-2xl font-bold text-green-600">
            {plans.filter(p => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Free Plans</h3>
          <p className="text-2xl font-bold text-blue-600">
            {plans.filter(p => p.pricing.monthly.amount === 0).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Enterprise Plans</h3>
          <p className="text-2xl font-bold text-purple-600">
            {plans.filter(p => p.target === 'enterprise').length}
          </p>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Plans</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits/Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {plan.displayName}
                        </div>
                        {plan.display.badge && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {plan.display.badge}
                          </span>
                        )}
                        {plan.display.popular && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{plan.description}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${plan.pricing.monthly.amount}/month
                    </div>
                    {plan.pricing.yearly && (
                      <div className="text-sm text-gray-500">
                        ${plan.pricing.yearly.amount}/year
                        {plan.pricing.yearly.discount && (
                          <span className="text-green-600 ml-1">
                            ({plan.pricing.yearly.discount}% off)
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCredits(plan.credits.monthly)} credits
                    </div>
                    <div className="text-xs text-gray-500">
                      TTS: {plan.credits.rates.tts}c/char • 
                      Music: {plan.credits.rates.music.per30Seconds}c/30s
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {plan.target}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        if (actionMenuOpen === plan._id) {
                          setActionMenuOpen(null)
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const dropdownHeight = 240 // Actual dropdown height
                          const viewportHeight = window.innerHeight
                          const spacing = 8 // Same spacing for both directions
                          
                          let top = rect.bottom + spacing
                          
                          // If dropdown would go below viewport, show above button
                          if (top + dropdownHeight > viewportHeight) {
                            top = rect.top - spacing // Just above the button with same spacing
                          }
                          
                          setDropdownPosition({
                            top: top,
                            right: window.innerWidth - rect.right
                          })
                          setActionMenuOpen(plan._id)
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
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <button
                onClick={() => {
                  const plan = plans.find(p => p._id === actionMenuOpen)
                  setSelectedPlan(plan || null)
                  setActionMenuOpen(null)
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              <button
                onClick={() => {
                  const plan = plans.find(p => p._id === actionMenuOpen)
                  if (plan) {
                    const clonedPlan = { ...plan, name: `${plan.name}-copy`, displayName: `${plan.displayName} (Copy)` }
                    delete (clonedPlan as any)._id
                    axios.post('/api/admin/plans', clonedPlan).then(() => {
                      fetchPlans()
                      setActionMenuOpen(null)
                    })
                  }
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Copy className="h-4 w-4 mr-2" />
                Clone
              </button>
              
              <button
                onClick={() => {
                  const plan = plans.find(p => p._id === actionMenuOpen)
                  if (plan) {
                    alert(`View subscriptions for ${plan.displayName}`)
                  }
                  setActionMenuOpen(null)
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Subscriptions
              </button>
              
              <button
                onClick={() => {
                  const plan = plans.find(p => p._id === actionMenuOpen)
                  if (plan) {
                    alert(`Analytics for ${plan.displayName}`)
                  }
                  setActionMenuOpen(null)
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </button>
              
              <button
                onClick={() => {
                  const plan = plans.find(p => p._id === actionMenuOpen)
                  if (plan) {
                    togglePlanStatus(plan._id, plan.status)
                  }
                  setActionMenuOpen(null)
                }}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  plans.find(p => p._id === actionMenuOpen)?.status === 'active' 
                    ? 'text-orange-700 hover:bg-orange-50' 
                    : 'text-green-700 hover:bg-green-50'
                }`}
              >
                {plans.find(p => p._id === actionMenuOpen)?.status === 'active' ? 
                  <XCircle className="h-4 w-4 mr-2" /> : 
                  <CheckCircle className="h-4 w-4 mr-2" />
                }
                {plans.find(p => p._id === actionMenuOpen)?.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              
              <hr className="my-1" />
              
              <button
                onClick={() => {
                  const plan = plans.find(p => p._id === actionMenuOpen)
                  if (plan && confirm(`Are you sure you want to delete ${plan.displayName}?`)) {
                    deletePlan(plan._id)
                  }
                  setActionMenuOpen(null)
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
        
        {plans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No plans found. Create your first plan to get started.</p>
          </div>
        )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Plan</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              try {
                const planData = {
                  name: formData.get('name'),
                  displayName: formData.get('displayName'),
                  description: formData.get('description'),
                  pricing: {
                    monthly: {
                      amount: Number(formData.get('monthlyAmount')),
                      currency: 'USD'
                    },
                    yearly: {
                      amount: Number(formData.get('yearlyAmount')),
                      currency: 'USD',
                      discount: Number(formData.get('yearlyDiscount'))
                    }
                  },
                  credits: {
                    monthly: Number(formData.get('monthlyCredits')),
                    rates: {
                      tts: Number(formData.get('ttsRate')),
                      music: {
                        per30Seconds: Number(formData.get('musicRate30')),
                        per60Seconds: Number(formData.get('musicRate60'))
                      },
                      voiceClone: {
                        creation: Number(formData.get('voiceCloneCreation')),
                        usage: Number(formData.get('voiceCloneUsage'))
                      },
                      voiceIsolator: {
                        perMinute: Number(formData.get('voiceIsolatorRate'))
                      }
                    }
                  },
                  features: {
                    textToSpeech: formData.get('textToSpeech') === 'on',
                    musicGeneration: formData.get('musicGeneration') === 'on',
                    voiceCloning: formData.get('voiceCloning') === 'on',
                    voiceIsolator: formData.get('voiceIsolator') === 'on'
                  },
                  display: {
                    order: Number(formData.get('displayOrder')),
                    featured: formData.get('featured') === 'on',
                    popular: formData.get('popular') === 'on',
                    badge: formData.get('badge') || '',
                    color: formData.get('color') || '#000000',
                    icon: formData.get('icon') || '📋'
                  },
                  status: formData.get('status') as 'active' | 'inactive',
                  target: formData.get('target') as 'individual' | 'team' | 'enterprise'
                }
                
                await axios.post('/api/admin/plans', planData)
                setShowCreateModal(false)
                fetchPlans()
                alert('Plan created successfully!')
              } catch (error) {
                // Failed to create plan
                alert('Failed to create plan')
              }
            }}>
              <div className="grid grid-cols-2 gap-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input name="name" type="text" required className="w-full p-2 border rounded" placeholder="starter" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input name="displayName" type="text" required className="w-full p-2 border rounded" placeholder="Starter" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea name="description" required className="w-full p-2 border rounded" placeholder="Perfect for individuals..." rows={2}></textarea>
                </div>
                
                {/* Pricing */}
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Price ($)</label>
                  <input name="monthlyAmount" type="number" min="0" required className="w-full p-2 border rounded" placeholder="9" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Credits</label>
                  <input name="monthlyCredits" type="number" min="0" required className="w-full p-2 border rounded" placeholder="50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yearly Price ($)</label>
                  <input name="yearlyAmount" type="number" min="0" className="w-full p-2 border rounded" placeholder="90" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yearly Discount (%)</label>
                  <input name="yearlyDiscount" type="number" min="0" max="100" defaultValue="17" className="w-full p-2 border rounded" placeholder="17" />
                </div>
                
                {/* Credit Rates */}
                <div>
                  <label className="block text-sm font-medium mb-1">TTS Rate (credits/char)</label>
                  <input name="ttsRate" type="number" min="0" step="0.1" defaultValue="1" className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Music 30s Rate</label>
                  <input name="musicRate30" type="number" min="0" defaultValue="200" className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Music 60s Rate</label>
                  <input name="musicRate60" type="number" min="0" defaultValue="400" className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Voice Clone Creation</label>
                  <input name="voiceCloneCreation" type="number" min="0" defaultValue="2000" className="w-full p-2 border rounded" />
                </div>
                
                {/* Features */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Features</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" name="textToSpeech" defaultChecked className="mr-2" />
                      Text-to-Speech
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="musicGeneration" defaultChecked className="mr-2" />
                      Music Generation
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="voiceCloning" className="mr-2" />
                      Voice Cloning
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="voiceIsolator" className="mr-2" />
                      Voice Isolator
                    </label>
                  </div>
                </div>
                
                {/* Display */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select name="status" defaultValue="active" className="w-full p-2 border rounded">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target</label>
                  <select name="target" defaultValue="individual" className="w-full p-2 border rounded">
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <input name="icon" type="text" defaultValue="📋" className="w-full p-2 border rounded" placeholder="📋" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Badge</label>
                  <input name="badge" type="text" className="w-full p-2 border rounded" placeholder="BEST VALUE" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">
                  Create Plan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Plan: {selectedPlan.displayName}</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              try {
                const planData = {
                  name: formData.get('name'),
                  displayName: formData.get('displayName'),
                  description: formData.get('description'),
                  pricing: {
                    monthly: {
                      amount: Number(formData.get('monthlyAmount')),
                      currency: 'USD'
                    },
                    yearly: {
                      amount: Number(formData.get('yearlyAmount')),
                      currency: 'USD',
                      discount: Number(formData.get('yearlyDiscount'))
                    }
                  },
                  credits: {
                    monthly: Number(formData.get('monthlyCredits')),
                    rates: {
                      tts: Number(formData.get('ttsRate')),
                      music: {
                        per30Seconds: Number(formData.get('musicRate30')),
                        per60Seconds: Number(formData.get('musicRate60'))
                      },
                      voiceClone: {
                        creation: Number(formData.get('voiceCloneCreation')),
                        usage: Number(formData.get('voiceCloneUsage'))
                      },
                      voiceIsolator: {
                        perMinute: Number(formData.get('voiceIsolatorRate'))
                      }
                    }
                  },
                  features: {
                    textToSpeech: formData.get('textToSpeech') === 'on',
                    musicGeneration: formData.get('musicGeneration') === 'on',
                    voiceCloning: formData.get('voiceCloning') === 'on',
                    voiceIsolator: formData.get('voiceIsolator') === 'on'
                  },
                  display: {
                    order: Number(formData.get('displayOrder')),
                    featured: formData.get('featured') === 'on',
                    popular: formData.get('popular') === 'on',
                    badge: formData.get('badge') || '',
                    color: formData.get('color') || '#000000',
                    icon: formData.get('icon') || '📋'
                  },
                  status: formData.get('status') as 'active' | 'inactive',
                  target: formData.get('target') as 'individual' | 'team' | 'enterprise'
                }
                
                await axios.patch(`/api/admin/plans/${selectedPlan._id}`, planData)
                setSelectedPlan(null)
                fetchPlans()
                alert('Plan updated successfully!')
              } catch (error) {
                // Failed to update plan
                alert('Failed to update plan')
              }
            }}>
              <div className="grid grid-cols-2 gap-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input name="name" type="text" required className="w-full p-2 border rounded" defaultValue={selectedPlan.name} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input name="displayName" type="text" required className="w-full p-2 border rounded" defaultValue={selectedPlan.displayName} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea name="description" required className="w-full p-2 border rounded" defaultValue={selectedPlan.description} rows={2}></textarea>
                </div>
                
                {/* Pricing */}
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Price ($)</label>
                  <input name="monthlyAmount" type="number" min="0" required className="w-full p-2 border rounded" defaultValue={selectedPlan.pricing.monthly.amount} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Credits</label>
                  <input name="monthlyCredits" type="number" min="0" required className="w-full p-2 border rounded" defaultValue={selectedPlan.credits.monthly} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yearly Price ($)</label>
                  <input name="yearlyAmount" type="number" min="0" className="w-full p-2 border rounded" defaultValue={selectedPlan.pricing.yearly?.amount || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yearly Discount (%)</label>
                  <input name="yearlyDiscount" type="number" min="0" max="100" className="w-full p-2 border rounded" defaultValue={selectedPlan.pricing.yearly?.discount || 17} />
                </div>
                
                {/* Credit Rates */}
                <div>
                  <label className="block text-sm font-medium mb-1">TTS Rate (credits/char)</label>
                  <input name="ttsRate" type="number" min="0" step="0.1" className="w-full p-2 border rounded" defaultValue={selectedPlan.credits.rates.tts} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Music 30s Rate</label>
                  <input name="musicRate30" type="number" min="0" className="w-full p-2 border rounded" defaultValue={selectedPlan.credits.rates.music.per30Seconds} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Music 60s Rate</label>
                  <input name="musicRate60" type="number" min="0" className="w-full p-2 border rounded" defaultValue={selectedPlan.credits.rates.music.per60Seconds} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Voice Clone Creation</label>
                  <input name="voiceCloneCreation" type="number" min="0" className="w-full p-2 border rounded" defaultValue={selectedPlan.credits.rates.voiceClone.creation} />
                </div>
                
                {/* Features */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Features</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" name="textToSpeech" defaultChecked={selectedPlan.features.textToSpeech} className="mr-2" />
                      Text-to-Speech
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="musicGeneration" defaultChecked={selectedPlan.features.musicGeneration} className="mr-2" />
                      Music Generation
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="voiceCloning" defaultChecked={selectedPlan.features.voiceCloning} className="mr-2" />
                      Voice Cloning
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="voiceIsolator" defaultChecked={selectedPlan.features.voiceIsolator} className="mr-2" />
                      Voice Isolator
                    </label>
                  </div>
                </div>
                
                {/* Display */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select name="status" className="w-full p-2 border rounded" defaultValue={selectedPlan.status}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target</label>
                  <select name="target" className="w-full p-2 border rounded" defaultValue={selectedPlan.target}>
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Badge</label>
                  <input name="badge" type="text" className="w-full p-2 border rounded" defaultValue={selectedPlan.display?.badge || ''} />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">
                  Update Plan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}