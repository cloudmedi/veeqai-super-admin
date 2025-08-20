import { useEffect, useState } from 'react'
import { Users as UsersIcon, Mail, Calendar, Shield, Crown, User, MoreVertical, Ban, UserCheck, Trash2, Edit, Key, BarChart3, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import api from '@/lib/axios'

interface User {
  _id: string
  name: string
  email: string
  role: string
  status: string
  emailVerified: boolean
  createdAt: string
  lastLogin?: string
  credits?: number
  subscription?: {
    plan: string
    status: string
  }
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [usageModalOpen, setUsageModalOpen] = useState(false)
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [userUsage, setUserUsage] = useState<any>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [creditAction, setCreditAction] = useState<'add' | 'set'>('add')

  useEffect(() => {
    fetchUsers()
  }, [])

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenuOpen(null);
    
    if (actionMenuOpen) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionMenuOpen])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await api.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data.users || [])
    } catch (error) {
      // Failed to fetch users
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />
      default: return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-yellow-100 text-yellow-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    if (filter === 'active') return user.status === 'active'
    if (filter === 'pending') return user.status === 'pending'
    if (filter === 'admins') return ['admin', 'superadmin'].includes(user.role)
    return user.role === filter
  })

  const handleUserAction = async (userId: string, action: string) => {
    const user = users.find(u => u._id === userId)
    if (!user) return
    
    setSelectedUser(user)
    setActionMenuOpen(null)
    
    try {
      switch (action) {
        case 'activate':
          await api.patch(`/api/admin/users/${userId}`, { status: 'active' })
          fetchUsers()
          break
        case 'suspend':
          await api.patch(`/api/admin/users/${userId}`, { status: 'suspended' })
          fetchUsers()
          break
        case 'delete':
          setDeleteModalOpen(true)
          break
        case 'reset-password':
          setResetPasswordModalOpen(true)
          break
        case 'view-usage':
          const usageResponse = await api.get(`/api/admin/users/${userId}/usage`)
          setUserUsage(usageResponse.data)
          setUsageModalOpen(true)
          break
      }
    } catch (error: any) {
      // User action error
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    try {
      await api.delete(`/api/admin/users/${selectedUser._id}`)
      
      fetchUsers()
      setDeleteModalOpen(false)
      setSelectedUser(null)
    } catch (error: any) {
      // Delete error
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      return
    }
    
    try {
      await api.patch(`/api/admin/users/${selectedUser._id}/reset-password`, 
        { newPassword }
      )
      
      setResetPasswordModalOpen(false)
      setNewPassword('')
      setSelectedUser(null)
    } catch (error: any) {
      // Password reset error
    }
  }

  const handleCreditAction = async () => {
    if (!selectedUser || !creditAmount) return
    
    try {
      const amount = parseInt(creditAmount)
      if (isNaN(amount) || amount < 0) return
      
      const endpoint = creditAction === 'add' ? 'add' : 'set'
      const response = await api.post(`/api/admin/users/${selectedUser._id}/credits/${endpoint}`, {
        amount,
        reason: creditReason || undefined
      })
      
      // Credit action successful
      
      // Update user in local state
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, credits: response.data.data.newCredits }
          : user
      ))
      
      setCreditModalOpen(false)
      setCreditAmount('')
      setCreditReason('')
      setSelectedUser(null)
    } catch (error: any) {
      // Credit error
    }
  }

  const openCreditModal = (user: User, action: 'add' | 'set') => {
    setSelectedUser(user)
    setCreditAction(action)
    setCreditModalOpen(true)
    setActionMenuOpen(null)
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
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">Manage platform users and their subscriptions</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {users.length} users
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'active', 'pending', 'admins', 'user'].map((filterOption) => (
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

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UsersIcon className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                          {user.emailVerified && (
                            <span className="ml-1 text-green-500">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {['superadmin', 'admin'].includes(user.role) ? (
                      <span className="text-blue-600 font-medium">Admin Access</span>
                    ) : user.subscription ? (
                      <div>
                        <div className="font-medium">{user.subscription.plan}</div>
                        <div className="text-xs text-gray-500">{user.subscription.status}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No subscription</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                      <span className="font-medium">{user.credits || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? (
                      new Date(user.lastLogin).toLocaleDateString()
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {['superadmin', 'admin'].includes(user.role) ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuOpen(actionMenuOpen === user._id ? null : user._id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {actionMenuOpen === user._id && (
                          <div className="fixed mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50" 
                               style={{ right: '20px', transform: 'translateY(20px)' }}>
                            <div className="py-1">
                              {user.status === 'active' ? (
                                <button
                                  onClick={() => handleUserAction(user._id, 'suspend')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend User
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user._id, 'activate')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate User
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleUserAction(user._id, 'reset-password')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </button>
                              
                              <button
                                onClick={() => openCreditModal(user, 'add')}
                                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Add Credits
                              </button>
                              
                              <button
                                onClick={() => openCreditModal(user, 'set')}
                                className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Set Credits
                              </button>

                              <button
                                onClick={() => handleUserAction(user._id, 'view-usage')}
                                className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                              >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Usage
                              </button>
                              
                              <button
                                onClick={() => handleUserAction(user._id, 'delete')}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'No users have registered yet.' : `No ${filter} users found.`}
            </p>
          </div>
        )}
      </div>

      {/* Delete User Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedUser(null)
        }}
        title="Delete User"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delete User</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setSelectedUser(null)
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetPasswordModalOpen}
        onClose={() => {
          setResetPasswordModalOpen(false)
          setSelectedUser(null)
          setNewPassword('')
        }}
        title="Reset Password"
        size="sm"
      >
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password for {selectedUser?.name}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordModalOpen(false)
                setSelectedUser(null)
                setNewPassword('')
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              className="flex-1"
            >
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Usage Modal */}
      <Modal
        isOpen={usageModalOpen}
        onClose={() => {
          setUsageModalOpen(false)
          setSelectedUser(null)
          setUserUsage(null)
        }}
        title="User Usage Analytics"
        size="lg"
      >
        <div>
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Usage for {selectedUser?.name}
            </h4>
            <p className="text-sm text-gray-500">
              Current usage statistics and limits
            </p>
          </div>
          
          {userUsage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">TTS</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">TTS Characters</p>
                    <p className="text-2xl font-bold text-blue-600">{userUsage.ttsCharacters || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">♪</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Music Generations</p>
                    <p className="text-2xl font-bold text-green-600">{userUsage.musicGenerations || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-sm">API</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">API Requests</p>
                    <p className="text-2xl font-bold text-purple-600">{userUsage.apiRequests || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {userUsage?.lastActivity && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Last Activity:</strong> {new Date(userUsage.lastActivity).toLocaleString()}
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <Button
              onClick={() => {
                setUsageModalOpen(false)
                setSelectedUser(null)
                setUserUsage(null)
              }}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Credit Management Modal */}
      <Modal
        isOpen={creditModalOpen}
        onClose={() => {
          setCreditModalOpen(false)
          setSelectedUser(null)
          setCreditAmount('')
          setCreditReason('')
        }}
        title={`${creditAction === 'add' ? 'Add Credits to' : 'Set Credits for'} ${selectedUser?.name}`}
      >
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Current credits: <span className="font-medium">{selectedUser?.credits || 0}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {creditAction === 'add' ? 'Credits to Add' : 'New Credit Amount'}
              </label>
              <input
                type="number"
                min="0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <textarea
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="Enter reason for credit change"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <Button
              onClick={() => {
                setCreditModalOpen(false)
                setSelectedUser(null)
                setCreditAmount('')
                setCreditReason('')
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreditAction}
              disabled={!creditAmount || parseInt(creditAmount) < 0}
              className="flex-1"
            >
              {creditAction === 'add' ? 'Add Credits' : 'Set Credits'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}