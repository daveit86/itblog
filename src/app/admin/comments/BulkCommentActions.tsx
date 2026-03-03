'use client'

import { useState } from 'react'
import { bulkApproveComments, bulkDisapproveComments, bulkDeleteComments } from './actions'

interface BulkCommentActionsProps {
  selectedIds: string[]
  onClearSelection: () => void
}

export default function BulkCommentActions({ selectedIds, onClearSelection }: BulkCommentActionsProps) {
  const [loading, setLoading] = useState(false)

  if (selectedIds.length === 0) return null

  const handleBulkApprove = async () => {
    if (!confirm(`Approve ${selectedIds.length} selected comments?`)) return
    
    setLoading(true)
    try {
      const result = await bulkApproveComments(selectedIds)
      if (result.error) {
        alert(result.error)
      } else {
        alert(`Successfully approved ${result.success} comments`)
        onClearSelection()
        window.location.reload()
      }
    } catch (error) {
      alert('Failed to approve comments')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDisapprove = async () => {
    if (!confirm(`Disapprove ${selectedIds.length} selected comments?`)) return
    
    setLoading(true)
    try {
      const result = await bulkDisapproveComments(selectedIds)
      if (result.error) {
        alert(result.error)
      } else {
        alert(`Successfully disapproved ${result.success} comments`)
        onClearSelection()
        window.location.reload()
      }
    } catch (error) {
      alert('Failed to disapprove comments')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected comments? This action cannot be undone.`)) return
    
    setLoading(true)
    try {
      const result = await bulkDeleteComments(selectedIds)
      if (result.error) {
        alert(result.error)
      } else {
        alert(`Successfully deleted ${result.success} comments`)
        onClearSelection()
        window.location.reload()
      }
    } catch (error) {
      alert('Failed to delete comments')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-foreground">
          {selectedIds.length} selected
        </span>
        
        <div className="flex gap-2">
          <button
            onClick={handleBulkApprove}
            disabled={loading}
            className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve All
          </button>
          
          <button
            onClick={handleBulkDisapprove}
            disabled={loading}
            className="bg-yellow-600 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Disapprove All
          </button>
          
          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete All
          </button>
        </div>
        
        <button
          onClick={onClearSelection}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground text-sm disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
