import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

/**
 * Audit logging utility
 * Logs all significant actions for PIPEDA compliance
 */
export async function logAuditEvent(
  organizationId: string,
  actionType: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null
    const userAgent = headersList.get('user-agent') || null

    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: user?.id || null,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId || null,
      details: details || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    })
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Audit logging error:', error)
  }
}

/**
 * Common audit action types
 */
export const AuditAction = {
  MEETING_CREATED: 'meeting.created',
  MEETING_UPLOADED: 'meeting.uploaded',
  MEETING_TRANSCRIBED: 'meeting.transcribed',
  MEETING_ANALYZED: 'meeting.analyzed',
  ACTION_ITEM_CREATED: 'action_item.created',
  ACTION_ITEM_UPDATED: 'action_item.updated',
  CRM_CONNECTED: 'crm.connected',
  CRM_DISCONNECTED: 'crm.disconnected',
  CRM_TASK_CREATED: 'crm.task_created',
  CRM_NOTE_CREATED: 'crm.note_created',
  PLAYBOOK_TRIGGERED: 'playbook.triggered',
  PLAYBOOK_COMPLETED: 'playbook.completed',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  USER_SIGNED_UP: 'user.signed_up',
  USER_SIGNED_IN: 'user.signed_in',
} as const
