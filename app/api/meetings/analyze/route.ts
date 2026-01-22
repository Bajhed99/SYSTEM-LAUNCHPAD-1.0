import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrganization } from '@/lib/auth/tenancy'
import { MeetingMindAgent } from '@/lib/agents/meetingmind'

/**
 * Trigger MeetingMind agent to analyze a transcribed meeting
 */
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

    // Verify meeting exists and is transcribed
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .eq('organization_id', org.id)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    if (meeting.status !== 'transcribed') {
      return NextResponse.json(
        { error: 'Meeting must be transcribed before analysis' },
        { status: 400 }
      )
    }

    // Get user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Execute MeetingMind agent
    const agent = new MeetingMindAgent()
    const result = await agent.execute({
      organizationId: org.id,
      userId: user.id,
      metadata: { meetingId },
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
