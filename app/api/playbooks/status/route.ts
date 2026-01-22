import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrganization } from '@/lib/auth/tenancy'

/**
 * Update playbook run status (called by n8n webhook)
 */
export async function POST(request: Request) {
  try {
    const { playbookRunId, status, result, error: errorMessage } = await request.json()

    if (!playbookRunId || !status) {
      return NextResponse.json(
        { error: 'Playbook run ID and status required' },
        { status: 400 }
      )
    }

    const org = await getCurrentOrganization()
    if (!org) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify playbook run belongs to org
    const { data: playbookRun, error: fetchError } = await supabase
      .from('playbook_runs')
      .select('*')
      .eq('id', playbookRunId)
      .eq('organization_id', org.id)
      .single()

    if (fetchError || !playbookRun) {
      return NextResponse.json({ error: 'Playbook run not found' }, { status: 404 })
    }

    // Update status
    const updateData: {
      status: string
      result?: unknown
      error_message?: string
      completed_at?: string
    } = {
      status,
    }

    if (result) {
      updateData.result = result
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('playbook_runs')
      .update(updateData)
      .eq('id', playbookRunId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update playbook run' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Playbook status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
