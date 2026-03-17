'use client'

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import { 
  updateProfile, 
  updateEmail, 
  updatePassword, 
  updateNotificationSettings,
  updateSMTPSettings,
  updateProfilePicture,
  testSMTP
} from "./actions"

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  bio: string | null
  notifyOnComments: boolean
  notifyOnPublish: boolean
  adminEmail: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpSecure: boolean | null
  smtpUser: string | null
  smtpPass: string | null
}

export default function SettingsPage({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'email' | 'password' | 'smtp'>('profile')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { update } = useSession()

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      const formData = new FormData(e.currentTarget)
      const result = await updateProfile(formData)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.')
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 2MB.')
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        // Update user profile with new image URL
        const result = await updateProfilePicture(data.url)
        if (result.success) {
          toast.success('Profile picture updated successfully!')
          // Update the session with the new image
          await update({ image: data.url })
          // Reload page to show new image
          window.location.reload()
        } else {
          toast.error(result.error || 'Failed to update profile picture')
        }
      } else {
        toast.error(data.error || 'Failed to upload image')
      }
    } catch (error) {
      toast.error('Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  const handleNotificationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const result = await updateNotificationSettings(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Notification settings updated successfully!')
    }
  }

  const handleSMTPSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const result = await updateSMTPSettings(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('SMTP settings saved successfully!')
    }
  }

  const handleTestSMTP = async () => {
    toast.promise(
      testSMTP(),
      {
        loading: 'Testing SMTP connection...',
        success: (data: { success: boolean; message: string }) => data.success ? data.message : data.message,
        error: 'Failed to test SMTP connection',
      }
    )
  }

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const result = await updateEmail(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Email updated successfully! Please sign in again.')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const result = await updatePassword(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Password updated successfully! Please sign in again.')
      e.currentTarget.reset()
    }
  }

  const tabs = [
    { key: 'profile' as const, label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { key: 'notifications' as const, label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { key: 'smtp' as const, label: 'Email (SMTP)', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { key: 'email' as const, label: 'Email Address', icon: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207' },
    { key: 'password' as const, label: 'Password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and notification settings</p>
      </div>

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
          <div className="bg-card border border-border rounded-xl p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">Profile Information</h2>
                  <p className="text-sm text-muted-foreground">Update your display name and profile picture</p>
                </div>

                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt="Profile"
                        width={100}
                        height={100}
                        className="rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary-hover/20 flex items-center justify-center border-2 border-border">
                        <span className="text-3xl font-bold text-primary">
                          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'A'}
                        </span>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfilePictureUpload}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload New Picture'}
                    </button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      JPEG, PNG, WebP or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
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
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
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
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Brief description about yourself that will appear on your articles</p>
                  </div>

                  <div className="pt-4">
                    <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
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
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors">
                    Save Notification Settings
                  </button>
                </div>
              </form>
            )}

            {/* SMTP Tab */}
            {activeTab === 'smtp' && (
              <form onSubmit={handleSMTPSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">Email Configuration (SMTP)</h2>
                  <p className="text-sm text-muted-foreground">Configure your SMTP server to send email notifications</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Gmail Setup Instructions:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Enable 2-Factor Authentication on your Google account</li>
                        <li>Generate an App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">Google Account Settings</a></li>
                        <li>Use the 16-character app password below (not your regular password)</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="smtpHost" className="block text-sm font-medium text-foreground mb-2">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        name="smtpHost"
                        id="smtpHost"
                        defaultValue={user.smtpHost || ''}
                        placeholder="smtp.gmail.com"
                        className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="smtpPort" className="block text-sm font-medium text-foreground mb-2">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        name="smtpPort"
                        id="smtpPort"
                        defaultValue={user.smtpPort || 587}
                        placeholder="587"
                        className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="smtpUser" className="block text-sm font-medium text-foreground mb-2">
                      SMTP Username / Email
                    </label>
                    <input
                      type="email"
                      name="smtpUser"
                      id="smtpUser"
                      defaultValue={user.smtpUser || ''}
                      placeholder="your-email@gmail.com"
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="smtpPass" className="block text-sm font-medium text-foreground mb-2">
                      SMTP Password / App Password
                    </label>
                    <input
                      type="password"
                      name="smtpPass"
                      id="smtpPass"
                      defaultValue={user.smtpPass || ''}
                      placeholder="your-app-password"
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      For Gmail, use the 16-character app password, not your regular password
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      name="smtpSecure"
                      id="smtpSecure"
                      defaultChecked={user.smtpSecure || false}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="smtpSecure" className="text-sm text-foreground cursor-pointer">
                      Use secure connection (TLS/SSL)
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors">
                    Save SMTP Settings
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSMTP}
                    className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors"
                  >
                    Test Connection
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
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Required for security verification</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors">
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
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors">
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
