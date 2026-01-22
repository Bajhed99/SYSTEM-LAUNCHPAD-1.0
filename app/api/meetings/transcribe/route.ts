import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrganization } from '@/lib/auth/tenancy'

export async function POST(request: Request) {
  try {
    const { meetingId } = await request.json()

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const org = await getCurrentOrganization()

    if (!org) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify meeting belongs to organization
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .eq('organization_id', org.id)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    if (!meeting.audio_file_url) {
      return NextResponse.json({ error: 'No audio file found' }, { status: 400 })
    }

    // Update meeting status
    await supabase
      .from('meetings')
      .update({ status: 'processing' })
      .eq('id', meetingId)

    // Call Supabase Edge Function for transcription
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'transcribe-meeting',
      {
        body: {
          meetingId,
          audioUrl: meeting.audio_file_url,
          organizationId: org.id,
        },
      }
    )

    if (functionError) {
      await supabase
        .from('meetings')
        .update({ status: 'failed' })
        .eq('id', meetingId)
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: functionData })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
