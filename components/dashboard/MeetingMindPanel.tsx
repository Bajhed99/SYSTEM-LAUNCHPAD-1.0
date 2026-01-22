'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Meeting = Database['public']['Tables']['meetings']['Row']
type Transcript = Database['public']['Tables']['transcripts']['Row']
type ActionItem = Database['public']['Tables']['action_items']['Row']

interface MeetingMindPanelProps {
  organizationId: string
}

export default function MeetingMindPanel({ organizationId }: MeetingMindPanelProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMeetings()
  }, [organizationId])

  useEffect(() => {
    if (selectedMeeting) {
      loadMeetingDetails(selectedMeeting.id)
    }
  }, [selectedMeeting])

  const loadMeetings = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (data) setMeetings(data)
    setLoading(false)
  }

  const loadMeetingDetails = async (meetingId: string) => {
    const supabase = createClient()
    const [transcriptRes, actionItemsRes] = await Promise.all([
      supabase
        .from('transcripts')
        .select('*')
        .eq('meeting_id', meetingId)
        .single(),
      supabase
        .from('action_items')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false }),
    ])

    if (transcriptRes.data) setTranscript(transcriptRes.data)
    if (actionItemsRes.data) setActionItems(actionItemsRes.data)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const supabase = createClient()
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('meeting-audio')
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('meeting-audio')
        .getPublicUrl(fileName)

      // Create meeting record
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          organization_id: organizationId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          audio_file_url: publicUrl,
          audio_file_size: file.size,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single()

      if (meetingError || !meeting) {
        throw meetingError || new Error('Failed to create meeting')
      }

      // Trigger transcription via API
      const response = await fetch('/api/meetings/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger transcription')
      }

      await loadMeetings()
      setSelectedMeeting(meeting)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload meeting. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">MeetingMind AI</h2>
        <p className="text-gray-600">Upload meeting audio for transcription and analysis</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block">
          <span className="sr-only">Upload meeting audio</span>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </label>
        {uploading && (
          <p className="mt-2 text-sm text-gray-500">Uploading and processing...</p>
        )}
      </div>

      {/* Meetings List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Meetings</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {meetings.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No meetings yet. Upload your first meeting above.
              </div>
            ) : (
              meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => setSelectedMeeting(meeting)}
                  className={`w-full px-6 py-4 text-left hover:bg-gray-50 ${
                    selectedMeeting?.id === meeting.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(meeting.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        meeting.status === 'analyzed'
                          ? 'bg-green-100 text-green-800'
                          : meeting.status === 'processing' || meeting.status === 'transcribed'
                          ? 'bg-yellow-100 text-yellow-800'
                          : meeting.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {meeting.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Meeting Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Meeting Details</h3>
          </div>
          <div className="p-6">
            {!selectedMeeting ? (
              <p className="text-gray-500 text-center py-8">Select a meeting to view details</p>
            ) : (
              <div className="space-y-6">
                {/* Transcript */}
                {transcript && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Transcript</h4>
                    <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {transcript.raw_text}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Action Items</h4>
                  {actionItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No action items extracted yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {actionItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 rounded-md p-3 border-l-4 border-blue-500"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{item.title}</h5>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              {item.assignee && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Assignee: {item.assignee}
                                </p>
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
