import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrganization } from '@/lib/auth/tenancy'
import { CrmManager } from '@/lib/crm/manager'

/**
 * Trigger playbook execution via n8n webhook
 */
export async function POST(request: Request) {
  try {
    const { meetingId, playbookType } = await request.json()

    if (!meetingId || !playbookType) {
      return NextResponse.json(
        { error: 'Meeting ID and playbook type required' },
        { status: 400 }
      )
    }

    const org = await getCurrentOrganization()
    if (!org) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify meeting exists and belongs to org
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .eq('organization_id', org.id)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Get action items for this meeting
    const { data: actionItems } = await supabase
      .from('action_items')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('organization_id', org.id)

    // Get transcript
    const { data: transcript } = await supabase
      .from('transcripts')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('organization_id', org.id)
      .single()

    // Create playbook run record
    const { data: playbookRun, error: runError } = await supabase
      .from('playbook_runs')
      .insert({
        organization_id: org.id,
        meeting_id: meetingId,
        playbook_type: playbookType,
        status: 'pending',
        payload: {
          meeting,
          actionItems: actionItems || [],
          transcript: transcript || null,
        },
      })
      .select()
      .single()

    if (runError || !playbookRun) {
      return NextResponse.json({ error: 'Failed to create playbook run' }, { status: 500 })
    }

    // Trigger n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    if (!n8nWebhookUrl) {
      return NextResponse.json({ error: 'n8n webhook not configured' }, { status: 500 })
    }

    const webhookPayload = {
      playbookRunId: playbookRun.id,
      organizationId: org.id,
      meetingId,
      playbookType,
      meeting,
      actionItems: actionItems || [],
      transcript: transcript || null,
    }

    const webhookResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!webhookResponse.ok) {
      await supabase
        .from('playbook_runs')
        .update({
          status: 'failed',
          error_message: `Webhook failed: ${webhookResponse.statusText}`,
        })
        .eq('id', playbookRun.id)

      return NextResponse.json({ error: 'Playbook trigger failed' }, { status: 500 })
    }

    const webhookData = await webhookResponse.json()

    // Update playbook run with execution ID
    await supabase
      .from('playbook_runs')
      .update({
        status: 'running',
        n8n_execution_id: webhookData.executionId || webhookData.id,
        started_at: new Date().toISOString(),
      })
      .eq('id', playbookRun.id)

    // If playbook includes CRM sync, execute it
    if (playbookType === 'ghl_sync' && actionItems && actionItems.length > 0) {
      try {
        const crmManager = new CrmManager()
        for (const item of actionItems) {
          if (item.status === 'pending' && !item.ghl_task_id) {
            const taskId = await crmManager.createTask(org.id, {
              title: item.title,
              description: item.description || undefined,
              assignee: item.assignee || undefined,
              dueDate: item.due_date || undefined,
              priority: item.priority,
            })

            await supabase
              .from('action_items')
              .update({
                ghl_task_id: taskId.id,
                ghl_synced_at: new Date().toISOString(),
              })
              .eq('id', item.id)
          }
        }

        // Create note from transcript
        if (transcript) {
          await crmManager.createNote(org.id, {
            content: `Meeting: ${meeting.title}\n\n${transcript.raw_text.substring(0, 5000)}`,
          })
        }
      } catch (crmError) {
        console.error('CRM sync error:', crmError)
        // Don't fail the whole playbook if CRM sync fails
      }
    }

    return NextResponse.json({
      success: true,
      playbookRunId: playbookRun.id,
      executionId: webhookData.executionId || webhookData.id,
    })
  } catch (error) {
    console.error('Playbook trigger error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
