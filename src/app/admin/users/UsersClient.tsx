'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  _count: {
    accounts: number
  }
}

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          name: formData.get('name'),
          password: formData.get('password'),
          role: formData.get('role'),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'User created successfully!' })
        setShowForm(false)
        loadUsers()
        ;(e.target as HTMLFormElement).reset()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create user' })
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        loadUsers()
        setMessage({ type: 'success', text: 'Role updated!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update role' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update role' })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadUsers()
        setMessage({ type: 'success', text: 'User deleted!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to delete user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : 'Add User'}
          </button>
          <Link
            href="/admin"
            className="text-primary hover:text-primary-hover"
          >
            ← Back
          </Link>
        </div>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded ${
          message.type === 'error' 
            ? 'bg-error/10 border border-error/20 text-error' 
            : 'bg-success/10 border border-success/20 text-success'
        }`}>
          {message.text}
        </div>
      )}

      {/* Add User Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-md border-border bg-card px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full rounded-md border-border bg-card px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full rounded-md border-border bg-card px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                <select
                  name="role"
                  className="w-full rounded-md border-border bg-card px-3 py-2"
                >
                  <option value="author">Author</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Create User
            </button>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-foreground">{user.name || 'No name'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    className="rounded-md border-border bg-card px-2 py-1 text-sm"
                  >
                    <option value="author">Author</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-error hover:text-error/80 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Role Permissions:</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Admin:</strong> Full access to all features, user management, settings</li>
          <li><strong>Author:</strong> Can create, edit, and publish their own articles</li>
        </ul>
      </div>
    </div>
  )
}
