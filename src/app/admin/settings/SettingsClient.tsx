'use client'

import { useState } from "react"
import Link from "next/link"
import { updateProfile, updateEmail, updatePassword, updateNotificationSettings } from "./actions"

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  bio: string | null
  notifyOnComments: boolean
  notifyOnPublish: boolean
  adminEmail: string | null
}

export default function SettingsPage({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'email' | 'password'>('profile')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      console.log('Submitting profile update:', Object.fromEntries(formData))
      const result = await updateProfile(formData)
      console.log('Profile update result:', result)
      
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' })
    }
  }

  const handleNotificationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await updateNotificationSettings(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Notification settings updated successfully!' })
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await updateEmail(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Email updated successfully! Please sign in again.' })
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await updatePassword(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully! Please sign in again.' })
      e.currentTarget.reset()
    }
  }

  const tabs = [
    { key: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { key: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { key: 'email', label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { key: 'password', label: 'Password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  ] as const

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and notification settings</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'error' 
            ? 'bg-error/10 border border-error/20 text-error' 
            : 'bg-success/10 border border-success/20 text-success'
        }`}>
          {message.type === 'error' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-border">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">Profile Information</h2>
                  <p className="text-sm text-muted-foreground">Update your display name and profile image</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      defaultValue={user.name || ''}
                      placeholder="Your name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-foreground mb-2">
                      Profile Image URL
                    </label>
                    <input
                      type="url"
                      name="image"
                      id="image"
                      defaultValue={user.image || ''}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Optional: Add a URL to your profile image</p>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      id="bio"
                      rows={4}
                      defaultValue={user.bio || ''}
                      placeholder="Tell readers about yourself..."
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Brief description about yourself that will appear on your articles</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleNotificationSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">Notification Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure how and when you receive email notifications</p>
                </div>

                <div className="space-y-6">
                  {/* Admin Email */}
                  <div>
                    <label htmlFor="adminEmail" className="block text-sm font-medium text-foreground mb-2">
                      Notification Email Address
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      id="adminEmail"
                      defaultValue={user.adminEmail || user.email || ''}
                      placeholder="admin@example.com"
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Email address where notifications will be sent (defaults to your account email)
                    </p>
                  </div>

                  {/* Notification Toggles */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="notifyOnComments"
                          id="notifyOnComments"
                          defaultChecked={user.notifyOnComments}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="notifyOnComments" className="font-medium text-foreground cursor-pointer">
                          New Comments
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Receive an email when someone submits a new comment on your articles
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="notifyOnPublish"
                          id="notifyOnPublish"
                          defaultChecked={user.notifyOnPublish}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="notifyOnPublish" className="font-medium text-foreground cursor-pointer">
                          Article Published
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Receive a confirmation email when you publish a new article
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="btn btn-primary">
                    Save Notification Settings
                  </button>
                </div>
              </form>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">Email Address</h2>
                  <p className="text-sm text-muted-foreground">Change your account email address</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      defaultValue={user.email || ''}
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      required
                      placeholder="Enter your current password"
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Required for security verification</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="btn btn-primary">
                    Update Email
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">Change Password</h2>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      required
                      placeholder="Enter current password"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      required
                      minLength={6}
                      placeholder="Enter new password"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      required
                      minLength={6}
                      placeholder="Confirm new password"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="btn btn-primary">
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
