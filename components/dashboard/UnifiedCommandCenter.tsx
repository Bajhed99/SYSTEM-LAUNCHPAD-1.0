'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Meeting = Database['public']['Tables']['meetings']['Row']
type ActionItem = Database['public']['Tables']['action_items']['Row']

interface UnifiedCommandCenterProps {
  organizationId: string
}

export default function UnifiedCommandCenter({ organizationId }: UnifiedCommandCenterProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    const supabase = createClient()
    
    const [meetingsRes, actionItemsRes] = await Promise.all([
      supabase
        .from('meetings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('action_items')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (meetingsRes.data) setMeetings(meetingsRes.data)
    if (actionItemsRes.data) setActionItems(actionItemsRes.data)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Unified AI Command Center</h2>
        <p className="text-gray-600">Agent dispatch and system overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total Meetings</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{meetings.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Pending Actions</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{actionItems.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">System Status</div>
          <div className="text-lg font-semibold text-green-600 mt-2">Operational</div>
        </div>
      </div>

      {/* Recent Meetings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Meetings</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {meetings.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No meetings yet. Upload your first meeting in MeetingMind AI.
            </div>
          ) : (
            meetings.map((meeting) => (
              <div key={meeting.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {meeting.meeting_date
                        ? new Date(meeting.meeting_date).toLocaleDateString()
                        : 'No date'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      meeting.status === 'analyzed'
                        ? 'bg-green-100 text-green-800'
                        : meeting.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {meeting.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Action Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Action Items</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {actionItems.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No pending action items.
            </div>
          ) : (
            actionItems.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    )}
                    {item.assignee && (
                      <p className="text-xs text-gray-400 mt-1">Assigned to: {item.assignee}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        item.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : item.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.priority}
                    </span>
                    {item.due_date && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
